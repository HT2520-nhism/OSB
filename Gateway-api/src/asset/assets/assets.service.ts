import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';
import { getUsersByIds } from '../../helpers/asset-enrichment';

type Asset = {
  id: string;
  assetCode?: string;
  serialNumber?: string;
  assetModelId?: string;
  status?: string;
  assetCondition?: string;
  customerId?: string;
  siteId?: string;
  manufactureDate?: string;
  warrantyExpiredDate?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  [key: string]: any;
};

@Injectable()
export class AssetsService {
  private async enrichAssets(
    authorization: string,
    items: Asset[],
  ): Promise<Asset[]> {
    if (!items.length) return items;

    const createdByIds = items
      .map((i) => i.createdBy)
      .filter((id): id is string => !!id);
    const updatedByIds = items
      .map((i) => i.updatedBy)
      .filter((id): id is string => !!id);

    const users = await getUsersByIds(authorization, [
      ...createdByIds,
      ...updatedByIds,
    ]);

    return items.map((item) => ({
      ...item,
      createdByName: item.createdBy
        ? users[item.createdBy]?.name || null
        : null,
      updatedByName: item.updatedBy
        ? users[item.updatedBy]?.name || null
        : null,
    }));
  }

  async createAsset(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.ASSET_API_URL}/api/assets`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAllAssets(
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
      .get(`${config.ASSET_API_URL}/api/assets`)
      .query(query)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (body?.data?.length) {
      const enriched = await this.enrichAssets(authorization, body.data);
      enrichedBody = { ...body, data: enriched };
    }

    return { body: enrichedBody, status };
  }

  async getAssetById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/assets/${id}`)
      .set('Authorization', authorization);

    let enrichedBody = body;

    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const enriched = await this.enrichAssets(authorization, [body as Asset]);
      enrichedBody = enriched[0] || body;
    }

    return { body: enrichedBody, status };
  }

  async updateAsset(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .patch(`${config.ASSET_API_URL}/api/assets/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteAsset(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.ASSET_API_URL}/api/assets/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAssetHierarchy(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/assets/${id}/hierarchy`)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAssetPath(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/assets/${id}/path`)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAssetChildren(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/assets/${id}/children`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
