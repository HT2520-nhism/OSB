import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../config';

type Customer = {
  id: string;
  [key: string]: any;
};

@Injectable()
export class CustomersService {
  async getAllCustomers(
    authorization: string,
    query: Record<string, string> = {},
  ) {
    const { body, status } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/customers`)
      .query(query)
      .set('Authorization', authorization);

    const customers: Customer[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];

    const createdByIds = Array.from(
      new Set(
        customers
          .map((c) => c.createdBy)
          .filter((id): id is string => typeof id === 'string' && !!id),
      ),
    );

    const userNameById: Record<string, string> = {};

    for (const userId of createdByIds) {
      try {
        const { body: userBody } = await superagent
          .get(`${config.IDENTITY_API_URL}/api/users/${userId}`)
          .set('Authorization', authorization);

        const user = userBody?.user;

        if (user?.name) {
          userNameById[userId] = user.name as string;
        }
      } catch {}
    }

    const enrichedCustomers = customers.map((customer) => ({
      ...customer,
      createdByName: customer.createdBy
        ? (userNameById[customer.createdBy] ?? null)
        : null,
    }));

    const enrichedBody = Array.isArray(body)
      ? enrichedCustomers
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedCustomers }
        : body;

    return { body: enrichedBody, status };
  }

  async getCustomerById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/customers/${id}`)
      .set('Authorization', authorization);

    const customer: Customer | null =
      body && typeof body === 'object' ? (body as Customer) : null;

    if (!customer?.createdBy) {
      return { body, status };
    }

    let createdByName: string | null = null;

    try {
      const { body: userBody } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users/${customer.createdBy}`)
        .set('Authorization', authorization);

      const user = userBody?.user;
      if (user?.name) {
        createdByName = user.name as string;
      }
    } catch {}

    const enrichedBody =
      customer && typeof body === 'object' ? { ...body, createdByName } : body;

    return { body: enrichedBody, status };
  }

  async createCustomer(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.CUSTOMER_API_URL}/api/customers`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async updateCustomer(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .patch(`${config.CUSTOMER_API_URL}/api/customers/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteCustomer(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.CUSTOMER_API_URL}/api/customers/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
