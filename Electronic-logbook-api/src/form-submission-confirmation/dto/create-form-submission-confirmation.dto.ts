import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormSubmissionConfirmationDto {
  @ApiProperty({ description: 'Confirmation type', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  confirmationType!: string;
}
