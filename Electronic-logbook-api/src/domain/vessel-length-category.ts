/**
 * Vessel length → regulatory category for Mẫu 01.
 *
 * Categories (from Phụ lục II Mẫu 01):
 *   - Dưới 6m       (less than 6m)
 *   - 6m đến dưới 12m  (6m to under 12m)
 *   - 12m đến dưới 15m (12m to under 15m)
 *   - Từ 15m trở lên   (15m and above)
 *
 * Boundary rule (deterministic):
 *   length < 6           → 'Dưới 6m'
 *   6 <= length < 12     → '6m đến dưới 12m'
 *   12 <= length < 15    → '12m đến dưới 15m'
 *   length >= 15         → 'Từ 15m trở lên'
 */

import { VesselLengthCategory } from '../constants/types/vessel-length-category.type';

export const VESSEL_LENGTH_CATEGORIES = {
  UNDER_6M: 'Dưới 6m' as const,
  FROM_6M_TO_UNDER_12M: '6m đến dưới 12m' as const,
  FROM_12M_TO_UNDER_15M: '12m đến dưới 15m' as const,
  FROM_15M_UP: 'Từ 15m trở lên' as const,
};

export const VESSEL_LENGTH_CATEGORY_BOUNDARIES: ReadonlyArray<{
  upperBound: number;
  category: VesselLengthCategory;
}> = [
  { upperBound: 6, category: VESSEL_LENGTH_CATEGORIES.UNDER_6M },
  { upperBound: 12, category: VESSEL_LENGTH_CATEGORIES.FROM_6M_TO_UNDER_12M },
  { upperBound: 15, category: VESSEL_LENGTH_CATEGORIES.FROM_12M_TO_UNDER_15M },
  {
    upperBound: Number.POSITIVE_INFINITY,
    category: VESSEL_LENGTH_CATEGORIES.FROM_15M_UP,
  },
];

/**
 * Convert a raw vessel length (stored as decimal string in DB) to the
 * regulatory vessel length category.
 *
 * Returns null if length is null/undefined/NaN so callers can decide
 * whether that should be an error.
 */
export function getVesselLengthCategory(
  rawLength: string | number | null | undefined,
): VesselLengthCategory | null {
  if (rawLength === null || rawLength === undefined) return null;

  const length = typeof rawLength === 'string' ? Number(rawLength) : rawLength;
  if (!Number.isFinite(length)) return null;

  for (const { upperBound, category } of VESSEL_LENGTH_CATEGORY_BOUNDARIES) {
    if (length < upperBound) return category;
  }
  return VESSEL_LENGTH_CATEGORIES.FROM_15M_UP;
}
