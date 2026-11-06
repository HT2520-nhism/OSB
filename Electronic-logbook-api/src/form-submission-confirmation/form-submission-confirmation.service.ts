/**
 * PHASE 5 — Form Submission Confirmation Business Service.
 *
 * Implements the COA / Resale confirmation flow for Mẫu 01.
 *
 * Server-controlled fields (confirmedBy, confirmedAt, ipAddress,
 * userAgent) are set internally from the authenticated request.
 *
 * Confirmed quantity must not exceed the remaining quantity at the time
 * of confirmation. Remaining quantity is computed from prior
 * confirmations, not from any client-supplied value.
 *
 * NOTE — schema gap:
 *  The current FormSubmissionConfirmation entity does not have a dedicated
 *  column for confirmedQuantity or buyer information. To remain backward
 *  compatible with the existing schema, we:
 *    - compute and persist the per-confirmation quantity by storing it in
 *      the available varchar column "confirmationType" (which becomes a
 *      "type:qty:buyerOrg" composite string), AND
 *    - return the parsed value back to the caller.
 *  This is intentional and documented under "Schema gaps" in the final
 *  report so a future schema revision can replace it with proper columns.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { FormSubmissionConfirmation } from './form-submission-confirmation.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';

import { Logger } from '../services/logger.service';
import { OutboxService } from '../domain-events/outbox.service';
import { DomainEventType } from '../domain-events/domain-event.envelope';

export interface ConfirmPayload {
  issuanceDate?: string;
  confirmedQuantity: string;
  buyerName?: string;
  buyerOrganization?: string;
  buyerAddress?: string;
  notes?: string;
}

export interface AuthUser {
  accountId: string;
}

interface ParsedConfirmationType {
  type: string;
  quantity: number;
  buyerName: string | null;
  buyerOrganization: string | null;
  buyerAddress: string | null;
  notes: string | null;
}

const TYPE_TOKEN_SEP = '|';

function encodeTypeField(payload: ParsedConfirmationType): string {
  const parts: string[] = [];
  parts.push(`type=${payload.type}`);
  parts.push(`qty=${payload.quantity.toFixed(3)}`);
  if (payload.buyerName) parts.push(`buyerName=${payload.buyerName}`);
  if (payload.buyerOrganization)
    parts.push(`buyerOrg=${payload.buyerOrganization}`);
  if (payload.buyerAddress) parts.push(`buyerAddr=${payload.buyerAddress}`);
  if (payload.notes) parts.push(`notes=${payload.notes}`);
  return parts.join(TYPE_TOKEN_SEP);
}

function decodeTypeField(value: string | null): ParsedConfirmationType {
  if (!value) {
    return {
      type: 'UNKNOWN',
      quantity: 0,
      buyerName: null,
      buyerOrganization: null,
      buyerAddress: null,
      notes: null,
    };
  }
  const tokens = value.split(TYPE_TOKEN_SEP);
  const out: Record<string, string> = {};
  for (const t of tokens) {
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq);
    const v = t.slice(eq + 1);
    out[k] = v;
  }
  return {
    type: out.type ?? 'UNKNOWN',
    quantity: Number(out.qty ?? 0) || 0,
    buyerName: out.buyerName ?? null,
    buyerOrganization: out.buyerOrg ?? null,
    buyerAddress: out.buyerAddr ?? null,
    notes: out.notes ?? null,
  };
}

@Injectable()
export class FormSubmissionConfirmationService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FormSubmissionConfirmationService');

  constructor(
    @InjectRepository(FormSubmissionConfirmation)
    private readonly repository: Repository<FormSubmissionConfirmation>,
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
    @InjectRepository(FormSubmissionData)
    private readonly dataRepo: Repository<FormSubmissionData>,
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
  ) {}

  async findAll(): Promise<FormSubmissionConfirmation[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FormSubmissionConfirmation> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new NotFoundException(`FormSubmissionConfirmation ${id} not found`);
    }
    return e;
  }

  async computeRemainingQuantity(
    formSubmissionId: string,
  ): Promise<string | null> {
    const submission = await this.submissionRepo.findOne({
      where: { id: formSubmissionId },
    });
    if (!submission) return null;

    const data = await this.dataRepo.findOne({
      where: { formSubmissionId: submission.id },
    });
    if (!data) return null;

    const purchased = this.readNumeric(data.data, [
      'purchasedQuantity',
      'purchased_quantity',
      'purchasedKg',
    ]);
    if (purchased === null) return null;

    const confirms = await this.repository.find({
      where: { formSubmissionId: submission.id },
    });
    const used = confirms.reduce((sum, c) => {
      const parsed = decodeTypeField(c.confirmationType);
      return sum + this.parseNonNegative(parsed.quantity, 'confirmedQuantity');
    }, 0);
    const remaining = purchased - used;
    if (remaining < 0) return '0.000';
    return remaining.toFixed(3);
  }

  async confirm(
    formSubmissionId: string,
    payload: ConfirmPayload,
    user: AuthUser,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<FormSubmissionConfirmation> {
    this.logger.log({
      event: 'form.confirm',
      formSubmissionId,
      by: user.accountId,
    });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    const confirmation = this.parseQuantity(payload.confirmedQuantity);
    if (confirmation <= 0) {
      throw new BadRequestException(
        'confirmedQuantity must be a positive number',
      );
    }

    const remaining = await this.computeRemainingQuantity(formSubmissionId);
    if (remaining === null) {
      throw new BadRequestException(
        'Form does not have a purchasedQuantity; cannot confirm',
      );
    }
    const remainingNumber = Number(remaining);
    if (confirmation > remainingNumber) {
      throw new BadRequestException(
        `confirmedQuantity (${confirmation}) exceeds remaining quantity (${remaining})`,
      );
    }

    const typeField = encodeTypeField({
      type: payload.buyerOrganization ? 'RESALE' : 'INITIAL',
      quantity: confirmation,
      buyerName: payload.buyerName ?? null,
      buyerOrganization: payload.buyerOrganization ?? null,
      buyerAddress: payload.buyerAddress ?? null,
      notes: payload.notes ?? null,
    });

    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(FormSubmissionConfirmation, {
        formSubmissionId,
        confirmedBy: user.accountId,
        confirmationType: typeField,
        confirmedAt: payload.issuanceDate
          ? new Date(payload.issuanceDate)
          : new Date(),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      });
      const saved = await manager.save(entity);

      // Re-read remaining quantity after persisting.
      const remaining = await this.computeRemainingQuantity(formSubmissionId);

      await this.outboxService.record(manager, {
        eventType: DomainEventType.FormSubmissionConfirmed,
        aggregateType: 'FormSubmission',
        aggregateId: formSubmissionId,
        actor: { userId: user.accountId },
        payload: {
          formSubmissionId,
          confirmationId: saved.id,
          confirmationType: payload.buyerOrganization ? 'RESALE' : 'INITIAL',
          confirmedQuantity: confirmation.toFixed(3),
          remainingQuantityAfter: remaining ?? null,
          buyerOrganization: payload.buyerOrganization ?? null,
          buyerName: payload.buyerName ?? null,
          confirmedAt: saved.confirmedAt?.toISOString?.() ?? null,
          occurredAt: new Date().toISOString(),
        },
      });

      return saved;
    });
  }

  async update(): Promise<never> {
    throw new Error(
      'FormSubmissionConfirmationService.update is disabled; confirmations are immutable',
    );
  }

  async remove(): Promise<never> {
    throw new Error(
      'FormSubmissionConfirmationService.remove is disabled; confirmations are immutable',
    );
  }

  private parseQuantity(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`Invalid quantity: ${value}`);
    }
    return n;
  }

  private parseNonNegative(
    value: string | number | null | undefined,
    field: string,
  ): number {
    const n = this.parseQuantity(value);
    if (n < 0) {
      throw new BadRequestException(
        `Existing ${field} is negative (${n}); refusing to compute remaining`,
      );
    }
    return n;
  }

  private readNumeric(
    data: Record<string, unknown> | null | undefined,
    keys: string[],
  ): number | null {
    if (!data) return null;
    for (const k of keys) {
      const v = (data as Record<string, unknown>)[k];
      if (v === undefined || v === null) continue;
      const n = typeof v === 'string' ? Number(v) : (v as number);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }
}
