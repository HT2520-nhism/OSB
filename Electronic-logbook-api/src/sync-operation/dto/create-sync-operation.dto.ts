import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSyncOperationDto {
  @ApiProperty({
    description: 'Operation ID (client-generated, unique)',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  operationId!: string;

  @ApiPropertyOptional({ description: 'Entity type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;
  @ApiPropertyOptional({ description: 'Entity ID (optional)' })
  @IsOptional()
  @IsUUID()
  entityId?: string;
  @ApiPropertyOptional({
    description: 'Operation type (CREATE/UPDATE/DELETE)',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  operationType?: string;
  @ApiPropertyOptional({ description: 'Payload (JSON object)' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Client version number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientVersion?: number | null;
}
