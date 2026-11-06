import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiUploadLogAttachment() {
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
              'Tệp docx/xlsx/pdf/zip/txt/... (không phải ảnh/video).',
          },
          logId: { type: 'string' },
        },
      },
    }),
  );
}
