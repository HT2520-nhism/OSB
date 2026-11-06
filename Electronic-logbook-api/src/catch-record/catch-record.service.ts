/**
 * PHASE 5 — Catch Record Business Service.
 *
 * Rules:
 *  - FishingOperation must exist.
 *  - quantity must not be negative.
 *  - estimatedQuantity must not be negative.
 *  - species information must be present (DTO-level).
 *  - Preserve unit.
 *  - Prevent orphan records.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CatchRecord } from './catch-record.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';

import { CreateCatchRecordDto } from './dto/create-catch-record.dto';
import { UpdateCatchRecordDto } from './dto/update-catch-record.dto';

import { Logger } from '../services/logger.service';
import { numberToDbString } from '../domain/db-type-conversion';

@Injectable()
export class CatchRecordService {
  /* istanbul ignore next */
  private readonly logger = new Logger('CatchRecordService');

  constructor(
    @InjectRepository(CatchRecord)
    private readonly repository: Repository<CatchRecord>,
    @InjectRepository(FishingOperation)
    private readonly opRepo: Repository<FishingOperation>,
  ) {}

  async findAll(): Promise<CatchRecord[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<CatchRecord> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`CatchRecord ${id} not found`);
    return e;
  }

  async create(dto: CreateCatchRecordDto): Promise<CatchRecord> {
    this.logger.log({ event: 'catch.create', dto });
    const op = await this.opRepo.findOne({
      where: { id: dto.fishingOperationId },
    });
    if (!op) {
      throw new NotFoundException(
        `FishingOperation ${dto.fishingOperationId} not found`,
      );
    }
    this.assertNonNegative(dto.quantity, 'quantity');
    this.assertNonNegative(dto.estimatedQuantity, 'estimatedQuantity');
    // Convert numeric DTO fields to DB string format
    const entity = this.repository.create({
      fishingOperationId: dto.fishingOperationId,
      speciesCode: dto.speciesCode ?? null,
      speciesName: dto.speciesName ?? null,
      quantity: numberToDbString(dto.quantity),
      unit: dto.unit ?? null,
      estimatedQuantity: numberToDbString(dto.estimatedQuantity),
      condition: dto.condition ?? null,
      notes: dto.notes ?? null,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: UpdateCatchRecordDto): Promise<CatchRecord> {
    const entity = await this.findOne(id);
    this.assertNonNegative(dto.quantity, 'quantity');
    this.assertNonNegative(dto.estimatedQuantity, 'estimatedQuantity');
    // Convert numeric DTO fields to DB string format
    Object.assign(entity, {
      speciesCode: dto.speciesCode ?? entity.speciesCode,
      speciesName: dto.speciesName ?? entity.speciesName,
      quantity:
        dto.quantity !== undefined
          ? numberToDbString(dto.quantity)
          : entity.quantity,
      unit: dto.unit ?? entity.unit,
      estimatedQuantity:
        dto.estimatedQuantity !== undefined
          ? numberToDbString(dto.estimatedQuantity)
          : entity.estimatedQuantity,
      condition: dto.condition ?? entity.condition,
      notes: dto.notes ?? entity.notes,
    });
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private assertNonNegative(
    value: number | string | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) return;
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`${field} must be numeric`);
    }
    if (n < 0) {
      throw new BadRequestException(`${field} must not be negative`);
    }
  }
}
