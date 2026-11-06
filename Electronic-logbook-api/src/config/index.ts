/* istanbul ignore file */
import { isEnvCorrect } from '../helpers';
import { ENV, initializeValue } from './ormconfig';

const sampleJwtPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0EMm7PBjV8crTmXCnSXX
Fceji1Kia940X6PXvVJ6tixbUoFBEsR+htckmhZWh7gtwVVDhxM6I+G8G6RB6ie1
+pjbw4sk32wpmo8lSPM3RyACIWZrGchNZ4PM46PF4LhGg2jg8nszqiNIZ84zNSTa
927bspFI9ormy0R4zFYptDnT5EV8vnpqT9fnBrNUWUTvb54xda63HkNDBM9+uR/2
jXHiRQuF2r67+BvMn/CZ83WYkwRc85PPLkcOLWN1CZYX1VTOoaQTyP+iaBXvywkF
EC7vThh/yJ7oyHxBPmv3VMcyyvi4t34RCiPkbpEoifVonEtKzGPVi1MqITMP6AuY
PwIDAQAB
-----END PUBLIC KEY-----`;

/** Sample secret for HS256 — THAY BẰNG GIÁ TRỊ BÍ MẬT trong production. */
const sampleJwtAccessSecret = 'logbook-jwt-access-secret-change-me';

if (!isEnvCorrect(ENV)) {
  throw new Error(`Invalid environment: ${ENV}`);
}

export const config = {
  PROJECT_NAME: process.env.PROJECT_NAME || 'electronic-logbook-api',
  LOG_LEVEL: initializeValue(process.env.LOG_LEVEL, 'fatal'),
  PORT: parseInt(initializeValue(process.env.PORT, '3043') as string, 10),
  ENV,
  /** PHASE 8 — Gateway URL used to reach the Document Service. */
  GATEWAY_URL: initializeValue(
    process.env.GATEWAY_URL,
    'http://localhost:3030',
  ),
  JWT: {
    PUBLIC_KEY: initializeValue(process.env.JWT_PUBLIC_KEY, sampleJwtPublicKey),
    ACCESS_SECRET: initializeValue(
      process.env.JWT_ACCESS_SECRET,
      sampleJwtAccessSecret,
    ) as string,
  },
  LOG_IMAGE_MAX_IMAGE_MB: parseInt(
    initializeValue(process.env.LOG_IMAGE_MAX_IMAGE_MB, '5') as string,
    10,
  ),
  LOG_IMAGE_MAX_VIDEO_MB: parseInt(
    initializeValue(process.env.LOG_IMAGE_MAX_VIDEO_MB, '25') as string,
    10,
  ),
};
