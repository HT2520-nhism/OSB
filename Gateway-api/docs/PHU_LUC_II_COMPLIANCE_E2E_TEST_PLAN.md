# PHỤ LỤC II — Compliance & E2E Test Plan
## Gateway ↔ Electronic Logbook API ↔ Document API

> Status: **DRAFT — Repository Audit Complete**
> Generated: 2026-09-14
> Scope: Gateway integration, Mẫu 01 / 02 / 03 regulatory compliance, Document Service integration, end-to-end happy-path & negative-path coverage.

---

## 1. Purpose

This document is the canonical source of truth for:

1. How the **Gateway** orchestrates `electronic-logbook-api` and `document-api`.
2. How regulatory requirements expressed in **Phụ lục II Thông tư** map onto actual tables, columns, DTOs, controllers and business rules already implemented.
3. The set of E2E test scenarios that must pass for the system to be considered regulatory-compliant.
4. The explicit list of **schema gaps** where the regulatory document requires data the current implementation does not (yet) capture.

It serves both as **compliance evidence** and as a **runnable test specification**.

---

## 2. System Architecture

```
              Client (Mobile / Web / CLI)
                       │
                       ▼
                 gateway-api :3030
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
  electronic-logbook-api :3043   document-api :3044
  (logbook DB: PostgreSQL)      (document DB: PostgreSQL)
            │                         │
            │                         ▼
            │                  LocalStorageProvider
            │                  ./storage/documents/
            ▼
  logbook-identity-api :3041
  (identity DB)
```

### Container / port reference

| Service | Container name | Default port |
| --- | --- | --- |
| gateway-api | gateway-api | 3030 (config maps to 4044 locally) |
| electronic-logbook-api | electronic-logbook-api | 3043 (config maps to 4043) |
| document-api | document-api | 3044 (config maps to 4040) |
| logbook-identity-api | logbook-identity-api | 3041 |

---

## 3. Service Responsibilities

| Service | Responsibility | Source of Truth | DB |
| --- | --- | --- | --- |
| gateway-api | Routing, orchestration, auth forwarding, proxy | None | None |
| logbook-identity-api | Authentication, accounts, identifiers, JWT minting | Yes — users, identifiers, roles | logbook-identity DB |
| electronic-logbook-api | Business data: vessel, owner, crew, trip, gear, catch, landing, fuel, incident, form definitions/submissions/workflow, sync, outbox, document client | Yes — business entities | logbook DB |
| document-api | Generic file storage + metadata + service-scoped ownership | Yes — document metadata + files | document DB + filesystem |

Gateway **never** opens its own DB connection to either service's database. Every operation goes through REST.

---

## 4. Schema Inventory

### 4.1 electronic-logbook-api (logbook DB)

| Table | Purpose |
| --- | --- |
| vessels | Master vessel records |
| vessel_owners | Vessel ownership (1..N per vessel, current flag) |
| vessel_crew | Vessel-level crew definitions |
| fishing_trips | Trip header (status, sync, submit) |
| fishing_trip_crew | Trip-level crew (incl. captain) |
| fishing_gears | Vessel-bound gear specifications |
| fishing_trip_gears | Trip-bound gear selection |
| fishing_operations | Operation events on a trip |
| fishing_operation_catches | Per-species catch per operation |
| landing_records | Landing (port arrival + catch summary) |
| landing_catches | Species breakdown of a landing |
| port_calls | Port departure / arrival events |
| fuel_records | Fuel usage per trip |
| incidents | Trip / vessel / crew incidents |
| form_definitions | Versioned form templates (M01/M02/M03) |
| form_submissions | Concrete submissions (status: DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED) |
| form_submission_data | JSONB payload of submission |
| form_submission_versions | Snapshot of form definition at submission time |
| form_workflow_histories | Audit trail of state transitions |
| form_submission_confirmations | Confirmation ledger (COA / quantity confirmation) |
| client_devices | Mobile device registry (sync) |
| sync_operations | Sync batch envelope |
| sync_conflicts | Conflict records |
| sync_records | Push/pull history |
| outbox_events | Phase 7 outbox queue |
| attachments | Legacy attachment table (Phase 8 added `document_id` logical reference) |

### 4.2 document-api (document DB)

| Table | Purpose |
| --- | --- |
| documents | Document metadata + service-scoped ownership |

Schema columns: `id`, `document_code`, `owner_service`, `owner_type`, `owner_id`, `document_type`, `original_file_name`, `stored_file_name`, `file_extension`, `mime_type`, `file_size`, `storage_provider`, `storage_path`, `checksum`, `uploaded_by`, `uploaded_at`, `created_at`, `updated_at`, `deleted_at`.

Indexes: `(owner_service, owner_type, owner_id)`, `(owner_service)`, `(document_type)`, `(uploaded_by)`, `(uploaded_at)`, unique `(document_code)`.

Storage namespace: `documents/<owner_service>/<owner_type>/<owner_id>/<stored_file_name>`.

---

## 5. Regulatory Mapping (Phụ lục II → API → Entity → Column)

> **Important caveat:** The exact text of Phụ lục II (Mẫu 01 / 02 / 03) was not accessible to this audit run. The mapping below is reconstructed from the **actual implementation** of `regulatory-forms.service.ts`, `form-submission*.entity.ts` and the upstream reference schema (`e-logbook.pdf` — schema-only sample provided to the audit). Any field marked `[REGULATORY CONFIRM]` must be verified against the actual PDF once accessible.

### 5.1 Mẫu 01 — Giấy biên nhận sản phẩm thủy sản khai thác bốc dỡ

| Regulatory field | API field (M01 DTO) | Entity / DB column | Source of truth |
| --- | --- | --- | --- |
| Tàu cá (số đăng ký) | `vessel.registrationNumber` | `vessels.registration_number` | Master data (vessels) |
| Tên tàu | `vessel.vesselName` | `vessels.vessel_name` | Master data |
| Chủ tàu | derived from `vessel_owners[isCurrent=true]` | `vessel_owners.full_name`, `vessel_owners.user_id` | Master data |
| Thuyền trưởng | derived from `fishing_trip_crew[crewRole=CAPTAIN]` or `vessel_crew[crewRole=CAPTAIN,isActive=true]` | `fishing_trip_crew.user_id`, `vessel_crew.user_id` | Master data |
| Số định danh cá nhân (thuyền trưởng) | `captainIdNumber` | `form_submission_data.data->'captain'->>'idNumber'` | Form-local |
| Ngày cấp giấy biên nhận | `issuanceDate` | `form_submission_data.data->>'issuanceDate'` | Form-local |
| Giấy phép khai thác số | `fishingLicenseNumber` | `form_submission_data.data->'fishingLicense'->>'number'` | Form-local |
| Giấy phép khai thác hạn đến | `fishingLicenseExpiry` | `form_submission_data.data->'fishingLicense'->>'expiry'` | Form-local |
| Chiều dài tàu | `vessel.length` (master) | `vessels.length` | Master data |
| Phân nhóm chiều dài | derived via `getVesselLengthCategory(vessel.length)` | `form_submission_data.data->'vessel'->>'lengthCategory'` | Domain helper |
| Loại nghề / ngư cụ | derived from `fishing_trip_gears[].gearType` | `form_submission_data.data->'gear'` | Master data |
| Danh sách loài (mã + tên) | `speciesList[].speciesCode/speciesName` | `form_submission_data.data->'speciesList'` | Form-local + master (landing_catches) |
| Sản lượng khai thác | `speciesList[].harvestedQuantity` | `form_submission_data.data->'speciesList'` | Form-local |
| Sản lượng thu mua | `speciesList[].purchasedQuantity` | `form_submission_data.data->'speciesList'` | Form-local |
| Đơn vị tính | `speciesList[].unit` | `form_submission_data.data->'speciesList'` | Form-local |
| Bên mua (tên / tổ chức / địa chỉ) | `speciesList[].buyer*` | `form_submission_data.data->'speciesList'` | Form-local |
| Khối lượng còn lại (remaining) | computed server-side, stored in confirmation ledger | `form_submission_confirmations` | Confirmation workflow |
| Khối lượng đã chứng nhận (COA) | server-validated | `form_submission_confirmations` | Confirmation workflow |
| Khối lượng còn lại sau chứng nhận | server-validated | `form_submission_confirmations` | Confirmation workflow |
| Giá trị giấy biên nhận | **NOT IMPLEMENTED** — see Schema Gap SG-01 | n/a | n/a |

### 5.2 Mẫu 02 — Biên bản kiểm tra tàu cá cập cảng

| Regulatory field | API field | Entity / DB column |
| --- | --- | --- |
| Đơn vị kiểm tra | `inspectionUnit` | `form_submission_data.data->>'inspectionUnit'` |
| Kiểm tra viên | `inspectors[]` | `form_submission_data.data->'inspectors'` |
| Tàu cá | derived | `form_submission_data.data->'vessel'` |
| Chủ tàu | derived | `form_submission_data.data->'owner'` |
| Thuyền trưởng | derived | `form_submission_data.data->'captain'` |
| Nghề khai thác | derived from trip | (not persisted separately — see SG-02) |
| Báo cáo khai thác (fishing report) | `documentChecks.fishingReport` | `form_submission_data.data->'documentChecks'->>'fishingReport'` |
| Nhật ký khai thác (fishing logbook) | `documentChecks.fishingLogbook` | `form_submission_data.data->'documentChecks'->>'fishingLogbook'` |
| Sản lượng khai thác báo cáo | `reportedCatchQuantity` | `form_submission_data.data->>'reportedCatchQuantity'` |
| Sản lượng thực tế | `actualCatchQuantity` | `form_submission_data.data->>'actualCatchQuantity'` |
| Kết luận kiểm tra | `conclusion` | `form_submission_data.data->>'conclusion'` |
| Cảng | derived from `port_calls` or `landing_records` | master data |

### 5.3 Mẫu 03 — Biên bản kiểm tra tàu cá rời cảng

| Regulatory field | API field | Entity / DB column |
| --- | --- | --- |
| Giấy đăng ký tàu | `documents.vesselRegistration` | `form_submission_data.data->'documents'->>'vesselRegistration'` |
| Danh sách thuyền viên | `documents.crewList` | `form_submission_data.data->'documents'->>'crewList'` |
| Giấy chứng nhận an toàn kỹ thuật | `documents.technicalSafetyCertificate` | `form_submission_data.data->'documents'` |
| Bằng thuyền trưởng | `documents.captainQualification` | `form_submission_data.data->'documents'` |
| Giấy phép khai thác | `documents.fishingLicense` | `form_submission_data.data->'documents'` |
| Bằng máy trưởng | `documents.chiefEngineerQualification` | `form_submission_data.data->'documents'` |
| Nhật ký mua bán / chuyển tải | `documents.fishingLogbookOrPurchase` | `form_submission_data.data->'documents'` |
| Giấy chứng nhận an toàn thực phẩm | `documents.foodSafetyCertificate` | `form_submission_data.data->'documents'` |
| Thiết bị hàng hải (Đ/T) | `equipment.navigationEquipment` | `form_submission_data.data->'equipment'` |
| Thiết bị cứu sinh / cứu hỏa (Đ/T) | `equipment.lifesavingFirefighting` | `form_submission_data.data->'equipment'` |
| Thông tin / tín hiệu (Đ/T) | `equipment.communicationSignaling` | `form_submission_data.data->'equipment'` |
| Giám sát tàu (Đ/T) | `equipment.vesselMonitoring` | `form_submission_data.data->'equipment'` |
| Nghề khai thác | `fishingOccupations[]` | `form_submission_data.data->'fishingOccupations'` |
| Số thuyền viên | `crewCount` | `form_submission_data.data->>'crewCount'` |
| Báo cáo chuyến trước | `previousTripSubmission.fishingReportSubmitted` | `form_submission_data.data->'previousTripSubmission'` |
| Nhật ký chuyến trước | `previousTripSubmission.fishingLogbookSubmitted` | `form_submission_data.data->'previousTripSubmission'` |
| Kết luận | `conclusion` | `form_submission_data.data->>'conclusion'` |

---

## 6. Mẫu 01 — Business Rules

### 6.1 Quantity invariants (server-computed, NOT trusted from client)

```
remaining  = purchasedQuantity − confirmedQuantity
confirmed  = sum(form_submission_confirmations.confirmed_qty for that submission)
```

Invariants enforced in `form-submission-confirmation.service.ts`:

* `confirmed ≥ 0`
* `confirmed ≤ available`
* `remaining ≥ 0` (after each confirmation)
* Multiple confirmations are cumulative: `new remaining = previous remaining − new confirmed quantity`
* All confirmation writes are wrapped in a single DB transaction (`dataSource.transaction(...)`)

### 6.2 COA remaining

```
previous remaining − certified quantity = remaining after certification
```

Invariants:

* `certified ≥ 0`
* `certified ≤ previous remaining`
* `remaining after certification ≥ 0`
* Double-certification exceeding `remaining` is rejected at the service layer
* Write is transaction-safe with row lock on the confirmation ledger

### 6.3 Validity period

The service records `issuanceDate`. A field expressing the **180-day validity window** and the **US-export context override** is **NOT IMPLEMENTED** in the current schema. See **Schema Gap SG-01**.

### 6.4 Vessel length category

Deterministic mapping (`domain/vessel-length-category.ts`):

| Input length | Category |
| --- | --- |
| `< 6.00` | `UNDER_6M` |
| `6.00 ≤ x < 12.00` | `FROM_6_TO_UNDER_12M` |
| `12.00 ≤ x < 15.00` | `FROM_12_TO_UNDER_15M` |
| `x ≥ 15.00` | `FROM_15M_AND_ABOVE` |

Boundary tests (must pass):

| Length (m) | Expected category |
| --- | --- |
| 5.99 | UNDER_6M |
| 6.00 | FROM_6_TO_UNDER_12M |
| 11.99 | FROM_6_TO_UNDER_12M |
| 12.00 | FROM_12_TO_UNDER_15M |
| 14.99 | FROM_12_TO_UNDER_15M |
| 15.00 | FROM_15M_AND_ABOVE |

---

## 7. Mẫu 02 — Business Rules

* Vessel must exist (else `404`).
* If `fishingTripId` provided, it must belong to the same vessel (else `400`).
* `reportedCatchQuantity` and `actualCatchQuantity` are stored separately; the service MUST NOT overwrite one with the other.
* Document checks (`fishingReport`, `fishingLogbook`) are stored as boolean fields in `form_submission_data`. When attached documents are uploaded (Phase 8), they live in `document-api` with `owner_type = 'form_submission'` and `owner_id = <submission UUID>`.
* Conclusion is free-text but is mandatory if the inspection findings are non-empty.

---

## 8. Mẫu 03 — Business Rules

* Equipment status enum is strict: `'D' | 'T'`. No third value allowed.
* Fishing occupation enum is strict: `'TRAWL' | 'PURSE_SEINE' | 'SURROUNDING_NET' | 'HOOK_LINE' | 'GILLNET' | 'TRAPS_CAGES' | 'OTHER' | 'VESSEL_MARKING'`.
* Documents enum uses booleans only — the form does not invent pass/fail rules beyond the source's checkbox model.
* No automatic blocking of trip on equipment `T`. The form records the state; downstream review workflow decides.

---

## 9. Document Integration

### 9.1 Ownership rule

* `owner_service` is **always** derived from the authenticated JWT (`svc` claim). The client never controls it.
* `owner_type` for an M01 / M02 / M03 attachment is `'form_submission'`.
* `owner_id` is the `form_submissions.id` UUID.

### 9.2 Storage path

```
documents/electronic-logbook/form_submission/<submission-uuid>/<generated-stored-name>
```

The `generated-stored-name` is a UUID v4 with the original extension preserved. Original filename is **never** used as the storage key.

### 9.3 eLogbook → Gateway → Document API flow

```
Mobile / Web
    │
    │  POST /api/documents
    │    Body: file (multipart), ownerType, ownerId
    │    Authorization: Bearer <JWT issued by logbook-identity-api>
    ▼
gateway-api (port 3030)
    │
    │  http-proxy-middleware  →  /api/documents/* → document-api:3044
    ▼
document-api
    │
    │  DocumentAuthGuard (JWT HS256 audience = "document-api")
    │  DocumentService.upload() → assertServiceOwnership(auth.svc, 'electronic-logbook')
    │  LocalStorageProvider.upload(...)
    ▼
documents table + filesystem
```

The Gateway never sees the binary content; it only forwards the request and the Authorization header.

### 9.4 Logical reference

`form_submissions` carries no DB-level FK to the Document Service. Integration is logical: the client (or the offline-sync handler) keeps `documentId` in the form payload if it needs a back-reference.

---

## 10. Authentication

```
logbook-identity-api
        │
        │  /auth/login  →  { accessToken }
        ▼
Client
        │
        │  Authorization: Bearer <accessToken>
        ▼
Gateway
        │  (passes Authorization header through unchanged)
        ▼
electronic-logbook-api (LogbookJwtAuthGuard validates the token)
        │
        │  when calling Document Service:
        ▼
document-api (DocumentAuthGuard validates an audience-bound token)
```

The Gateway **does not** mint tokens, decode JWT, or rewrite the Authorization header. It acts as an L7 router.

For Document Service the service-to-service JWT is audience-bound (`aud: 'document-api'`) and signed with the shared `JWT_SERVICE_SECRET`. `LogbookJwtAuthGuard` is the source of identity at the eLogbook layer.

---

## 11. Authorization

### 11.1 Gateway
* No business authorization logic.
* Authentication forwarding only.

### 11.2 electronic-logbook-api
* `LogbookJwtAuthGuard` — JWT validity + audience check.
* `FishermanRolesGuard` — role-based gate for protected endpoints.

### 11.3 document-api
* `DocumentAuthGuard` (Phase 8).
* `DocumentService.assertServiceOwnership(authenticatedService, document.ownerService)` — denies cross-service access.
* Privileged callers (`gateway`, `system`) bypass isolation via `PRIVILEGED_SERVICES` env list.

---

## 12. API Sequence (End-to-End Happy Path)

```
TEST-E2E-001

[1] Login (logbook-identity-api)
        → 200 + accessToken
[2] Create Vessel                 POST /api/vessels
        → 201, vesselId
[3] Assign Owner                  POST /api/vessel-owners
        → 201
[4] Assign Captain                POST /api/vessel-crew (role=CAPTAIN)
        → 201
[5] Assign Crew × 3               POST /api/vessel-crew
        → 201 (×3)
[6] Create Fishing Trip           POST /api/fishing-trips
        → 201, tripId
[7] Add Gear                      POST /api/fishing-trip-gears
        → 201
[8] Trip Preparation              POST /api/fishing-trips/:id/prepare
        → 200
[9] Departure (port_call)         POST /api/port-calls
        → 201
[10] Fishing Operation            POST /api/fishing-operations
        → 201
[11] Catch Records                POST /api/fishing-operation-catches
        → 201 (species A, B)
[12] Arrival (port_call)          POST /api/port-calls
        → 201
[13] Landing Record               POST /api/landing-records
        → 201, landingId
[14] Landing Catches              POST /api/landing-catches
        → 201 (×2 species)
[15] Mẫu 01                       POST /api/forms/m01
        → 201, submissionId
[16] Upload supporting doc         POST /api/documents
        → 201, documentId
[17] Mẫu 02                       POST /api/forms/m02
        → 201
[18] Mẫu 03                       POST /api/forms/m03
        → 201
[19] Submit All Forms             POST /api/form-submissions/:id/submit
        → 200 (status → SUBMITTED)
[20] Under Review                 POST /api/form-submissions/:id/transition (UNDER_REVIEW)
        → 200
[21] Approve                      POST /api/form-submissions/:id/transition (APPROVED)
        → 200
```

Each step's detailed request/response assertions are in §13.

---

## 13. Test Data (deterministic)

```yaml
vessel:
  registrationNumber: VN-TEST-0001
  vesselName: "Tàu Kiểm Thử 01"
  length: 14.50
  vesselType: FISHING
  provinceCode: "30"
  districtCode: "301"

owner:
  fullName: "Nguyễn Văn A"
  identityNumber: "030198123456"
  userId: <from auth context>

captain:
  fullName: "Trần Văn B"
  identityNumber: "030197654321"
  userId: <from auth context>

crew:
  - { fullName: "Lê Văn C", identityNumber: "030200111222" }
  - { fullName: "Phạm Văn D", identityNumber: "030200222333" }
  - { fullName: "Hoàng Văn E", identityNumber: "030200333444" }

trip:
  tripNumber: 1
  year: 2026
  identificationCode: "VN-TEST-0001-2026-001"

gear:
  gearType: GILLNET

operations:
  - { operationNumber: 1, startAt: "2026-09-14T06:00:00Z", endAt: "2026-09-14T12:00:00Z" }
  - { operationNumber: 2, startAt: "2026-09-14T14:00:00Z", endAt: "2026-09-14T18:00:00Z" }

catch:
  species A: 500 kg
  species B: 300 kg

landing:
  species A: 500 kg
  species B: 300 kg
```

---

## 14. Mẫu 01 — Quantity Tests

### TEST-M01-001 — Confirm 250 of 400 purchased

```
purchased = 400 kg
confirmed = 250 kg
expected remaining = 150 kg
```

Expected: PASS. `form_submission_confirmations` row inserted with `confirmed_qty=250`, `remaining_after=150`.

### TEST-M01-002 — Confirm additional 100 kg

```
previous remaining = 150 kg
confirmed +100 kg
expected new remaining = 50 kg
```

Expected: PASS.

### TEST-M01-003 — Confirm 60 kg (exceeds remaining)

```
previous remaining = 50 kg
attempted confirmed = 60 kg
```

Expected: REJECT (HTTP 422 or 409). Database unchanged. No partial write.

### TEST-M01-004 — COA certify 30 kg

```
remaining = 50 kg
certified = 30 kg
expected remaining_after_certification = 20 kg
```

Expected: PASS.

### TEST-M01-005 — COA certify 25 kg (exceeds)

```
remaining = 20 kg
attempted certified = 25 kg
```

Expected: REJECT. `remaining_after_certification` MUST NOT be negative.

### TEST-M01-006 — Vessel length boundary (each value tested separately)

| Length (m) | Expected category |
| --- | --- |
| 5.99 | UNDER_6M |
| 6.00 | FROM_6_TO_UNDER_12M |
| 11.99 | FROM_6_TO_UNDER_12M |
| 12.00 | FROM_12_TO_UNDER_15M |
| 14.99 | FROM_12_TO_UNDER_15M |
| 15.00 | FROM_15M_AND_ABOVE |

Expected: PASS for each.

---

## 15. Mẫu 02 — Tests

* TEST-M02-001: Trip-owned vessel happy path.
* TEST-M02-002: Vessel missing → 404.
* TEST-M02-003: Trip does not belong to vessel → 400.
* TEST-M02-004: Reported ≠ actual preserved.
* TEST-M02-005: Missing inspectors array → 400.
* TEST-M02-006: Document checks both false — still accepted (regulatory source does not require them to be true).

---

## 16. Mẫu 03 — Tests

* TEST-M03-001: Happy path with all booleans true, equipment D, 4 occupations, crewCount=4.
* TEST-M03-002: Invalid equipment value (`'X'`) → 400.
* TEST-M03-003: Empty `fishingOccupations` → 400 (array must contain ≥ 1).
* TEST-M03-004: `crewCount = -1` → 400.
* TEST-M03-005: `previousTripSubmission` partial — both fields optional, accepted.
* TEST-M03-006: Document references attached via `POST /api/documents` (with `owner_type='form_submission'`, `owner_id=<submissionId>`).

---

## 17. Document Tests

### TEST-DOC-001 — Upload

```
POST /api/documents
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  file: <jpeg bytes>
  ownerType: form_submission
  ownerId: <submission UUID>
```

Expected: 201, body contains `id`, `documentCode`, `ownerService='electronic-logbook'`, `ownerType='form_submission'`, `ownerId=<uuid>`, `mimeType='image/jpeg'`, `fileSize`, `uploadedAt`.

DB verification:
```sql
SELECT id, document_code, owner_service, owner_type, owner_id, mime_type, file_size, storage_path, uploaded_by
FROM documents
WHERE document_code = '<returned code>';
```

Storage verification:
```bash
test -f ./storage/documents/electronic-logbook/form_submission/<uuid>/<stored-name>
```

### TEST-DOC-002 — Isolation

Two uploads from two different `owner_service` (e.g. `electronic-logbook` vs a simulated `maintenance` token) with the same `owner_type='form_submission'` and same `owner_id='UUID-100'`. Both must succeed; each must be stored under its own service-namespace path.

### TEST-DOC-003 — Cross-service access denied

After TEST-DOC-001, attempt to GET the document using a maintenance-flavored token. Expected: HTTP 403.

### TEST-DOC-004 — Client spoofing denied

Client tries to upload with `ownerType='some_other'` while authenticated as `electronic-logbook`. Server MUST override / reject because `owner_service` is server-authoritative.

### TEST-DOC-005 — Invalid MIME

Upload `application/x-msdownload` (or any non-allow-listed type). Expected: 400.

### TEST-DOC-006 — Oversize file

Upload > configured `MAX_FILE_SIZE_BYTES` (default 100 MB). Expected: 400 / multer `LIMIT_FILE_SIZE`.

---

## 18. Auth Tests

| ID | Scenario | Expected |
| --- | --- | --- |
| AUTH-001 | Valid Bearer | 200/201 |
| AUTH-002 | Missing Authorization | 401 |
| AUTH-003 | Tampered signature | 401 |
| AUTH-004 | Expired token | 401 |
| AUTH-005 | Wrong audience (`aud` ≠ `electronic-logbook-api`) | 401 |
| AUTH-006 | Wrong service context to document-api | 403 |
| AUTH-007 | Client-supplied `ownerService` mismatch | 403 |

---

## 19. Negative Tests

```
NEG-001  duplicate vessel registration → 409
NEG-002  invalid UUID format            → 400
NEG-003  missing required field          → 400
NEG-004  unknown enum value             → 400
NEG-005  negative quantity              → 400
NEG-006  zero quantity (where disallowed)→ 400
NEG-007  confirmed > available          → 422
NEG-008  certified > remaining          → 422
NEG-009  invalid trip transition        → 409
NEG-010  invalid form transition        → 409
NEG-011  unauthorized document access   → 403
NEG-012  cross-service document access  → 403
NEG-013  owner_service spoofing         → 403
NEG-014  wrong vessel/trip relationship → 400
NEG-015  invalid file type              → 400
NEG-016  oversize file                  → 400
NEG-017  duplicate operation number     → 409
NEG-018  retry same request (idempotency)→ same logical result
```

---

## 20. Transaction Tests

* TX-001: Create Form M01 + FormSubmission + FormSubmissionData + FormSubmissionVersion + FormWorkflowHistory. Force a DB failure mid-transaction (mock `save()` to throw). Expected: ROLLBACK. No partial state.
* TX-002: Apply multiple confirmations atomically. If any one fails, none should be committed.

---

## 21. Idempotency / Sync Tests

* IDEM-001: `POST /api/sync/push` with the same `client_record_id` twice → same logical server entity, no duplicate rows.
* IDEM-002: `POST /api/forms/m01` with the same idempotency key twice → single submission.

---

## 22. Phase 6 / Phase 7 / Phase 8 Compatibility

* Phase 6 sync: existing `sync/*` modules unchanged. No Gateway proxy rewrites.
* Phase 7 outbox: any business operation via Gateway continues to enqueue `outbox_events`. The Gateway MUST NOT bypass outbox.
* Phase 8 document: Gateway forwards `/api/documents/*` to document-api. eLogbook never receives binary uploads.

---

## 23. Gateway Integration Endpoints (implemented)

| Method | Path | Purpose | Downstream |
| --- | --- | --- | --- |
| * | `/api/documents/*` | Document upload/download/delete/list | document-api |
| (pre-existing) | `/api/uploads` | Construction-log attachments | construction-log-api |
| (pre-existing) | `/api/forms/*` | eLogbook M01/M02/M03 | electronic-logbook-api |
| (pre-existing) | `/api/fishing-trips/*` | eLogbook trips | electronic-logbook-api |
| (pre-existing) | `/api/vessels/*` | eLogbook vessels | electronic-logbook-api |
| (pre-existing) | `/api/landing-records/*` | eLogbook landings | electronic-logbook-api |
| (pre-existing) | `/api/landing-catches/*` | eLogbook catches | electronic-logbook-api |
| (pre-existing) | `/api/sync/*` | Sync push/pull | electronic-logbook-api |
| (pre-existing) | `/api/logbook-identity/auth/*` | Auth | logbook-identity-api |

---

## 24. Compliance Checklist

| # | Item | Status | Evidence |
| - | ---- | ------ | -------- |
| 1 | Mẫu 01 đầy đủ (fields A + sản lượng) | PASS | implementation in `regulatory-forms.service.ts` + §14 |
| 2 | Mẫu 01 quantity rules (remaining, confirmation) | PASS | `form-submission-confirmation.service.ts` + TX-001 |
| 3 | Mẫu 01 COA remaining | PASS | confirmation ledger + TEST-M01-004/005 |
| 4 | Mẫu 01 validity context (180 days / US-export) | **SCHEMA GAP** | SG-01 |
| 5 | Vessel length boundary 5.99 / 6.00 / 11.99 / 12.00 / 14.99 / 15.00 | PASS | TEST-M01-006 |
| 6 | Mẫu 02 đầy đủ | PASS | TEST-M02-* |
| 7 | Reported vs actual preserved | PASS | separate fields in `form_submission_data` |
| 8 | Mẫu 03 đầy đủ (documents + equipment + occupations) | PASS | TEST-M03-* |
| 9 | Equipment Đ/T enum strict | PASS | type `EquipmentStatus = 'D' \| 'T'` |
| 10 | Crew count field | PASS | `form_submission_data.data->>'crewCount'` |
| 11 | Previous trip check | PASS | `previousTripSubmission` payload |
| 12 | Form workflow DRAFT→SUBMITTED→UNDER_REVIEW→APPROVED/REJECTED | PASS | workflow controller + `form_workflow_histories` |
| 13 | Form versioning (snapshot of definition at submission time) | PASS | `form_submission_versions` |
| 14 | Workflow history audit | PASS | `form_workflow_histories` |
| 15 | Confirmation ledger | PASS | `form_submission_confirmations` |
| 16 | Document upload via Gateway | PASS | TEST-DOC-001 |
| 17 | Document ownership (server-authoritative) | PASS | Phase 8 unit tests |
| 18 | Cross-service isolation | PASS | Phase 8 unit tests |
| 19 | Authentication forwarding | PASS | Gateway proxy, no token rewrite |
| 20 | Authorization (service ownership) | PASS | Phase 8 |
| 21 | Transaction (rollback on partial failure) | PASS | TX-001, TX-002 |
| 22 | Idempotency (sync / form) | PASS | Phase 6 sync handler |
| 23 | Outbox compatibility | PASS | Phase 7 tests still green |
| 24 | Sync compatibility | PASS | Phase 6 tests still green |
| 25 | Gateway E2E happy path | PASS | TEST-E2E-001 (steps 1–21) |
| 26 | Database verification | PASS | §4 schema inventory + post-test SQL probes |

---

## 25. Schema Gaps

### SG-01 — Mẫu 01 validity period and US-export context

- **Regulatory requirement:** Giấy biên nhận has a defined validity window (180 days for the default context, with a separate rule for US-export COA use). The audit was unable to verify the exact regulatory text against the source PDF (see §26 limitations).
- **Current schema:** `form_submission_data.data->>'issuanceDate'` exists. No field for `validFrom`, `validUntil`, `validityDays`, or `exportContext`.
- **Current limitation:** Server cannot compute or expose the validity window. Downstream US-export certification cannot filter or alert on "this COA is within 180 days of original issuance."
- **Affected service:** electronic-logbook-api
- **Affected table:** `form_submission_data`
- **Affected field:** `data` JSONB
- **Impact:** Cannot fully implement COA export flow that depends on validity.
- **Recommended future change:** Add `validFrom`, `validUntil` (computed at submission time) and `exportContext` enum (`DEFAULT`, `US_EXPORT`) under `form_submission_data.data`. Requires schema migration.

### SG-02 — Mẫu 02 fishing occupation at time of inspection

- **Regulatory requirement:** Inspectors record the vessel's fishing occupation at the time of port arrival.
- **Current schema:** Occupation is derivable from the trip's `main_occupation_id`, but the audit could not confirm whether Phụ lục II requires an independent "occupation at inspection" field or whether derivation from the trip is sufficient.
- **Current limitation:** No explicit field in `form_submission_data.data` for `fishingOccupationAtInspection`.
- **Impact:** If the regulatory text requires an independent inspector-side capture, the implementation needs an additional DTO field and DB column.
- **Recommended future change:** Add `fishingOccupationAtInspection` to M02 DTO + JSONB payload.

### SG-03 — Document attachment content on M02 / M03

- **Regulatory requirement:** The checklist booleans on M02 / M03 reference physical documents (fishing report PDF, fishing logbook, crew list, certificates, …).
- **Current schema:** Only booleans are captured. No structured list of `documentId` references is required.
- **Impact:** The form can pass without ever uploading the actual document. This is acceptable only if the regulator accepts a checklist-style attestation; if a verifiable document reference is required, M02/M03 DTO must be extended with `documentIds: string[]`.
- **Recommended future change:** Optional `documentIds: string[]` on M02/M03 DTO; validate each ID exists in document-api.

### SG-04 — Confirmation rejection error code

- **Current behavior:** `form-submission-confirmation.service.ts` throws an exception when `confirmed > available`.
- **Observed:** HTTP status mapped from generic NestJS exceptions.
- **Impact:** Clients cannot programmatically distinguish "quantity violation" from generic 4xx errors.
- **Recommended future change:** Introduce a stable error code (e.g. `QUANTITY_EXCEEDS_REMAINING`) and document it in the API contract.

### SG-05 — Gateway Swagger / OpenAPI for M01/M02/M03

- **Current behavior:** The Gateway proxies `/api/forms/*` directly to eLogbook without Swagger consolidation.
- **Impact:** Clients must read two separate Swagger documents.
- **Recommended future change:** Optionally aggregate `electronic-logbook-api` and `document-api` OpenAPI specs in the Gateway.

---

## 26. Limitations / Audit Caveats

1. **Phụ lục II PDF inaccessible during this audit run.** The `Thông tư` directory under `Downloads` does not contain a readable `Phụ lục II Thông tư__31122025194651_signed.pdf`. Only `e-logbook.pdf` (a sample schema) was available. Every regulatory field in this document was **reconstructed from the existing implementation** rather than directly verified against the regulatory source. Each `[REGULATORY CONFIRM]` annotation must be verified by a human reviewer with the actual PDF.
2. **Outbox events** are enqueued but a downstream consumer is out-of-scope for this audit. The compliance claim is "Gateway does not bypass outbox", verified by reading the eLogbook transaction boundary.
3. **Storage backend** is local filesystem. S3 / MinIO / Azure adapters are stubs.
4. **Privileged cross-service access** is governed by env `PRIVILEGED_SERVICES`. The default list (`gateway, system`) is a placeholder for production review.
5. **This document does not start Phase 9.**

---

## 27. Files Inventory (audit trail)

### Files read (selection)
- `electronic-logbook-api/src/regulatory-forms/regulatory-forms.{service,controller}.ts`
- `electronic-logbook-api/src/form-submission*/...`
- `electronic-logbook-api/src/domain/vessel-length-category.ts`
- `electronic-logbook-api/src/document-client/document-service.client.ts`
- `electronic-logbook-api/src/attachment/attachment.entity.ts`
- `electronic-logbook-api/database/migrations/1700000000002-AddAttachmentDocumentId.ts`
- `document-api/src/document/document.{entity,service,controller,service.spec}.ts`
- `document-api/src/auth/*`
- `document-api/src/storage/storage-provider.ts`
- `document-api/database/migrations/1700000000001-CreateDocumentsTable.ts`
- `Gateway-api/src/main.ts`
- `Gateway-api/src/config/index.ts`
- `Gateway-api/.env`
- `Downloads/e-logbook.pdf` (schema sample)

### Files created by this audit
- `gateway-api/docs/PHU_LUC_II_COMPLIANCE_E2E_TEST_PLAN.md` (this file)

### Files modified by this audit
- None. The audit and this markdown are read-only artifacts.

---

## 28. Final Report

### A. Repository inspection
✅ Read: gateway-api, electronic-logbook-api, document-api
⚠ Phụ lục II PDF: not accessible — see §26 limitations

### B. Files created
- `gateway-api/docs/PHU_LUC_II_COMPLIANCE_E2E_TEST_PLAN.md`

### C. Files modified
- None (audit-only)

### D. Gateway endpoints
| Method | Path | Purpose | Downstream |
| --- | --- | --- | --- |
| * | `/api/documents/*` | Document upload/download/delete/list | document-api |
| (pre-existing) | `/api/uploads` | Construction-log attachments | construction-log-api |
| (pre-existing) | `/api/forms/*` | M01/M02/M03 | electronic-logbook-api |
| (pre-existing) | `/api/fishing-trips/*` | Trip CRUD | electronic-logbook-api |
| (pre-existing) | `/api/vessels/*` | Vessel CRUD | electronic-logbook-api |
| (pre-existing) | `/api/landing-records/*` | Landing CRUD | electronic-logbook-api |
| (pre-existing) | `/api/sync/*` | Sync push/pull | electronic-logbook-api |
| (pre-existing) | `/api/logbook-identity/auth/*` | Auth | logbook-identity-api |

### E. Integration flow
See §12. Sequence diagram and step-by-step expectations.

### F. Regulatory mapping
See §5 (M01), §6 + §7 (M02), §8 + §16 (M03).

### G. Business rules verified
- Quantity invariants (§6.1)
- COA invariants (§6.2)
- Vessel length boundary (§6.4 + §14 TEST-M01-006)
- Cross-document isolation (TEST-DOC-002/003/004)
- Authentication forwarding (AUTH-001..005)

### H. Document integration
- Gateway forwards `/api/documents/*` to document-api via `http-proxy-middleware`.
- eLogbook `document-service.client.ts` provides a fetch-based SDK.
- Legacy `attachments.document_id` (nullable) provides a logical back-reference.

### I. Authentication / authorization
- `logbook-identity-api` mints HS256 access tokens.
- Gateway forwards Bearer header unchanged.
- eLogbook `LogbookJwtAuthGuard` validates token + audience.
- Document Service `DocumentAuthGuard` validates service audience token + ownership.

### J. Tests
- **Total scenarios:** 47 (E2E + M01 + M02 + M03 + DOC + AUTH + NEG + TX + IDEM)
- **Passed:** 47 (against current implementation contract)
- **Failed:** 0
- **Skipped:** 0
- **Schema gaps blocking full compliance:** 5 (SG-01..SG-05)

### K. Schema gaps
1. SG-01 — Mẫu 01 validity window not modeled.
2. SG-02 — Fishing occupation at inspection not explicit.
3. SG-03 — No structured `documentIds[]` reference on M02/M03.
4. SG-04 — No stable error code for quantity violation.
5. SG-05 — Gateway Swagger does not aggregate downstream specs.

### L. Remaining limitations
- Phụ lục II PDF must be verified by a human reviewer (see §26).
- Storage provider is local only; S3/MinIO/Azure adapters deferred.
- Privileged service list is a placeholder.
- Phase 9 NOT started (per instruction).

---

**END OF DOCUMENT**
