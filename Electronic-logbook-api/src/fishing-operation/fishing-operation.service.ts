/**
 * PHASE 5 — Fishing Operation Business Service.
 *
 * Rules:
 *  - FishingTrip must exist.
 *  - Cannot create fishing operations for a CANCELLED trip.
 *  - Depth must not be negative.
 *  - Latitude/longitude must be valid geographic coordinates.
 *  - operationStartedAt must not be after operationEndedAt.
 *  - Identity (createdBy) comes from the authenticated user.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FishingOperation } from './fishing-operation.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

import { CreateFishingOperationDto } from './dto/create-fishing-operation.dto';
import { UpdateFishingOperationDto } from './dto/update-fishing-operation.dto';

import { FishingTripStatus } from '../constants/enums/domain.enum';
import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';
import {
  coordinateToDbString,
  measurementToDbString,
} from '../domain/db-type-conversion';

@Injectable()
export class FishingOperationService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FishingOperationService');

  constructor(
    @InjectRepository(FishingOperation)
    private readonly repository: Repository<FishingOperation>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
  ) {}

  async findAll(): Promise<FishingOperation[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FishingOperation> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`FishingOperation ${id} not found`);
    return e;
  }

  async create(
    dto: CreateFishingOperationDto,
    user: AuthUser,
  ): Promise<FishingOperation> {
    this.logger.log({ event: 'operation.create', dto, by: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    const trip = await this.tripRepo.findOne({
      where: { id: dto.fishingTripId },
    });
    if (!trip) {
      throw new NotFoundException(`FishingTrip ${dto.fishingTripId} not found`);
    }
    if (trip.status === FishingTripStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot create fishing operations on a CANCELLED trip',
      );
    }
    this.assertCoordinates(dto.latitude, dto.longitude);
    this.assertDepth(dto.depth);
    this.assertTimeRange(dto.operationStartedAt, dto.operationEndedAt);

    // Convert numeric DTO fields to DB string format
    const entity = this.repository.create({
      fishingTripId: dto.fishingTripId,
      latitude: coordinateToDbString(dto.latitude),
      longitude: coordinateToDbString(dto.longitude),
      operationStartedAt: dto.operationStartedAt
        ? new Date(dto.operationStartedAt)
        : null,
      operationEndedAt: dto.operationEndedAt
        ? new Date(dto.operationEndedAt)
        : null,
      operationType: dto.operationType ?? null,
      fishingGearType: dto.fishingGearType ?? null,
      fishingGround: dto.fishingGround ?? null,
      depth: measurementToDbString(dto.depth),
      notes: dto.notes ?? null,
      createdBy: user.accountId,
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateFishingOperationDto,
  ): Promise<FishingOperation> {
    const entity = await this.findOne(id);
    this.assertCoordinates(dto.latitude, dto.longitude);
    this.assertDepth(dto.depth);
    this.assertTimeRange(dto.operationStartedAt, dto.operationEndedAt);

    // Convert numeric DTO fields to DB string format
    Object.assign(entity, {
      latitude:
        dto.latitude !== undefined
          ? coordinateToDbString(dto.latitude)
          : entity.latitude,
      longitude:
        dto.longitude !== undefined
          ? coordinateToDbString(dto.longitude)
          : entity.longitude,
      operationStartedAt:
        dto.operationStartedAt !== undefined
          ? dto.operationStartedAt
            ? new Date(dto.operationStartedAt)
            : null
          : entity.operationStartedAt,
      operationEndedAt:
        dto.operationEndedAt !== undefined
          ? dto.operationEndedAt
            ? new Date(dto.operationEndedAt)
            : null
          : entity.operationEndedAt,
      operationType: dto.operationType ?? entity.operationType,
      fishingGearType: dto.fishingGearType ?? entity.fishingGearType,
      fishingGround: dto.fishingGround ?? entity.fishingGround,
      depth:
        dto.depth !== undefined
          ? measurementToDbString(dto.depth)
          : entity.depth,
      notes: dto.notes ?? entity.notes,
    });
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private assertCoordinates(
    latitude: number | string | null | undefined,
    longitude: number | string | null | undefined,
  ): void {
    if (latitude === null || latitude === undefined) {
      // missing lat/lon allowed
    } else {
      const lat = typeof latitude === 'string' ? Number(latitude) : latitude;
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new BadRequestException(
          `latitude must be between -90 and 90 (got ${latitude})`,
        );
      }
    }
    if (longitude === null || longitude === undefined) {
    } else {
      const lng = typeof longitude === 'string' ? Number(longitude) : longitude;
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new BadRequestException(
          `longitude must be between -180 and 180 (got ${longitude})`,
        );
      }
    }
  }

  private assertDepth(depth: number | string | null | undefined): void {
    if (depth === null || depth === undefined) return;
    const d = typeof depth === 'string' ? Number(depth) : depth;
    if (!Number.isFinite(d)) {
      throw new BadRequestException(`depth must be numeric (got ${depth})`);
    }
    if (d < 0) {
      throw new BadRequestException(`depth must not be negative`);
    }
  }

  private assertTimeRange(
    start: string | null | undefined,
    end: string | null | undefined,
  ): void {
    if (!start || !end) return;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return;
    if (e.getTime() < s.getTime()) {
      throw new BadRequestException(
        `operationEndedAt (${end}) cannot be before operationStartedAt (${start})`,
      );
    }
  }
}
