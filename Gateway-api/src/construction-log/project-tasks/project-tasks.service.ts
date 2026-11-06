import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

@Injectable()
export class ProjectTasksService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api`;

  getTasksByProject(
    authorization: string,
    projectId: string,
    query?: Record<string, string>,
  ) {
    const req = superagent
      .get(`${this.baseUrl}/projects/${projectId}/tasks`)
      .set('Authorization', authorization);
    if (query && Object.keys(query).length > 0) {
      req.query(query);
    }
    return req;
  }

  createTask(authorization: string, projectId: string, body: any) {
    return superagent
      .post(`${this.baseUrl}/projects/${projectId}/tasks`)
      .send(body)
      .set('Authorization', authorization);
  }

  updateTask(authorization: string, taskId: string, body: any) {
    return superagent
      .patch(`${this.baseUrl}/tasks/${taskId}`)
      .send(body)
      .set('Authorization', authorization);
  }

  deleteTask(authorization: string, taskId: string) {
    return superagent
      .delete(`${this.baseUrl}/tasks/${taskId}`)
      .set('Authorization', authorization);
  }
}
