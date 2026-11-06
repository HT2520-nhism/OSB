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

import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';
import { SitesService } from './sites.service';

@ApiTags(SwaggerTags.SITES)
@ApiBearerAuth('user')
@Controller()
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @ApiParam({ name: 'customerId', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Post('customers/:customerId/sites')
  async createSite(
    @Headers() { authorization },
    @Param('customerId') customerId: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } = await this.sitesService.createSite(
        authorization,
        customerId,
        body,
      );

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'customerId', schema: { type: 'string' } })
  @Get('customers/:customerId/sites')
  async getAllSites(
    @Headers() { authorization },
    @Param('customerId') customerId: string,
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.sitesService.getAllSites(
        authorization,
        customerId,
        query,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('sites/:id')
  async getSiteById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.sitesService.getSiteById(
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
  @Patch('sites/:id')
  async updateSite(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } = await this.sitesService.updateSite(
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
  @Delete('sites/:id')
  async deleteSite(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.sitesService.deleteSite(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
