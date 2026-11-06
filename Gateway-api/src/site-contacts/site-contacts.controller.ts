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
import { SiteContactsService } from './site-contacts.service';

@ApiTags(SwaggerTags.SITE_CONTACTS)
@ApiBearerAuth('user')
@Controller()
export class SiteContactsController {
  constructor(private readonly siteContactsService: SiteContactsService) {}

  @ApiParam({ name: 'siteId', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Post('sites/:siteId/contacts')
  async createSiteContact(
    @Headers() { authorization },
    @Param('siteId') siteId: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.siteContactsService.createSiteContact(
          authorization,
          siteId,
          body,
        );

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'siteId', schema: { type: 'string' } })
  @Get('sites/:siteId/contacts')
  async getAllSiteContacts(
    @Headers() { authorization },
    @Param('siteId') siteId: string,
    @Query() query: Record<string, string>,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.siteContactsService.getAllSiteContacts(
          authorization,
          siteId,
          query,
        );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @Get('site-contacts/:id')
  async getSiteContactById(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.siteContactsService.getSiteContactById(authorization, id);

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'id', schema: { type: 'string' } })
  @ApiBody({ schema: { type: 'object' } })
  @Patch('site-contacts/:id')
  async updateSiteContact(
    @Headers() { authorization },
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.siteContactsService.updateSiteContact(
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
  @Delete('site-contacts/:id')
  async deleteSiteContact(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.siteContactsService.deleteSiteContact(
        authorization,
        id,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
