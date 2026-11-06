import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { SyncConflict } from './sync-conflict.entity';
import { Logger } from '../services/logger.service';

@Injectable()
export class SyncConflictService {
  /* istanbul ignore next */
  private readonly logger = new Logger('SyncConflictService');

  constructor(
    @InjectRepository(SyncConflict)
    private readonly repository: Repository<SyncConflict>,
  ) {}

  async findAll(): Promise<SyncConflict[]> {
    this.logger.log({ event: 'findAll' });
    return this.repository.find();
  }

  async findOne(id: string): Promise<SyncConflict> {
    this.logger.log({ event: 'findOne', id });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`SyncConflict ${id} not found`);
    }
    return entity;
  }

  async create(data: DeepPartial<SyncConflict>): Promise<SyncConflict> {
    this.logger.log({ event: 'create', data });
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: QueryDeepPartialEntity<SyncConflict>,
  ): Promise<SyncConflict> {
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
