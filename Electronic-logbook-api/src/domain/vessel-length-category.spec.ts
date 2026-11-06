/**
 * PHASE 5.11 — Vessel Length Category Tests
 */

import {
  getVesselLengthCategory,
  VESSEL_LENGTH_CATEGORIES,
} from './vessel-length-category';

describe('getVesselLengthCategory', () => {
  it('classifies under 6m', () => {
    expect(getVesselLengthCategory(5.99)).toBe(
      VESSEL_LENGTH_CATEGORIES.UNDER_6M,
    );
    expect(getVesselLengthCategory('5.999')).toBe(
      VESSEL_LENGTH_CATEGORIES.UNDER_6M,
    );
  });

  it('classifies 6m to under 12m', () => {
    expect(getVesselLengthCategory(6)).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_6M_TO_UNDER_12M,
    );
    expect(getVesselLengthCategory('11.99')).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_6M_TO_UNDER_12M,
    );
  });

  it('classifies 12m to under 15m', () => {
    expect(getVesselLengthCategory(12)).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_12M_TO_UNDER_15M,
    );
    expect(getVesselLengthCategory('14.999')).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_12M_TO_UNDER_15M,
    );
  });

  it('classifies 15m and above', () => {
    expect(getVesselLengthCategory(15)).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_15M_UP,
    );
    expect(getVesselLengthCategory('100')).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_15M_UP,
    );
    expect(getVesselLengthCategory('9999.99')).toBe(
      VESSEL_LENGTH_CATEGORIES.FROM_15M_UP,
    );
  });

  it('returns null for null/invalid', () => {
    expect(getVesselLengthCategory(null)).toBeNull();
    expect(getVesselLengthCategory(undefined)).toBeNull();
    expect(getVesselLengthCategory('abc')).toBeNull();
  });
});
