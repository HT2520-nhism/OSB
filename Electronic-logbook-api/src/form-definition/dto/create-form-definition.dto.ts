import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormDefinitionDto {
  @ApiProperty({ description: 'Form code', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  formCode!: string;

  @ApiProperty({ description: 'Form name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Description (text)' })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiPropertyOptional({ description: 'Version', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  version?: string;
  @ApiPropertyOptional({ description: 'Form type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  formType?: string;
  @ApiPropertyOptional({ description: 'Effective from' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
  @ApiPropertyOptional({ description: 'Effective to' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
