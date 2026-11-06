import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, LessThanOrEqual, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { OutboxEvent } from './outbox-event.entity';
import { Logger } from '../services/logger.service';

/**
 * Internal service — KHÔNG expose HTTP endpoints.
 * Worker/process khác sẽ inject OutboxEventService để xử lý event.
 */
@Injectable()
export class OutboxEventService {
  /* istanbul ignore next */
  private readonly logger = new Logger('OutboxEventService');

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly repository: Repository<OutboxEvent>,
  ) {}

  /** Tạo event mới. */
  async createEvent(
    data: QueryDeepPartialEntity<OutboxEvent>,
  ): Promise<OutboxEvent> {
    this.logger.log({ event: 'createEvent', data });
    const entity = this.repository.create(data as DeepPartial<OutboxEvent>);
    return this.repository.save(entity);
  }

  /** Tìm các event chưa publish và đã tới thời điểm xử lý. */
  async findPending(limit = 100): Promise<OutboxEvent[]> {
    this.logger.log({ event: 'findPending', limit });
    return this.repository.find({
      where: {
        status: 'pending',
        availableAt: LessThanOrEqual(new Date()),
      },
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<OutboxEvent> {
    this.logger.log({ event: 'findOne', id });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`OutboxEvent ${id} not found`);
    }
    return entity;
  }

  /** Đánh dấu event đã publish thành công. */
  async markPublished(id: string): Promise<OutboxEvent> {
    this.logger.log({ event: 'markPublished', id });
    const entity = await this.findOne(id);
    entity.status = 'published';
    entity.publishedAt = new Date();
    return this.repository.save(entity);
  }

  /** Đánh dấu event thất bại. */
  async markFailed(id: string, errorMessage: string): Promise<OutboxEvent> {
    this.logger.log({ event: 'markFailed', id, errorMessage });
    const entity = await this.findOne(id);
    entity.status = 'failed';
    entity.publishedAt = new Date();
    entity.payload = {
      ...(entity.payload ?? {}),
      __error: errorMessage,
    };
    return this.repository.save(entity);
  }

  /** Tăng retry_count, set availableAt cho lần retry tiếp theo. */
  async incrementRetry(
    id: string,
    nextAvailableAt: Date,
  ): Promise<OutboxEvent> {
    this.logger.log({ event: 'incrementRetry', id, nextAvailableAt });
    const entity = await this.findOne(id);
    entity.retryCount += 1;
    entity.availableAt = nextAvailableAt;
    return this.repository.save(entity);
  }
}
