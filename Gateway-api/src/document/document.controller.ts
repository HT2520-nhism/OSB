/**
 * PHASE 8 — Document Service passthrough controller.
 *
 * Forwards every /api/documents/* request to the Document Service while
 * preserving the Bearer token and the multipart upload stream. Mirrors the
 * downstream REST surface so it appears in Swagger.
 *
 * Endpoint mapping (downstream paths):
 *   POST   /documents          (multipart upload)
 *   GET    /documents          (list)
 *   GET    /documents/:id
 *   GET    /documents/:id/download
 *   DELETE /documents/:id
 */

import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import * as superagent from 'superagent';
import type { Request } from 'express';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';
import { UploadDocumentDto, QueryDocumentDto } from './dto';

@ApiTags(SwaggerTags.DOCUMENTS)
@ApiBearerAuth('user')
@Controller('documents')
export class DocumentController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a document (multipart)',
    description:
      'Forwards the file + ownerType/ownerId/documentType to the Document Service. ' +
      'owner_service is derived from the Bearer token by the downstream — clients MUST NOT send it.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'File binary' },
        ownerType: { type: 'string', example: 'vessel' },
        ownerId: { type: 'string', example: 'uuid' },
        documentType: { type: 'string', example: 'license' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document created' })
  @ApiResponse({ status: 400, description: 'Invalid file or missing fields' })
  @ApiResponse({ status: 403, description: 'Service not authorized' })
  async upload(
    @Headers('authorization') authorization: string,
    @Req() req: Request & { file?: Express.Multer.File },
    @Res() res,
  ) {
    try {
      const reqAny = req as any;
      const ownerType = reqAny.body?.ownerType;
      const ownerId = reqAny.body?.ownerId;
      const documentType = reqAny.body?.documentType;

      const request = superagent
        .post(`${config.DOCUMENT_API_URL}/api/documents`)
        .set('Authorization', (authorization as string) || '');

      if (reqAny.file) {
        request.attach('file', reqAny.file.buffer, reqAny.file.originalname);
      }
      if (ownerType) request.field('ownerType', ownerType);
      if (ownerId) request.field('ownerId', ownerId);
      if (documentType) request.field('documentType', documentType);

      const { body: data, status } = await request;
      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List documents (paginated)' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Headers('authorization') authorization: string,
    @Query() query: QueryDocumentDto,
    @Res() res,
  ) {
    try {
      const request = superagent
        .get(`${config.DOCUMENT_API_URL}/api/documents`)
        .set('Authorization', (authorization as string) || '')
        .query({
          ownerType: query.ownerType,
          ownerId: query.ownerId,
          documentType: query.documentType,
          limit: query.limit ? String(query.limit) : undefined,
          page: query.page ? String(query.page) : undefined,
        });
      const { body, status } = await request;
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await superagent
        .get(`${config.DOCUMENT_API_URL}/api/documents/${id}`)
        .set('Authorization', (authorization as string) || '');
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download document file (streams binary)',
    description:
      'Streams the file from the downstream. The Gateway does not buffer — passthrough via superagent pipe().',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async download(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const response = await superagent
        .get(`${config.DOCUMENT_API_URL}/api/documents/${id}/download`)
        .set('Authorization', (authorization as string) || '')
        .buffer(false)
        .parse((resHttp, cb) => {
          resHttp.on('data', (chunk: Buffer) => {
            res.write(chunk);
          });
          resHttp.on('end', () => cb(null, null));
          resHttp.on('error', (err: Error) => cb(err, null));
        });
      res.status(response.status);
      Object.entries(response.headers).forEach(([k, v]) => {
        if (k.toLowerCase() !== 'content-length') res.setHeader(k, String(v));
      });
      return res.end();
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200 })
  async remove(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await superagent
        .delete(`${config.DOCUMENT_API_URL}/api/documents/${id}`)
        .set('Authorization', (authorization as string) || '');
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
