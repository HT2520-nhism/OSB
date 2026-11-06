import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDtoBody {
  @ApiProperty({
    description: 'Microsoft Entra ID (Azure AD) ID Token',
    example:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ...',
  })
  @IsString()
  token: string;
}
