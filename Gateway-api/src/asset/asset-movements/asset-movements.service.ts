import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';
import { getUsersByIds, getSitesByIds } from '../../helpers/asset-enrichment';

type Movement = {
  id: string;
  assetId: string;
  assetCode?: string;
  movementType: string;
  movementFromType?: string;
  movementFromId?: string;
  movementFromTechnicianId?: string;
  movementToType?: string;
  movementToId?: string;
  movementToTechnicianId?: string;
  movementDate?: string;
  performedBy?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
  [key: string]: any;
};

@Injectable()
export class AssetMovementsService {
  private async enrichMovements(
    authorization: string,
    items: Movement[],
  ): Promise<Movement[]> {
    if (!items.length) return items;

    // Collect IDs for batch enrichment
    const performedByIds = items
      .map((i) => i.performedBy)
      .filter((id): id is string => !!id);
    const allSiteIds = [
      ...items.map((i) => i.movementFromId).filter((id): id is string => !!id),
      ...items.map((i) => i.movementToId).filter((id): id is string => !!id),
    ];
    const allTechnicianIds = [
      ...items
        .map((i) => i.movementFromTechnicianId)
        .filter((id): id is string => !!id),
      ...items
        .map((i) => i.movementToTechnicianId)
        .filter((id): id is string => !!id),
    ];

    const [users, sites] = await Promise.all([
      getUsersByIds(authorization, [...performedByIds, ...allTechnicianIds]),
      getSitesByIds(authorization, allSiteIds),
    ]);

    return items.map((item) => ({
      ...item,
      performedByName: item.performedBy
        ? users[item.performedBy]?.name || null
        : null,
      movementFromSite: item.movementFromId
        ? sites[item.movementFromId] || null
        : null,
      movementToSite: item.movementToId
        ? sites[item.movementToId] || null
        : null,
      movementFromTechnicianName: item.movementFromTechnicianId
        ? users[item.movementFromTechnicianId]?.name || null
        : null,
      movementToTechnicianName: item.movementToTechnicianId
        ? users[item.movementToTechnicianId]?.name || null
        : null,
    }));
  }

  async createAssetMovement(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.ASSET_API_URL}/api/asset-movements`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAllAssetMovements(
    authorization: string,
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

    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-movements`)
      .query(query)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (body?.data?.length) {
      const enriched = await this.enrichMovements(authorization, body.data);
      enrichedBody = { ...body, data: enriched };
    }

    return { body: enrichedBody, status };
  }

  async getAssetMovementByAssetId(
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
    const url = `${config.ASSET_API_URL}/api/asset-movements/asset/${assetId}${params ? `?${params}` : ''}`;

    const { body, status } = await superagent
      .get(url)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (Array.isArray(body) && body.length) {
      const enriched = await this.enrichMovements(authorization, body);
      enrichedBody = enriched;
    } else if (body?.data?.length) {
      const enriched = await this.enrichMovements(authorization, body.data);
      enrichedBody = { ...body, data: enriched };
    }

    return { body: enrichedBody, status };
  }

  async getAssetMovementById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-movements/${id}`)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const enriched = await this.enrichMovements(authorization, [
        body as Movement,
      ]);
      enrichedBody = enriched[0] || body;
    }

    return { body: enrichedBody, status };
  }
}
