import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { FishingGear } from './fishing-gear.entity';
import { Logger } from '../services/logger.service';

@Injectable()
export class FishingGearService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FishingGearService');

  constructor(
    @InjectRepository(FishingGear)
    private readonly repository: Repository<FishingGear>,
  ) {}

  async findAll(): Promise<FishingGear[]> {
    this.logger.log({ event: 'findAll' });
    return this.repository.find();
  }

  async findOne(id: string): Promise<FishingGear> {
    this.logger.log({ event: 'findOne', id });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`FishingGear ${id} not found`);
    }
    return entity;
  }

  async create(data: DeepPartial<FishingGear>): Promise<FishingGear> {
    this.logger.log({ event: 'create', data });
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: QueryDeepPartialEntity<FishingGear>,
  ): Promise<FishingGear> {
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
