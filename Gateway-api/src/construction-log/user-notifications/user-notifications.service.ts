import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

type Notification = {
  id: string;
  type: string;
  entityType: string;
  entityId?: string;
  title: string;
  message?: string;
  actorId?: string;
  isRead: boolean;
  createdAt: string;
};

@Injectable()
export class UserNotificationsService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api/user_notifications`;

  async getMyNotificationsEnriched(
    authorization: string,
  ): Promise<{ body: any; status: number }> {
    const { body, status } = await superagent
      .get(`${this.baseUrl}/me`)
      .set('Authorization', authorization);

    const notifications: Notification[] = Array.isArray(body) ? body : [];
    const actorIds = Array.from(
      new Set(
        notifications.map((n) => n.actorId).filter((id): id is string => !!id),
      ),
    );

    const actorNameById: Record<string, string> = {};
    for (const actorId of actorIds) {
      try {
        const { body: userBody } = await superagent
          .get(`${config.IDENTITY_API_URL}/api/users/${actorId}`)
          .set('Authorization', authorization);
        const user = userBody?.user;
        if (user?.name) {
          actorNameById[actorId] = user.name;
        }
      } catch {}
    }

    const enriched = notifications.map((n) => ({
      ...n,
      actorName: n.actorId ? (actorNameById[n.actorId] ?? null) : null,
    }));

    return { body: enriched, status };
  }

  getMyNotifications(authorization: string) {
    return superagent
      .get(`${this.baseUrl}/me`)
      .set('Authorization', authorization);
  }

  getUnreadCount(authorization: string) {
    return superagent
      .get(`${this.baseUrl}/me/unread_count`)
      .set('Authorization', authorization);
  }

  markAsRead(authorization: string, id: string) {
    return superagent
      .patch(`${this.baseUrl}/${id}/read`)
      .set('Authorization', authorization);
  }

  markAllAsRead(authorization: string) {
    return superagent
      .patch(`${this.baseUrl}/me/read_all`)
      .set('Authorization', authorization);
  }
}
