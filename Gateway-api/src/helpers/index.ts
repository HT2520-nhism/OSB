// import { AxiosError } from 'axios';
import { HttpStatus } from '@nestjs/common';

import { Env } from '../constants/enums/env.enum';

/**
 * Check if the env value is in the list of allowed environment
 *
 * @param {unknown} env   - the value needs to be checked
 *
 * @return {boolean} if it is a correct environment
 */
export function isEnvCorrect(env: unknown): boolean {
  return Object.values(Env).includes(env as Env);
}

/**
 * Check if the environment is test or dev environment
 *
 * @param {string} env  - the environment
 *
 * @return {boolean} if it is Development or Test environment
 */
export function isDevOrTestEnv(env: Env): boolean {
  return env === Env.TEST || env === Env.DEVELOPMENT;
}

/* istanbul ignore next */
/**
 * Ensure if a value is not null or undefined
 * Throw an error is value is undefined or null
 *
 * @param {unknown} value   - the value need to be asserted
 *
 * @return {unknown} the actual value if it is defined
 */
export function assertToBeDefined(value: unknown) {
  if (!value) {
    throw new Error('Value not initialized');
  }

  return value;
}

/* istanbul ignore next */
/**
 * Get the current date
 */
export function getCurrentDate() {
  return new Date();
}

/**
 * Convert the axios error to a nest response
 *
 * @param {object} res  - the nest response
 * @param {error} error - the axios error
 *
 * @return {object} the final nest response
 */
export function convertSuperAgentErrorToResponse(res: any, error: any) {
  return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json(
    (error.response?.text && JSON.parse(error.response.text)) || {
      code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal Server Error',
    },
  );
}

export {
  DOCUMENT_AUDIENCE,
  SERVICE_NAME,
  mintServiceToken,
  extractUserIdFromAuthHeader,
} from './service-token';
