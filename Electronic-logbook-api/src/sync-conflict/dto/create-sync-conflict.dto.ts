import {
  IsUUID,
  IsOptional,
  IsString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSyncConflictDto {
  @ApiProperty({ description: 'Sync operation ID' })
  @IsUUID()
  syncOperationId!: string;
  @ApiPropertyOptional({ description: 'Entity type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;
  @ApiPropertyOptional({ description: 'Entity ID (optional)' })
  @IsOptional()
  @IsUUID()
  entityId?: string;
  @ApiPropertyOptional({ description: 'Client data (JSON object)' })
  @IsOptional()
  @IsObject()
  clientData?: Record<string, unknown>;
  @ApiPropertyOptional({ description: 'Server data (JSON object)' })
  @IsOptional()
  @IsObject()
  serverData?: Record<string, unknown>;
}
