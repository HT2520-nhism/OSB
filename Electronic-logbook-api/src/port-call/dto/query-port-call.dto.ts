import { IsUUID, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryPortCallDto {
  @ApiPropertyOptional({ description: 'Filter by fishing trip ID' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by port code' })
  @IsOptional()
  @IsString()
  portCode?: string;

  @ApiPropertyOptional({ description: 'Filter by call type' })
  @IsOptional()
  @IsString()
  callType?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
