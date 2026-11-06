import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vessel } from './vessel.entity';
import { Logger } from '../services/logger.service';
import { measurementToDbString } from '../domain/db-type-conversion';
import type { AuthUser } from '../auth/current-user.decorator';
import { AuthorizationService } from '../auth/authorization.service';

interface VesselCreateInput {
  registrationNumber: string;
  vesselName?: string;
  vesselType?: string;
  length?: number;
  width?: number;
  depth?: number;
  grossTonnage?: number;
  enginePower?: number;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  status?: string;
}

interface VesselUpdateInput {
  registrationNumber?: string;
  vesselName?: string;
  vesselType?: string;
  length?: number;
  width?: number;
  depth?: number;
  grossTonnage?: number;
  enginePower?: number;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  status?: string;
}

interface VesselFilterInput {
  search?: string;
  status?: string;
  provinceCode?: string;
  ownerId?: string;
}

@Injectable()
export class VesselService {
  private readonly logger = new Logger('VesselService');

  constructor(
    @InjectRepository(Vessel)
    private readonly repository: Repository<Vessel>,
    private readonly authService: AuthorizationService,
  ) {}

  async findAll(user?: AuthUser): Promise<Vessel[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    // If user is provided, only return their accessible vessels
    if (user?.accountId) {
      // SUPER_ADMIN sees all vessels
      if (this.authService.isSuperAdmin(user)) {
        return this.repository.find({ order: { createdAt: 'DESC' } });
      }

      const accessibleIds = await this.authService.getAllAccessibleVesselIds(
        user,
      );
      if (accessibleIds.length === 0) {
        return [];
      }
      return this.repository
        .createQueryBuilder('v')
        .where('v.id IN (:...accessibleIds)', { accessibleIds })
        .orderBy('v.created_at', 'DESC')
        .getMany();
    }

    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findByOwner(ownerId: string): Promise<Vessel[]> {
    return this.repository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user?: AuthUser): Promise<Vessel> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Vessel ${id} not found`);
    }

    // If user is provided, check access
    if (user?.accountId && !this.authService.isSuperAdmin(user)) {
      const isAccessible = await this.authService.isMemberOfVessel(id, user);
      if (!isAccessible) {
        throw new NotFoundException(`Vessel ${id} not found`);
      }
    }

    return entity;
  }

  async findOneByOwner(id: string, ownerId: string): Promise<Vessel | null> {
    return this.repository.findOne({ where: { id, ownerId } });
  }

  async create(data: VesselCreateInput, user: AuthUser): Promise<Vessel> {
    this.logger.log({ event: 'create', data, userId: user.accountId });
    const entity = this.repository.create({
      registrationNumber: data.registrationNumber,
      vesselName: data.vesselName ?? null,
      vesselType: data.vesselType ?? null,
      length: measurementToDbString(data.length),
      width: measurementToDbString(data.width),
      depth: measurementToDbString(data.depth),
      grossTonnage: measurementToDbString(data.grossTonnage),
      enginePower: measurementToDbString(data.enginePower),
      provinceCode: data.provinceCode ?? null,
      districtCode: data.districtCode ?? null,
      wardCode: data.wardCode ?? null,
      status: data.status ?? null,
      ownerId: user.accountId, // Set owner to current user
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: VesselUpdateInput,
    user: AuthUser,
  ): Promise<Vessel> {
    this.logger.log({
      event: 'update',
      id,
      changes: data,
      userId: user.accountId,
    });

    // Find the vessel
    const entity = await this.findOne(id);

    // SUPER_ADMIN can update any vessel
    if (this.authService.isSuperAdmin(user)) {
      // continue
    } else {
      // Check membership — captain/owner/admin can update
      const role = await this.authService.getVesselMembershipRole(id, user);
      const allowedRoles = new Set(['owner', 'captain', 'admin']);
      if (!role || !allowedRoles.has(role.toLowerCase())) {
        throw new NotFoundException(`Vessel ${id} not found`);
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.registrationNumber !== undefined)
      updateData.registrationNumber = data.registrationNumber;
    if (data.vesselName !== undefined) updateData.vesselName = data.vesselName;
    if (data.vesselType !== undefined) updateData.vesselType = data.vesselType;
    if (data.length !== undefined)
      updateData.length = measurementToDbString(data.length);
    if (data.width !== undefined)
      updateData.width = measurementToDbString(data.width);
    if (data.depth !== undefined)
      updateData.depth = measurementToDbString(data.depth);
    if (data.grossTonnage !== undefined)
      updateData.grossTonnage = measurementToDbString(data.grossTonnage);
    if (data.enginePower !== undefined)
      updateData.enginePower = measurementToDbString(data.enginePower);
    if (data.provinceCode !== undefined)
      updateData.provinceCode = data.provinceCode;
    if (data.districtCode !== undefined)
      updateData.districtCode = data.districtCode;
    if (data.wardCode !== undefined) updateData.wardCode = data.wardCode;
    if (data.status !== undefined) updateData.status = data.status;

    await this.repository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    this.logger.log({ event: 'remove', id, userId: user.accountId });

    // For delete, we rely on the controller-level SystemRoleGuard.
    // We still check existence.
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Vessel ${id} not found`);
    }

    await this.repository.delete(id);
  }
}
