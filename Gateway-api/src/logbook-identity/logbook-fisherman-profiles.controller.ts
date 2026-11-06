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
import { CreateFishermanProfileDto, UpdateFishermanProfileDto } from './dto';

@ApiTags(SwaggerTags.LOGBOOK_FISHERMAN_PROFILES)
@ApiBearerAuth('logbook-user')
@Controller('logbook/fisherman-profiles')
export class LogbookFishermanProfilesController {
  @Post(':accountId/profile')
  @ApiOperation({ summary: 'Create fisherman profile for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiBody({ type: CreateFishermanProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Profile created',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @Headers() { authorization }: { authorization?: string },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() body: CreateFishermanProfileDto,
    @Res() res,
  ) {
    try {
      const req = superagent
        .post(
          `${config.LOGBOOK_IDENTITY_API_URL}/api/fisherman-profiles/${accountId}/profile`,
        )
        .send(body);
      if (authorization) req.set('Authorization', authorization);
      const { body: data, status } = await req;

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get(':accountId/profile')
  @ApiOperation({ summary: 'Get fisherman profile for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({
    status: 200,
    description: 'Profile details',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(
    @Headers() { authorization }: { authorization?: string },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Res() res,
  ) {
    try {
      const req = superagent.get(
        `${config.LOGBOOK_IDENTITY_API_URL}/api/fisherman-profiles/${accountId}/profile`,
      );
      if (authorization) req.set('Authorization', authorization);
      const { body, status } = await req;

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Patch(':accountId/profile')
  @ApiOperation({ summary: 'Update fisherman profile for account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiBody({ type: UpdateFishermanProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @Headers() { authorization }: { authorization?: string },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() body: UpdateFishermanProfileDto,
    @Res() res,
  ) {
    try {
      const req = superagent
        .patch(
          `${config.LOGBOOK_IDENTITY_API_URL}/api/fisherman-profiles/${accountId}/profile`,
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
