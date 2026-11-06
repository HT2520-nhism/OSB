import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';

import { config } from '../../config';

@Injectable()
export class DeviceTokensService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api/device_tokens`;

  registerToken(authorization: string, body: { expoPushToken: string }) {
    return superagent
      .post(`${this.baseUrl}/register`)
      .send(body)
      .set('Authorization', authorization);
  }
}
