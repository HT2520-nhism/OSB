import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { AssetModelsService } from './asset-models.service';

@ApiTags(SwaggerTags.ASSET_MODELS)
@ApiBearerAuth('user')
@Controller('asset-models')
export class AssetModelsController {
  constructor(private readonly assetModelsService: AssetModelsService) {}

  @Get('/')
  async getAllAssetModels(
    @Headers() { authorization },
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assetModelsService.getAllAssetModels(
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
  async getAssetModelById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assetModelsService.getAssetModelById(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBody({ schema: { type: 'object' } })
  @Post('/')
  async createAssetModel(
    @Headers() { authorization },
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.assetModelsService.createAssetModel(authorization, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Put('/:id')
  async updateAssetModel(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.assetModelsService.updateAssetModel(authorization, id, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Delete('/:id')
  async deleteAssetModel(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assetModelsService.deleteAssetModel(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
