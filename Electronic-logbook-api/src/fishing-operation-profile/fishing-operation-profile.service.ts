/**
 * PHASE 8 — Fishing Operation Profile Service.
 *
 * Responsibilities:
 *  1. Create profiles with auto-generated fisherman_code (via PostgreSQL sequence)
 *  2. Search by fisherman_code (exact match) or user_id
 *  3. Prevent duplicate user_id
 *  4. Enforce authorization — users can only search/list profiles
 *
 * Code Generation (CONCURRENT-SAFE):
 *  Uses PostgreSQL sequence nextval() — no race condition.
 *  SELECT nextval('fisherman_code_seq') → 123 → 'FSH-' || LPAD(123, 6, '0')
 */
import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import {
  FishingOperationProfile,
  FishingOperationProfileStatus,
} from './fishing-operation-profile.entity';
import {
  CreateFishingOperationProfileDto,
  SearchFishingOperationProfileDto,
  FishingOperationProfileResponseDto,
} from './dto';
import type { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class FishingOperationProfileService {
  private readonly logger = new Logger('FishingOperationProfileService');

  constructor(
    @InjectRepository(FishingOperationProfile)
    private readonly repository: Repository<FishingOperationProfile>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generate next fisherman code using PostgreSQL sequence.
   * Thread-safe — sequence handles concurrent requests atomically.
   */
  private async generateFishermanCode(): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT nextval('fisherman_code_seq') as seq`,
    );
    const seq = result[0]?.seq as number;
    if (!seq) {
      throw new Error('Failed to generate fisherman code sequence');
    }
    return `FSH-${seq.toString().padStart(6, '0')}`;
  }

  /**
   * Create a new fishing operation profile.
   * - Generates fisherman_code server-side
   * - Enforces unique user_id
   * - User must have proper authorization context
   */
  async create(
    dto: CreateFishingOperationProfileDto,
    user: AuthUser,
  ): Promise<FishingOperationProfile> {
    this.logger.log({ event: 'profile.create', dto, by: user?.accountId });

    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    // Check duplicate user_id
    const existing = await this.repository.findOne({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException(
        `Fishing Operation Profile already exists for user ${dto.userId}`,
      );
    }

    // Generate fisherman code (sequence-based)
    const fishermanCode = await this.generateFishermanCode();

    const entity = this.repository.create({
      userId: dto.userId,
      fishermanCode,
      status:
        (dto.status as FishingOperationProfileStatus) ??
        FishingOperationProfileStatus.ACTIVE,
    });

    return this.repository.save(entity);
  }

  /**
   * Search fishermen by fisherman_code (exact) or user_id.
   * Returns minimal public data — no sensitive information.
   */
  async search(
    query: SearchFishingOperationProfileDto,
    user?: AuthUser,
  ): Promise<FishingOperationProfileResponseDto[]> {
    this.logger.log({
      event: 'profile.search',
      query,
      userId: user?.accountId,
    });

    if (!user?.accountId) {
      return [];
    }

    const qb = this.repository.createQueryBuilder('p');

    if (query.fishermanCode) {
      qb.andWhere('p.fisherman_code = :fishermanCode', {
        fishermanCode: query.fishermanCode,
      });
    }

    if (query.userId) {
      qb.andWhere('p.user_id = :userId', { userId: query.userId });
    }

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    qb.orderBy('p.created_at', 'DESC');

    const profiles = await qb.getMany();

    // Map to response DTO — strip sensitive fields
    return profiles.map((p) => ({
      id: p.id,
      fishermanCode: p.fishermanCode,
      userId: p.userId,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Find profile by fisherman_code.
   * Returns 404 if not found.
   */
  async findByFishermanCode(
    fishermanCode: string,
    user?: AuthUser,
  ): Promise<FishingOperationProfileResponseDto | null> {
    if (!user?.accountId) return null;

    const profile = await this.repository.findOne({
      where: { fishermanCode },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      fishermanCode: profile.fishermanCode,
      userId: profile.userId,
      status: profile.status,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  /**
   * Resolve fisherman_code to user_id.
   * Used by VesselCrew/FishingTripCrew when assigning crew.
   */
  async resolveUserIdByCode(
    fishermanCode: string,
  ): Promise<{ userId: string; status: FishingOperationProfileStatus } | null> {
    const profile = await this.repository.findOne({
      where: { fishermanCode },
    });

    if (!profile) return null;

    return {
      userId: profile.userId,
      status: profile.status,
    };
  }

  /**
   * Find profile by user ID.
   */
  async findByUserId(userId: string): Promise<FishingOperationProfile | null> {
    return this.repository.findOne({ where: { userId } });
  }

  /**
   * Get profile by ID (admin/internal use).
   */
  async findOne(id: string): Promise<FishingOperationProfile> {
    const profile = await this.repository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`FishingOperationProfile ${id} not found`);
    }
    return profile;
  }
}
