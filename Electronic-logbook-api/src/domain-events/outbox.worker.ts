/**
 * PHASE 7 — Outbox Worker.
 *
 * Background poller that:
 *  1. Claims pending events via OutboxService.claimBatch
 *     (uses FOR UPDATE SKIP LOCKED).
 *  2. Publishes each event through the DomainEventPublisher abstraction.
 *  3. Marks successful events PUBLISHED.
 *  4. On publish failure, schedules a retry with exponential backoff.
 *
 * Design notes:
 *  - The worker does NOT hold a DB lock during external network calls;
 *    it claims a batch first, then releases the row by marking it
 *    PUBLISHED or scheduling a retry.
 *  - On process restart, the worker resumes idempotently; any event
 *    still in `IN_FLIGHT` is reclaimed by the next worker.
 *  - `stuckEventRecovery` is part of the worker lifecycle so that
 *    long-lived crashed workers do not permanently strand events.
 */

import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

import type { DomainEventPublisher } from './domain-event.publisher';
import { OutboxService } from './outbox.service';
import { loadOutboxConfiguration, OutboxConfiguration } from './outbox.config';
import * as os from 'os';

const WORKER_ID = `${os.hostname()}:${process.pid}`;

export const DOMAIN_EVENT_PUBLISHER_TOKEN = 'DOMAIN_EVENT_PUBLISHER';

@Injectable()
export class OutboxWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger('OutboxWorker');
  private readonly cfg: OutboxConfiguration = loadOutboxConfiguration();
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;

  constructor(
    private readonly outboxService: OutboxService,
    @Inject(DOMAIN_EVENT_PUBLISHER_TOKEN)
    private readonly publisher: DomainEventPublisher,
  ) {}

  onModuleInit(): void {
    if (!this.cfg.enabled) {
      this.logger.log({
        event: 'outbox.worker.disabled',
        cfg: this.cfg,
      });
      return;
    }
    this.scheduleNext();
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // Drain in-flight: best-effort wait for current cycle.
    while (this.running) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private scheduleNext(): void {
    if (this.stopped) return;
    this.timer = setTimeout(
      () => this.tick().catch((err) => this.logger.error(err)),
      this.cfg.pollIntervalMs,
    );
    this.timer.unref?.();
  }

  /**
   * Manually trigger one cycle (used by tests).
   */
  async tick(): Promise<void> {
    if (this.stopped) return;
    if (this.running) {
      this.scheduleNext();
      return;
    }
    this.running = true;
    try {
      await this.cycle();
    } finally {
      this.running = false;
      this.scheduleNext();
    }
  }

  private async cycle(): Promise<void> {
    const batch = await this.outboxService.claimBatch(
      WORKER_ID,
      this.cfg.batchSize,
    );
    if (batch.length === 0) return;
    for (const event of batch) {
      const envelope = this.outboxService.toEnvelope(event);
      try {
        await this.publisher.publish(envelope);
        await this.outboxService.markPublished(event.id);
        this.logger.log({
          event: 'outbox.event.published',
          eventId: envelope.eventId,
          eventType: envelope.eventType,
          attempt: (event.retryCount ?? 0) + 1,
        });
      } catch (publishErr) {
        const errMsg =
          publishErr instanceof Error ? publishErr.message : String(publishErr);
        const nextDelay = this.computeBackoff(event.retryCount ?? 0);
        const nextAt = new Date(Date.now() + nextDelay);
        const updated = await this.outboxService.recordFailure(
          event.id,
          errMsg,
          nextAt,
          this.cfg.maxRetries,
        );
        this.logger.warn({
          event: 'outbox.event.publish-failed',
          eventId: envelope.eventId,
          eventType: envelope.eventType,
          retryCount: updated.retryCount,
          status: updated.status,
          nextAvailableAt: nextAt.toISOString(),
          error: errMsg,
        });
      }
    }
  }

  private computeBackoff(retryCount: number): number {
    if (this.cfg.retryBackoff === 'fixed') {
      return this.cfg.retryBaseDelayMs;
    }
    const exp = this.cfg.retryBaseDelayMs * 2 ** Math.min(retryCount, 8);
    // Add ±20% jitter so a thundering herd doesn't synchronize.
    const jitter = exp * 0.2 * (Math.random() * 2 - 1);
    return Math.max(
      this.cfg.retryBaseDelayMs,
      Math.min(this.cfg.retryMaxDelayMs, Math.round(exp + jitter)),
    );
  }
}
