/* istanbul ignore file */
import * as dotenv from 'dotenv';
import * as process from 'process';

import { assertToBeDefined, isDevOrTestEnv, isEnvCorrect } from '../helpers';
import { Env } from '../constants/enums/env.enum';

export const ENV: Env = process.env.JEST_WORKER_ID
  ? Env.TEST
  : (dotenv.config(), assertToBeDefined(process.env.NODE_ENV) as Env);

if (ENV === Env.DEVELOPMENT) {
  dotenv.config();
}

export function initializeValue(
  value: string | undefined,
  defaultValue: string,
) {
  if (isDevOrTestEnv(ENV) && !value) {
    return defaultValue;
  }

  return assertToBeDefined(value) as string;
}

if (!isEnvCorrect(ENV)) {
  throw new Error(`Invalid environment: ${ENV}`);
}

function parsePositiveMegabytes(
  raw: string | undefined,
  fallbackMb: number,
): number {
  if (!raw?.trim()) return fallbackMb;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 4096) : fallbackMb;
}

const LOG_IMAGE_MAX_VIDEO_MB = parsePositiveMegabytes(
  process.env.LOG_IMAGE_MAX_VIDEO_MB,
  200,
);
const LOG_IMAGE_MAX_IMAGE_MB = parsePositiveMegabytes(
  process.env.LOG_IMAGE_MAX_IMAGE_MB,
  30,
);
const MB = 1024 * 1024;

export const config = {
  JWT_TOKEN: initializeValue(process.env.JWT_TOKEN, 'fake_token'),
  PROJECT_NAME: initializeValue(process.env.PROJECT_NAME, 'gateway-api'),
  LOG_LEVEL: initializeValue(process.env.LOG_LEVEL, 'fatal'),
  IDENTITY_API_URL: initializeValue(
    process.env.IDENTITY_API_URL,
    'http://localhost:3032',
  ),
  CONSTRUCTION_LOG_API_URL: initializeValue(
    process.env.CONSTRUCTION_LOG_API_URL,
    'http://localhost:3031',
  ),
  CUSTOMER_API_URL: initializeValue(
    process.env.CUSTOMER_API_URL,
    'http://localhost:3033',
  ),
  ASSET_API_URL: initializeValue(
    process.env.ASSET_API_URL,
    'http://localhost:3034',
  ),
  NOTIFICATION_API_URL: initializeValue(
    process.env.NOTIFICATION_API_URL,
    'http://localhost:3032',
  ),
  LOGBOOK_IDENTITY_API_URL: initializeValue(
    process.env.LOGBOOK_IDENTITY_API_URL,
    'http://localhost:3041',
  ),
  /** URL cho Electronic Logbook API — dùng chung secret LOGBOOK_JWT_ACCESS_SECRET */
  ELECTRONIC_LOGBOOK_API_URL: initializeValue(
    process.env.ELECTRONIC_LOGBOOK_API_URL,
    'http://localhost:3043',
  ),
  /** PHASE 8 — Shared Document Service URL */
  DOCUMENT_API_URL: initializeValue(
    process.env.DOCUMENT_API_URL,
    'http://localhost:3040',
  ),
  PORT: parseInt(initializeValue(process.env.PORT, '3030'), 10),
  ENV,
  /** Đồng bộ với construction-log-api (multipart ảnh/video nhật ký). */
  LOG_IMAGE_MAX_VIDEO_BYTES: LOG_IMAGE_MAX_VIDEO_MB * MB,
  LOG_IMAGE_MAX_IMAGE_BYTES: LOG_IMAGE_MAX_IMAGE_MB * MB,
  LOG_IMAGE_UPLOAD_MAX_BYTES: Math.max(
    LOG_IMAGE_MAX_VIDEO_MB * MB,
    LOG_IMAGE_MAX_IMAGE_MB * MB,
  ),
};
