import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';
import { getUsersByIds, getSitesByIds } from '../../helpers/asset-enrichment';

type Assignment = {
  id: string;
  assetId: string;
  assetCode?: string;
  assignmentType: string;
  warehouseId?: string;
  siteId?: string;
  technicianId?: string;
  assignedAt: string;
  unassignedAt?: string;
  assignedBy?: string;
  unassignedBy?: string;
  notes?: string;
  createdAt?: string;
  [key: string]: any;
};

type PaginatedResponse = {
  data: Assignment[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  [key: string]: any;
};

@Injectable()
export class AssetAssignmentsService {
  private async enrichAssignments(
    authorization: string,
    items: Assignment[],
  ): Promise<Assignment[]> {
    if (!items.length) return items;

    // Collect IDs for batch enrichment
    const assignedByIds = items
      .map((i) => i.assignedBy)
      .filter((id): id is string => !!id);
    const unassignedByIds = items
      .map((i) => i.unassignedBy)
      .filter((id): id is string => !!id);
    const technicianIds = items
      .map((i) => i.technicianId)
      .filter((id): id is string => !!id);
    const siteIds = items
      .map((i) => i.siteId)
      .filter((id): id is string => !!id);

    const [users, sites] = await Promise.all([
      getUsersByIds(authorization, [
        ...assignedByIds,
        ...unassignedByIds,
        ...technicianIds,
      ]),
      getSitesByIds(authorization, siteIds),
    ]);

    return items.map((item) => ({
      ...item,
      assignedByName: item.assignedBy
        ? users[item.assignedBy]?.name || null
        : null,
      unassignedByName: item.unassignedBy
        ? users[item.unassignedBy]?.name || null
        : null,
      technicianName: item.technicianId
        ? users[item.technicianId]?.name || null
        : null,
      siteName: item.siteId ? sites[item.siteId]?.siteName || null : null,
      siteCode: item.siteId ? sites[item.siteId]?.siteCode || null : null,
      siteAddress: item.siteId ? sites[item.siteId]?.address || null : null,
    }));
  }

  async create(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.ASSET_API_URL}/api/asset-assignments`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAll(authorization: string, query: Record<string, string> = {}) {
    // Validate limit
    if (query.limit) {
      const limit = parseInt(query.limit, 10);
      if (isNaN(limit) || limit < 1) {
        return {
          body: {
            statusCode: 400,
            message: ['limit must be a positive integer'],
            error: 'Bad Request',
          },
          status: 400,
        };
      }
      if (limit > 100) {
        return {
          body: {
            statusCode: 400,
            message: ['limit must not be greater than 100'],
            error: 'Bad Request',
          },
          status: 400,
        };
      }
    }

    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-assignments`)
      .query(query)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (body?.data?.length) {
      const enriched = await this.enrichAssignments(authorization, body.data);
      enrichedBody = { ...body, data: enriched };
    }

    return { body: enrichedBody, status };
  }

  async getByAssetId(
    authorization: string,
    assetId: string,
    query: Record<string, string> = {},
  ) {
    // Validate limit
    if (query.limit) {
      const limit = parseInt(query.limit, 10);
      if (isNaN(limit) || limit < 1) {
        return {
          body: {
            statusCode: 400,
            message: ['limit must be a positive integer'],
            error: 'Bad Request',
          },
          status: 400,
        };
      }
      if (limit > 100) {
        return {
          body: {
            statusCode: 400,
            message: ['limit must not be greater than 100'],
            error: 'Bad Request',
          },
          status: 400,
        };
      }
    }

    const params = new URLSearchParams(query).toString();
    const url = `${config.ASSET_API_URL}/api/asset-assignments/asset/${assetId}${params ? `?${params}` : ''}`;

    const { body, status } = await superagent
      .get(url)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (Array.isArray(body) && body.length) {
      const enriched = await this.enrichAssignments(authorization, body);
      enrichedBody = enriched;
    } else if (body?.data?.length) {
      const enriched = await this.enrichAssignments(authorization, body.data);
      enrichedBody = { ...body, data: enriched };
    }

    return { body: enrichedBody, status };
  }

  async getById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-assignments/${id}`)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const enriched = await this.enrichAssignments(authorization, [
        body as Assignment,
      ]);
      enrichedBody = enriched[0] || body;
    }

    return { body: enrichedBody, status };
  }

  async unassign(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .patch(`${config.ASSET_API_URL}/api/asset-assignments/${id}/unassign`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }
}
