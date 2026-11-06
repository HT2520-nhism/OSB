import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';
import { NotificationsService } from './notifications.service';

@ApiTags(SwaggerTags.NOTIFICATIONS)
@ApiBearerAuth('user')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async sendNotification(
    @Headers() { authorization },
    @Body()
    payload: {
      eventType: string;
      eventCode: string;
      title: string;
      body: string;
      userIds: string[];
      source: 'identity-api' | 'logboook-identity-api';
      priority?: string;
      payload?: Record<string, any>;
      deepLink?: string;
    },
    @Res() res,
  ) {
    try {
      const { body, status } = await this.notificationsService.sendNotification(
        authorization,
        payload,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('users/:userId/history')
  async getUserNotificationHistory(
    @Headers() { authorization },
    @Param('userId') userId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('unreadOnly') unreadOnly: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.notificationsService.getUserNotifications(
          authorization,
          userId,
          {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            unreadOnly: unreadOnly === 'true',
          },
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Patch('recipients/:recipientId/read')
  async markAsRead(
    @Headers() { authorization },
    @Param('recipientId') recipientId: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.notificationsService.markAsRead(
        authorization,
        recipientId,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('users/:userId/devices')
  async registerDevice(
    @Headers() { authorization },
    @Param('userId') userId: string,
    @Body()
    payload: {
      deviceToken: string;
      platform?: 'ios' | 'android';
      appVersion?: string;
      deviceName?: string;
    },
    @Res() res,
  ) {
    try {
      const { body, status } = await this.notificationsService.registerDevice(
        authorization,
        userId,
        payload,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
