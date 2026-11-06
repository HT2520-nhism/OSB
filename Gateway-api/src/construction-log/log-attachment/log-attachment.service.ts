import { Injectable } from '@nestjs/common';
import * as superagent from 'superagent';
import { config } from '../../config';

@Injectable()
export class LogAttachmentService {
  private readonly baseUrl = `${config.CONSTRUCTION_LOG_API_URL}/api/log_attachment`;

  async createLogAttachment(
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

  getAttachmentsByLog(authorization: string, logId: string) {
    return superagent
      .get(`${this.baseUrl}/log/${logId}`)
      .set('Authorization', authorization);
  }

  deleteAttachment(authorization: string, attachmentId: string) {
    return superagent
      .delete(`${this.baseUrl}/${attachmentId}`)
      .set('Authorization', authorization);
  }
}
