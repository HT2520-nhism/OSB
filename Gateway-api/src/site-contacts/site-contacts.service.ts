import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../config';

@Injectable()
export class SiteContactsService {
  async createSiteContact(authorization: string, siteId: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.CUSTOMER_API_URL}/api/sites/${siteId}/contacts`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAllSiteContacts(
    authorization: string,
    siteId: string,
    query: Record<string, string> = {},
  ) {
    const { body, status } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/sites/${siteId}/contacts`)
      .query(query)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getSiteContactById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/site-contacts/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }

  async updateSiteContact(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .patch(`${config.CUSTOMER_API_URL}/api/site-contacts/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteSiteContact(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.CUSTOMER_API_URL}/api/site-contacts/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
