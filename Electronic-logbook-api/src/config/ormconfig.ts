import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { Env } from '../constants/enums/env.enum';
import { assertToBeDefined, isDevOrTestEnv } from '../helpers';
import { ENTITIES } from '../../database/entities';

import { InitializeTables1789120777696 } from '../../database/migrations/1789120777696-InitializeTables';
import { OutboxEventsPhase7Columns1789357756615 } from '../../database/migrations/1789357756615-OutboxEventsPhase7Columns';
import { AddAttachmentDocumentId1789379721444 } from '../../database/migrations/1789379721444-AddAttachmentDocumentId';
import { AddIncidentOwnerId1789530919173 } from '../../database/migrations/1789530919173-AddIncidentOwnerId';
import { AddVesselOwnerId1789530912973 } from '../../database/migrations/1789530912973-AddVesselOwnerId';
import { FishingOperationProfile1789550736108 } from '../../database/migrations/1789550736108-FishingOperationProfile';
import { SeedRegulatoryFormDefinitions1789614734352 } from '../../database/migrations/1789614734352-SeedRegulatoryFormDefinitions';

export const ENV: Env = process.env.JEST_WORKER_ID
  ? Env.TEST
  : (dotenv.config(), assertToBeDefined(process.env.NODE_ENV) as Env);

export function initializeValue(
  value: string | undefined,
  defaultValue: string,
) {
  if (isDevOrTestEnv(ENV) && !value) {
    return defaultValue;
  }

  return assertToBeDefined(value) as string;
}

const ROOT_DIR = path.resolve(__dirname, '../..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'database', 'migrations');

export const ormConfig = {
  type: 'postgres' as const,
  host: initializeValue(process.env.POSTGRES_HOST, 'localhost'),
  port: parseInt(initializeValue(process.env.POSTGRES_PORT, '5432'), 10),
  database: initializeValue(
    process.env.POSTGRES_DBNAME,
    'electronic-logbook-api',
  ),
  username: initializeValue(process.env.POSTGRES_USERNAME, 'postgres'),
  password: initializeValue(process.env.POSTGRES_PASSWORD, 'postgres'),

  entities: ENTITIES,

  migrations: [
    InitializeTables1789120777696,
    OutboxEventsPhase7Columns1789357756615,
    AddAttachmentDocumentId1789379721444,
    AddIncidentOwnerId1789530919173,
    AddVesselOwnerId1789530912973,
    FishingOperationProfile1789550736108,
    SeedRegulatoryFormDefinitions1789614734352,
  ],

  migrationsTransactionMode: 'each',

  cli: {
    migrationsDir: 'database/migrations',
  },

  synchronize: ENV === Env.TEST || ENV === Env.DEVELOPMENT,
  logging: ENV === Env.TEST || ENV === Env.DEVELOPMENT,
};

export default new DataSource(ormConfig as PostgresConnectionOptions);
