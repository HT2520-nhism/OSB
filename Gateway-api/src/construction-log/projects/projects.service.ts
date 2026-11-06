import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

type Project = {
  id: string;
  updatedBy?: string | null;
  [key: string]: any;
};

@Injectable()
export class ProjectsService {
  async getAllProjectsWithCreatedByName(
    authorization: string,
    query: Record<string, string> = {},
  ) {
    const { body, status } = await superagent
      .get(`${config.CONSTRUCTION_LOG_API_URL}/api/projects`)
      .query(query)
      .set('Authorization', authorization);

    const projects: Project[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];

    const createdByIds = Array.from(
      new Set(
        projects
          .map((p) => p.createdBy)
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

    const enrichedProjects = projects.map((project) => ({
      ...project,
      createdByName: project.createdBy
        ? (userNameById[project.createdBy] ?? null)
        : null,
    }));

    const enrichedBody = Array.isArray(body)
      ? enrichedProjects
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedProjects }
        : body;

    return { body: enrichedBody, status };
  }

  async getProjectByIdWithCreatedByName(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.CONSTRUCTION_LOG_API_URL}/api/projects/${id}`)
      .set('Authorization', authorization);

    const project: Project | null =
      body && typeof body === 'object' ? (body as Project) : null;

    if (!project?.createdBy) {
      return { body, status };
    }

    let createdByName: string | null = null;

    try {
      const { body: userBody } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users/${project.createdBy}`)
        .set('Authorization', authorization);

      const user = userBody?.user;
      if (user?.name) {
        createdByName = user.name as string;
      }
    } catch {}

    const enrichedBody =
      project && typeof body === 'object' ? { ...body, createdByName } : body;

    return { body: enrichedBody, status };
  }
}
