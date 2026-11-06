# MOBILE-WEB-TESTING-MATRIX.md

> **Mục đích:** Test case cho workflow Mobile + Web
> **Prerequisites:** 
> - Seed migration `1789614734352-SeedRegulatoryFormDefinitions.ts` đã chạy
> - Test user đã được tạo qua `/logbook/auth/register`
> - Token đã được lấy qua `/logbook/auth/login`

---

## Authentication Tests

### TEST 01 — Đăng ký tài khoản Fisherman
```
Action: POST /api/logbook/auth/register
Payload:
{
  "fullName": "Nguyễn Văn Test",
  "identifierType": "EMAIL",
  "identifier": "fisherman.test@example.com",
  "dateOfBirth": "1985-03-15",
  "gender": "Male",
  "nationality": "Vietnamese",
  "identityDocumentNumber": "025123456789",
  "provinceCode": "92",
  "districtCode": "921",
  "wardCode": "92101"
}
Expected: 201 Created
Expected Body: {
  "account": { "status": "PENDING", "accountType": "FISHERMAN" },
  "identifier": { "type": "EMAIL", "value": "...", "isPrimary": true },
  "profile": { "fullName": "...", "profileStatus": "INCOMPLETE" }
}
```

### TEST 02 — Đăng nhập
```
Action: POST /api/logbook/auth/login
Payload:
{
  "identifierType": "EMAIL",
  "identifier": "fisherman.test@example.com",
  "password": "TestPassword@123"
}
Expected: 200 OK
Expected Body: {
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": { "id": "uuid", "accountType": "FISHERMAN" }
}
```

### TEST 03 — Refresh Token
```
Action: POST /api/logbook/auth/refresh
Payload: { "refreshToken": "<previous_refresh_token>" }
Expected: 200 OK
Expected Body: { "accessToken": "...", "refreshToken": "..." }
```

---

## Vessel Tests

### TEST 10 — Tạo tàu cá
```
Action: POST /api/electronic-logbook/vessels
Payload:
{
  "registrationNumber": "CT-TEST-001",
  "vesselName": "Tàu Test Thắng Lợi",
  "vesselType": "Tàu khai thác thủy sản",
  "length": 24.50,
  "width": 6.80,
  "depth": 3.20,
  "grossTonnage": 120.00,
  "enginePower": 450.00,
  "provinceCode": "92",
  "districtCode": "921",
  "wardCode": "92101"
}
Expected: 201 Created
Expected Body: {
  "id": "uuid",
  "registrationNumber": "CT-TEST-001",
  "status": "ACTIVE",
  ...
}
```

### TEST 11 — Liệt kê tàu cá
```
Action: GET /api/electronic-logbook/vessels?page=1&limit=10
Expected: 200 OK
Expected Body: {
  "data": [ /* vessels */ ],
  "meta": { "page": 1, "limit": 10, "total": N, "totalPages": M, "hasNext": true/false }
}
Mobile Check: Có thể render list với pagination
```

### TEST 12 — Xem chi tiết tàu cá
```
Action: GET /api/electronic-logbook/vessels/{vesselId}
Expected: 200 OK
Expected Body: Full vessel object với tất cả fields
Mobile Check: Hiển thị đầy đủ thông tin tàu
```

### TEST 13 — Cập nhật tàu cá
```
Action: PATCH /api/electronic-logbook/vessels/{vesselId}
Payload: { "vesselName": "Tàu Test Updated" }
Expected: 200 OK
```

---

## Fishing Trip Tests

### TEST 20 — Tạo chuyến biển (DRAFT)
```
Action: POST /api/electronic-logbook/fishing-trips
Payload:
{
  "vesselId": "<vesselId from TEST 10>",
  "tripNumber": "1",
  "departurePortCode": "92101",
  "arrivalPortCode": "92101"
}
Expected: 201 Created
Expected Body: {
  "id": "uuid",
  "vesselId": "...",
  "status": "DRAFT",
  "submissionStatus": "NOT_SUBMITTED"
}
```

### TEST 21 — Chuẩn bị chuyến biển (DRAFT → PREPARING)
```
Action: POST /api/electronic-logbook/fishing-trips/{tripId}/prepare
Expected: 200 OK
Expected Body: { "status": "PREPARING" }
```

### TEST 22 — Thêm thiết bị khai thác vào chuyến biển
```
Action: POST /api/electronic-logbook/fishing-trip-gears
Payload:
{
  "fishingTripId": "<tripId>",
  "fishingGearId": "<gearId>",
  "gearType": "TRAWL",
  "quantity": "2"
}
Expected: 201 Created
```

### TEST 23 — Thêm thuyền viên vào chuyến biển
```
Action: POST /api/electronic-logbook/fishing-trip-crews
Payload:
{
  "fishingTripId": "<tripId>",
  "userId": "<userId>",
  "crewRole": "CAPTAIN",
  "joinedAt": "2025-01-15T06:00:00Z"
}
Expected: 201 Created
```

### TEST 24 — Nộp M03 (TRƯỚC KHI KHỞI HÀNH)
```
Prerequisite: FormDefinition seed đã chạy
Action: POST /api/electronic-logbook/forms/m03
Payload:
{
  "vesselId": "<vesselId>",
  "fishingTripId": "<tripId>",
  "inspectionDate": "2025-01-15",
  "inspectionUnit": "Chi cục Thủy sản Cần Thơ",
  "inspectors": ["Ông Trần Văn B"],
  "documents": {
    "vesselRegistration": true,
    "crewList": true,
    "technicalSafetyCertificate": true,
    "captainQualification": true,
    "fishingLicense": true,
    "chiefEngineerQualification": true,
    "fishingLogbookOrPurchase": true,
    "foodSafetyCertificate": true
  },
  "equipment": {
    "navigationEquipment": "T",
    "lifesavingFirefighting": "T",
    "communicationSignaling": "T",
    "vesselMonitoring": "T"
  },
  "fishingOccupations": ["TRAWL"],
  "crewCount": 8,
  "previousTripSubmission": {
    "fishingReportSubmitted": true,
    "fishingLogbookSubmitted": true
  },
  "conclusion": "Đạt yêu cầu"
}
Expected: 201 Created
Expected Body: FormSubmission object với status = "DRAFT"
```

### TEST 25 — Ghi nhận cảng rời
```
Action: POST /api/electronic-logbook/port-calls
Payload:
{
  "fishingTripId": "<tripId>",
  "portCode": "92101",
  "callType": "DEPARTURE",
  "occurredAt": "2025-01-15T07:30:00Z",
  "latitude": "10.03500",
  "longitude": "105.78700"
}
Expected: 201 Created
```

### TEST 26 — Rời cảng (PREPARING → DEPARTED)
```
Action: POST /api/electronic-logbook/fishing-trips/{tripId}/depart
Expected: 200 OK
Expected Body: { "status": "DEPARTED" }
```

### TEST 27 — Bắt đầu khai thác (DEPARTED → FISHING)
```
Action: POST /api/electronic-logbook/fishing-trips/{tripId}/start-fishing
Expected: 200 OK
Expected Body: { "status": "FISHING" }
```

---

## Fishing Operation Tests

### TEST 30 — Ghi nhận lần khai thác
```
Action: POST /api/electronic-logbook/fishing-operations
Payload:
{
  "fishingTripId": "<tripId>",
  "latitude": "9.52345",
  "longitude": "104.12345",
  "operationStartedAt": "2025-01-15T08:00:00Z",
  "operationEndedAt": "2025-01-15T14:00:00Z",
  "operationType": "TRAWL",
  "fishingGearType": "Lưới kéo đáy",
  "fishingGround": "Vùng biển Tây Nam",
  "depth": "45.0"
}
Expected: 201 Created
Expected Body: FishingOperation object với id, latitude, longitude, times
Mobile Check: Có thể hiển thị operation trên map
```

### TEST 31 — Ghi nhận sản lượng
```
Action: POST /api/electronic-logbook/catch-records
Payload:
{
  "fishingOperationId": "<operationId>",
  "speciesCode": "TRA",
  "speciesName": "Cá Tra",
  "quantity": "150.000",
  "unit": "kg",
  "estimatedQuantity": "160.000",
  "condition": "FRESH"
}
Expected: 201 Created
Expected Body: CatchRecord object
Mobile Check: Hiển thị tổng sản lượng theo loài
```

### TEST 32 — Xem chi tiết Fishing Operation
```
Action: GET /api/electronic-logbook/fishing-operations/{operationId}
Expected: 200 OK
Expected Body: Full FishingOperation với catches
Mobile Check: Hiển thị operation timeline với catch details
```

### TEST 33 — Bắt đầu hành trình về (FISHING → RETURNING)
```
Action: POST /api/electronic-logbook/fishing-trips/{tripId}/start-returning
Expected: 200 OK
Expected Body: { "status": "RETURNING" }
```

---

## Landing & Return Tests

### TEST 40 — Ghi nhận cập cảng
```
Action: POST /api/electronic-logbook/port-calls
Payload:
{
  "fishingTripId": "<tripId>",
  "portCode": "92101",
  "callType": "ARRIVAL",
  "occurredAt": "2025-01-16T06:00:00Z",
  "latitude": "10.03500",
  "longitude": "105.78700"
}
Expected: 201 Created
```

### TEST 41 — Tạo bản ghi hạ nhu cầu (Landing Record)
```
Action: POST /api/electronic-logbook/landing-records
Payload:
{
  "fishingTripId": "<tripId>",
  "landingPortCode": "92101",
  "landedAt": "2025-01-16T07:00:00Z",
  "totalQuantity": "350.000",
  "notes": "Tổng sản lượng 2 lần khai thác"
}
Expected: 201 Created
```

### TEST 42 — Ghi nhận chi tiết bốc dỡ theo loài
```
Action: POST /api/electronic-logbook/landing-catches
Payload:
{
  "landingRecordId": "<landingId>",
  "speciesCode": "TRA",
  "speciesName": "Cá Tra",
  "quantity": "150.000",
  "unit": "kg"
}
Expected: 201 Created
```

### TEST 43 — Hoàn thành chuyến biển (RETURNING → COMPLETED)
```
Action: POST /api/electronic-logbook/fishing-trips/{tripId}/complete
Expected: 200 OK
Expected Body: { "status": "COMPLETED" }
```

---

## M01/M02/M03 Tests

### TEST 50 — Nộp M02 (SAU KHI CẬP CẢNG)
```
Prerequisite: FormDefinition seed đã chạy
Action: POST /api/electronic-logbook/forms/m02
Payload:
{
  "vesselId": "<vesselId>",
  "fishingTripId": "<tripId>",
  "inspectionDate": "2025-01-16",
  "inspectionUnit": "Chi cục Thủy sản Cần Thơ",
  "inspectors": ["Ông Phạm Văn D"],
  "documentChecks": {
    "fishingReport": true,
    "fishingLogbook": true
  },
  "reportedCatchQuantity": "350.000",
  "actualCatchQuantity": "350.000",
  "conclusion": "Khớp lệnh"
}
Expected: 201 Created
Mobile Check: Hiển thị checklist đầy đủ theo M02
```

### TEST 51 — Nộp M01 (CÙNG LÚC/Sau khi bốc dỡ)
```
Prerequisite: FormDefinition seed đã chạy
Action: POST /api/electronic-logbook/forms/m01
Payload:
{
  "vesselId": "<vesselId>",
  "fishingTripId": "<tripId>",
  "issuanceDate": "2025-01-16",
  "captainName": "Nguyễn Văn A",
  "captainIdNumber": "025123456789",
  "fishingLicenseNumber": "GP-2025-CT-001",
  "fishingLicenseExpiry": "2026-01-01",
  "speciesList": [
    {
      "speciesCode": "TRA",
      "speciesName": "Cá Tra",
      "harvestedQuantity": "150.000",
      "purchasedQuantity": "150.000",
      "unit": "kg",
      "buyerName": "Công ty TNHH Thủy sản Miền Tây",
      "buyerOrganization": "CTY-TS-001",
      "buyerAddress": "123 Đường 3/2, Ninh Kiều, Cần Thơ"
    }
  ]
}
Expected: 201 Created
Mobile Check: Hiển thị đầy đủ theo M01 Phụ lục II
```

---

## Document Tests

### TEST 60 — Upload tài liệu
```
Action: POST /api/documents
Content-Type: multipart/form-data
Fields:
  file: <test-file.jpg>
  ownerType: fishing_trip
  ownerId: <tripId>
  documentType: image
Expected: 201 Created
Expected Body: {
  "id": "uuid",
  "documentCode": "DOC-XXXX",
  "documentType": "image",
  "originalFileName": "test-file.jpg",
  "mimeType": "image/jpeg",
  "fileSize": "12345"
}
Mobile Check: Có thể upload ảnh/video offline được
```

### TEST 61 — Xem danh sách tài liệu
```
Action: GET /api/documents?ownerType=fishing_trip&ownerId=<tripId>&page=1&limit=10
Expected: 200 OK
Expected Body: { "data": [...], "meta": {...} }
Mobile Check: Hiển thị thumbnails, có thể download
```

### TEST 62 — Xem chi tiết tài liệu
```
Action: GET /api/documents/{documentId}
Expected: 200 OK
Expected Body: Full Document object
Mobile Check: Hiển thị preview
```

### TEST 63 — Download tài liệu
```
Action: GET /api/documents/{documentId}/download
Expected: 200 OK (file stream)
Mobile Check: Có thể mở file trong viewer
```

---

## Offline Sync Tests

### TEST 70 — Push dữ liệu offline
```
Action: POST /api/electronic-logbook/sync/push
Payload:
{
  "deviceId": "device-uuid-001",
  "operations": [
    {
      "operationId": "op-001",
      "entityType": "FISHING_OPERATION",
      "entityId": "uuid-new-operation",
      "operationType": "CREATE",
      "clientVersion": 1,
      "payload": {
        "fishingTripId": "<tripId>",
        "latitude": "9.52345",
        "longitude": "104.12345",
        "operationType": "TRAWL"
      }
    }
  ]
}
Expected: 200 OK
Expected Body: Sync result
Mobile Check: Có thể queue operations khi offline
```

### TEST 71 — Pull dữ liệu
```
Action: GET /api/electronic-logbook/sync/pull?cursor=&limit=100
Expected: 200 OK
Expected Body: { "data": [...], "cursor": "next-cursor-or-null" }
Mobile Check: Có thể sync khi reconnect
```

### TEST 72 — Xem Sync Conflicts
```
Action: GET /api/electronic-logbook/sync/conflicts?deviceId=<deviceId>&page=1&limit=10
Expected: 200 OK
Expected Body: { "data": [...], "meta": {...} }
Mobile Check: Có thể hiển thị conflicts để resolve
```

---

## Error Handling Tests

### TEST 80 — 401 Unauthorized
```
Action: GET /api/electronic-logbook/vessels (without token)
Expected: 401 Unauthorized
```

### TEST 83 — 403 Forbidden
```
Action: GET /api/electronic-logbook/vessels/{otherUserVesselId} (vessel not owned)
Expected: 403 Forbidden or 404 Not Found
```

### TEST 84 — 404 Not Found
```
Action: GET /api/electronic-logbook/vessels/non-existent-uuid
Expected: 404 Not Found
```

### TEST 85 — Validation Error
```
Action: POST /api/electronic-logbook/vessels
Payload: { "registrationNumber": "" }  // empty
Expected: 400 Bad Request
Expected Body: { "message": "Validation failed", "errors": [...] }
Mobile Check: Hiển thị validation messages rõ ràng
```

---

## Workflow E2E Tests

### TEST 90 — Full Fishing Trip Workflow
```
1. TEST 10: Tạo tàu ✅
2. TEST 20: Tạo chuyến biển → DRAFT ✅
3. TEST 21: Chuẩn bị → PREPARING ✅
4. TEST 24: Nộp M03 ✅
5. TEST 25: Ghi nhận cảng rời ✅
6. TEST 26: Rời cảng → DEPARTED ✅
7. TEST 27: Bắt đầu khai thác → FISHING ✅
8. TEST 30: Ghi nhận operation ✅
9. TEST 31: Ghi nhận catch ✅
10. TEST 33: Bắt đầu về → RETURNING ✅
11. TEST 40: Ghi nhận cập cảng ✅
12. TEST 41: Tạo landing record ✅
13. TEST 42: Ghi nhận landing catch ✅
14. TEST 43: Hoàn thành → COMPLETED ✅
15. TEST 50: Nộp M02 ✅
16. TEST 51: Nộp M01 ✅
17. TEST 60: Upload document ✅

Expected: Tất cả steps thành công
```

---

## Notes

1. **FormDefinition Seed:** Nếu TEST 24, 50, 51 fail với "FormDefinition not found", chạy migration:
   ```bash
   cd electronic-logbook-api
   npm run migration:run
   ```

2. **Token Refresh:** Mỗi test nên refresh token nếu hết hạn (expiresIn: 900 seconds = 15 phút)

3. **Pagination:** Tất cả list endpoints nên verify pagination metadata

4. **Mobile-Specific:**
   - Verify payload size không quá lớn
   - Verify offline queue hoạt động
   - Verify sync khi reconnect
