import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { DeviceTokensService } from './device-tokens.service';

@ApiTags(SwaggerTags.USER_NOTIFICATIONS)
@ApiBearerAuth('user')
@Controller('construction-log/device_tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post('register')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { expoPushToken: { type: 'string' } },
      required: ['expoPushToken'],
    },
  })
  async register(
    @Headers() { authorization },
    @Body() body: { expoPushToken: string },
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.deviceTokensService.registerToken(authorization, body);
      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
