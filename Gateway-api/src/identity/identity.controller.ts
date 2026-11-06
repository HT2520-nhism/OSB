import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import * as superagent from 'superagent';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';

@ApiTags(SwaggerTags.IDENTITY)
@ApiBearerAuth('user')
@Controller('auth')
export class IdentityController {
  @ApiBody({ schema: { type: 'object' } })
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body, @Res() res) {
    try {
      const { body: data, status } = await superagent
        .post(`${config.IDENTITY_API_URL}/api/auth/login`)
        .send(body);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBody({ schema: { type: 'object' } })
  @Post('/login/password')
  @HttpCode(HttpStatus.OK)
  async loginWithPassword(@Body() body, @Res() res) {
    try {
      const { body: data, status } = await superagent
        .post(`${config.IDENTITY_API_URL}/api/auth/login/password`)
        .send(body);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
