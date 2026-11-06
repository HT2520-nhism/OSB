import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';
import { getUsersByIds } from '../../helpers/asset-enrichment';

type AssetRelationship = {
  id: string;
  parentAssetId?: string;
  childAssetId?: string;
  relationshipType?: string;
  installedBy?: string;
  installedAt?: string;
  removedBy?: string;
  removedAt?: string;
  notes?: string;
  createdAt?: string;
  [key: string]: any;
};

@Injectable()
export class AssetRelationshipsService {
  private async getUserNames(
    authorization: string,
    userIds: (string | undefined)[],
  ): Promise<Record<string, string>> {
    const users = await getUsersByIds(
      authorization,
      userIds.filter((id): id is string => !!id),
    );

    const result: Record<string, string> = {};
    for (const [id, user] of Object.entries(users)) {
      if (user?.name) {
        result[id] = user.name;
      }
    }
    return result;
  }

  private async enrichRelationship(
    authorization: string,
    relationship: AssetRelationship,
  ): Promise<AssetRelationship> {
    if (!relationship) {
      return relationship;
    }

    const userIds = [relationship.installedBy, relationship.removedBy];
    const users = await this.getUserNames(authorization, userIds);

    return {
      ...relationship,
      installedByName: relationship.installedBy
        ? (users[relationship.installedBy] ?? null)
        : null,
      removedByName: relationship.removedBy
        ? (users[relationship.removedBy] ?? null)
        : null,
    };
  }

  private async enrichRelationshipList(
    authorization: string,
    relationships: AssetRelationship[],
  ): Promise<AssetRelationship[]> {
    const userIds = relationships.flatMap((r) => [r.installedBy, r.removedBy]);
    const users = await this.getUserNames(authorization, userIds);

    return relationships.map((r) => ({
      ...r,
      installedByName: r.installedBy ? (users[r.installedBy] ?? null) : null,
      removedByName: r.removedBy ? (users[r.removedBy] ?? null) : null,
    }));
  }

  async createAssetRelationship(authorization: string, payload: any) {
    const { body, status } = await superagent
      .post(`${config.ASSET_API_URL}/api/asset-relationships`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAllAssetRelationships(
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
      .get(`${config.ASSET_API_URL}/api/asset-relationships`)
      .query(query)
      .set('Authorization', authorization);

    const assetRelationships: AssetRelationship[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];

    const enrichedAssetRelationships = await this.enrichRelationshipList(
      authorization,
      assetRelationships,
    );

    const enrichedBody = Array.isArray(body)
      ? enrichedAssetRelationships
      : Array.isArray(body?.data)
        ? { ...body, data: enrichedAssetRelationships }
        : body;

    return { body: enrichedBody, status };
  }

  async getInstalledAssetComponents(authorization: string, assetId: string) {
    const { body, status } = await superagent
      .get(
        `${config.ASSET_API_URL}/api/asset-relationships/installed/${assetId}`,
      )
      .set('Authorization', authorization);

    const relationships: AssetRelationship[] = Array.isArray(body)
      ? body
      : (body?.data ?? []);

    const enrichedRelationships = await this.enrichRelationshipList(
      authorization,
      relationships,
    );

    return {
      body: Array.isArray(body)
        ? enrichedRelationships
        : { ...body, data: enrichedRelationships },
      status,
    };
  }

  async getAssetInstallationHistory(authorization: string, assetId: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-relationships/history/${assetId}`)
      .set('Authorization', authorization);

    return { body, status };
  }

  async getAssetRelationshipById(authorization: string, id: string) {
    const { body, status } = await superagent
      .get(`${config.ASSET_API_URL}/api/asset-relationships/${id}`)
      .set('Authorization', authorization);

    const assetRelationship: AssetRelationship | null =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as AssetRelationship)
        : null;

    if (!assetRelationship) {
      return { body, status };
    }

    const enrichedBody = await this.enrichRelationship(
      authorization,
      assetRelationship,
    );

    return {
      body: enrichedBody,
      status,
    };
  }
  async updateAssetRelationship(
    authorization: string,
    id: string,
    payload: any,
  ) {
    const { body, status } = await superagent
      .patch(`${config.ASSET_API_URL}/api/asset-relationships/${id}`)
      .send(payload)
      .set('Authorization', authorization);

    return { body, status };
  }

  async deleteAssetRelationship(authorization: string, id: string) {
    const { body, status } = await superagent
      .delete(`${config.ASSET_API_URL}/api/asset-relationships/${id}`)
      .set('Authorization', authorization);

    return { body, status };
  }
}
