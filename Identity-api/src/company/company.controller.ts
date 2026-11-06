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
import { CompanyService } from './company.service';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';

@ApiBearerAuth('user')
@UsePipes(validationPipe())
@UseFilters(AllExceptionsFilter)
@ApiTags(SwaggerTags.COMPANY)
@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('/')
  getAllCompanies() {
    return this.companyService.getAllCompany();
  }

  @Get('/subsidiaries')
  getSubsidiariesCompany() {
    return this.companyService.getSubsidiariesCompany();
  }

  @Get('/hierarchy')
  getOrganizationHierarchy() {
    return this.companyService.getOrganizationHierarchy();
  }
}
