import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormSubmissionStatus } from '../../constants/enums/domain.enum';

export class CreateFormSubmissionDto {
  @ApiProperty({
    description: 'Form definition ID (FK to form_definitions.id)',
  })
  @IsString()
  @IsNotEmpty()
  formDefinitionId!: string;

  @ApiPropertyOptional({
    description: 'Fishing trip ID (optional — null for vessel-only forms)',
  })
  @IsOptional()
  @IsString()
  fishingTripId?: string | null;

  @ApiProperty({ description: 'Vessel ID' })
  @IsString()
  @IsNotEmpty()
  vesselId!: string;

  @ApiPropertyOptional({
    description:
      'Initial submission status (defaults to DRAFT; set to SUBMITTED for direct or offline sync submit)',
    enum: FormSubmissionStatus,
  })
  @IsOptional()
  @IsEnum(FormSubmissionStatus)
  status?: FormSubmissionStatus;

  /**
   * Form-specific payload (M01/M02/M03 fields, regulatory data, etc.).
   * Stored as JSONB in form_submission_data.data via FormSubmissionData entity.
   *
   * IMPORTANT: The field MUST be declared on the DTO with `@IsObject()`.
   * GlobalValidationPipe uses `whitelist: true` which strips any property
   * not bound to a validator — without this declaration, `data` would be
   * silently dropped and the service would reject the request with:
   *   "Form data must be a JSON object" (400 Bad Request).
   */
  @ApiProperty({
    description:
      'Form data payload (M01/M02/M03 fields). Stored as JSON. ' +
      'Must be a plain JSON object.',
    type: 'object',
    additionalProperties: true,
    example: {
      formCode: 'M03',
      inspectionDate: '2026-01-15',
      inspectionUnit: 'Chi cục Thủy sản Cần Thơ',
      inspectors: ['Ông Trần Văn B'],
      documents: {
        vesselRegistration: true,
        crewList: true,
        technicalSafetyCertificate: true,
      },
      equipment: { navigationEquipment: 'T' },
      fishingOccupations: ['TRAWL'],
      crewCount: 8,
    },
  })
  @IsObject()
  data!: Record<string, unknown>;
}
