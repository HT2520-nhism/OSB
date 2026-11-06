import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttachmentDto {
  @ApiPropertyOptional({ description: 'Owner user ID (optional)' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;
  @ApiPropertyOptional({ description: 'Vessel ID (optional)' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;
  @ApiPropertyOptional({ description: 'Fishing trip ID (optional)' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;
  @ApiPropertyOptional({ description: 'Form submission ID (optional)' })
  @IsOptional()
  @IsUUID()
  formSubmissionId?: string;
  @ApiPropertyOptional({ description: 'Incident ID (optional)' })
  @IsOptional()
  @IsUUID()
  incidentId?: string;
  @ApiPropertyOptional({ description: 'File name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
  @ApiPropertyOptional({ description: 'File type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fileType?: string;
  @ApiPropertyOptional({ description: 'MIME type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}
