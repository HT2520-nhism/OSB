import {
  Controller,
  Get,
  Query,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AllExceptionsFilter } from '../errors/exception-filter';
import validationPipe from '../validation-pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepartmentsService } from './departments.service';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';

@ApiBearerAuth('user')
@UsePipes(validationPipe())
@UseFilters(AllExceptionsFilter)
@ApiTags(SwaggerTags.DEPARTMENTS)
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get('/')
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: Number,
    description:
      'Lọc phòng ban theo đơn vị. Nếu có → chỉ trả về phòng ban thuộc company đó.',
  })
  getAllDepartments(@Query('companyId') companyId?: string) {
    const id = companyId ? parseInt(companyId, 10) : undefined;
    return this.departmentsService.getAllDepartments(
      Number.isNaN(id) ? undefined : id,
    );
  }
}
