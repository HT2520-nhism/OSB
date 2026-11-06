/**
 * PHASE 6 — Form Submission Sync Handler.
 *
 * Routes through FormSubmissionService so:
 *  - Submitted/approved/rejected forms are protected by Phase 5
 *    workflow rules.
 *  - Mobile clients cannot set status directly; only the matching
 *    transition operation is allowed.
 *  - Each version row records `changedBy` from the authenticated user.
 *
 * Operation mapping:
 *  - CREATE: FormSubmissionService.createForm (DRAFT only)
 *  - UPDATE data: FormSubmissionService.updateFormData (DRAFT only)
 *  - UPDATE status: FormSubmissionService.transition
 *  - DELETE: rejected (regulatory immutability)
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
import { FormSubmissionService } from '../../form-submission/form-submission.service';
import { FormSubmissionStatus } from '../../constants/enums/domain.enum';

@Injectable()
export class FormSubmissionSyncHandler implements SyncEntityHandler {
  constructor(
    private readonly submissionService: FormSubmissionService,
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
  ) {}

  supports(entityType: SyncEntityType): boolean {
    return entityType === SyncEntityType.FORM_SUBMISSION;
  }

  async applyCreate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) throw new BadRequestException('payload required');
    const existing = await this.submissionRepo.findOne({
      where: { id: op.entityId },
    });
    if (existing) {
      throw new BadRequestException(
        'Form submission already exists; use UPDATE',
      );
    }
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
      serverVersion: created.version ?? 1,
      data: this.project(created),
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
    this.assertVersionNotBehind(op.clientVersion, existing.version ?? 1);

    // 1) Status transition?
    const desired = op.payload['status'] as FormSubmissionStatus | undefined;
    if (desired && desired !== existing.status) {
      const reason = this.optionalString(op.payload['rejectionReason']);
      await this.submissionService.transition(
        existing.id,
        desired,
        ctx.user,
        reason ?? null,
      );
    }

    // 2) Data update?
    const newData = op.payload['data'] as Record<string, unknown> | undefined;
    if (newData) {
      const reason = this.optionalString(op.payload['changeReason']);
      await this.submissionService.updateFormData(
        existing.id,
        newData,
        reason ?? null,
        ctx.user,
      );
    }

    const after = await this.submissionRepo.findOne({
      where: { id: existing.id },
    });
    return {
      entityId: existing.id,
      serverVersion: after?.version ?? 1,
      data: after ? this.project(after) : undefined,
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
      // Idempotent delete.
      return { entityId: op.entityId, serverVersion: 0 };
    }
    if (existing.status !== FormSubmissionStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot delete form submission in status ${existing.status}`,
      );
    }
    await this.submissionService.remove(existing.id);
    return { entityId: op.entityId, serverVersion: 0 };
  }

  async loadServerSnapshot(
    entityId: string,
    _ctx: SyncHandlerContext,
  ): Promise<Record<string, unknown> | null> {
    const e = await this.submissionRepo.findOne({ where: { id: entityId } });
    if (!e) return null;
    return this.project(e);
  }

  private assertVersionNotBehind(
    clientVersion: number,
    serverVersion: number,
  ): void {
    if (clientVersion < serverVersion) {
      throw new BadRequestException(
        `Stale form version (client=${clientVersion}, server=${serverVersion})`,
      );
    }
  }

  private optionalString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
  }

  private project(s: FormSubmission): Record<string, unknown> {
    return {
      id: s.id,
      formDefinitionId: s.formDefinitionId,
      vesselId: s.vesselId,
      fishingTripId: s.fishingTripId,
      status: s.status,
      version: s.version,
      submittedBy: s.submittedBy,
      submittedAt: s.submittedAt,
      approvedAt: s.approvedAt,
      rejectedAt: s.rejectedAt,
      rejectionReason: s.rejectionReason,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
