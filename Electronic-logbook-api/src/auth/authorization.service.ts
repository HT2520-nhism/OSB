/**
 * PHASE 8 — Centralized Authorization Service.
 *
 * Implements layered authorization for Electronic Logbook:
 *   1. System Role (global admin level)
 *   2. Vessel Membership (per-vessel access)
 *   3. Resource-level checks
 *
 * Source of truth rules:
 *  - SystemRole is embedded in JWT and verified upstream.
 *  - Vessel membership is always verified via database query.
 *  - Resource ownership is always verified via database query.
 *  - Client-supplied ownerId/accountId/role/systemRole are NEVER trusted.
 *
 * This service is the single point for all authorization decisions in the
 * electronic-logbook-api. Guards and controllers MUST delegate here
 * rather than implementing inline checks.
 */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';

import { Logger } from '../services/logger.service';
import { SystemRole } from '../constants/enums/system-role.enum';
import type { AuthUser } from './current-user.decorator';

export type { AuthUser };

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger('AuthorizationService');

  constructor(
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(VesselOwner)
    private readonly vesselOwnerRepo: Repository<VesselOwner>,
    @InjectRepository(VesselCrew)
    private readonly vesselCrewRepo: Repository<VesselCrew>,
    @InjectRepository(FishingTripCrew)
    private readonly tripCrewRepo: Repository<FishingTripCrew>,
  ) {}

  // ══════════════════════════════════════════════════════════════════════
  // SYSTEM ROLE CHECKS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Assert the user has the required system role.
   * Throws ForbiddenException if not authorized.
   */
  assertSystemRole(user: AuthUser, requiredRoles: SystemRole[]): void {
    if (!user?.systemRole) {
      throw new ForbiddenException('Authentication required');
    }

    if (requiredRoles.includes(SystemRole.SUPER_ADMIN)) {
      if (user.systemRole === SystemRole.SUPER_ADMIN) {
        return; // SUPER_ADMIN bypasses all system role checks
      }
    }

    if (!requiredRoles.includes(user.systemRole as SystemRole)) {
      this.logger.warn({
        event: 'system_role_denied',
        userId: user.accountId,
        userRole: user.systemRole,
        requiredRoles,
      });
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
  }

  /**
   * Check if user is SUPER_ADMIN (full system access).
   */
  isSuperAdmin(user: AuthUser): boolean {
    return user?.systemRole === SystemRole.SUPER_ADMIN;
  }

  /**
   * Check if user is ADMIN or higher.
   */
  isStaffOrHigher(user: AuthUser): boolean {
    return (
      user?.systemRole === SystemRole.SUPER_ADMIN ||
      user?.systemRole === SystemRole.ADMIN ||
      user?.systemRole === SystemRole.OPERATOR
    );
  }

  /**
   * Assert user has access to create/manage data for a vessel:
   * - System staff (OPERATOR, ADMIN, SUPER_ADMIN) have operational authority across port vessels.
   * - Regular users (USER / fishermen) must be verified members of the vessel.
   */
  async assertCanAccessVessel(vesselId: string, user: AuthUser): Promise<void> {
    if (this.isStaffOrHigher(user)) return;
    await this.assertVesselMember(vesselId, user);
  }

  /**
   * Check if user is ADMIN or higher.
   */
  isAdminOrHigher(user: AuthUser): boolean {
    return (
      user?.systemRole === SystemRole.SUPER_ADMIN ||
      user?.systemRole === SystemRole.ADMIN
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // VESSEL MEMBERSHIP CHECKS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Check if user has any membership on a vessel (owner or crew).
   */
  async isMemberOfVessel(vesselId: string, user: AuthUser): Promise<boolean> {
    if (!user?.accountId) return false;

    // SUPER_ADMIN bypasses vessel membership check
    if (this.isSuperAdmin(user)) return true;

    // Check direct ownerId
    const vessel = await this.vesselRepo.findOne({
      where: { id: vesselId },
      select: ['ownerId'],
    });
    if (!vessel) return false;
    if (vessel.ownerId === user.accountId) return true;

    // Check vessel_owners (active)
    const owner = await this.vesselOwnerRepo.findOne({
      where: { vesselId, userId: user.accountId, isCurrent: true },
    });
    if (owner) return true;

    // Check vessel_crew (active)
    const crew = await this.vesselCrewRepo.findOne({
      where: { vesselId, userId: user.accountId, isActive: true },
    });
    if (crew) return true;

    return false;
  }

  /**
   * Get the user's membership role on a vessel.
   * Returns null if user is not a member.
   */
  async getVesselMembershipRole(
    vesselId: string,
    user: AuthUser,
  ): Promise<string | null> {
    if (!user?.accountId) return null;
    if (this.isSuperAdmin(user)) return 'super_admin';

    const vessel = await this.vesselRepo.findOne({
      where: { id: vesselId },
      select: ['ownerId'],
    });
    if (!vessel) return null;

    // Direct owner
    if (vessel.ownerId === user.accountId) return 'owner';

    // Active vessel owner record
    const vo = await this.vesselOwnerRepo.findOne({
      where: { vesselId, userId: user.accountId, isCurrent: true },
    });
    if (vo) return vo.ownershipType ?? 'owner';

    // Active vessel crew record
    const vc = await this.vesselCrewRepo.findOne({
      where: { vesselId, userId: user.accountId, isActive: true },
    });
    if (vc) return vc.crewRole ?? 'crew';

    return null;
  }

  /**
   * Assert user is a member of the vessel.
   */
  async assertVesselMember(vesselId: string, user: AuthUser): Promise<void> {
    if (!(await this.isMemberOfVessel(vesselId, user))) {
      this.logger.warn({
        event: 'vessel_access_denied',
        vesselId,
        userId: user.accountId,
      });
      throw new ForbiddenException('You do not have access to this vessel');
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // RESOURCE AUTHORIZATION
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Assert user can access a fishing trip.
   * Access is granted via vessel membership.
   */
  async assertCanAccessTrip(tripId: string, user: AuthUser): Promise<void> {
    if (!user?.accountId) {
      throw new ForbiddenException('Authentication required');
    }

    if (this.isSuperAdmin(user)) return;

    // Get vessel through trip → fishing_trips table
    const result = await this.vesselRepo
      .createQueryBuilder('v')
      .innerJoin('v.fishingTrips', 'ft')
      .select('v.id', 'vesselId')
      .addSelect('v.owner_id', 'ownerId')
      .where('ft.id = :tripId', { tripId })
      .getRawOne();

    if (!result) {
      throw new ForbiddenException('Trip not found');
    }

    if (result.ownerId === user.accountId) return;
    if (await this.isMemberOfVessel(result.vesselId, user)) return;

    this.logger.warn({
      event: 'trip_access_denied',
      tripId,
      userId: user.accountId,
    });
    throw new ForbiddenException('You do not have access to this trip');
  }

  /**
   * Filter vessel IDs to only those the user can access.
   * SUPER_ADMIN sees all.
   */
  async filterAccessibleVesselIds(
    vesselIds: string[],
    user: AuthUser,
  ): Promise<string[]> {
    if (!user?.accountId) return [];
    if (vesselIds.length === 0) return [];

    if (this.isSuperAdmin(user)) return vesselIds;

    // Get vessels where user is direct owner
    const ownedVessels = await this.vesselRepo
      .createQueryBuilder('v')
      .select('v.id', 'vesselId')
      .where('v.owner_id = :accountId', { accountId: user.accountId })
      .andWhere('v.id IN (:...vesselIds)', { vesselIds })
      .getRawMany();

    // Get vessels where user is an active vessel owner
    const ownerMemberships = await this.vesselOwnerRepo
      .createQueryBuilder('vo')
      .select('vo.vessel_id', 'vesselId')
      .where('vo.user_id = :accountId', { accountId: user.accountId })
      .andWhere('vo.is_current = :isCurrent', { isCurrent: true })
      .andWhere('vo.vessel_id IN (:...vesselIds)', { vesselIds })
      .getRawMany();

    // Get vessels where user is active crew
    const crewMemberships = await this.vesselCrewRepo
      .createQueryBuilder('vc')
      .select('vc.vessel_id', 'vesselId')
      .where('vc.user_id = :accountId', { accountId: user.accountId })
      .andWhere('vc.is_active = :isActive', { isActive: true })
      .andWhere('vc.vessel_id IN (:...vesselIds)', { vesselIds })
      .getRawMany();

    const accessible = new Set<string>();
    for (const row of ownedVessels) accessible.add(row.vesselId);
    for (const row of ownerMemberships) accessible.add(row.vesselId);
    for (const row of crewMemberships) accessible.add(row.vesselId);

    return Array.from(accessible);
  }

  /**
   * Get all vessel IDs the user can access (for list operations).
   */
  async getAllAccessibleVesselIds(user: AuthUser): Promise<string[]> {
    if (!user?.accountId) return [];

    if (this.isSuperAdmin(user)) {
      // SUPER_ADMIN can see all vessels — return empty array and let
      // the service handle "no filter" case
      return [];
    }

    const ownedVessels = await this.vesselRepo
      .createQueryBuilder('v')
      .select('v.id', 'vesselId')
      .where('v.owner_id = :accountId', { accountId: user.accountId })
      .getRawMany();

    const ownerMemberships = await this.vesselOwnerRepo
      .createQueryBuilder('vo')
      .select('vo.vessel_id', 'vesselId')
      .where('vo.user_id = :accountId', { accountId: user.accountId })
      .andWhere('vo.is_current = :isCurrent', { isCurrent: true })
      .getRawMany();

    const crewMemberships = await this.vesselCrewRepo
      .createQueryBuilder('vc')
      .select('vc.vessel_id', 'vesselId')
      .where('vc.user_id = :accountId', { accountId: user.accountId })
      .andWhere('vc.is_active = :isActive', { isActive: true })
      .getRawMany();

    const accessible = new Set<string>();
    for (const row of ownedVessels) accessible.add(row.vesselId);
    for (const row of ownerMemberships) accessible.add(row.vesselId);
    for (const row of crewMemberships) accessible.add(row.vesselId);

    return Array.from(accessible);
  }
}
