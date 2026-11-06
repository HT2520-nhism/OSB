/* istanbul ignore file */
import { isEnvCorrect } from '../helpers';
import { ENV, initializeValue } from './ormconfig';

interface MicrosoftAuthConfig {
  CLIENT_ID: string;
  SECRET: string;
  TENANT_ID: string;
  ALLOWED_DOMAINS: string;
}

const sampleJwtPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0EMm7PBjV8crTmXCnSXX
Fceji1Kia940X6PXvVJ6tixbUoFBEsR+htckmhZWh7gtwVVDhxM6I+G8G6RB6ie1
+pjbw4sk32wpmo8lSPM3RyACIWZrGchNZ4PM46PF4LhGg2jg8nszqiNIZ84zNSTa
927bspFI9ormy0R4zFYptDnT5EV8vnpqT9fnBrNUWUTvb54xda63HkNDBM9+uR/2
jXHiRQuF2r67+BvMn/CZ83WYkwRc85PPLkcOLWN1CZYX1VTOoaQTyP+iaBXvywkF
EC7vThh/yJ7oyHxBPmv3VMcyyvi4t34RCiPkbpEoifVonEtKzGPVi1MqITMP6AuY
PwIDAQAB
-----END PUBLIC KEY-----`;

if (!isEnvCorrect(ENV)) {
  throw new Error(`Invalid environment: ${ENV}`);
}

export const config = {
  PROJECT_NAME: process.env.PROJECT_NAME || 'identity-api',
  LOG_LEVEL: initializeValue(process.env.LOG_LEVEL, 'fatal'),
  PORT: parseInt(initializeValue(process.env.PORT, '3032') as string, 10),
  ENV,
  MICROSOFT_AUTH: {
    CLIENT_ID: initializeValue(process.env.MS_CLIENT_ID, 'ms_client_id'),
    SECRET: initializeValue(process.env.MS_SECRET, 'ms_secret'),
    TENANT_ID: initializeValue(process.env.TENANT_ID, 'tenant_id'),
    ALLOWED_DOMAINS: 'seacom.net.vn,osbholding.com',
  },
  JWT: {
    PRIVATE_KEY: initializeValue(process.env.JWT_PRIVATE_KEY, 'jwt_private'),
    PUBLIC_KEY: initializeValue(process.env.JWT_PUBLIC_KEY, sampleJwtPublicKey),
    EXPIRATION: process.env.JWT_EXPIRATION || '3h',
  },
};
