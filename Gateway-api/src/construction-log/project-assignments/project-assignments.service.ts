import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

type Assignment = {
  id: string;
  userId: string;
  projectId: string;
  assignedBy?: string;
  [key: string]: any;
};

@Injectable()
export class ProjectAssignmentsService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api/project_assignments`;

  async getAssignmentsByProject(authorization: string, projectId: string) {
    const { body, status } = await superagent
      .get(
        `${config.CONSTRUCTION_LOG_API_URL}/api/project_assignments/project/${projectId}`,
      )
      .set('Authorization', authorization);

    const assignments: any[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];

    const userIds = Array.from(
      new Set(
        assignments
          .flatMap((a) => [a.userId, a.assignedBy])
          .filter((id): id is string => typeof id === 'string' && !!id),
      ),
    );

    const userNameById: Record<string, string> = {};

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const { body: userBody } = await superagent
            .get(`${config.IDENTITY_API_URL}/api/users/${userId}`)
            .set('Authorization', authorization);

          const user = userBody?.user;
          if (user?.name) {
            userNameById[userId] = user.name;
          }
        } catch {}
      }),
    );

    const enrichedAssignments = assignments.map((assignment) => ({
      ...assignment,
      userName: assignment.userId
        ? (userNameById[assignment.userId] ?? null)
        : null,
      assignedByName: assignment.assignedBy
        ? (userNameById[assignment.assignedBy] ?? null)
        : null,
    }));

    return { body: enrichedAssignments, status };
  }

  assignUserToProject(authorization: string, body: any) {
    return superagent
      .post(this.baseUrl)
      .send(body)
      .set('Authorization', authorization);
  }

  removeAssignment(authorization: string, id: string) {
    return superagent
      .delete(`${this.baseUrl}/${id}`)
      .set('Authorization', authorization);
  }
}
