/**
 * PHASE 8 — Response DTOs for Client-ready aggregation endpoints.
 *
 * These DTOs are designed for Mobile/Web screens, not for database entities.
 * Follows UI-DATA-CONTRACT.md specifications.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Common ────────────────────────────────────────────────────────────────

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrevious!: boolean;
}

// ─── Vessel DTOs ─────────────────────────────────────────────────────────

export class VesselSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'CT-001' })
  registrationNumber!: string;

  @ApiPropertyOptional({ example: 'Tàu Thắng Lợi' })
  vesselName?: string;

  @ApiPropertyOptional({ example: 'Tàu khai thác thủy sản' })
  vesselType?: string;

  @ApiPropertyOptional({ example: 24.5 })
  length?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  status?: string;
}

export class OwnerSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'uuid-user' })
  userId!: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'OWNER' })
  ownershipType?: string;

  @ApiProperty({ example: true })
  isCurrent!: boolean;
}

export class CrewSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'uuid-user' })
  userId!: string;

  @ApiPropertyOptional({ example: 'Trần Văn B' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'FSH-001' })
  fishermanCode?: string;

  @ApiProperty({ example: 'CAPTAIN' })
  crewRole!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class GearSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: 'Lưới kéo đáy' })
  name?: string;

  @ApiProperty({ example: 'TRAWL' })
  gearType!: string;

  @ApiPropertyOptional({ example: 2 })
  quantity?: number;
}

export class VesselStatisticsDto {
  @ApiProperty({ example: 15 })
  totalTrips!: number;

  @ApiProperty({ example: 12 })
  completedTrips!: number;

  @ApiPropertyOptional({ example: 4500.0 })
  totalCatch?: number;

  @ApiProperty({ example: 8 })
  crewCount!: number;
}

export class VesselDetailDto {
  @ApiProperty({ type: VesselSummaryDto })
  vessel!: VesselSummaryDto;

  @ApiPropertyOptional({ type: OwnerSummaryDto })
  owner?: OwnerSummaryDto;

  @ApiPropertyOptional({ type: CrewSummaryDto })
  captain?: CrewSummaryDto;

  @ApiProperty({ type: [CrewSummaryDto] })
  crew!: CrewSummaryDto[];

  @ApiProperty({ type: [GearSummaryDto] })
  gear!: GearSummaryDto[];

  @ApiProperty({ type: VesselStatisticsDto })
  statistics!: VesselStatisticsDto;
}

// ─── Fishing Trip DTOs ────────────────────────────────────────────────────

export class VesselRefDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'CT-001' })
  registrationNumber!: string;

  @ApiPropertyOptional({ example: 'Tàu Thắng Lợi' })
  vesselName?: string;
}

export class CaptainRefDto {
  @ApiProperty({ example: 'uuid-user' })
  userId!: string;

  @ApiPropertyOptional({ example: 'Trần Văn B' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'FSH-001' })
  fishermanCode?: string;

  @ApiProperty({ example: 'CAPTAIN' })
  crewRole!: string;
}

export class CatchSummaryDto {
  @ApiPropertyOptional({ example: 350.0 })
  totalWeight?: number;

  @ApiProperty({ example: 2 })
  speciesCount!: number;
}

export class TripListItemDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: '1' })
  tripNumber?: string;

  @ApiProperty({ type: VesselRefDto })
  vessel!: VesselRefDto;

  @ApiProperty({ example: 'COMPLETED' })
  status!: string;

  @ApiProperty({ example: 'SUBMITTED' })
  submissionStatus!: string;

  @ApiPropertyOptional()
  departureAt?: string;

  @ApiPropertyOptional()
  arrivalAt?: string;

  @ApiPropertyOptional({ example: '92101' })
  departurePortCode?: string;

  @ApiPropertyOptional({ example: '92101' })
  arrivalPortCode?: string;

  @ApiProperty({ type: CatchSummaryDto })
  catchSummary!: CatchSummaryDto;

  @ApiProperty({ example: 8 })
  crewCount!: number;

  @ApiProperty({ example: 2 })
  operationCount!: number;

  @ApiProperty({ example: 3 })
  documentCount!: number;

  @ApiProperty()
  createdAt!: string;
}

export class FishingOperationDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: 9.52345 })
  latitude?: number;

  @ApiPropertyOptional({ example: 104.12345 })
  longitude?: number;

  @ApiProperty()
  operationStartedAt!: string;

  @ApiProperty()
  operationEndedAt!: string;

  @ApiPropertyOptional({ example: 'TRAWL' })
  operationType?: string;

  @ApiPropertyOptional({ example: 'Lưới kéo đáy' })
  fishingGearType?: string;

  @ApiPropertyOptional({ example: 'Vùng biển Tây Nam' })
  fishingGround?: string;

  @ApiPropertyOptional({ example: 45.0 })
  depth?: number;

  @ApiProperty({ type: () => [CatchRecordDto] })
  catches!: CatchRecordDto[];
}

export class CatchRecordDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: 'TRA' })
  speciesCode?: string;

  @ApiPropertyOptional({ example: 'Cá Tra' })
  speciesName?: string;

  @ApiPropertyOptional({ example: 150.0 })
  quantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  unit?: string;

  @ApiPropertyOptional({ example: 160.0 })
  estimatedQuantity?: number;

  @ApiPropertyOptional({ example: 'FRESH' })
  condition?: string;
}

export class CatchBySpeciesDto {
  @ApiPropertyOptional({ example: 'TRA' })
  speciesCode?: string;

  @ApiPropertyOptional({ example: 'Cá Tra' })
  speciesName?: string;

  @ApiPropertyOptional({ example: 150.0 })
  totalQuantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  unit?: string;
}

export class LandingCatchDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: 'TRA' })
  speciesCode?: string;

  @ApiPropertyOptional({ example: 'Cá Tra' })
  speciesName?: string;

  @ApiPropertyOptional({ example: 150.0 })
  quantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  unit?: string;
}

export class LandingSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: '92101' })
  landingPortCode?: string;

  @ApiProperty()
  landedAt!: string;

  @ApiPropertyOptional({ example: 350.0 })
  totalQuantity?: number;

  @ApiProperty({ type: () => [LandingCatchDto] })
  catches!: LandingCatchDto[];
}

export class PortCallDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: '92101' })
  portCode?: string;

  @ApiProperty({ example: 'DEPARTURE' })
  callType!: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiPropertyOptional({ example: 10.035 })
  latitude?: number;

  @ApiPropertyOptional({ example: 105.787 })
  longitude?: number;

  @ApiPropertyOptional({ example: 'Rời cảng khai thác' })
  reason?: string;
}

export class FuelRecordDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'CONSUMPTION' })
  recordType!: string;

  @ApiPropertyOptional({ example: 800.0 })
  quantity?: number;

  @ApiPropertyOptional({ example: 'lít' })
  unit?: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiPropertyOptional({ example: 'Vùng biển Tây Nam' })
  location?: string;
}

export class IncidentDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: 'EQUIPMENT_FAILURE' })
  incidentType?: string;

  @ApiPropertyOptional({ example: 'MEDIUM' })
  severity?: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiPropertyOptional({ example: 'Máy phát điện không hoạt động' })
  description?: string;

  @ApiPropertyOptional({ example: 'Đã sửa tạm thời' })
  actionTaken?: string;
}

export class FormSubmissionRefDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'APPROVED' })
  status!: string;

  @ApiPropertyOptional()
  submittedAt?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  inspectionDate?: string;

  @ApiPropertyOptional({ example: 'Đạt yêu cầu' })
  conclusion?: string;
}

export class FormsRefDto {
  @ApiPropertyOptional({ type: FormSubmissionRefDto })
  m01?: FormSubmissionRefDto | null;

  @ApiPropertyOptional({ type: FormSubmissionRefDto })
  m02?: FormSubmissionRefDto | null;

  @ApiPropertyOptional({ type: FormSubmissionRefDto })
  m03?: FormSubmissionRefDto | null;
}

export class DocumentSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'DOC-001' })
  documentCode!: string;

  @ApiPropertyOptional({ example: 'image' })
  documentType?: string;

  @ApiPropertyOptional({ example: 'landing-photo.jpg' })
  originalFileName?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  mimeType?: string;

  @ApiPropertyOptional({ example: 123456 })
  fileSize?: number;

  @ApiPropertyOptional()
  uploadedAt?: string;
}

export class TripCrewDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'uuid-user' })
  userId!: string;

  @ApiPropertyOptional({ example: 'Lê Văn C' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'FSH-002' })
  fishermanCode?: string;

  @ApiProperty({ example: 'FISHERMAN' })
  crewRole!: string;

  @ApiPropertyOptional()
  joinedAt?: string;
}

export class TripGearDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: 'Lưới kéo đáy' })
  name?: string;

  @ApiProperty({ example: 'TRAWL' })
  gearType!: string;

  @ApiPropertyOptional({ example: 2 })
  quantity?: number;
}

export class WorkflowActionDto {
  @ApiProperty({ example: 'canDepart' })
  action!: string;

  @ApiProperty({ example: false })
  allowed!: boolean;

  @ApiPropertyOptional({ example: 'Trip must be in PREPARING status' })
  reason?: string;
}

export class WorkflowDto {
  @ApiProperty({ example: 'FISHING' })
  currentStep!: string;

  @ApiProperty({ example: ['DRAFT', 'PREPARING', 'DEPARTED'] })
  completedSteps!: string[];

  @ApiPropertyOptional({ example: 'RETURNING' })
  nextStep?: string;

  @ApiProperty({ example: [] })
  requiredActions!: string[];

  @ApiProperty({ example: false })
  canDepart!: boolean;

  @ApiProperty({ example: false })
  canStartFishing!: boolean;

  @ApiProperty({ example: true })
  canReturn!: boolean;

  @ApiProperty({ example: false })
  canComplete!: boolean;

  @ApiPropertyOptional({ type: [WorkflowActionDto] })
  actions?: WorkflowActionDto[];
}

export class SyncStatusDto {
  @ApiProperty({ example: 'SYNCED' })
  status!: string;

  @ApiPropertyOptional()
  lastSyncedAt?: string;

  @ApiProperty({ example: 0 })
  pendingChanges!: number;
}

export class FishingTripOverviewDto {
  @ApiProperty({ type: VesselSummaryDto })
  vessel!: VesselSummaryDto;

  @ApiPropertyOptional({ type: CaptainRefDto })
  captain?: CaptainRefDto;

  @ApiProperty({ type: [TripCrewDto] })
  crew!: TripCrewDto[];

  @ApiProperty({ type: [TripGearDto] })
  gear!: TripGearDto[];

  @ApiProperty({ type: [FishingOperationDto] })
  operations!: FishingOperationDto[];

  @ApiProperty({ type: CatchSummaryDto })
  catchSummary!: CatchSummaryDto;

  @ApiProperty({ type: [CatchBySpeciesDto] })
  catchBySpecies!: CatchBySpeciesDto[];

  @ApiPropertyOptional({ type: LandingSummaryDto })
  landing?: LandingSummaryDto;

  @ApiProperty({ type: [PortCallDto] })
  portCalls!: PortCallDto[];

  @ApiProperty({ type: [IncidentDto] })
  incidents!: IncidentDto[];

  @ApiProperty({ type: [FuelRecordDto] })
  fuelRecords!: FuelRecordDto[];

  @ApiProperty({ type: FormsRefDto })
  forms!: FormsRefDto;

  @ApiProperty({ type: [DocumentSummaryDto] })
  documents!: DocumentSummaryDto[];

  @ApiProperty({ type: WorkflowDto })
  workflow!: WorkflowDto;

  @ApiPropertyOptional({ type: SyncStatusDto })
  sync?: SyncStatusDto;
}

// ─── Trip Trip Ref ───────────────────────────────────────────────────────

export class TripRefDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: '1' })
  tripNumber?: string;

  @ApiPropertyOptional()
  departureAt?: string;

  @ApiPropertyOptional()
  arrivalAt?: string;
}

// ─── M01 DTOs ───────────────────────────────────────────────────────────

export class M01BuyerDto {
  @ApiPropertyOptional({ example: 'Công ty TNHH Thủy sản Miền Tây' })
  name?: string;

  @ApiPropertyOptional({ example: 'CTY-TS-001' })
  organization?: string;

  @ApiPropertyOptional({ example: '123 Đường 3/2, Ninh Kiều, Cần Thơ' })
  address?: string;
}

export class M01SpeciesDto {
  @ApiPropertyOptional({ example: 'TRA' })
  speciesCode?: string;

  @ApiPropertyOptional({ example: 'Cá Tra (Pangasianodon hypophthalmus)' })
  speciesName?: string;

  @ApiPropertyOptional({ example: 150.0 })
  harvestedQuantity?: number;

  @ApiPropertyOptional({ example: 150.0 })
  purchasedQuantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  unit?: string;

  @ApiProperty({ type: M01BuyerDto })
  buyer!: M01BuyerDto;
}

export class M01TotalsDto {
  @ApiPropertyOptional({ example: 350.0 })
  totalHarvested?: number;

  @ApiPropertyOptional({ example: 350.0 })
  totalPurchased?: number;

  @ApiProperty({ example: 'kg' })
  unit!: string;
}

export class M01ConfirmationDto {
  @ApiPropertyOptional({ example: 'CONFIRMED' })
  status?: string;

  @ApiPropertyOptional({ example: 350.0 })
  confirmedQuantity?: number;

  @ApiPropertyOptional({ example: 'Công ty TNHH Thủy sản Miền Tây' })
  buyerName?: string;

  @ApiPropertyOptional()
  confirmedAt?: string;
}

export class M01OverviewDto {
  @ApiProperty({ type: FormSubmissionRefDto })
  form!: FormSubmissionRefDto;

  @ApiPropertyOptional()
  receipt?: {
    issuanceDate?: string;
    serialNumber?: string;
  };

  @ApiPropertyOptional()
  unloadingLocation?: {
    portCode?: string;
    address?: string;
  };

  @ApiProperty({ type: VesselSummaryDto })
  vessel!: VesselSummaryDto;

  @ApiPropertyOptional()
  owner?: {
    fullName?: string;
    address?: string;
  };

  @ApiPropertyOptional()
  captain?: {
    name?: string;
    idNumber?: string;
    fishermanCode?: string;
  };

  @ApiPropertyOptional()
  fishingLicense?: {
    number?: string;
    expiryDate?: string;
  };

  @ApiProperty({ type: [GearSummaryDto] })
  gear!: GearSummaryDto[];

  @ApiProperty({ type: [M01SpeciesDto] })
  species!: M01SpeciesDto[];

  @ApiProperty({ type: M01TotalsDto })
  totals!: M01TotalsDto;

  @ApiProperty({ type: M01ConfirmationDto })
  confirmation!: M01ConfirmationDto;

  @ApiProperty({ type: TripRefDto })
  trip!: TripRefDto;
}

// ─── M02 DTOs ───────────────────────────────────────────────────────────

export class M02InspectorDto {
  @ApiPropertyOptional({ example: 'Ông Phạm Văn D' })
  name?: string;

  @ApiPropertyOptional({ example: 'Kiểm tra viên' })
  position?: string;
}

export class M02DocumentsDto {
  @ApiProperty({ example: true })
  fishingReport!: boolean;

  @ApiProperty({ example: true })
  fishingLogbook!: boolean;
}

export class M02SpeciesComparisonDto {
  @ApiPropertyOptional({ example: 'TRA' })
  speciesCode?: string;

  @ApiPropertyOptional({ example: 'Cá Tra' })
  speciesName?: string;

  @ApiPropertyOptional({ example: 150.0 })
  reportedQuantity?: number;

  @ApiPropertyOptional({ example: 150.0 })
  actualQuantity?: number;

  @ApiProperty({ example: true })
  matched!: boolean;
}

export class M02CatchComparisonDto {
  @ApiPropertyOptional({ example: 350.0 })
  reportedQuantity?: number;

  @ApiPropertyOptional({ example: 350.0 })
  actualQuantity?: number;

  @ApiProperty({ example: 'kg' })
  unit!: string;

  @ApiProperty({ example: true })
  matched!: boolean;

  @ApiProperty({ type: () => [M02SpeciesComparisonDto] })
  bySpecies!: M02SpeciesComparisonDto[];
}

export class M02OverviewDto {
  @ApiProperty({ type: FormSubmissionRefDto })
  form!: FormSubmissionRefDto;

  @ApiPropertyOptional()
  inspection?: {
    serialNumber?: string;
    inspectionDate?: string;
    inspectionTime?: string;
    inspectionUnit?: string;
    portCode?: string;
    portAddress?: string;
    inspectors?: M02InspectorDto[];
  };

  @ApiProperty({ type: VesselSummaryDto })
  vessel!: VesselSummaryDto;

  @ApiPropertyOptional()
  owner?: {
    fullName?: string;
    address?: string;
  };

  @ApiPropertyOptional()
  captain?: {
    fullName?: string;
    address?: string;
    fishermanCode?: string;
  };

  @ApiPropertyOptional()
  previousTrip?: {
    tripNumber?: string;
    departurePortCode?: string;
    departureAt?: string;
  };

  @ApiProperty({ type: M02DocumentsDto })
  documents!: M02DocumentsDto;

  @ApiProperty({ type: M02CatchComparisonDto })
  catchComparison!: M02CatchComparisonDto;

  @ApiPropertyOptional({ example: 'Khớp lệnh' })
  conclusion?: string;

  @ApiPropertyOptional({ example: 'Sản lượng khai thác khớp với báo cáo' })
  notes?: string;

  @ApiProperty({ type: TripRefDto })
  trip!: TripRefDto;
}

// ─── M03 DTOs ───────────────────────────────────────────────────────────

export class M03InspectorDto {
  @ApiPropertyOptional({ example: 'Ông Trần Văn B' })
  name?: string;

  @ApiPropertyOptional({ example: 'Trưởng đoàn kiểm tra' })
  position?: string;
}

export class M03DocumentsDto {
  @ApiProperty({ example: true })
  vesselRegistration!: boolean;

  @ApiProperty({ example: true })
  crewList!: boolean;

  @ApiProperty({ example: true })
  technicalSafetyCertificate!: boolean;

  @ApiProperty({ example: true })
  captainQualification!: boolean;

  @ApiProperty({ example: true })
  fishingLicense!: boolean;

  @ApiProperty({ example: true })
  chiefEngineerQualification!: boolean;

  @ApiProperty({ example: true })
  fishingLogbookOrPurchase!: boolean;

  @ApiProperty({ example: true })
  foodSafetyCertificate!: boolean;

  @ApiProperty({ example: true })
  allValid!: boolean;
}

export class M03EquipmentDto {
  @ApiPropertyOptional({ example: 'T' })
  navigationEquipment?: string;

  @ApiPropertyOptional({ example: 'T' })
  lifesavingFirefighting?: string;

  @ApiPropertyOptional({ example: 'T' })
  communicationSignaling?: string;

  @ApiPropertyOptional({ example: 'T' })
  vesselMonitoring?: string;

  @ApiProperty({ example: true })
  allPassed!: boolean;
}

export class M03FishingOccupationDto {
  @ApiPropertyOptional({ example: 'TRAWL' })
  code?: string;

  @ApiPropertyOptional({ example: 'Nghề lưới kéo' })
  name?: string;

  @ApiProperty({ example: true })
  checked!: boolean;
}

export class M03PreviousTripDto {
  @ApiPropertyOptional({ example: '0' })
  tripNumber?: string;

  @ApiProperty({ example: true })
  fishingReportSubmitted!: boolean;

  @ApiProperty({ example: true })
  fishingLogbookSubmitted!: boolean;

  @ApiProperty({ example: true })
  allSubmitted!: boolean;
}

export class M03OverviewDto {
  @ApiProperty({ type: FormSubmissionRefDto })
  form!: FormSubmissionRefDto;

  @ApiPropertyOptional()
  inspection?: {
    serialNumber?: string;
    inspectionDate?: string;
    inspectionTime?: string;
    inspectionUnit?: string;
    portCode?: string;
    portAddress?: string;
    inspectors?: M03InspectorDto[];
  };

  @ApiProperty({ type: VesselSummaryDto })
  vessel!: VesselSummaryDto;

  @ApiPropertyOptional()
  owner?: {
    fullName?: string;
    ownershipType?: string;
  };

  @ApiPropertyOptional()
  captain?: {
    fullName?: string;
    fishermanCode?: string;
  };

  @ApiProperty({ type: M03DocumentsDto })
  documents!: M03DocumentsDto;

  @ApiProperty({ type: M03EquipmentDto })
  equipment!: M03EquipmentDto;

  @ApiProperty({ type: () => [M03FishingOccupationDto] })
  fishingOccupations!: M03FishingOccupationDto[];

  @ApiProperty({ example: true })
  vesselMarking!: boolean;

  @ApiProperty({ example: 8 })
  crewCount!: number;

  @ApiProperty({ type: M03PreviousTripDto })
  previousTrip!: M03PreviousTripDto;

  @ApiPropertyOptional({ example: 'Đạt yêu cầu' })
  conclusion?: string;

  @ApiPropertyOptional({ example: 'Tàu đủ điều kiện rời cảng' })
  notes?: string;

  @ApiProperty({ type: TripRefDto })
  trip!: TripRefDto;
}

// ─── Dashboard DTOs ──────────────────────────────────────────────────────

export class DashboardVesselDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'CT-001' })
  registrationNumber!: string;

  @ApiPropertyOptional({ example: 'Tàu Thắng Lợi' })
  vesselName?: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;
}

export class DashboardTripDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiPropertyOptional({ example: '1' })
  tripNumber?: string;

  @ApiProperty({ example: 'FISHING' })
  status!: string;

  @ApiPropertyOptional({ example: 'Tàu Thắng Lợi' })
  vesselName?: string;

  @ApiPropertyOptional()
  departureAt?: string;
}

export class DashboardPendingSyncDto {
  @ApiProperty({ example: 0 })
  count!: number;

  @ApiPropertyOptional()
  oldestPendingAt?: string;
}

export class DashboardDto {
  @ApiProperty({ type: [DashboardVesselDto] })
  vessels!: DashboardVesselDto[];

  @ApiProperty({ example: 0 })
  vesselCount!: number;

  @ApiProperty({ type: [DashboardTripDto] })
  activeTrips!: DashboardTripDto[];

  @ApiProperty({ example: 0 })
  activeTripCount!: number;

  @ApiProperty({ type: DashboardPendingSyncDto })
  pendingSync!: DashboardPendingSyncDto;
}

// ─── Response Wrappers ────────────────────────────────────────────────────

export class VesselListResponseDto {
  @ApiProperty({ type: [VesselSummaryDto] })
  data!: VesselSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class TripListResponseDto {
  @ApiProperty({ type: [TripListItemDto] })
  data!: TripListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
