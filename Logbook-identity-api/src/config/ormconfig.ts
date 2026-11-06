import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { Env } from '../constants/enums/env.enum';
import { assertToBeDefined, isDevOrTestEnv } from '../helpers';
import { ENTITIES } from '../../database/entities';
import { InitializeTables1793332987817 } from '../../database/migrations/1793332987817-InitializeTables';
import { AddSystemRole1793333058891 } from '../../database/migrations/1793333058891-AddSystemRole';

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
  host: initializeValue(process.env.POSTGRES_HOST, 'localhost') as string,
  port: parseInt(initializeValue(process.env.POSTGRES_PORT, '5432'), 10),
  database: initializeValue(
    process.env.POSTGRES_DBNAME,
    'logbook-identity-api',
  ) as string,
  username: initializeValue(
    process.env.POSTGRES_USERNAME,
    'postgres',
  ) as string,
  password: initializeValue(
    process.env.POSTGRES_PASSWORD,
    'postgres',
  ) as string,
  entities: ENTITIES,
  migrations: [InitializeTables1793332987817, AddSystemRole1793333058891],
  migrationsTransactionMode: 'each',
  cli: {
    migrationsDir: 'database/migrations',
  },
  synchronize: ENV === Env.TEST || ENV === Env.DEVELOPMENT,
  logging: ENV === Env.TEST || ENV === Env.DEVELOPMENT,
};

export default new DataSource({
  ...ormConfig,
} as PostgresConnectionOptions);
