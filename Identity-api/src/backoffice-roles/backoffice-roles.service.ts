import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Logger } from '../services/logger.service';
import {
  BackofficeRoleEntity,
  DEFAULT_SELECTED_FIELDS,
} from './backoffice-role.entity';
import { transformSelectFields } from '../helpers/transform-select-fields';

@Injectable()
export class BackofficeRolesService {
  private readonly logger = new Logger(BackofficeRolesService.name);

  constructor(
    @InjectRepository(BackofficeRoleEntity)
    private backofficeRoleRepo: Repository<BackofficeRoleEntity>,
  ) {}

  /**
   * Return all the backoffice roles
   */
  async getAllBackofficeRoles() {
    this.logger.log({
      message:
        '[getAllBackofficeRoles] Receive request to get all backoffice roles',
    });

    const backofficeRoles = await this.backofficeRoleRepo.find({
      select: transformSelectFields(DEFAULT_SELECTED_FIELDS),
      relations: ['department', 'department.company'],
    });

    return {
      backofficeRoles,
    };
  }
}
