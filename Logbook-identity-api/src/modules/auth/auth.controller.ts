import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  RegistrationResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { AuthenticatedUser } from './strategies/jwt.strategy';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({
    status: 201,
    description: 'Account registered successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Identifier already exists' })
  async register(@Body() dto: RegisterDto): Promise<RegistrationResponseDto> {
    const { response } = await this.authService.register(dto);
    return response;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with identifier and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip || (req.socket as any)?.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(
    @Body() body: { sessionId?: string },
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<void> {
    // sessionId may come from body (Gateway extracted from JWT) or from JWT payload
    const sessionId =
      body?.sessionId ||
      (req.user as any).sessionId ||
      (req.user as any)?.session?.id;

    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.authService.logout(sessionId, req.user.accountId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent if account exists',
  })
  @ApiResponse({ status: 500, description: 'Failed to process request' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string; expiresIn: number }> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 500, description: 'Failed to reset password' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}
