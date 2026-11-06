import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Logger } from '../services/logger.service';
import { DepartmentEntity } from './department.entity';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectRepository(DepartmentEntity)
    private departmentsRepo: Repository<DepartmentEntity>,
  ) {}

  /**
   * Return departments, optionally filtered by company.
   * Nếu có companyId → chỉ trả về phòng ban thuộc đơn vị đó (hỗ trợ cascading UI).
   */
  async getAllDepartments(companyId?: number) {
    this.logger.log({
      message: '[getAllDepartments] Receive request to get all departments',
      companyId,
    });

    const where = companyId ? { company: { id: companyId } } : {};
    const departments = await this.departmentsRepo.find({
      where,
      relations: ['company'],
      order: { name: 'ASC' },
    });

    return {
      departments,
    };
  }
}
