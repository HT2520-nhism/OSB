import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDeviceDto {
  @ApiProperty({ description: 'Device ID (unique)', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceId!: string;

  @ApiPropertyOptional({
    description: 'Platform (ios/android/web)',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  platform?: string;
  @ApiPropertyOptional({ description: 'App version', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}
