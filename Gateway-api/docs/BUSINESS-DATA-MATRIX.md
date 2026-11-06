# BUSINESS-DATA-MATRIX.md

> **Mục đích:** Phân loại tất cả fields theo domain, service, và mục đích sử dụng
> **Source of Truth:** TESTING-GUIDE.md, domain entities

---

## Field Classification

| Field | Domain | Entity | Source Service | Required | Mobile Display | Web Display | Searchable | Sensitive | Editable | Offline | M01/M02/M03 |
|-------|--------|--------|---------------|----------|---------------|------------|------------|-----------|----------|----------|-------------|
| **VESSEL FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | Vessel | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| registrationNumber | Electronic Logbook | Vessel | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ M02, M03 |
| vesselName | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M02, M03 |
| vesselType | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| length | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ M01 (derived category) |
| width | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| depth | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| grossTonnage | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| enginePower | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| status | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| provinceCode | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M02 |
| districtCode | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| wardCode | Electronic Logbook | Vessel | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| **FISHING TRIP FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | FishingTrip | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| vesselId | Electronic Logbook | FishingTrip | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| tripNumber | Electronic Logbook | FishingTrip | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| departurePortCode | Electronic Logbook | FishingTrip | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| arrivalPortCode | Electronic Logbook | FishingTrip | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| departureAt | Electronic Logbook | FishingTrip | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| arrivalAt | Electronic Logbook | FishingTrip | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| status | Electronic Logbook | FishingTrip | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| submissionStatus | Electronic Logbook | FishingTrip | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| **FISHING OPERATION FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | FishingOperation | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| fishingTripId | Electronic Logbook | FishingOperation | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| latitude | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| longitude | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| operationStartedAt | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| operationEndedAt | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| operationType | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M03 |
| fishingGearType | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| fishingGround | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| depth | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| notes | Electronic Logbook | FishingOperation | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| **CATCH FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | CatchRecord | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| fishingOperationId | Electronic Logbook | CatchRecord | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| speciesCode | Electronic Logbook | CatchRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M01 |
| speciesName | Electronic Logbook | CatchRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M01 |
| quantity | Electronic Logbook | CatchRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ M01 |
| unit | Electronic Logbook | CatchRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ M01 |
| estimatedQuantity | Electronic Logbook | CatchRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| condition | Electronic Logbook | CatchRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| **LANDING FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | LandingRecord | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| fishingTripId | Electronic Logbook | LandingRecord | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| landingPortCode | Electronic Logbook | LandingRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M01 |
| landedAt | Electronic Logbook | LandingRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ M01 |
| totalQuantity | Electronic Logbook | LandingRecord | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ M01, M02 |
| **CREW FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | VesselCrew | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| vesselId | Electronic Logbook | VesselCrew | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| userId | Identity | Account | logbook-identity-api | ✅ | ⚠️ UUID only | ⚠️ UUID only | ✅ | ❌ | ❌ | ✅ | ✅ M03 |
| crewRole | Electronic Logbook | VesselCrew | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M03 |
| startedAt | Electronic Logbook | VesselCrew | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| isActive | Electronic Logbook | VesselCrew | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| **ACCOUNT/USER FIELDS** | | | | | | | | | | | |
| id | Identity | Account | logbook-identity-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| accountType | Identity | Account | logbook-identity-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| status | Identity | Account | logbook-identity-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| fullName | Identity | FishermanProfile | logbook-identity-api | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ M03 |
| dateOfBirth | Identity | FishermanProfile | logbook-identity-api | ❌ | ⚠️ Sensitive | ⚠️ Sensitive | ❌ | ✅ | ✅ | ✅ | - |
| gender | Identity | FishermanProfile | logbook-identity-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| identityDocumentNumber (CCCD) | Identity | FishermanProfile | logbook-identity-api | ❌ | ❌ DO NOT DISPLAY | ❌ DO NOT DISPLAY | ❌ | ✅ SENSITIVE | ❌ | ✅ | ⚠️ Internal only |
| **FORM SUBMISSION FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | FormSubmission | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| formDefinitionId | Electronic Logbook | FormSubmission | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| status | Electronic Logbook | FormSubmission | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ M01, M02, M03 |
| version | Electronic Logbook | FormSubmission | electronic-logbook-api | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | - |
| submittedAt | Electronic Logbook | FormSubmission | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ M01, M02, M03 |
| **DOCUMENT FIELDS** | | | | | | | | | | | |
| id | Document | Document | document-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| documentCode | Document | Document | document-api | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| documentType | Document | Document | document-api | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| originalFileName | Document | Document | document-api | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | - |
| fileExtension | Document | Document | document-api | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | - |
| mimeType | Document | Document | document-api | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | - |
| fileSize | Document | Document | document-api | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | - |
| uploadedAt | Document | Document | document-api | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | - |
| storagePath | Document | Document | document-api | ❌ | ❌ NEVER EXPOSE | ❌ NEVER EXPOSE | ❌ | ❌ | ❌ | ❌ | - |
| **INCIDENT FIELDS** | | | | | | | | | | | |
| id | Electronic Logbook | Incident | electronic-logbook-api | ✅ | ✅ (hidden) | ✅ | ✅ | ❌ | ❌ | ✅ | - |
| incidentType | Electronic Logbook | Incident | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| severity | Electronic Logbook | Incident | electronic-logbook-api | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | - |
| latitude | Electronic Logbook | Incident | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| longitude | Electronic Logbook | Incident | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| description | Electronic Logbook | Incident | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |
| actionTaken | Electronic Logbook | Incident | electronic-logbook-api | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | - |

---

## M01/M02/M03 Field Mapping

### M01 — Giấy biên nhận sản phẩm thủy sản bốc dỡ

| Phụ lục II Field | API Field | Source | Status |
|-------------------|-----------|--------|--------|
| Số biên nhận | (auto-generated) | FormSubmission | ✅ |
| Ngày lập | issuanceDate | Client input | ✅ |
| Địa điểm bốc dỡ | landingPortCode | LandingRecord | ✅ |
| Tên tàu | vessel.vesselName | Vessel entity | ✅ |
| Số đăng kiểm | vessel.registrationNumber | Vessel entity | ✅ |
| Chiều dài | vessel.length, lengthCategory | Vessel entity | ✅ |
| Chủ tàu | owner | VesselOwner | ⚠️ UUID only |
| Thuyền trưởng | captain.name | Client input or resolved | ✅ |
| Số CCCD Thuyền trưởng | captain.idNumber | Client input | ✅ (sensitive) |
| Số GPKT | fishingLicense.number | Client input | ✅ |
| Ngày hết hạn GPKT | fishingLicense.expiry | Client input | ✅ |
| Ngày bốc dỡ | landedAt | LandingRecord | ✅ |
| Nghề khai thác | gear.gearType | FishingTripGear | ✅ |
| Ngư cụ | gear.gearType, gear.quantity | FishingTripGear | ✅ |
| Loài thủy sản | speciesCode, speciesName | CatchRecord/LandingCatch | ✅ |
| Sản lượng khai thác | harvestedQuantity | Client/LandingCatch | ✅ |
| Sản lượng mua | purchasedQuantity | Client input | ✅ |
| Đơn vị | unit | CatchRecord | ✅ |
| Người mua | buyerName | Client input | ✅ |
| Đơn vị mua | buyerOrganization | Client input | ✅ |
| Địa chỉ mua | buyerAddress | Client input | ✅ |

### M02 — Biên bản kiểm tra tàu cá cập cảng

| Phụ lục II Field | API Field | Source | Status |
|-------------------|-----------|--------|--------|
| Số biên bản | (auto-generated) | FormSubmission | ✅ |
| Ngày kiểm tra | inspectionDate | Client input | ✅ |
| Đơn vị kiểm tra | inspectionUnit | Client input | ✅ |
| Người kiểm tra | inspectors[] | Client input | ✅ |
| Cảng cá | (derived from context) | PortCall | ✅ |
| Tên tàu | vessel.vesselName | Vessel entity | ✅ |
| Số đăng kiểm | vessel.registrationNumber | Vessel entity | ✅ |
| Chủ tàu | owner | VesselOwner | ⚠️ UUID only |
| Thuyền trưởng | captain | VesselCrew/resolved | ⚠️ UUID only |
| Báo cáo khai thác | documentChecks.fishingReport | Client input | ✅ |
| Nhật ký khai thác | documentChecks.fishingLogbook | Client input | ✅ |
| Sản lượng khai thác | reportedCatchQuantity | Client input | ✅ |
| Sản lượng thực tế | actualCatchQuantity | Client input | ✅ |
| Kết luận | conclusion | Client input | ✅ |
| Chữ ký | (out of scope) | - | - |

### M03 — Biên bản kiểm tra tàu cá rời cảng

| Phụ lục II Field | API Field | Source | Status |
|-------------------|-----------|--------|--------|
| Số biên bản | (auto-generated) | FormSubmission | ✅ |
| Ngày kiểm tra | inspectionDate | Client input | ✅ |
| Đơn vị kiểm tra | inspectionUnit | Client input | ✅ |
| Người kiểm tra | inspectors[] | Client input | ✅ |
| Cảng cá | (derived from context) | FishingTrip | ✅ |
| Tên tàu | vessel.vesselName | Vessel entity | ✅ |
| Số đăng kiểm | vessel.registrationNumber | Vessel entity | ✅ |
| Chủ tàu | (not in current form) | - | ❌ MISSING |
| Thuyền trưởng | (not in current form) | - | ❌ MISSING |
| Đăng kiểm tàu | documents.vesselRegistration | Client input | ✅ |
| Danh sách thuyền viên | documents.crewList | Client input | ✅ |
| An toàn kỹ thuật | documents.technicalSafetyCertificate | Client input | ✅ |
| Chức danh thuyền trưởng | documents.captainQualification | Client input | ✅ |
| Giấy phép khai thác | documents.fishingLicense | Client input | ✅ |
| Chức danh máy trưởng | documents.chiefEngineerQualification | Client input | ✅ |
| Nhật ký/Purchase log | documents.fishingLogbookOrPurchase | Client input | ✅ |
| ATVSTP | documents.foodSafetyCertificate | Client input | ✅ |
| Thiết bị hàng hải | equipment.navigationEquipment | Client input | ✅ |
| PCCC & CN | equipment.lifesavingFirefighting | Client input | ✅ |
| VTĐ & TT | equipment.communicationSignaling | Client input | ✅ |
| GSHT | equipment.vesselMonitoring | Client input | ✅ |
| Nghề khai thác | fishingOccupations[] | Client input | ✅ |
| Số thuyền viên | crewCount | Client input | ✅ |
| Ghi chú đánh dấu tàu | fishingOccupations.VESSEL_MARKING | Client input | ✅ |
| Báo cáo chuyến trước | previousTripSubmission | Client input | ✅ |
| Kết luận | conclusion | Client input | ✅ |
| Chữ ký | (out of scope) | - | - |

---

## Known Gaps

### 1. Owner/Captain Name Display (M02, M03)
- **Issue:** Owner và Captain chỉ trả về userId (UUID)
- **Impact:** Mobile không hiển thị được tên chủ tàu/thuyền trưởng
- **Solution Options:**
  - A) Thêm enrichment từ identity service trong response
  - B) Tạo dedicated endpoint cho owner/captain name lookup
  - C) Frontend tự gọi identity API khi cần

### 2. Remaining Quantity (M01 Part B/C)
- **Issue:** Phụ lục II yêu cầu phần "Khối lượng còn lại" và "Chứng khối lượng còn lại"
- **Impact:** Không có trong current domain
- **Solution:** Ghi nhận là MISSING DOMAIN DATA - cần bổ sung ở phase tiếp theo

### 3. Port Address Resolution
- **Issue:** API trả về portCode nhưng Mobile cần tên/tỉnh/thành
- **Impact:** Cần lookup table cho mã cảng
- **Solution:** Cân nhắc thêm port lookup service hoặc static data

---

## Sensitive Data Handling

| Data | Display | Search | Storage | Notes |
|------|---------|--------|---------|-------|
| CCCD/Identity Number | ❌ NEVER | ❌ NEVER | ✅ Encrypted | Backend only |
| Password | ❌ NEVER | ❌ NEVER | ❌ NEVER | Handled by auth |
| Refresh Token | ❌ NEVER | ❌ NEVER | ❌ NEVER | HTTP-only cookie |
| Storage Path | ❌ NEVER | ❌ NEVER | ✅ Internal | Document service only |
| Date of Birth | ⚠️ Optional | ❌ NEVER | ✅ | Privacy sensitive |

---

## Notes

1. **CCCD Constraint:** Không được dùng CCCD làm search key hoặc display field. Identity document chỉ lưu trữ ở backend.

2. **UUID vs Display ID:** Tất cả entities dùng UUID làm primary key. Tuy nhiên, một số resource có business identifier (ví dụ: registrationNumber, documentCode).

3. **Port Code:** Cần tra cứu tên cảng từ danh mục. Hiện tại chưa có endpoint lookup.
