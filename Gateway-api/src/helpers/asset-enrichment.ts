import * as superagent from 'superagent';

import { config } from '../config';

type User = {
  id: string;
  name?: string;
  email?: string;
  [key: string]: any;
};

type Site = {
  id: string;
  siteName?: string;
  siteCode?: string;
  address?: string;
  [key: string]: any;
};

/**
 * Fetch user info by ID
 */
export async function getUserById(
  authorization: string,
  userId: string,
): Promise<User | null> {
  try {
    const { body } = await superagent
      .get(`${config.IDENTITY_API_URL}/api/users/${userId}`)
      .set('Authorization', authorization);
    return body?.user || body || null;
  } catch {
    return null;
  }
}

/**
 * Fetch multiple users by IDs (batch)
 */
export async function getUsersByIds(
  authorization: string,
  userIds: (string | undefined)[],
): Promise<Record<string, User>> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
  const results: Record<string, User> = {};

  await Promise.all(
    uniqueIds.map(async (id) => {
      const user = await getUserById(authorization, id);
      if (user) {
        results[id] = user;
      }
    }),
  );

  return results;
}

/**
 * Fetch site info by ID
 */
export async function getSiteById(
  authorization: string,
  siteId: string,
): Promise<Site | null> {
  try {
    const { body } = await superagent
      .get(`${config.CUSTOMER_API_URL}/api/sites/${siteId}`)
      .set('Authorization', authorization);
    return body?.site || body || null;
  } catch {
    return null;
  }
}

/**
 * Fetch multiple sites by IDs (batch)
 */
export async function getSitesByIds(
  authorization: string,
  siteIds: (string | undefined)[],
): Promise<Record<string, Site>> {
  const uniqueIds = [...new Set(siteIds.filter((id): id is string => !!id))];
  const results: Record<string, Site> = {};

  await Promise.all(
    uniqueIds.map(async (id) => {
      const site = await getSiteById(authorization, id);
      if (site) {
        results[id] = site;
      }
    }),
  );

  return results;
}

/**
 * Enrich items with user names
 */
export function enrichWithUserNames<T extends Record<string, any>>(
  items: T[],
  userIdFields: (keyof T)[],
  nameFields: Record<keyof T, keyof T>,
): (T & Record<string, any>)[] {
  return items.map((item) => {
    const enriched: Record<string, any> = { ...item };
    for (const userIdField of userIdFields) {
      const nameField = nameFields[userIdField];
      const userId = item[userIdField];
      // User names will be added by the service layer after batch fetch
      enriched[nameField as string] = null; // placeholder
    }
    return enriched as T & Record<string, any>;
  });
}

/**
 * Enrich items with site info
 */
export function enrichWithSites<T extends Record<string, any>>(
  items: T[],
  siteIdFields: (keyof T)[],
  siteFields: Record<keyof T, keyof T>,
): (T & Record<string, any>)[] {
  return items.map((item) => {
    const enriched: Record<string, any> = { ...item };
    for (const siteIdField of siteIdFields) {
      const siteField = siteFields[siteIdField];
      // Site info will be added by the service layer after batch fetch
      enriched[siteField as string] = null; // placeholder
    }
    return enriched as T & Record<string, any>;
  });
}
