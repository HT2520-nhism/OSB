import {
  Controller,
  Get,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AllExceptionsFilter } from '../errors/exception-filter';
import validationPipe from '../validation-pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BackofficeRolesService } from './backoffice-roles.service';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';

@ApiBearerAuth('user')
@UsePipes(validationPipe())
@UseFilters(AllExceptionsFilter)
@ApiTags(SwaggerTags.BACKOFFICE_ROLES)
@Controller('backoffice_roles')
@UseGuards(JwtAuthGuard)
export class BackofficeRolesController {
  constructor(
    private readonly backofficeRolesService: BackofficeRolesService,
  ) {}

  @Get('/')
  getAllBackofficeRoles() {
    return this.backofficeRolesService.getAllBackofficeRoles();
  }
}
