import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';
import {
  SendEmailDto,
  SendPasswordChangedEmailDto,
  SendPasswordResetEmailDto,
  SendPasswordResetOtpEmailDto,
  SendRegistrationEmailDto,
} from './dto/email.dto';
import { EmailService } from './email.service';

@ApiTags(SwaggerTags.EMAIL)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send generic email' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async sendEmail(
    @Headers() { authorization },
    @Body() body: SendEmailDto,
    @Res() res,
  ) {
    try {
      const { body: data, status } = await this.emailService.sendEmail(
        body,
        authorization,
      );
      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('registration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send registration confirmation email' })
  @ApiResponse({ status: 200, description: 'Registration email sent' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async sendRegistrationEmail(
    @Headers() { authorization },
    @Body() body: SendRegistrationEmailDto,
    @Res() res,
  ) {
    try {
      const { body: data, status } =
        await this.emailService.sendRegistrationEmail(body, authorization);
      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async sendPasswordResetEmail(
    @Headers() { authorization },
    @Body() body: SendPasswordResetEmailDto,
    @Res() res,
  ) {
    try {
      const { body: data, status } =
        await this.emailService.sendPasswordResetEmail(body, authorization);
      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('password-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset OTP email' })
  @ApiResponse({ status: 200, description: 'OTP email sent' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async sendPasswordResetOtpEmail(
    @Headers() { authorization },
    @Body() body: SendPasswordResetOtpEmailDto,
    @Res() res,
  ) {
    try {
      const { body: data, status } =
        await this.emailService.sendPasswordResetOtpEmail(body, authorization);
      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('password-changed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password changed notification email' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async sendPasswordChangedEmail(
    @Headers() { authorization },
    @Body() body: SendPasswordChangedEmailDto,
    @Res() res,
  ) {
    try {
      const { body: data, status } =
        await this.emailService.sendPasswordChangedEmail(body, authorization);
      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
