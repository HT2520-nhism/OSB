/**
 * PHASE 5 — Form Submission Data Business Service.
 *
 * Provides version-aware read/update of the JSONB payload for a
 * FormSubmission. Mutations are routed through FormSubmissionService
 * for proper versioning and workflow history.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FormSubmissionData } from './form-submission-data.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';

import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';

@Injectable()
export class FormSubmissionDataService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FormSubmissionDataService');

  constructor(
    @InjectRepository(FormSubmissionData)
    private readonly repository: Repository<FormSubmissionData>,
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
  ) {}

  async findAll(): Promise<FormSubmissionData[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FormSubmissionData> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`FormSubmissionData ${id} not found`);
    return e;
  }

  async findBySubmissionId(
    formSubmissionId: string,
  ): Promise<FormSubmissionData> {
    const e = await this.repository.findOne({
      where: { formSubmissionId },
    });
    if (!e) {
      throw new NotFoundException(
        `FormSubmissionData for submission ${formSubmissionId} not found`,
      );
    }
    return e;
  }

  /**
   * Direct create/update of FormSubmissionData is disallowed.
   * Use FormSubmissionService.createForm / updateFormData instead so that
   * versioning and workflow history are honored.
   */
  async create(): Promise<never> {
    throw new ForbiddenException(
      'Use POST /form-submissions to create a form (data + submission are created atomically)',
    );
  }

  async update(): Promise<never> {
    throw new ForbiddenException(
      'Use PATCH /form-submissions/:id/data to update form data (creates a new version)',
    );
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
