import { Controller, Get, Headers, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as superagent from 'superagent';

import { config } from '../../config';
import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';

@ApiTags(SwaggerTags.BACKOFFICE_ROLES)
@ApiBearerAuth('user')
@Controller('identity/backoffice_roles')
export class BackofficeRolesController {
  @Get('/')
  async getAllBackofficeRoles(@Headers() { authorization }, @Res() res) {
    try {
      const { status, body } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/backoffice_roles`)
        .set('Authorization', authorization || null);

      return res.status(status).json(body);
    } catch (err) {
      convertSuperAgentErrorToResponse(res, err);
    }
  }
}
