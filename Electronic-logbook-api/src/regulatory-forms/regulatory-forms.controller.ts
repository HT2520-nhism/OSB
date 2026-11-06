import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { RegulatoryFormsService } from './regulatory-forms.service';
import { CreateM01Dto, CreateM02Dto, CreateM03Dto, CreateNKKTDto } from './dto';

@ApiBearerAuth('user')
@ApiTags('Regulatory_forms')
@UseGuards(LogbookJwtAuthGuard)
@Controller('forms')
export class RegulatoryFormsController {
  constructor(private readonly service: RegulatoryFormsService) {}

  @Post('m01')
  createM01(@Body() dto: CreateM01Dto, @CurrentUser() user: AuthUser) {
    return this.service.createM01(
      {
        vesselId: dto.vesselId,
        fishingTripId: dto.fishingTripId ?? null,
        issuanceDate: dto.issuanceDate,
        captainName: dto.captainName,
        captainIdNumber: dto.captainIdNumber,
        fishingLicenseNumber: dto.fishingLicenseNumber,
        fishingLicenseExpiry: dto.fishingLicenseExpiry,
        lengthCategoryOverride: dto.lengthCategoryOverride,
        buyerName: dto.buyerName,
        buyerAddress: dto.buyerAddress,
        sectionB: dto.sectionB,
        sectionC: dto.sectionC,
        speciesList: dto.speciesList,
        notes: dto.notes,
      },
      user,
    );
  }

  @Post('m02')
  createM02(@Body() dto: CreateM02Dto, @CurrentUser() user: AuthUser) {
    return this.service.createM02(
      {
        vesselId: dto.vesselId,
        fishingTripId: dto.fishingTripId ?? null,
        inspectionDate: dto.inspectionDate,
        inspectionUnit: dto.inspectionUnit,
        inspectors: dto.inspectors,
        documentChecks: dto.documentChecks,
        reportedCatchQuantity: dto.reportedCatchQuantity,
        actualCatchQuantity: dto.actualCatchQuantity,
        speciesChecks: dto.speciesChecks,
        conclusion: dto.conclusion,
        notes: dto.notes,
      },
      user,
    );
  }

  @Post('m03')
  createM03(@Body() dto: CreateM03Dto, @CurrentUser() user: AuthUser) {
    return this.service.createM03(
      {
        vesselId: dto.vesselId,
        fishingTripId: dto.fishingTripId ?? null,
        inspectionDate: dto.inspectionDate,
        inspectionUnit: dto.inspectionUnit,
        inspectors: dto.inspectors,
        documents: dto.documents,
        equipment: dto.equipment,
        fishingOccupations: dto.fishingOccupations,
        otherOccupation: dto.otherOccupation,
        crewCount: dto.crewCount,
        previousTripSubmission: dto.previousTripSubmission,
        conclusion: dto.conclusion,
        notes: dto.notes,
      },
      user,
    );
  }

  @Post('nkkt')
  createNKKT(@Body() dto: CreateNKKTDto, @CurrentUser() user: AuthUser) {
    return this.service.createNKKT(
      {
        vesselId: dto.vesselId,
        fishingTripId: dto.fishingTripId ?? null,
        tripIdentifier: dto.tripIdentifier,
        mainOccupation: dto.mainOccupation,
        subOccupation1: dto.subOccupation1,
        subOccupation2: dto.subOccupation2,
        gearSpecifications: dto.gearSpecifications,
        endangeredSpecies: dto.endangeredSpecies,
        transshipments: dto.transshipments,
        logbookNumber: dto.logbookNumber,
        notes: dto.notes,
      },
      user,
    );
  }
}
