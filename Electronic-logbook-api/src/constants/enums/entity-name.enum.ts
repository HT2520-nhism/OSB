/**
 * Bảng liệt kê tên entity (table name) trong electronic-logbook-api.
 *
 * Dùng thay cho string literal trong @Entity(EntityName.XXX) để:
 * - tránh typo
 * - dễ refactor khi đổi tên bảng
 * - nhất quán giữa các entity
 */
export enum EntityName {
  VESSELS = 'vessels',
  VESSEL_OWNERS = 'vessel_owners',
  VESSEL_CREW = 'vessel_crew',

  FISHING_TRIPS = 'fishing_trips',
  FISHING_TRIP_CREW = 'fishing_trip_crew',
  FISHING_GEARS = 'fishing_gears',
  FISHING_TRIP_GEARS = 'fishing_trip_gears',
  FISHING_OPERATIONS = 'fishing_operations',
  CATCH_RECORDS = 'catch_records',

  LANDING_RECORDS = 'landing_records',
  LANDING_CATCHES = 'landing_catches',
  PORT_CALLS = 'port_calls',
  FUEL_RECORDS = 'fuel_records',

  INCIDENTS = 'incidents',

  FORM_DEFINITIONS = 'form_definitions',
  FORM_SUBMISSIONS = 'form_submissions',
  FORM_SUBMISSION_DATA = 'form_submission_data',
  FORM_SUBMISSION_VERSIONS = 'form_submission_versions',
  FORM_WORKFLOW_HISTORIES = 'form_workflow_histories',
  FORM_SUBMISSION_CONFIRMATIONS = 'form_submission_confirmations',
  ATTACHMENTS = 'attachments',

  CLIENT_DEVICES = 'client_devices',
  SYNC_OPERATIONS = 'sync_operations',
  SYNC_CONFLICTS = 'sync_conflicts',
  OUTBOX_EVENTS = 'outbox_events',

  /** PHASE 8 Extension — Fishing Operation Profile */
  FISHING_OPERATION_PROFILES = 'fishing_operation_profiles',
}
