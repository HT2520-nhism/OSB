/**
 * PHASE 6 — Mẫu 01 (Receipt of landed aquatic products) Sync Handler.
 *
 * For M01 we require server-authoritative recalculation of:
 *  - remainingQuantity = purchasedQuantity - sum(confirmedQuantity)
 *  - remainingAfterCertification = previousRemaining - certifiedQuantity
 *
 * Mobile clients are NOT allowed to push client-calculated remaining
 * quantities. They push the purchasedQuantity and confirmations, and
 * the server computes the authoritative remaining.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  SyncEntityHandler,
  SyncHandlerContext,
  SyncHandlerResult,
  SyncOperationEnvelope,
} from './sync-handler.interface';
import { SyncEntityType } from '../sync.enum';

import { FormSubmission } from '../../form-submission/form-submission.entity';
import { FormSubmissionData } from '../../form-submission-data/form-submission-data.entity';
import { FormSubmissionService } from '../../form-submission/form-submission.service';
import { FormSubmissionConfirmationService } from '../../form-submission-confirmation/form-submission-confirmation.service';
import {
  FormSubmissionStatus,
  FormSubmissionSubmissionStatus,
} from '../../constants/enums/domain.enum';

@Injectable()
export class FormM01SyncHandler implements SyncEntityHandler {
  constructor(
    private readonly submissionService: FormSubmissionService,
    private readonly confirmationService: FormSubmissionConfirmationService,
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
    @InjectRepository(FormSubmissionData)
    private readonly dataRepo: Repository<FormSubmissionData>,
  ) {}

  supports(entityType: SyncEntityType): boolean {
    return (
      entityType === SyncEntityType.FORM_SUBMISSION_DATA &&
      // Distinguish from generic form_submission_data by payload shape
      // — actual selection happens in the dispatcher.
      false
    );
  }

  /**
   * M01 doesn't have its own SyncEntityType; instead, sync of an M01
   * form happens via FORM_SUBMISSION CREATE + UPDATE_DATA (the existing
   * FormSubmissionSyncHandler) plus FORM_SUBMISSION_CONFIRMATION via
   * a dedicated endpoint. This handler is exposed for clarity / future
   * expansion (e.g. a dedicated M01 endpoint).
   */

  async applyCreate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) throw new BadRequestException('payload required');
    const created = await this.submissionService.createForm(
      {
        formDefinitionId: String(op.payload['formDefinitionId']),
        vesselId: String(op.payload['vesselId']),
        fishingTripId: this.optionalString(op.payload['fishingTripId']),
        data: (op.payload['data'] as Record<string, unknown>) ?? {},
      },
      ctx.user,
    );
    return {
      entityId: created.id,
      serverVersion: 1,
    };
  }

  async applyUpdate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) throw new BadRequestException('payload required');
    const existing = await this.submissionRepo.findOne({
      where: { id: op.entityId },
    });
    if (!existing) {
      throw new BadRequestException(`FormSubmission ${op.entityId} not found`);
    }
    // Strip any client-calculated remainingQuantity — server recalculates.
    const data = (op.payload['data'] as Record<string, unknown>) ?? {};
    const sanitizedData = { ...data };
    delete sanitizedData['remainingQuantity'];
    delete sanitizedData['remainingAfterCertification'];

    // Transition if requested.
    const desired = op.payload['status'] as FormSubmissionStatus | undefined;
    if (desired && desired !== existing.status) {
      await this.submissionService.transition(
        existing.id,
        desired,
        ctx.user,
        this.optionalString(op.payload['rejectionReason']) ?? null,
      );
    }
    if (Object.keys(sanitizedData).length > 0) {
      await this.submissionService.updateFormData(
        existing.id,
        sanitizedData,
        null,
        ctx.user,
      );
    }
    const after = await this.submissionRepo.findOne({
      where: { id: existing.id },
    });
    return {
      entityId: existing.id,
      serverVersion: after?.version ?? existing.version ?? 1,
    };
  }

  async applyDelete(
    op: SyncOperationEnvelope,
    _ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    const existing = await this.submissionRepo.findOne({
      where: { id: op.entityId },
    });
    if (!existing) {
      return { entityId: op.entityId, serverVersion: 0 };
    }
    if (existing.status !== FormSubmissionStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot delete M01 in status ${existing.status}`,
      );
    }
    await this.submissionService.remove(existing.id);
    return { entityId: op.entityId, serverVersion: 0 };
  }

  async loadServerSnapshot(
    entityId: string,
    _ctx: SyncHandlerContext,
  ): Promise<Record<string, unknown> | null> {
    const s = await this.submissionRepo.findOne({ where: { id: entityId } });
    if (!s) return null;
    const data = await this.dataRepo.findOne({
      where: { formSubmissionId: s.id },
    });
    return {
      id: s.id,
      status: s.status,
      version: s.version,
      data: data?.data ?? null,
      remainingQuantity:
        await this.confirmationService.computeRemainingQuantity(s.id),
    };
  }

  private optionalString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function _useSubmissionStatusConstToAvoidTreeShakeRemoval(): FormSubmissionSubmissionStatus {
  return FormSubmissionSubmissionStatus.NOT_SUBMITTED;
}
