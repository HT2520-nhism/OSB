import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../config';

@Injectable()
export class SitesService {
  async createSite(authorization: string, customerId: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.CUSTOMER_API_URL}/api/customers/${customerId}/sites`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAllSites(
    authorization: string,
    customerId: string,
    query: Record<string, string> = {},
  ) {
    const { body, status } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/customers/${customerId}/sites`)
      .query(query)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getSiteById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/sites/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }

  async updateSite(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .patch(`${config.CUSTOMER_API_URL}/api/sites/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteSite(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.CUSTOMER_API_URL}/api/sites/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
