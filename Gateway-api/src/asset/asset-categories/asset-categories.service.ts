import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';
import { convertSuperAgentErrorToResponse } from '../../helpers';

@Injectable()
export class AssetCategoriesService {
  async getAllCategories(
    authorization: string,
    query: Record<string, string> = {},
  ) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-categories`)
      .query(query)
      .set('Authorization', authorization);

    const assetCategories: any[] = body?.data;

    const createdByIds = Array.from(
      new Set(
        assetCategories
          .map((ac) => ac.createdBy)
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

    const enrichedAssetCategories = assetCategories.map((assetCategory) => ({
      ...assetCategory,
      createdByName: assetCategory.createdBy
        ? (userNameById[assetCategory.createdBy] ?? null)
        : null,
    }));

    const enrichedBody = Array.isArray(body)
      ? enrichedAssetCategories
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedAssetCategories }
        : body;

    return { body: enrichedBody, status };
  }

  async getCategoryById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-categories/${id}`)
      .set('Authorization', authorization);

    const assetCategory: any | null =
      body && typeof body === 'object' ? (body as any) : null;

    if (!assetCategory?.createdBy || !assetCategory?.updatedBy) {
      return { body, status };
    }

    let createdByName: string | null = null;
    let updatedByName: string | null = null;
    try {
      const { body: userBody } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users/${assetCategory.createdBy}`)
        .set('Authorization', authorization);

      const user = userBody?.user;
      if (user?.name) {
        createdByName = user.name as string;
      }
    } catch {
      createdByName = null;
    }

    try {
      const { body: userBody } = await superagent
        .get(`${config.IDENTITY_API_URL}/api/users/${assetCategory.updatedBy}`)
        .set('Authorization', authorization);

      const user = userBody?.user;
      if (user?.name) {
        updatedByName = user.name as string;
      }
    } catch {
      updatedByName = null;
    }

    const enrichedBody =
      assetCategory && typeof body === 'object'
        ? { ...body, createdByName, updatedByName }
        : body;

    return { body: enrichedBody, status };
  }

  async createCategory(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.ASSET_API_URL}/api/asset-categories`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async updateCategory(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .put(`${config.ASSET_API_URL}/api/asset-categories/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteCategory(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.ASSET_API_URL}/api/asset-categories/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
