import {
  Body,
  Controller,
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
import { AssetAssignmentsService } from './asset-assignments.service';

@ApiTags(SwaggerTags.ASSET_ASSIGNMENTS)
@ApiBearerAuth('user')
@Controller('asset-assignments')
export class AssetAssignmentsController {
  constructor(private readonly assignmentsService: AssetAssignmentsService) {}

  @Post('/')
  async create(@Headers() { authorization }, @Body() body: any, @Res() res) {
    try {
      const { body: resBody, status } = await this.assignmentsService.create(
        authorization,
        body,
      );
      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('/')
  async getAll(
    @Headers() { authorization },
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assignmentsService.getAll(
        authorization,
        query,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'assetId', schema: { type: 'string' } })
  @Get('/asset/:assetId')
  async getByAssetId(
    @Headers() { authorization },
    @Param('assetId') assetId: string,
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assignmentsService.getByAssetId(
        authorization,
        assetId,
        query,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('/:id')
  async getById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assignmentsService.getById(
        authorization,
        id,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Patch('/:id/unassign')
  async unassign(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } = await this.assignmentsService.unassign(
        authorization,
        id,
        body,
      );
      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
