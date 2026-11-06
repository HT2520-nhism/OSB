/**
 * PHASE 5 — Form Submission Version Read Service.
 *
 * Versions are immutable historical snapshots. This service only exposes
 * reads. New versions are produced by FormSubmissionService.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FormSubmissionVersion } from './form-submission-version.entity';

@Injectable()
export class FormSubmissionVersionService {
  constructor(
    @InjectRepository(FormSubmissionVersion)
    private readonly repository: Repository<FormSubmissionVersion>,
  ) {}

  async findAll(): Promise<FormSubmissionVersion[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FormSubmissionVersion> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new NotFoundException(`FormSubmissionVersion ${id} not found`);
    }
    return e;
  }

  async findBySubmissionId(
    formSubmissionId: string,
  ): Promise<FormSubmissionVersion[]> {
    return this.repository.find({
      where: { formSubmissionId },
      order: { version: 'ASC' },
    });
  }

  async create(): Promise<never> {
    throw new Error(
      'FormSubmissionVersionService.create is disabled; versions are produced by FormSubmissionService',
    );
  }

  async update(): Promise<never> {
    throw new Error(
      'FormSubmissionVersionService.update is disabled; versions are immutable',
    );
  }

  async remove(): Promise<never> {
    throw new Error(
      'FormSubmissionVersionService.remove is disabled; versions are immutable',
    );
  }
}
