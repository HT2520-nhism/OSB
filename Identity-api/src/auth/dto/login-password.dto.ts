import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginPasswordDtoBody {
  @ApiProperty({
    description: 'Email hoặc tên đăng nhập (login_username)',
    example: 'user@example.com',
  })
  @IsString()
  @MinLength(1)
  identifier: string;

  @ApiProperty({ description: 'Mật khẩu', minLength: 1 })
  @IsString()
  @MinLength(1)
  password: string;
}
