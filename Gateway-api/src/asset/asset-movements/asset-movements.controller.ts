import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { AssetMovementsService } from './asset-movements.service';

@ApiTags(SwaggerTags.ASSET_MOVEMENTS)
@ApiBearerAuth('user')
@Controller('asset-movements')
export class AssetMovementsController {
  constructor(private readonly movementsService: AssetMovementsService) {}

  @Post('/')
  async createAssetMovement(
    @Headers() { authorization },
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.movementsService.createAssetMovement(authorization, body);
      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('/')
  async getAllAssetMovements(
    @Headers() { authorization },
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.movementsService.getAllAssetMovements(
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
  async getAssetMovementByAssetId(
    @Headers() { authorization },
    @Param('assetId') assetId: string,
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.movementsService.getAssetMovementByAssetId(
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
  async getAssetMovementById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.movementsService.getAssetMovementById(
        authorization,
        id,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
