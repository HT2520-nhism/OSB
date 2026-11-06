/**
 * PHASE 5 — Form Workflow History Read Service.
 *
 * History entries are immutable and produced by FormSubmissionService.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FormWorkflowHistory } from './form-workflow-history.entity';

@Injectable()
export class FormWorkflowHistoryService {
  constructor(
    @InjectRepository(FormWorkflowHistory)
    private readonly repository: Repository<FormWorkflowHistory>,
  ) {}

  async findAll(): Promise<FormWorkflowHistory[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FormWorkflowHistory> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`FormWorkflowHistory ${id} not found`);
    return e;
  }

  async findBySubmissionId(
    formSubmissionId: string,
  ): Promise<FormWorkflowHistory[]> {
    return this.repository.find({
      where: { formSubmissionId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(): Promise<never> {
    throw new Error(
      'FormWorkflowHistoryService.create is disabled; history is produced by FormSubmissionService',
    );
  }

  async update(): Promise<never> {
    throw new Error(
      'FormWorkflowHistoryService.update is disabled; history is immutable',
    );
  }

  async remove(): Promise<never> {
    throw new Error(
      'FormWorkflowHistoryService.remove is disabled; history is immutable',
    );
  }
}
