import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

@Injectable()
export class AssetModelsService {
  async getAllAssetModels(
    authorization: string,
    query: Record<string, string> = {},
  ) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-models`)
      .query(query)
      .set('Authorization', authorization);

    const assetModels: any[] = body?.data ?? [];
    const userIds = Array.from(
      new Set(
        assetModels
          .flatMap((assetModel) => [
            assetModel.createdBy,
            assetModel.updatedBy,
            assetModel.deletedBy,
          ])
          .filter((id): id is string => typeof id === 'string' && !!id),
      ),
    );

    const usersById: Record<string, string> = {};

    for (const userId of userIds) {
      try {
        const { body: userBody } = await superagent
          .get(`${config.IDENTITY_API_URL}/api/users/${userId}`)
          .set('Authorization', authorization);

        const user = userBody?.user;

        if (user?.name) {
          usersById[userId] = user.name;
        }
      } catch {
        // Ignore user not found
      }
    }

    const enrichedAssetModels = assetModels.map((assetModel) => ({
      ...assetModel,

      createdByName: assetModel.createdBy
        ? (usersById[assetModel.createdBy] ?? null)
        : null,

      updatedByName: assetModel.updatedBy
        ? (usersById[assetModel.updatedBy] ?? null)
        : null,

      deletedByName: assetModel.deletedBy
        ? (usersById[assetModel.deletedBy] ?? null)
        : null,
    }));

    const enrichedBody = Array.isArray(body)
      ? enrichedAssetModels
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedAssetModels }
        : body;

    return {
      body: enrichedBody,
      status,
    };
  }

  async getAssetModelById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-models/${id}`)
      .set('Authorization', authorization);

    const assetModel = body;

    const userIds = Array.from(
      new Set(
        [
          assetModel?.createdBy,
          assetModel?.updatedBy,
          assetModel?.deletedBy,
        ].filter((id): id is string => typeof id === 'string' && !!id),
      ),
    );

    const usersById: Record<string, string> = {};

    for (const userId of userIds) {
      try {
        const { body: userBody } = await superagent
          .get(`${config.IDENTITY_API_URL}/api/users/${userId}`)
          .set('Authorization', authorization);

        const user = userBody?.user;

        if (user?.name) {
          usersById[userId] = user.name;
        }
      } catch {
        // Ignore user not found
      }
    }

    const enrichedAssetModel = {
      ...assetModel,

      createdByName: assetModel?.createdBy
        ? (usersById[assetModel.createdBy] ?? null)
        : null,

      updatedByName: assetModel?.updatedBy
        ? (usersById[assetModel.updatedBy] ?? null)
        : null,

      deletedByName: assetModel?.deletedBy
        ? (usersById[assetModel.deletedBy] ?? null)
        : null,
    };

    return {
      body: enrichedAssetModel,
      status,
    };
  }
  async createAssetModel(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.ASSET_API_URL}/api/asset-models`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async updateAssetModel(authorization: string, id: string, payload: any) {
    const { body, status } = await superagent
      .put(`${config.ASSET_API_URL}/api/asset-models/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteAssetModel(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.ASSET_API_URL}/api/asset-models/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
