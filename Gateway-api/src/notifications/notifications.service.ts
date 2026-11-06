import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../config';

@Injectable()
export class NotificationsService {
  private readonly notificationApiUrl = `${config.NOTIFICATION_API_URL}/api/notifications`;

  async sendNotification(
    authorization: string,
    payload: {
      eventType: string;
      eventCode: string;
      title: string;
      body: string;
      userIds: string[];
      source: 'identity-api' | 'logboook-identity-api';
      priority?: string;
      payload?: Record<string, any>;
      deepLink?: string;
    },
  ): Promise<{ body: any; status: number }> {
    try {
      const { body, status } = await superagent
        .post(`${this.notificationApiUrl}/send-to-users`)
        .set('Authorization', authorization)
        .send(payload);

      return { body, status };
    } catch (err: any) {
      if (err.response) {
        return { body: err.response.body, status: err.response.status };
      }
      throw err;
    }
  }

  async getUserNotifications(
    authorization: string,
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ): Promise<{ body: any; status: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.set('page', options.page.toString());
      if (options.limit) queryParams.set('limit', options.limit.toString());
      if (options.unreadOnly) queryParams.set('unreadOnly', 'true');

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const { body, status } = await superagent
        .get(`${this.notificationApiUrl}/users/${userId}/notifications${query}`)
        .set('Authorization', authorization);

      return { body, status };
    } catch (err: any) {
      if (err.response) {
        return { body: err.response.body, status: err.response.status };
      }
      throw err;
    }
  }

  async markAsRead(
    authorization: string,
    recipientId: string,
  ): Promise<{ body: any; status: number }> {
    try {
      const { body, status } = await superagent
        .patch(`${this.notificationApiUrl}/recipients/${recipientId}/read`)
        .set('Authorization', authorization);

      return { body, status };
    } catch (err: any) {
      if (err.response) {
        return { body: err.response.body, status: err.response.status };
      }
      throw err;
    }
  }

  async registerDevice(
    authorization: string,
    userId: string,
    payload: {
      deviceToken: string;
      platform?: 'ios' | 'android';
      appVersion?: string;
      deviceName?: string;
    },
  ): Promise<{ body: any; status: number }> {
    try {
      const { body, status } = await superagent
        .post(`${this.notificationApiUrl}/users/${userId}/devices`)
        .set('Authorization', authorization)
        .send(payload);

      return { body, status };
    } catch (err: any) {
      if (err.response) {
        return { body: err.response.body, status: err.response.status };
      }
      throw err;
    }
  }
}
