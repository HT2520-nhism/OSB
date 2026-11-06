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
import { AssetRelationshipsService } from './asset-relationships.service';

@ApiTags(SwaggerTags.ASSET_RELATIONSHIPS)
@ApiBearerAuth('user')
@Controller('asset-relationships')
export class AssetRelationshipsController {
  constructor(
    private readonly relationshipsService: AssetRelationshipsService,
  ) {}

  @Post('/')
  async create(@Headers() { authorization }, @Body() body: any, @Res() res) {
    try {
      const { body: resBody, status } =
        await this.relationshipsService.createAssetRelationship(
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
      const { body, status } =
        await this.relationshipsService.getAllAssetRelationships(
          authorization,
          query,
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'assetId', schema: { type: 'string' } })
  @Get('/installed/:assetId')
  async getInstalledAssetComponents(
    @Headers() { authorization },
    @Param('assetId') assetId: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.relationshipsService.getInstalledAssetComponents(
          authorization,
          assetId,
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'assetId', schema: { type: 'string' } })
  @Get('/history/:assetId')
  async getAssetInstallationHistory(
    @Headers() { authorization },
    @Param('assetId') assetId: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.relationshipsService.getAssetInstallationHistory(
          authorization,
          assetId,
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('/:id')
  async getAssetRelationshipById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.relationshipsService.getAssetRelationshipById(
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
  @Patch('/:id')
  async update(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.relationshipsService.updateAssetRelationship(
          authorization,
          id,
          body,
        );
      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Delete('/:id')
  async delete(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.relationshipsService.deleteAssetRelationship(
          authorization,
          id,
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
