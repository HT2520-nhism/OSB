import {
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OutboxEvent is primarily internal infrastructure.
 * This DTO is for internal service use only.
 */
export class CreateOutboxEventDto {
  @ApiPropertyOptional({ description: 'Aggregate type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  aggregateType?: string;
  @ApiPropertyOptional({ description: 'Aggregate ID (optional)' })
  @IsOptional()
  @IsUUID()
  aggregateId?: string;
  @ApiPropertyOptional({ description: 'Event type', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  eventType?: string;
  @ApiPropertyOptional({ description: 'Event payload (JSON object)' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}
