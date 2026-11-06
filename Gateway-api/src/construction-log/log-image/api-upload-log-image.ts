import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiUploadLogImage() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file', 'logId'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description:
              'Ảnh hoặc video. Tệp tài liệu (docx/xlsx/pdf...) dùng endpoint /construction-log/log-attachment.',
          },
          logId: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          deviceTimestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );
}
