export type FormCode = 'M01' | 'M02' | 'M03' | 'NKKT';
export type FormStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface M01RemainingBalanceItem {
  speciesName: string;
  purchasedQuantity: number | string;
  confirmedQuantity: number | string;
  remainingQuantity: number | string;
}

export interface M01SectionBData {
  portAuthorityName: string;
  confirmationNumber: string;
  confirmationDate: string;
  remainingBalanceList: M01RemainingBalanceItem[];
}

export interface M01CoaRemainingItem {
  speciesName: string;
  previousRemainingQuantity: number | string;
  certifiedQuantity: number | string;
  remainingAfterCertification: number | string;
}

export interface M01SectionCData {
  authorityName: string;
  coaNumber: string;
  coaDate: string;
  coaRemainingList: M01CoaRemainingItem[];
}

export interface M02SpeciesCheckItem {
  speciesName: string;
  reportedQuantity: number | string;
  actualQuantity: number | string;
  diffPercent?: number;
}

export interface FormSubmissionSummary {
  id: string;
  formCode: FormCode;
  formTitle: string;
  status: FormStatus;
  vesselId: string;
  vesselRegistration: string;
  vesselName: string;
  captainName: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  tripId?: string;
  data: Record<string, any>;
}

export interface VesselSummary {
  id: string;
  registrationNumber: string;
  vesselName: string;
  vesselType: string;
  length: number;
  enginePowerKw: number;
  licenseNumber?: string;
  licenseExpiry?: string;
  ownerName: string;
  ownerPhone?: string;
  province: string;
  status: 'ACTIVE' | 'AT_SEA' | 'IN_PORT' | 'MAINTENANCE';
}

export interface FishingTripSummary {
  id: string;
  tripIdentifier: string;
  vesselRegistration: string;
  captainName: string;
  departurePort: string;
  departureTime: string;
  arrivalPort?: string;
  arrivalTime?: string;
  status: 'DEPARTING' | 'AT_SEA' | 'ARRIVED' | 'COMPLETED';
  operationsCount: number;
  totalCatchWeightKg: number;
}

export interface DashboardStats {
  activeVesselsAtSea: number;
  tripsThisMonth: number;
  pendingFormsCount: number;
  totalCatchWeightThisMonth: number;
  formsBreakdown: {
    m03Count: number;
    nkktCount: number;
    m02Count: number;
    m01Count: number;
  };
}

export interface AuthUser {
  id: string;
  identifier: string;
  fullName: string;
  systemRole: 'super_admin' | 'admin' | 'operator' | 'user';
  accountType: string;
}

export type UserRole = 'super_admin' | 'admin' | 'operator' | 'user';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING' | 'SUSPENDED';
export type AccountCategory = 'STAFF' | 'FISHERMAN' | 'CAPTAIN' | 'OWNER';

export interface UserAccount {
  id: string;
  fullName: string;
  identifier: string;
  identifierType: 'EMAIL' | 'PHONE';
  systemRole: UserRole;
  accountType: AccountCategory;
  status: UserStatus;
  organization?: string;
  vesselRegistration?: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface CreateUserInput {
  fullName: string;
  identifierType: 'EMAIL' | 'PHONE';
  identifier: string;
  password?: string;
  accountType: AccountCategory;
  systemRole: UserRole;
  organization?: string;
  vesselRegistration?: string;
}
