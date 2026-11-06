import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../../constants/enums/swagger-tags.enum';
import { config } from '../../config';
import { LogImageService } from './log-image.service';
import { convertSuperAgentErrorToResponse } from '../../helpers';
import { ApiUploadLogImage } from './api-upload-log-image';

@ApiTags(SwaggerTags.LOG_IMAGES)
@ApiBearerAuth('user')
@Controller('construction-log/log-image')
export class LogImageController {
  constructor(private readonly logImageService: LogImageService) {}

  @Post('/')
  @ApiUploadLogImage()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: config.LOG_IMAGE_UPLOAD_MAX_BYTES },
    }),
  )
  async createLogImage(
    @Headers() { authorization },
    @UploadedFile() file: any,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const { body: resBody, status } =
        await this.logImageService.createLogImage(authorization, file, body);

      return res.status(status).json(resBody);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'logId', schema: { type: 'string' } })
  @Get('/log/:logId')
  async getImagesByLog(
    @Headers() { authorization },
    @Param('logId') logId: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.logImageService.getImagesByLog(
        authorization,
        logId,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'imageId', schema: { type: 'string' } })
  @Get('/:imageId/status')
  async getProcessingStatus(
    @Headers() { authorization },
    @Param('imageId') imageId: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.logImageService.getProcessingStatus(
        authorization,
        imageId,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiParam({ name: 'imageId', schema: { type: 'string' } })
  @Delete('/:imageId')
  async deleteImage(
    @Headers() { authorization },
    @Param('imageId') imageId: string,
    @Res() res,
  ) {
    try {
      const { body, status } = await this.logImageService.deleteImage(
        authorization,
        imageId,
      );

      return res.status(status).json(body);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
