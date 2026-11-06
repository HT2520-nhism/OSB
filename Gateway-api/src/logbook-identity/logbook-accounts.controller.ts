import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import * as superagent from 'superagent';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';
import { CreateAccountDto, UpdateAccountDto } from './dto';

@ApiTags(SwaggerTags.LOGBOOK_ACCOUNTS)
@ApiBearerAuth('logbook-user')
@Controller('logbook/accounts')
export class LogbookAccountsController {
  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async findAll(
    @Headers() { authorization }: { authorization?: string },
    @Res() res,
  ) {
    try {
      const req = superagent.get(
        `${config.LOGBOOK_IDENTITY_API_URL}/api/accounts`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
  })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async create(
    @Headers() { authorization }: { authorization?: string },
    @Body() body: CreateAccountDto,
    @Res() res,
  ) {
    try {
      const req = superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/accounts`)
        .send(body);
      if (authorization) req.set('Authorization', authorization);
      const { body: data, status } = await req;

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Account details',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findById(
    @Headers() { authorization }: { authorization?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    try {
      const req = superagent.get(
        `${config.LOGBOOK_IDENTITY_API_URL}/api/accounts/${id}`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account status or type' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account updated',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Headers() { authorization }: { authorization?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAccountDto,
    @Res() res,
  ) {
    try {
      const req = superagent
        .patch(`${config.LOGBOOK_IDENTITY_API_URL}/api/accounts/${id}`)
        .send(body);
      if (authorization) req.set('Authorization', authorization);
      const { body: data, status } = await req;

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get(':id/notification-info')
  @ApiOperation({ summary: 'Get account info for notifications' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Account notification info',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountForNotification(
    @Headers() { authorization }: { authorization?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    try {
      const req = superagent.get(
        `${config.LOGBOOK_IDENTITY_API_URL}/api/accounts/${id}/notification-info`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
