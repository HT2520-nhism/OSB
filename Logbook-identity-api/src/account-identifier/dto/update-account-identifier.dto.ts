import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountIdentifierDto {
  @ApiPropertyOptional({
    description: 'Whether this is the primary identifier',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
