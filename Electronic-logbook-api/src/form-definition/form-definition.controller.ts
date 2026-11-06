import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';

import { FormDefinitionService } from './form-definition.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Form_definition')
@UseGuards(LogbookJwtAuthGuard)
@Controller('form-definitions')
export class FormDefinitionController {
  constructor(private readonly service: FormDefinitionService) {}

  /**
   * List form definitions with optional filters and pagination.
   *
   * Supported query parameters:
   *  - formCode : exact (case-insensitive) match, e.g. ?formCode=M03
   *  - isActive : true / false
   *  - formType : exact match
   *  - search   : substring match against name OR formCode (case-insensitive)
   *  - page     : page number (default 1)
   *  - limit    : page size (default 20, max 100)
   *
   * Response: { data: FormDefinition[], meta: { total, page, limit, totalPages } }
   */
  @Get()
  @ApiOperation({
    summary: 'List form definitions (filterable, paginated)',
    description:
      'Returns form definitions filtered by query parameters. Use formCode and ' +
      'isActive to find a specific regulatory definition (e.g. M03).',
  })
  findAll(@Query() query: Dto.QueryFormDefinitionDto) {
    return this.service.findAll(query);
  }

  /**
   * Resolve the active FormDefinition for a regulatory code (M01/M02/M03).
   * 404 if no active definition is registered for the code.
   */
  @Get('by-code/:code')
  @ApiOperation({
    summary: 'Get the active FormDefinition for a regulatory code',
    description:
      'Returns the active (isActive=true) FormDefinition matching the given ' +
      'form code (e.g. M01, M02, M03). Case-insensitive. 404 if no active ' +
      'definition is registered for the code.',
  })
  @ApiParam({
    name: 'code',
    description: 'Regulatory form code (case-insensitive)',
    example: 'M03',
  })
  findActiveByCode(@Param('code') code: string) {
    return this.service.findActiveByCode(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Dto.CreateFormDefinitionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateFormDefinitionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
