import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { DailyLogService } from './daily-log.service';

@ApiTags(SwaggerTags.DAILY_LOGS)
@ApiBearerAuth('user')
@Controller('construction-log/daily-log')
export class DailyLogController {
  constructor(private readonly dailyLogService: DailyLogService) {}

  @ApiBody({ schema: { type: 'object' } })
  @Post('/')
  async createDailyLog(
    @Headers() { authorization },
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.dailyLogService.createDailyLog(authorization, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('/:id')
  async getDailyLogById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.getDailyLogById(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'projectId', schema: { type: 'string' } })
  @Get('/project/:projectId')
  async getDailyLogsByProject(
    @Headers() { authorization },
    @Param('projectId') projectId: string,
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.getDailyLogsByProject(
        authorization,
        projectId,
        query,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'taskId', schema: { type: 'string' } })
  @Get('/task/:taskId')
  async getDailyLogsByTask(
    @Headers() { authorization },
    @Param('taskId') taskId: string,
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.getDailyLogsByTask(
        authorization,
        taskId,
        query,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Patch('/:id')
  async updateDailyLog(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.dailyLogService.updateDailyLog(authorization, id, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Post('/:id/submit')
  async submitDailyLog(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.submitDailyLog(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Post('/:id/approve')
  async approveDailyLog(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.approveDailyLog(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Post('/:id/reject')
  async rejectDailyLog(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.rejectDailyLog(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Delete('/:id')
  async deleteDailyLog(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.dailyLogService.deleteDailyLog(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
