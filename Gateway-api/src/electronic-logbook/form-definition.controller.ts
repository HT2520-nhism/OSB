/**
 * PHASE 8 — Electronic Logbook · Form Definition CRUD passthrough.
 *
 * Endpoints:
 *  GET    /form-definitions              — list (filterable, paginated)
 *  GET    /form-definitions/by-code/:code — active definition by code (M01/M02/M03)
 *  GET    /form-definitions/:id          — single definition
 *  POST   /form-definitions              — create
 *  PATCH  /form-definitions/:id          — update
 *  DELETE /form-definitions/:id          — delete
 *
 * NOTE: The `by-code/:code` route MUST be declared before `:id` so NestJS
 * does not interpret the literal string "by-code" as a UUID and trigger
 * the ParseUUIDPipe on the `:id` route.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';
import {
  CreateFormDefinitionDto,
  UpdateFormDefinitionDto,
  QueryFormDefinitionDto,
} from './dto';

@ApiTags(SwaggerTags.FORM_DEFINITION)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/form-definitions')
export class ElbFormDefinitionController {
  /**
   * List form definitions with optional filters and pagination.
   * Forwards every query param (formCode, isActive, search, formType,
   * page, limit) to the Electronic Logbook backend.
   */
  @Get()
  @ApiOperation({
    summary: 'List form definitions (filterable, paginated)',
    description:
      'Filter by formCode (e.g. M01/M02/M03), isActive, formType, or search by ' +
      'name/code. Paginated (page, limit, max 100).',
  })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFormDefinitionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'form-definitions',
      authorization,
      query,
      res,
    });
  }

  /**
   * Resolve the ACTIVE FormDefinition for a regulatory code (M01/M02/M03).
   * Declared BEFORE the `:id` route so NestJS does not match `by-code`
   * against the UUID-typed `:id` param.
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
  async findActiveByCode(
    @Headers() { authorization },
    @Param('code') code: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-definitions/by-code/${encodeURIComponent(code)}`,
      authorization,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form definition by ID' })
  @ApiParam({ name: 'id', description: 'Form definition UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-definitions/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create form definition' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFormDefinitionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'form-definitions',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update form definition' })
  @ApiParam({ name: 'id', description: 'Form definition UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFormDefinitionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-definitions/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete form definition' })
  @ApiParam({ name: 'id', description: 'Form definition UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-definitions/${id}`,
      authorization,
      res,
    });
  }
}
