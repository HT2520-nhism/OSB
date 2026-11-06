import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Headers,
  Res,
  Param,
  Body,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import * as superagent from 'superagent';

import { config } from '../../config';
import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';

@ApiTags(SwaggerTags.USERS)
@ApiBearerAuth('user')
@Controller('identity/users')
export class UsersController {
  @ApiQuery({ name: 'queries', schema: { type: 'object' } })
  @Get('/')
  async getAllUsers(@Headers() { authorization }, @Query() query, @Res() res) {
    try {
      const { body, status } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users`)
        .query(query)
        .set('Authorization', authorization || null);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBody({ schema: { type: 'object' } })
  @Post('/')
  async createUser(@Headers() { authorization }, @Body() body, @Res() res) {
    try {
      const { body: resData, status } = await superagent
        .post(`${config.IDENTITY_API_URL}/api/users`)
        .send(body)
        .set('Authorization', authorization || null);

      return res.status(status).json(resData);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('/:id')
  async getUserById(@Headers() { authorization }, @Param('id') id, @Res() res) {
    try {
      const { body, status } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users/${id}`)
        .set('Authorization', authorization || null);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Patch('/:id')
  async updateUserById(
    @Headers() { authorization },
    @Param('id') id,
    @Body() body,
    @Res() res,
  ) {
    try {
      const { body: resData, status } = await superagent
        .patch(`${config.IDENTITY_API_URL}/api/users/${id}`)
        .send(body)
        .set('Authorization', authorization || null);

      return res.status(status).json(resData);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Delete('/:id')
  async deleteUserById(
    @Headers() { authorization },
    @Param('id') id,
    @Res() res,
  ) {
    try {
      const { body: resData, status } = await superagent
        .delete(`${config.IDENTITY_API_URL}/api/users/${id}`)
        .set('Authorization', authorization || null);

      return res.status(status).json(resData);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
