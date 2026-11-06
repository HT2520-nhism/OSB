/**
 * PHASE 5 — Fishing Trip Gear Business Service.
 *
 * Rules:
 *  - Fishing Trip must exist.
 *  - When fishingGearId is supplied, the master FishingGear must exist.
 *  - Quantity must not be negative.
 *  - Preserve gear type information.
 *  - Do NOT silently overwrite master gear data.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FishingTripGear } from './fishing-trip-gear.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingGear } from '../fishing-gear/fishing-gear.entity';

import { CreateFishingTripGearDto } from './dto/create-fishing-trip-gear.dto';
import { UpdateFishingTripGearDto } from './dto/update-fishing-trip-gear.dto';

import { Logger } from '../services/logger.service';
import { numberToDbString } from '../domain/db-type-conversion';

@Injectable()
export class FishingTripGearService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FishingTripGearService');

  constructor(
    @InjectRepository(FishingTripGear)
    private readonly repository: Repository<FishingTripGear>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    @InjectRepository(FishingGear)
    private readonly gearRepo: Repository<FishingGear>,
  ) {}

  async findAll(): Promise<FishingTripGear[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FishingTripGear> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`FishingTripGear ${id} not found`);
    return e;
  }

  async create(dto: CreateFishingTripGearDto): Promise<FishingTripGear> {
    this.logger.log({ event: 'trip-gear.create', dto });
    const trip = await this.tripRepo.findOne({
      where: { id: dto.fishingTripId },
    });
    if (!trip) {
      throw new NotFoundException(`FishingTrip ${dto.fishingTripId} not found`);
    }
    if (dto.fishingGearId) {
      const gear = await this.gearRepo.findOne({
        where: { id: dto.fishingGearId },
      });
      if (!gear) {
        throw new NotFoundException(
          `FishingGear ${dto.fishingGearId} not found`,
        );
      }
    }
    this.assertNonNegative(dto.quantity, 'quantity');
    // Convert numeric DTO fields to DB string format
    const entity = this.repository.create({
      fishingTripId: dto.fishingTripId,
      fishingGearId: dto.fishingGearId ?? null,
      gearType: dto.gearType ?? null,
      quantity: numberToDbString(dto.quantity),
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateFishingTripGearDto,
  ): Promise<FishingTripGear> {
    const entity = await this.findOne(id);
    this.assertNonNegative(dto.quantity, 'quantity');
    if (dto.fishingGearId) {
      const gear = await this.gearRepo.findOne({
        where: { id: dto.fishingGearId },
      });
      if (!gear) {
        throw new NotFoundException(
          `FishingGear ${dto.fishingGearId} not found`,
        );
      }
    }
    // Convert numeric DTO fields to DB string format
    Object.assign(entity, {
      fishingGearId: dto.fishingGearId ?? entity.fishingGearId,
      gearType: dto.gearType ?? entity.gearType,
      quantity:
        dto.quantity !== undefined
          ? numberToDbString(dto.quantity)
          : entity.quantity,
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
