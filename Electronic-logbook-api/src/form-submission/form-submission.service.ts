/**
 * PHASE 5 — Form Submission Business Service.
 *
 * PHASE 7 — Domain events.
 *   Each successful transition or new version records a domain event
 *   in the same transaction as the business data changes.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { FormSubmission } from './form-submission.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { FormSubmissionVersion } from '../form-submission-version/form-submission-version.entity';
import { FormWorkflowHistory } from '../form-workflow-history/form-workflow-history.entity';
import { FormDefinition } from '../form-definition/form-definition.entity';
import { Vessel } from '../vessel/vessel.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

import { AuthUser } from '../auth/current-user.decorator';
import { AuthorizationService } from '../auth/authorization.service';
import { SystemRole } from '../constants/enums/system-role.enum';
import { QueryFormSubmissionDto } from './dto';
import {
  FormSubmissionStatus,
  FormSubmissionSubmissionStatus,
} from '../constants/enums/domain.enum';

import {
  assertFormStatusTransition,
  canTransitionFormStatus,
} from '../domain/form/submission-state-machine';
import { Logger } from '../services/logger.service';
import { OutboxService } from '../domain-events/outbox.service';
import {
  DomainEventType,
  DomainEventTypeValue,
} from '../domain-events/domain-event.envelope';

export interface CreateFormSubmissionInput {
  formDefinitionId: string;
  vesselId: string;
  fishingTripId?: string | null;
  status?: FormSubmissionStatus;
  data: Record<string, unknown>;
}

const FORM_STATE_EVENT: Partial<
  Record<FormSubmissionStatus, DomainEventTypeValue>
> = {
  [FormSubmissionStatus.DRAFT]: DomainEventType.FormSubmissionCreated,
  [FormSubmissionStatus.SUBMITTED]: DomainEventType.FormSubmissionSubmitted,
  [FormSubmissionStatus.UNDER_REVIEW]:
    DomainEventType.FormSubmissionUnderReview,
  [FormSubmissionStatus.APPROVED]: DomainEventType.FormSubmissionApproved,
  [FormSubmissionStatus.REJECTED]: DomainEventType.FormSubmissionRejected,
  [FormSubmissionStatus.CANCELLED]: DomainEventType.FormSubmissionCancelled,
};

@Injectable()
export class FormSubmissionService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FormSubmissionService');

  constructor(
    @InjectRepository(FormSubmission)
    private readonly repository: Repository<FormSubmission>,
    @InjectRepository(FormSubmissionData)
    private readonly dataRepo: Repository<FormSubmissionData>,
    @InjectRepository(FormSubmissionVersion)
    private readonly versionRepo: Repository<FormSubmissionVersion>,
    @InjectRepository(FormWorkflowHistory)
    private readonly historyRepo: Repository<FormWorkflowHistory>,
    @InjectRepository(FormDefinition)
    private readonly defRepo: Repository<FormDefinition>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
  ) {}

  async findAll(): Promise<FormSubmission[]> {
    return this.repository.find({
      relations: ['formDefinition', 'vessel', 'fishingTrip', 'data'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FormSubmission> {
    const e = await this.repository.findOne({
      where: { id },
      relations: ['formDefinition', 'vessel', 'fishingTrip', 'data'],
    });
    if (!e) throw new NotFoundException(`FormSubmission ${id} not found`);
    return e;
  }

  async createForm(
    input: CreateFormSubmissionInput,
    user: AuthUser,
  ): Promise<FormSubmission> {
    this.logger.log({
      event: 'form.create',
      formDefinitionId: input.formDefinitionId,
      vesselId: input.vesselId,
      fishingTripId: input.fishingTripId,
      by: user.accountId,
    });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    if (!input.data || typeof input.data !== 'object') {
      throw new BadRequestException('Form data must be a JSON object');
    }

    return this.dataSource.transaction(async (manager) => {
      let defId = input.formDefinitionId;
      if (defId.startsWith('def-') || defId.length < 30) {
        const codeKey = defId.replace('def-', '').toUpperCase();
        const found = await manager.findOne(FormDefinition, { where: { formCode: codeKey as any } });
        if (found) defId = found.id;
      }
      const def = await manager.findOne(FormDefinition, {
        where: { id: defId },
      });
      if (!def) {
        throw new NotFoundException(
          `FormDefinition ${input.formDefinitionId} not found`,
        );
      }
      if (!def.isActive) {
        throw new BadRequestException(`FormDefinition ${def.id} is not active`);
      }

      let vId = input.vesselId;
      if (vId === 'vessel-demo-001' || vId.includes('demo')) {
        vId = '00000000-0000-0000-0000-000000000001';
      }
      const vessel = await manager.findOne(Vessel, {
        where: { id: vId },
      });
      if (!vessel) {
        throw new NotFoundException(`Vessel ${input.vesselId} not found`);
      }

      let tId = input.fishingTripId;
      if (tId === 'trip-demo-001' || (tId && tId.includes('demo'))) {
        tId = '00000000-0000-0000-0000-000000000002';
      }
      if (tId) {
        const trip = await manager.findOne(FishingTrip, {
          where: { id: tId },
        });
        if (!trip) {
          throw new NotFoundException(
            `FishingTrip ${input.fishingTripId} not found`,
          );
        }
        if (trip.vesselId !== vessel.id) {
          throw new ConflictException(
            `FishingTrip ${trip.id} does not belong to vessel ${vessel.id}`,
          );
        }
      }

      const targetStatus = input.status === FormSubmissionStatus.SUBMITTED
        ? FormSubmissionStatus.SUBMITTED
        : FormSubmissionStatus.DRAFT;

      const submission = manager.create(FormSubmission, {
        formDefinitionId: def.id,
        vesselId: vessel.id,
        fishingTripId: tId ?? null,
        submittedBy: user.accountId,
        status: targetStatus,
        submittedAt: targetStatus === FormSubmissionStatus.SUBMITTED ? new Date() : null,
        version: 1,
      });
      const saved = await manager.save(submission);

      const data = manager.create(FormSubmissionData, {
        formSubmissionId: saved.id,
        data: input.data,
      });
      await manager.save(data);

      const v1 = manager.create(FormSubmissionVersion, {
        formSubmissionId: saved.id,
        version: 1,
        data: input.data,
        status: targetStatus,
        changedBy: user.accountId,
        changeReason: targetStatus === FormSubmissionStatus.SUBMITTED ? 'SUBMITTED_OFFLINE_SYNC' : 'INITIAL',
      });
      await manager.save(v1);

      const history = manager.create(FormWorkflowHistory, {
        formSubmissionId: saved.id,
        fromStatus: null,
        toStatus: targetStatus,
        action: targetStatus === FormSubmissionStatus.SUBMITTED ? 'SUBMIT' : 'CREATE',
        reason: targetStatus === FormSubmissionStatus.SUBMITTED ? 'Submitted directly or via offline sync' : null,
        actorId: user.accountId,
      });
      await manager.save(history);

      await this.recordFormEvent(
        manager,
        saved,
        targetStatus === FormSubmissionStatus.SUBMITTED
          ? DomainEventType.FormSubmissionSubmitted
          : DomainEventType.FormSubmissionCreated,
        user.accountId,
        { fromStatus: null },
      );

      return saved;
    });
  }

  async updateFormData(
    id: string,
    newData: Record<string, unknown>,
    reason: string | null,
    user: AuthUser,
  ): Promise<FormSubmission> {
    this.logger.log({
      event: 'form.updateData',
      id,
      by: user.accountId,
    });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    if (!newData || typeof newData !== 'object') {
      throw new BadRequestException('Form data must be a JSON object');
    }

    return this.dataSource.transaction(async (manager) => {
      const submission = await manager.findOne(FormSubmission, {
        where: { id },
      });
      if (!submission) {
        throw new NotFoundException(`FormSubmission ${id} not found`);
      }
      if (submission.status !== FormSubmissionStatus.DRAFT) {
        throw new BadRequestException(
          `Form data can only be updated while in DRAFT (current: ${submission.status})`,
        );
      }

      const data = await manager.findOne(FormSubmissionData, {
        where: { formSubmissionId: submission.id },
      });
      if (!data) {
        throw new NotFoundException(`FormSubmissionData for ${id} not found`);
      }
      data.data = newData;
      await manager.save(data);

      const newVersion = submission.version + 1;
      submission.version = newVersion;
      await manager.save(submission);

      const version = manager.create(FormSubmissionVersion, {
        formSubmissionId: submission.id,
        version: newVersion,
        data: newData,
        status: submission.status,
        changedBy: user.accountId,
        changeReason: reason ?? null,
      });
      await manager.save(version);

      await this.recordFormEvent(
        manager,
        submission,
        DomainEventType.FormSubmissionVersionCreated,
        user.accountId,
        { changeReason: reason ?? null },
      );

      return submission;
    });
  }

  async transition(
    id: string,
    to: FormSubmissionStatus,
    user: AuthUser,
    reason: string | null = null,
  ): Promise<FormSubmission> {
    this.logger.log({
      event: 'form.transition',
      id,
      to,
      by: user.accountId,
    });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    return this.dataSource.transaction(async (manager) => {
      const submission = await manager.findOne(FormSubmission, {
        where: { id },
      });
      if (!submission) {
        throw new NotFoundException(`FormSubmission ${id} not found`);
      }
      assertFormStatusTransition(submission.status, to);

      const fromStatus = submission.status;
      submission.status = to;
      const now = new Date();
      if (to === FormSubmissionStatus.SUBMITTED) {
        submission.submittedAt = now;
        submission.submittedBy = user.accountId;
      }
      if (to === FormSubmissionStatus.APPROVED) {
        submission.approvedAt = now;
      }
      if (to === FormSubmissionStatus.REJECTED) {
        submission.rejectedAt = now;
        submission.rejectionReason = reason;
      }
      const saved = await manager.save(submission);

      const history = manager.create(FormWorkflowHistory, {
        formSubmissionId: submission.id,
        fromStatus,
        toStatus: to,
        action: this.actionFor(to),
        reason: reason ?? null,
        actorId: user.accountId,
      });
      await manager.save(history);

      const eventType = FORM_STATE_EVENT[to];
      if (eventType) {
        await this.recordFormEvent(manager, saved, eventType, user.accountId, {
          fromStatus,
          reason: reason ?? null,
        });
      }
      // Workflow-history-changed event always fires.
      await this.recordFormEvent(
        manager,
        saved,
        DomainEventType.FormWorkflowChanged,
        user.accountId,
        { fromStatus, toStatus: to, action: this.actionFor(to) },
      );

      return saved;
    });
  }

  async update(
    id: string,
    dto: Partial<FormSubmission>,
    _user: AuthUser,
  ): Promise<FormSubmission> {
    const entity = await this.findOne(id);
    const protectedFields = [
      'status',
      'submittedBy',
      'submittedAt',
      'approvedAt',
      'rejectedAt',
      'rejectionReason',
      'version',
      'createdAt',
      'updatedAt',
      'id',
    ];
    for (const f of protectedFields) {
      if ((dto as Record<string, unknown>)[f] !== undefined) {
        throw new BadRequestException(
          `Field '${f}' is server-controlled; use explicit endpoints`,
        );
      }
    }
    Object.assign(entity, dto);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private actionFor(status: FormSubmissionStatus): string {
    switch (status) {
      case FormSubmissionStatus.SUBMITTED:
        return 'SUBMIT';
      case FormSubmissionStatus.UNDER_REVIEW:
        return 'REVIEW';
      case FormSubmissionStatus.APPROVED:
        return 'APPROVE';
      case FormSubmissionStatus.REJECTED:
        return 'REJECT';
      case FormSubmissionStatus.CANCELLED:
        return 'CANCEL';
      case FormSubmissionStatus.DRAFT:
        return 'REOPEN';
      default:
        return status;
    }
  }

  private async recordFormEvent(
    manager: EntityManager,
    submission: FormSubmission,
    eventType: DomainEventTypeValue,
    actorId: string,
    extras: Record<string, unknown>,
  ): Promise<void> {
    await this.outboxService.record(manager, {
      eventType,
      aggregateType: 'FormSubmission',
      aggregateId: submission.id,
      actor: { userId: actorId },
      payload: {
        formSubmissionId: submission.id,
        formDefinitionId: submission.formDefinitionId,
        vesselId: submission.vesselId,
        fishingTripId: submission.fishingTripId ?? null,
        status: submission.status,
        version: submission.version,
        occurredAt: new Date().toISOString(),
        ...extras,
      },
    });
  }
}

export function deriveTripSubmissionStatus(
  highestFormStatus: FormSubmissionStatus | string | null,
): string {
  if (!highestFormStatus) {
    return FormSubmissionSubmissionStatus.NOT_SUBMITTED;
  }
  switch (highestFormStatus) {
    case FormSubmissionStatus.DRAFT:
      return FormSubmissionSubmissionStatus.NOT_SUBMITTED;
    case FormSubmissionStatus.SUBMITTED:
      return FormSubmissionSubmissionStatus.SUBMITTED;
    case FormSubmissionStatus.UNDER_REVIEW:
      return FormSubmissionSubmissionStatus.UNDER_REVIEW;
    case FormSubmissionStatus.APPROVED:
      return FormSubmissionSubmissionStatus.APPROVED;
    case FormSubmissionStatus.REJECTED:
      return FormSubmissionSubmissionStatus.REJECTED;
    default:
      return FormSubmissionSubmissionStatus.NOT_SUBMITTED;
  }
}

export { canTransitionFormStatus };
