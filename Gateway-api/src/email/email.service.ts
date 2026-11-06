import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../config';

@Injectable()
export class EmailService {
  private readonly emailApiUrl = `${config.NOTIFICATION_API_URL}/api/email`;

  private async proxyPost(
    path: string,
    payload: object,
    authorization?: string,
  ): Promise<{ body: any; status: number }> {
    try {
      const request = superagent
        .post(`${this.emailApiUrl}${path}`)
        .send(payload);

      if (authorization) {
        request.set('Authorization', authorization);
      }

      const { body, status } = await request;
      return { body, status };
    } catch (err: any) {
      if (err.response) {
        return { body: err.response.body, status: err.response.status };
      }
      throw err;
    }
  }

  sendEmail(payload: object, authorization?: string) {
    return this.proxyPost('', payload, authorization);
  }

  sendRegistrationEmail(payload: object, authorization?: string) {
    return this.proxyPost('/registration', payload, authorization);
  }

  sendPasswordResetEmail(payload: object, authorization?: string) {
    return this.proxyPost('/password-reset', payload, authorization);
  }

  sendPasswordResetOtpEmail(payload: object, authorization?: string) {
    return this.proxyPost('/password-reset-otp', payload, authorization);
  }

  sendPasswordChangedEmail(payload: object, authorization?: string) {
    return this.proxyPost('/password-changed', payload, authorization);
  }
}
