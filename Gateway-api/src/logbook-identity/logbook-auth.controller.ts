import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import * as jwt from 'jsonwebtoken';
import * as superagent from 'superagent';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { convertSuperAgentErrorToResponse } from '../helpers';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

@ApiTags(SwaggerTags.LOGBOOK_AUTH)
@Controller('logbook/auth')
export class LogbookAuthController {
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new fisherman account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Account registered successfully. Password will be sent via email.',
  })
  @ApiResponse({ status: 409, description: 'Identifier already exists' })
  async register(@Body() body: RegisterDto, @Res() res) {
    try {
      const { body: data, status } = await superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/auth/register`)
        .send(body);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with identifier and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful — returns accessToken + refreshToken',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: LoginDto, @Req() req: any, @Res() res) {
    try {
      const ipAddress = req.ip || (req.socket as any)?.remoteAddress;
      const userAgent = req.get('User-Agent');

      const loginBody = {
        ...body,
        ipAddress,
        userAgent,
      };

      const { body: data, status } = await superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/auth/login`)
        .send(loginBody);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description:
      'Token refreshed successfully — returns new accessToken + refreshToken',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: RefreshTokenDto, @Res() res) {
    try {
      const { body: data, status } = await superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/auth/refresh`)
        .send(body);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @ApiBearerAuth('logbook-user')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(
    @Headers() { authorization }: { authorization?: string },
    @Res() res,
  ) {
    try {
      // Extract sessionId from the JWT payload so the downstream can revoke it
      let sessionId: string | undefined;
      if (authorization && authorization.startsWith('Bearer ')) {
        const token = authorization.slice(7);
        try {
          const payload = jwt.decode(token) as Record<string, unknown>;
          sessionId = payload?.sessionId as string | undefined;
        } catch {
          // ignore decode errors — downstream will handle auth
        }
      }

      const req = superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/auth/logout`)
        .send(sessionId ? { sessionId } : {});
      if (authorization) req.set('Authorization', authorization);
      await req;

      return res.status(HttpStatus.NO_CONTENT).send();
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent if account exists',
  })
  @ApiResponse({ status: 500, description: 'Failed to process request' })
  async forgotPassword(@Body() body: ForgotPasswordDto, @Res() res) {
    try {
      const { body: data, status } = await superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/auth/forgot-password`)
        .send(body);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 500, description: 'Failed to reset password' })
  async resetPassword(@Body() body: ResetPasswordDto, @Res() res) {
    try {
      const { body: data, status } = await superagent
        .post(`${config.LOGBOOK_IDENTITY_API_URL}/api/auth/reset-password`)
        .send(body);

      return res.status(status).json(data);
    } catch (err) {
      return convertSuperAgentErrorToResponse(res, err);
    }
  }
}
