import { Controller, Get, Headers, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as superagent from 'superagent';

import { config } from '../../config';
import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';

@ApiTags(SwaggerTags.COMPANY)
@ApiBearerAuth('user')
@Controller('identity/company')
export class CompanyController {
  @Get('/all')
  async getAllCompanies(@Headers() { authorization }, @Res() res) {
    try {
      const { status, body } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/company/`)
        .set('Authorization', authorization || null);

      return res.status(status).json(body?.Company ?? body ?? []);
    } catch (err) {
      convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('/subsidiaries')
  async getSubsidiariesCompany(@Headers() { authorization }, @Res() res) {
    try {
      const { status, body } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/company/subsidiaries`)
        .set('Authorization', authorization || null);

      return res.status(status).json(body);
    } catch (err) {
      convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get('/hierarchy')
  async getOrganizationHierarchy(@Headers() { authorization }, @Res() res) {
    try {
      const { status, body } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/company/hierarchy`)
        .set('Authorization', authorization || null);

      return res.status(status).json(body);
    } catch (err) {
      convertSuperAgentErrorToResponse(res, err);
    }
  }
}
