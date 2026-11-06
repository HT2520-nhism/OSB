import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { Attachment } from './attachment.entity';
import { Logger } from '../services/logger.service';

@Injectable()
export class AttachmentService {
  /* istanbul ignore next */
  private readonly logger = new Logger('AttachmentService');

  constructor(
    @InjectRepository(Attachment)
    private readonly repository: Repository<Attachment>,
  ) {}

  async findAll(): Promise<Attachment[]> {
    this.logger.log({ event: 'findAll' });
    return this.repository.find();
  }

  async findOne(id: string): Promise<Attachment> {
    this.logger.log({ event: 'findOne', id });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Attachment ${id} not found`);
    }
    return entity;
  }

  async create(data: DeepPartial<Attachment>): Promise<Attachment> {
    this.logger.log({ event: 'create', data });
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: QueryDeepPartialEntity<Attachment>,
  ): Promise<Attachment> {
    this.logger.log({ event: 'update', id, changes: data });
    await this.findOne(id);
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    this.logger.log({ event: 'remove', id });
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
