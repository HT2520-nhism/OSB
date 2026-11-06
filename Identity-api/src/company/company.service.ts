import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Logger } from '../services/logger.service';
import { CompanyEntity } from './company.entity';
import { CompanyType } from '../constants/enums/company-type.enum';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(CompanyEntity)
    private CompanyRepo: Repository<CompanyEntity>,
  ) {}

  /**
   * Return all the company
   */
  async getAllCompany() {
    this.logger.log({
      message: '[getAllCompany] Receive request to get all company',
    });

    const Company = await this.CompanyRepo.find({
      order: { name: 'ASC' },
    });

    return {
      Company,
    };
  }

  async getSubsidiariesCompany() {
    this.logger.log({
      message:
        '[getSubsidiariesCompany] Receive request to get subsidiaries company',
    });
    const subsidiariesCompany = await this.CompanyRepo.find({
      where: {
        type: CompanyType.SUBSIDIARY,
      },
      order: { name: 'ASC' },
    });
    return subsidiariesCompany;
  }

  /**
   * Trả về cấu trúc tổ chức: holding (1) + subsidiaries (n).
   * Dùng cho cascading UI: chọn cấp Tập đoàn hay Đơn vị trước, rồi chọn đơn vị/phòng ban.
   */
  async getOrganizationHierarchy() {
    const all = await this.CompanyRepo.find({
      order: { name: 'ASC' },
    });
    const holding = all.find((c) => c.type === CompanyType.HOLDING) ?? null;
    const subsidiaries = all.filter((c) => c.type === CompanyType.SUBSIDIARY);
    return { holding, subsidiaries };
  }
}
