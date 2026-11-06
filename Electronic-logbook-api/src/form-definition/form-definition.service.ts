/**
 * PHASE 5 — Form Definition Business Service.
 *
 * Adds active definition lookup by code.
 *
 * PHASE 9 — Query filtering:
 *  - findAll now supports filters (formCode, isActive, formType, search)
 *    and pagination. Returns a PaginatedResult envelope so the mobile /
 *    web client can render paged lists without re-fetching.
 *  - findActiveByCode remains for single-shot lookups of the active
 *    regulatory definition (M01/M02/M03).
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FormDefinition } from './form-definition.entity';
import { CreateFormDefinitionDto } from './dto/create-form-definition.dto';
import { UpdateFormDefinitionDto } from './dto/update-form-definition.dto';
import { QueryFormDefinitionDto } from './dto/query-form-definition.dto';

import { Logger } from '../services/logger.service';

export interface PaginatedFormDefinitions {
  data: FormDefinition[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class FormDefinitionService {
  /* istanbul ignore next */
  private readonly logger = new Logger('FormDefinitionService');

  constructor(
    @InjectRepository(FormDefinition)
    private readonly repository: Repository<FormDefinition>,
  ) {}

  /**
   * Find form definitions with optional filters and pagination.
   *
   * Filters:
   *  - formCode : exact (case-insensitive) match
   *  - isActive : true/false
   *  - formType : exact match
   *  - search   : case-insensitive LIKE on name OR formCode
   *
   * Pagination:
   *  - page (default 1, min 1)
   *  - limit (default 20, min 1, max 100)
   *
   * Returns a PaginatedResult envelope so the client can render paged UI
   * without re-fetching.
   */
  async findAll(
    query: QueryFormDefinitionDto,
  ): Promise<PaginatedFormDefinitions> {
    this.logger.log({ event: 'form-definition.findAll', query });
    const qb = this.repository.createQueryBuilder('fd');

    if (query.formCode) {
      qb.andWhere('UPPER(fd.form_code) = :formCode', {
        formCode: query.formCode,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('fd.is_active = :isActive', { isActive: query.isActive });
    }
    if (query.formType) {
      qb.andWhere('fd.form_type = :formType', { formType: query.formType });
    }
    if (query.search) {
      const like = `%${query.search}%`;
      qb.andWhere(
        '(LOWER(fd.name) LIKE LOWER(:like) OR LOWER(fd.form_code) LIKE LOWER(:like))',
        { like },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.orderBy('fd.form_code', 'ASC').addOrderBy('fd.version', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async findOne(id: string): Promise<FormDefinition> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`FormDefinition ${id} not found`);
    return e;
  }

  async findActiveByCode(code: string): Promise<FormDefinition> {
    this.logger.log({ event: 'form-definition.findActiveByCode', code });
    const def = await this.repository.findOne({
      where: { formCode: code.toUpperCase(), isActive: true },
    });
    if (!def) {
      throw new NotFoundException(
        `Active FormDefinition for code ${code} not found`,
      );
    }
    return def;
  }

  /**
   * Find active FormDefinitions by code — returns all currently active
   * versions of a given code (typically just one row). Returns empty
   * array if no active definition exists. Useful for read-only paths
   * that should not 404 when a regulatory code is not yet seeded
   * (e.g. trip overview enrichment).
   */
  async findActiveByCodeSafe(code: string): Promise<FormDefinition[]> {
    this.logger.log({ event: 'form-definition.findActiveByCodeSafe', code });
    return this.repository.find({
      where: { formCode: code.toUpperCase(), isActive: true },
    });
  }

  async create(dto: CreateFormDefinitionDto): Promise<FormDefinition> {
    this.logger.log({ event: 'form-definition.create', dto });
    if (dto.effectiveFrom && dto.effectiveTo) {
      const f = new Date(dto.effectiveFrom);
      const t = new Date(dto.effectiveTo);
      if (Number.isFinite(f.getTime()) && Number.isFinite(t.getTime())) {
        if (t.getTime() < f.getTime()) {
          throw new BadRequestException(
            'effectiveTo cannot be before effectiveFrom',
          );
        }
      }
    }
    const entity = this.repository.create({
      ...dto,
      formCode: dto.formCode?.toUpperCase(),
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateFormDefinitionDto,
  ): Promise<FormDefinition> {
    const entity = await this.findOne(id);
    if (dto.formCode) {
      entity.formCode = dto.formCode.toUpperCase();
    }
    Object.assign(entity, dto);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
