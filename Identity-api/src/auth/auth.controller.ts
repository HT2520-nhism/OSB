import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  UseFilters,
} from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import {
  loginBodySchema,
  loginPasswordBodySchema,
} from './auth.request-schema';
import { AllExceptionsFilter } from '../errors/exception-filter';
import validationPipe from '../validation-pipe';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { LoginDtoBody } from './dto/login-ms.dto';
import { LoginPasswordDtoBody } from './dto/login-password.dto';

@UsePipes(validationPipe())
@UseFilters(AllExceptionsFilter)
@ApiTags(SwaggerTags.AUTH)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Login với Microsoft Entra ID',
    description:
      'Xác thực người dùng bằng Microsoft ID Token và trả về JWT token nội bộ',
  })
  @ApiBody(loginBodySchema)
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'JWT token nội bộ để sử dụng cho các API khác',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc email domain không được phép',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() { token }: LoginDtoBody) {
    return this.authService.login(token);
  }

  @ApiOperation({
    summary: 'Đăng nhập email / tên đăng nhập + mật khẩu',
    description:
      'identifier: email (không phân biệt hoa thường) hoặc login_username (đã lưu chữ thường). Cần admin gán mật khẩu trên web.',
  })
  @ApiBody(loginPasswordBodySchema)
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'JWT token nội bộ',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Sai thông tin đăng nhập' })
  @Post('login/password')
  @HttpCode(HttpStatus.OK)
  loginWithPassword(@Body() body: LoginPasswordDtoBody) {
    return this.authService.loginWithPassword(body.identifier, body.password);
  }

  // signIn(@Body() signInDto: SignInDto) {
  //   return this.authService.signIn(signInDto.username, signInDto.password);
  // }

  // @UsePipes(validationPipe())
  // @UseFilters(AllExceptionsFilter)
  // @ApiTags(SwaggerTags.AUTH)
  // @HttpCode(HttpStatus.CREATED)
  // @ApiBody(registerBodySchema)
  // @Post('register')
  // register(@Body() registerDto: RegisterDto) {
  //   return this.authService.register(
  //     registerDto.username,
  //     registerDto.password,
  //     registerDto.firstName,
  //     registerDto.lastName,
  //     registerDto.gender,
  //     registerDto.email,
  //   );
  // }
}
