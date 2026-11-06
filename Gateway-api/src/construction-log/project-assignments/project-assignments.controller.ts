import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { ProjectAssignmentsService } from './project-assignments.service';

@ApiTags(SwaggerTags.PROJECT_ASSIGNMENTS)
@ApiBearerAuth('user')
@Controller('construction-log/project-assignments')
export class ProjectAssignmentsController {
  constructor(
    private readonly projectAssignmentsService: ProjectAssignmentsService,
  ) {}

  @ApiParam({ name: 'projectId', schema: { type: 'string', format: 'uuid' } })
  @Get('/project/:projectId')
  async getByProject(
    @Headers() { authorization },
    @Param('projectId') projectId: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.projectAssignmentsService.getAssignmentsByProject(
          authorization,
          projectId,
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
      },
      required: ['projectId', 'userId'],
    },
  })
  @Post('/')
  async assignUser(
    @Headers() { authorization },
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.projectAssignmentsService.assignUserToProject(
          authorization,
          body,
        );

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @Delete('/:id')
  async removeAssignment(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.projectAssignmentsService.removeAssignment(
          authorization,
          id,
        );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
