import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { LogAttachmentService } from './log-attachment.service';
import { ApiUploadLogAttachment } from './api-upload-log-attachment';

@ApiTags(SwaggerTags.LOG_ATTACHMENTS)
@ApiBearerAuth('user')
@Controller('construction-log/log-attachment')
export class LogAttachmentController {
  constructor(private readonly logAttachmentService: LogAttachmentService) {}

  @Post('/')
  @ApiUploadLogAttachment()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }),
  )
  async createLogAttachment(
    @Headers() { authorization },
    @UploadedFile() file: any,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.logAttachmentService.createLogAttachment(
          authorization,
          file,
          body,
        );
      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'logId', schema: { type: 'string' } })
  @Get('/log/:logId')
  async getAttachmentsByLog(
    @Headers() { authorization },
    @Param('logId') logId: string,
    @Res() res,
  ) {
    try {
      const { body, status } =
        await this.logAttachmentService.getAttachmentsByLog(
          authorization,
          logId,
        );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'attachmentId', schema: { type: 'string' } })
  @Delete('/:attachmentId')
  async deleteAttachment(
    @Headers() { authorization },
    @Param('attachmentId') attachmentId: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.logAttachmentService.deleteAttachment(
        authorization,
        attachmentId,
      );
      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
