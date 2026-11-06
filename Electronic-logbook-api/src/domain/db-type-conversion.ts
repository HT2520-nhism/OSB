/**
 * PHASE 8 — Domain utilities for data type conversion.
 *
 * Handles conversion between API numeric types and database decimal/string types.
 * PostgreSQL TypeORM driver returns decimal columns as strings to preserve precision.
 */

/**
 * Convert a numeric value to string for database storage.
 * Handles null, undefined, and various input types.
 *
 * @param value - The numeric value to convert (from DTO)
 * @param scale - Decimal places to preserve (default: 3 for kg quantities)
 * @returns String representation for DB or null
 */
export function numberToDbString(
  value: number | string | null | undefined,
  scale: number = 3,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed.toFixed(scale);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(scale);
  }
  return null;
}

/**
 * Convert vessel measurement fields (length, width, depth) with scale 2.
 */
export function measurementToDbString(
  value: number | string | null | undefined,
): string | null {
  return numberToDbString(value, 2);
}

/**
 * Convert coordinate value (latitude/longitude) with precision 7.
 */
export function coordinateToDbString(
  value: number | string | null | undefined,
): string | null {
  return numberToDbString(value, 7);
}

/**
 * Parse a database decimal string back to number for API response.
 * Returns null if the value cannot be parsed.
 */
export function dbStringToNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Check if a numeric value is valid (finite and non-negative).
 */
export function isValidNonNegativeNumber(
  value: number | string | null | undefined,
): boolean {
  if (value === null || value === undefined) return true;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) && n >= 0;
}
