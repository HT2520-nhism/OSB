import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

type DailyLog = {
  id: string;
  createdBy?: string | null;
  [key: string]: any;
};

type DailyLogListQuery = {
  page?: string;
  pageSize?: string;
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class DailyLogService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api/daily_log`;

  createDailyLog(authorization: string, body: any) {
    return superagent
      .post(this.baseUrl)
      .send(body)
      .set('Authorization', authorization);
  }

  async getDailyLogById(
    authorization: string,
    id: string,
  ): Promise<{ body: any; status: number }> {
    const { body, status } = await superagent
      .get(`${this.baseUrl}/${id}`)
      .set('Authorization', authorization);

    const dailyLog: DailyLog | null =
      body && typeof body === 'object' ? (body as DailyLog) : null;

    if (!dailyLog?.createdBy) {
      return { body, status };
    }

    let createdByName: string | null = null;
    try {
      const { body: userBody } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users/${dailyLog.createdBy}`)
        .set('Authorization', authorization);
      const user = userBody?.user;
      if (user?.name) {
        createdByName = user.name as string;
      }
    } catch {}

    const enrichedBody =
      dailyLog && typeof body === 'object'
        ? {
            ...body,
            createdByName,
            taskName: (dailyLog as any)?.task?.name ?? null,
          }
        : body;

    return { body: enrichedBody, status };
  }

  private async enrichDailyLogList(
    authorization: string,
    dailyLogs: DailyLog[],
  ): Promise<DailyLog[]> {
    const createdByIds = Array.from(
      new Set(
        dailyLogs
          .map((log) => log.createdBy)
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

    return dailyLogs.map((log) => ({
      ...log,
      createdByName: log.createdBy
        ? (userNameById[log.createdBy] ?? null)
        : null,
      taskName: (log as any)?.task?.name ?? null,
    }));
  }

  private buildUpstreamListQuery(
    query?: DailyLogListQuery,
  ): Record<string, string> {
    if (!query) return {};
    const out: Record<string, string> = {};
    if (query.page != null && query.page !== '') out.page = String(query.page);
    if (query.pageSize != null && query.pageSize !== '')
      out.pageSize = String(query.pageSize);
    if (query.dateFrom != null && query.dateFrom !== '')
      out.dateFrom = String(query.dateFrom);
    if (query.dateTo != null && query.dateTo !== '')
      out.dateTo = String(query.dateTo);
    return out;
  }

  async getDailyLogsByProject(
    authorization: string,
    projectId: string,
    query?: DailyLogListQuery,
  ): Promise<{ body: any; status: number }> {
    const req = superagent
      .get(`${this.baseUrl}/project/${projectId}`)
      .set('Authorization', authorization);
    const q = this.buildUpstreamListQuery(query);
    if (Object.keys(q).length) {
      req.query(q);
    }
    const { body, status } = await req;

    const isPaged =
      body &&
      typeof body === 'object' &&
      Array.isArray((body as any).data) &&
      typeof (body as any).total === 'number';

    if (isPaged) {
      const dailyLogs = (body as any).data as DailyLog[];
      const enrichedLogs = await this.enrichDailyLogList(
        authorization,
        dailyLogs,
      );
      return { body: { ...body, data: enrichedLogs }, status };
    }

    const dailyLogs: DailyLog[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];

    const enrichedLogs = await this.enrichDailyLogList(
      authorization,
      dailyLogs,
    );

    const enrichedBody = Array.isArray(body)
      ? enrichedLogs
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedLogs }
        : body;

    return { body: enrichedBody, status };
  }

  async getDailyLogsByTask(
    authorization: string,
    taskId: string,
    query?: DailyLogListQuery,
  ): Promise<{ body: any; status: number }> {
    const req = superagent
      .get(`${this.baseUrl}/task/${taskId}`)
      .set('Authorization', authorization);
    const q = this.buildUpstreamListQuery(query);
    if (Object.keys(q).length) {
      req.query(q);
    }
    const { body, status } = await req;

    const isPaged =
      body &&
      typeof body === 'object' &&
      Array.isArray((body as any).data) &&
      typeof (body as any).total === 'number';

    if (isPaged) {
      const dailyLogs = (body as any).data as DailyLog[];
      const enrichedLogs = await this.enrichDailyLogList(
        authorization,
        dailyLogs,
      );
      return { body: { ...body, data: enrichedLogs }, status };
    }

    const dailyLogs: DailyLog[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];

    const enrichedLogs = await this.enrichDailyLogList(
      authorization,
      dailyLogs,
    );

    const enrichedBody = Array.isArray(body)
      ? enrichedLogs
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedLogs }
        : body;

    return { body: enrichedBody, status };
  }

  updateDailyLog(authorization: string, id: string, body: any) {
    return superagent
      .patch(`${this.baseUrl}/${id}`)
      .send(body)
      .set('Authorization', authorization);
  }

  submitDailyLog(authorization: string, id: string) {
    return superagent
      .post(`${this.baseUrl}/${id}/submit`)
      .set('Authorization', authorization);
  }

  approveDailyLog(authorization: string, id: string) {
    return superagent
      .post(`${this.baseUrl}/${id}/approve`)
      .set('Authorization', authorization);
  }

  rejectDailyLog(authorization: string, id: string) {
    return superagent
      .post(`${this.baseUrl}/${id}/reject`)
      .set('Authorization', authorization);
  }

  deleteDailyLog(authorization: string, id: string) {
    return superagent
      .delete(`${this.baseUrl}/${id}`)
      .set('Authorization', authorization);
  }
}
