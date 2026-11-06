/**
 * PHASE 7 — Outbox Configuration.
 *
 * Centralized so we don't sprinkle magic numbers.
 */

export interface OutboxConfiguration {
  enabled: boolean;
  batchSize: number;
  pollIntervalMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  /** When the worker logs/computes backoff exponentially. */
  retryBackoff: 'exponential' | 'fixed';
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function parseInt10(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function loadOutboxConfiguration(): OutboxConfiguration {
  return {
    enabled: parseBool(process.env.OUTBOX_ENABLED, true),
    batchSize: parseInt10(process.env.OUTBOX_BATCH_SIZE, 50),
    pollIntervalMs: parseInt10(process.env.OUTBOX_POLL_INTERVAL_MS, 2_000),
    maxRetries: parseInt10(process.env.OUTBOX_MAX_RETRIES, 8),
    retryBaseDelayMs: parseInt10(process.env.OUTBOX_RETRY_BASE_DELAY_MS, 1_000),
    retryMaxDelayMs: parseInt10(process.env.OUTBOX_RETRY_MAX_DELAY_MS, 60_000),
    retryBackoff:
      (process.env.OUTBOX_RETRY_BACKOFF ?? 'exponential') === 'fixed'
        ? 'fixed'
        : 'exponential',
  };
}
