import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';
import { config } from '../../config';

@Injectable()
export class LogImageService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api/log_image`;

  async createLogImage(
    authorization: string,
    file: Express.Multer.File,
    body: any,
  ) {
    const request = superagent
      .post(this.baseUrl)
      .set('Authorization', authorization);

    if (file) {
      request.attach('file', file.buffer, file.originalname);
    }

    Object.keys(body || {}).forEach((key) => {
      request.field(key, body[key]);
    });

    return request;
  }

  getImagesByLog(authorization: string, logId: string) {
    return superagent
      .get(`${this.baseUrl}/log/${logId}`)
      .set('Authorization', authorization);
  }

  getProcessingStatus(authorization: string, imageId: string) {
    return superagent
      .get(`${this.baseUrl}/${imageId}/status`)
      .set('Authorization', authorization);
  }

  deleteImage(authorization: string, imageId: string) {
    return superagent
      .delete(`${this.baseUrl}/${imageId}`)
      .set('Authorization', authorization);
  }
}
