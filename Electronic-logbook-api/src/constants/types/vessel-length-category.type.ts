/**
 * Type alias for the regulatory vessel length category
 * used by Mẫu 01.
 */

export const VESSEL_LENGTH_CATEGORY_VALUES = [
  'Dưới 6m',
  '6m đến dưới 12m',
  '12m đến dưới 15m',
  'Từ 15m trở lên',
] as const;

export type VesselLengthCategory =
  | 'Dưới 6m'
  | '6m đến dưới 12m'
  | '12m đến dưới 15m'
  | 'Từ 15m trở lên';
