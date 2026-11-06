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
import { AssetCategoriesService } from './asset-categories.service';

@ApiTags(SwaggerTags.ASSET_CATEGORIES)
@ApiBearerAuth('user')
@Controller('asset-categories')
export class AssetCategoriesController {
  constructor(
    private readonly assetCategoriesService: AssetCategoriesService,
  ) {}

  @Get('/')
  async getAllCategories(
    @Headers() { authorization },
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.assetCategoriesService.getAllCategories(
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
  async getCategoryById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.assetCategoriesService.getCategoryById(authorization, id);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBody({ schema: { type: 'object' } })
  @Post('/')
  async createCategory(
    @Headers() { authorization },
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.assetCategoriesService.createCategory(authorization, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Put('/:id')
  async updateCategory(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.assetCategoriesService.updateCategory(
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
  async deleteCategory(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.assetCategoriesService.deleteCategory(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
