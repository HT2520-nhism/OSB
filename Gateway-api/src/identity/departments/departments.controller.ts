import { Controller, Get, Headers, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import * as superagent from 'superagent';

import { config } from '../../config';
import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';

@ApiTags(SwaggerTags.DEPARTMENTS)
@ApiBearerAuth('user')
@Controller('identity/departments')
export class DepartmentsController {
  @Get('/')
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: Number,
    description: 'Lọc phòng ban theo đơn vị',
  })
  async getAllDepartments(
    @Headers() { authorization },
    @Query('companyId') companyId: string | undefined,
    @Res() res,
  ) {
    try {
      let url = `${config.IDENTITY_API_URL}/api/departments`;
      if (companyId) {
        url += `?companyId=${encodeURIComponent(companyId)}`;
      }
      const { status, body } = await superagent
        .get(url)
        .set('Authorization', authorization || null);

      return res.status(status).json(body);
    } catch (err) {
      convertSuperAgentErrorToResponse(res, err);
    }
  }
}
