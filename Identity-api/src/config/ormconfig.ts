import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { Env } from '../constants/enums/env.enum';
import { assertToBeDefined, isDevOrTestEnv } from '../helpers';

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
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'database');

export const ormConfig = {
  type: 'postgres',
  host: initializeValue(process.env.POSTGRES_HOST, 'localhost') as string,
  port: parseInt(initializeValue(process.env.POSTGRES_PORT, '5432'), 10),
  database: initializeValue(
    process.env.POSTGRES_DBNAME,
    'identity-api',
  ) as string,
  username: initializeValue(
    process.env.POSTGRES_USERNAME,
    'postgres',
  ) as string,
  password: initializeValue(
    process.env.POSTGRES_PASSWORD,
    'postgres',
  ) as string,
  entities: [path.join(ROOT_DIR, 'src/**/*.entity.ts')],
  migrations: [MIGRATIONS_DIR],
  migrationsTransactionMode: 'each',
  cli: {
    migrationsDir: 'database',
  },
};

export default new DataSource({
  ...ormConfig,
} as PostgresConnectionOptions);
