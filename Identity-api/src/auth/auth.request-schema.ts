import { ApiBodyOptions } from '@nestjs/swagger';
import { Gender } from '../../src/constants/enums/gender.enum';

export const loginBodySchema: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
        description: 'Microsoft Entra ID (Azure AD) ID Token',
        example:
          'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJjbGllbnRfaWQiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vdGVuYW50X2lkL3YyLjAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1c2VyQHNlYWNvbS5uZXQudm4iLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIn0...',
      },
    },
  },
};

export const loginPasswordBodySchema: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['identifier', 'password'],
    properties: {
      identifier: {
        type: 'string',
        description: 'Email hoặc tên đăng nhập',
        example: 'contractor@example.com',
      },
      password: {
        type: 'string',
        description: 'Mật khẩu',
      },
    },
  },
};
