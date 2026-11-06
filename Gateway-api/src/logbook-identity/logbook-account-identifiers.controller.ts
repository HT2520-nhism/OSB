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
import { AddAccountIdentifierDto, UpdateAccountIdentifierDto } from './dto';

@ApiTags(SwaggerTags.LOGBOOK_ACCOUNT_IDENTIFIERS)
@ApiBearerAuth('logbook-user')
@Controller('logbook/account-identifiers')
export class LogbookAccountIdentifiersController {
  @Post(':accountId/identifiers')
  @ApiOperation({ summary: 'Add identifier (email/phone) to account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiBody({ type: AddAccountIdentifierDto })
  @ApiResponse({
    status: 201,
    description: 'Identifier added',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Identifier already exists' })
  async addIdentifier(
    @Headers() { authorization }: { authorization?: string },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() body: AddAccountIdentifierDto,
    @Res() res,
  ) {
    try {
      const req = superagent
        .post(
          `${config.LOGBOOK_IDENTITY_API_URL}/api/account-identifiers/${accountId}/identifiers`,
        )
        .send(body);
      if (authorization) req.set('Authorization', authorization);
      const { body: data, status } = await req;

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get(':accountId/identifiers')
  @ApiOperation({ summary: 'Get all identifiers for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of identifiers',
  })
  async getIdentifiers(
    @Headers() { authorization }: { authorization?: string },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Res() res,
  ) {
    try {
      const req = superagent.get(
        `${config.LOGBOOK_IDENTITY_API_URL}/api/account-identifiers/${accountId}/identifiers`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Patch(':accountId/identifiers/:identifierId')
  @ApiOperation({ summary: 'Update identifier (set primary)' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiParam({ name: 'identifierId', description: 'Identifier UUID' })
  @ApiBody({ type: UpdateAccountIdentifierDto })
  @ApiResponse({
    status: 200,
    description: 'Identifier updated',
  })
  @ApiResponse({ status: 404, description: 'Identifier not found' })
  async updateIdentifier(
    @Headers() { authorization }: { authorization?: string },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Param('identifierId', ParseUUIDPipe) identifierId: string,
    @Body() body: UpdateAccountIdentifierDto,
    @Res() res,
  ) {
    try {
      const req = superagent
        .patch(
          `${config.LOGBOOK_IDENTITY_API_URL}/api/account-identifiers/${accountId}/identifiers/${identifierId}`,
        )
        .send(body);
      if (authorization) req.set('Authorization', authorization);
      const { body: data, status } = await req;

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
