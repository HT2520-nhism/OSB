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
import * as superagent from 'superagent';

import { config } from '../../config';
import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { ProjectsService } from './projects.service';

@ApiTags(SwaggerTags.PROJECTS)
@ApiBearerAuth('user')
@Controller('construction-log/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('/')
  async getAllProjects(
    @Headers() { authorization },
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.projectsService.getAllProjectsWithCreatedByName(
          authorization,
          query,
        );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('/:id')
  async getProjectById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.projectsService.getProjectByIdWithCreatedByName(
          authorization,
          id,
        );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('/:id/progress')
  async getProjectProgress(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await superagent
        .get(`${config.CONSTRUCTION_LOG_API_URL}/api/projects/${id}/progress`)
        .set('Authorization', authorization);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBody({ schema: { type: 'object' } })
  @Post('/')
  async createProject(
    @Headers() { authorization },
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } = await superagent
        .post(`${config.CONSTRUCTION_LOG_API_URL}/api/projects`)
        .send(body)
        .set('Authorization', authorization);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Patch('/:id')
  async updateProject(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } = await superagent
        .patch(`${config.CONSTRUCTION_LOG_API_URL}/api/projects/${id}`)
        .send(body)
        .set('Authorization', authorization);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Patch('/:id/close')
  async closeProject(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await superagent
        .patch(`${config.CONSTRUCTION_LOG_API_URL}/api/projects/${id}/close`)
        .set('Authorization', authorization);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  /* =========================
     HARD DELETE PROJECT
  ========================= */
  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Delete('/:id')
  async hardDeleteProject(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await superagent
        .delete(`${config.CONSTRUCTION_LOG_API_URL}/api/projects/${id}`)
        .set('Authorization', authorization);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
