/**
 * PHASE 8 — Vessel Membership Roles.
 *
 * Defines the role a user has on a specific vessel.
 * This is a TypeScript-level enum — the database stores these as varchar(50)
 * in the `crew_role` column of `vessel_crew` and `fishing_trip_crew` tables.
 * Validation enforces that only these values are accepted.
 *
 * IMPORTANT: These roles are per-vessel. A user can have different roles
 * on different vessels (e.g., captain on Vessel A, crew on Vessel B).
 *
 * Authorization logic:
 *  - captain: full CRUD on vessel resources (trips, operations, etc.)
 *  - crew: read + limited write on own fishing operations
 *  - viewer: read-only access to vessel resources
 */
export enum VesselMembershipRole {
  CAPTAIN = 'captain',
  CREW = 'crew',
  VIEWER = 'viewer',
}

/** Human-readable labels for UI display */
export const VesselMembershipRoleLabels: Record<VesselMembershipRole, string> =
  {
    [VesselMembershipRole.CAPTAIN]: 'Thuyền trưởng',
    [VesselMembershipRole.CREW]: 'Thuyền viên',
    [VesselMembershipRole.VIEWER]: 'Người xem',
  };

/** Actions that require captain role */
export const CAPTAIN_ONLY_ACTIONS = new Set([
  'vessel.update',
  'vessel.delete',
  'trip.create',
  'trip.end',
  'crew.add',
  'crew.remove',
  'gear.add',
  'gear.remove',
  'port_call.create',
  'fuel_record.create',
  'incident.create',
  'form_submission.approve',
]);

/** Actions that require at least crew role */
export const CREW_MINIMUM_ACTIONS = new Set([
  'fishing_operation.create',
  'fishing_operation.update',
  'catch_record.create',
  'landing_record.create',
]);
