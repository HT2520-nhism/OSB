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
import { ProjectTasksService } from './project-tasks.service';

@ApiTags(SwaggerTags.PROJECTS)
@ApiBearerAuth('user')
@Controller('construction-log')
export class ProjectTasksController {
  constructor(private readonly projectTasksService: ProjectTasksService) {}

  @ApiParam({ name: 'projectId', schema: { type: 'string' } })
  @Get('/projects/:projectId/tasks')
  async getTasksByProject(
    @Headers() { authorization },
    @Param('projectId') projectId: string,
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.projectTasksService.getTasksByProject(
        authorization,
        projectId,
        query,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'projectId', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Post('/projects/:projectId/tasks')
  async createTask(
    @Headers() { authorization },
    @Param('projectId') projectId: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.projectTasksService.createTask(
          authorization,
          projectId,
          body,
        );

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'taskId', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Patch('/tasks/:taskId')
  async updateTask(
    @Headers() { authorization },
    @Param('taskId') taskId: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.projectTasksService.updateTask(authorization, taskId, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'taskId', schema: { type: 'string' } })
  @Delete('/tasks/:taskId')
  async deleteTask(
    @Headers() { authorization },
    @Param('taskId') taskId: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.projectTasksService.deleteTask(
        authorization,
        taskId,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
