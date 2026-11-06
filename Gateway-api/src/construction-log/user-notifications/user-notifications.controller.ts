import { Controller, Get, Patch, Param, Headers, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { UserNotificationsService } from './user-notifications.service';

@ApiTags(SwaggerTags.USER_NOTIFICATIONS)
@ApiBearerAuth('user')
@Controller('construction-log/user_notifications')
export class UserNotificationsController {
  constructor(
    private readonly userNotificationsService: UserNotificationsService,
  ) {}

  @Get('me/unread_count')
  async getUnreadCount(@Headers() { authorization }, @Res() res) {
    try {
      const { body, status } =
        await this.userNotificationsService.getUnreadCount(authorization);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('me')
  async getMyNotifications(@Headers() { authorization }, @Res() res) {
    try {
      const { body, status } =
        await this.userNotificationsService.getMyNotificationsEnriched(
          authorization,
        );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Patch(':id/read')
  async markAsRead(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.userNotificationsService.markAsRead(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Patch('me/read_all')
  async markAllAsRead(@Headers() { authorization }, @Res() res) {
    try {
      const { body, status } =
        await this.userNotificationsService.markAllAsRead(authorization);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
