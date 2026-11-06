/**
 * PHASE 5 — Landing Catch Business Service.
 *
 * Rules:
 *  - LandingRecord must exist.
 *  - quantity must not be negative.
 *  - Prevent orphan records (handled via LandingRecord transactions).
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LandingCatch } from './landing-catch.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';

import { CreateLandingCatchDto } from './dto/create-landing-catch.dto';
import { UpdateLandingCatchDto } from './dto/update-landing-catch.dto';

import { Logger } from '../services/logger.service';
import { numberToDbString } from '../domain/db-type-conversion';

@Injectable()
export class LandingCatchService {
  /* istanbul ignore next */
  private readonly logger = new Logger('LandingCatchService');

  constructor(
    @InjectRepository(LandingCatch)
    private readonly repository: Repository<LandingCatch>,
    @InjectRepository(LandingRecord)
    private readonly landingRepo: Repository<LandingRecord>,
  ) {}

  async findAll(): Promise<LandingCatch[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<LandingCatch> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`LandingCatch ${id} not found`);
    return e;
  }

  async create(dto: CreateLandingCatchDto): Promise<LandingCatch> {
    this.logger.log({ event: 'landing-catch.create', dto });
    const landing = await this.landingRepo.findOne({
      where: { id: dto.landingRecordId },
    });
    if (!landing) {
      throw new NotFoundException(
        `LandingRecord ${dto.landingRecordId} not found`,
      );
    }
    this.assertNonNegative(dto.quantity, 'quantity');
    const entity = this.repository.create({
      landingRecordId: dto.landingRecordId,
      speciesCode: dto.speciesCode ?? null,
      speciesName: dto.speciesName ?? null,
      quantity: numberToDbString(dto.quantity),
      unit: dto.unit ?? null,
    });
    return this.repository.save(entity);
  }

  async update(id: string, dto: UpdateLandingCatchDto): Promise<LandingCatch> {
    const entity = await this.findOne(id);
    this.assertNonNegative(dto.quantity, 'quantity');
    Object.assign(entity, {
      speciesCode: dto.speciesCode ?? entity.speciesCode,
      speciesName: dto.speciesName ?? entity.speciesName,
      quantity:
        dto.quantity !== undefined
          ? numberToDbString(dto.quantity)
          : entity.quantity,
      unit: dto.unit ?? entity.unit,
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
