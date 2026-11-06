# Hướng Dẫn Test Toàn Bộ API — Electronic Logbook (Theo Thông Tư 31/2025/TT-BNNPTNT)

> **Nền tảng:** Gateway-api (`http://localhost:4044`) — tất cả endpoint đều prefix `/api`
> **Auth:** Token từ `logboook-identity-api` — dùng Bearer scheme **`logbook-user`** trong Swagger
> **Phạm vi:** Luồng nghiệp vụ thực tế từ khi tạo tài khoản thuyền viên → tạo chuyến biển → khai thác → cập cảng → nộp biểu mẫu quy định

---

## Mục Lục

1. [Quản lý Account (Tài khoản)](#1-quản-lý-account-tài-khoản)
2. [Quản lý Fisherman Profile (Hồ sơ Thuyền viên)](#2-quản-lý-fisherman-profile-hồ-sơ-thuyền-viên)
3. [Quản lý Identifier (Email/Phone)](#3-quản-lý-identifier-emailphone)
4. [Quản lý Tàu cá (Vessel)](#4-quản-lý-tàu-cá-vessel)
5. [Quản lý Thiết bị khai thác (Fishing Gear)](#5-quản-lý-thiết-bị-khai-thác-fishing-gear)
6. [Quản lý Thuyền viên (Crew)](#6-quản-lý-thuyền-viên-crew)
7. [Quản lý Thiết bị đồng bộ (Device)](#7-quản-lý-thiết-bị-đồng-bộ-device)
8. [Chuyến biển — Tạo & Chuẩn bị](#8-chuyến-biển--tạo--chuẩn-bị)
9. [Chuyến biển — Khai thác](#9-chuyến-biển--khai-thác)
10. [Chuyến biển — Cập cảng & Bốc dỡ](#10-chuyến-biển--cập-cảng--bốc-dỡ)
11. [Sự cố (Incident)](#11-sự-cố-incident)
12. [Nhiên liệu (Fuel Record)](#12-nhiên-liệu-fuel-record)
13. [Biểu mẫu Quy định M01 / M02 / M03](#13-biểu-mẫu-quy-định-m01--m02--m03)
14. [Form Submission Workflow](#14-form-submission-workflow)
15. [Đồng bộ Offline (Sync)](#15-đồng-bộ-offline-sync)
16. [Tài liệu đính kèm (Document)](#16-tài-liệu-đính-kèm-document)
17. [Form Definition (CRUD quản lý biểu mẫu)](#17-form-definition-crud-quản-lý-biểu-mẫu)

---

## 0. Chuẩn bị — Lấy Token

### 0.1 Đăng ký tài khoản thuyền viên

> **Quan trọng:** Hệ thống dùng **Identifier-based registration** — không cần password khi đăng ký. Mật khẩu sẽ được **tự động tạo và gửi qua email**. Trường `identifierType` bắt buộc: `EMAIL` hoặc `PHONE`.

```http
POST http://localhost:4044/api/logbook/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "identifierType": "EMAIL",
  "identifier": "thuyenvien001@example.com",
  "dateOfBirth": "1985-03-15",
  "gender": "Male",
  "nationality": "Vietnamese",
  "identityDocumentNumber": "025123456789",
  "provinceCode": "92",
  "districtCode": "921",
  "wardCode": "92101"
}
```

**Response mong đợi:** `201 Created`
```json
{
  "account": {
    "id": "uuid-của-tài-khoản",
    "status": "PENDING",
    "accountType": "FISHERMAN"
  },
  "identifier": {
    "type": "EMAIL",
    "value": "thuyenvien001@example.com",
    "isPrimary": true,
    "isVerified": false
  },
  "profile": {
    "fullName": "Nguyễn Văn A",
    "profileStatus": "INCOMPLETE"
  }
}
```

> ⚠️ **Lưu ý:** Sau khi đăng ký, kiểm tra email để lấy **mật khẩu tạm thời** (auto-generated, gửi kèm email đăng ký). Nếu chưa nhận được email, dùng chức năng **Forgot Password** để reset.

### 0.2 Quên mật khẩu — Nhận OTP

> Nếu chưa có mật khẩu hoặc quên mật khẩu, yêu cầu OTP qua email.

```http
POST http://localhost:4044/api/logbook/auth/forgot-password
Content-Type: application/json

{
  "identifierType": "EMAIL",
  "identifier": "thuyenvien001@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Verification code sent to your email",
  "expiresIn": 5
}
```

### 0.3 Đặt lại mật khẩu bằng OTP

> Nhập OTP từ email + mật khẩu mới.

```http
POST http://localhost:4044/api/logbook/auth/reset-password
Content-Type: application/json

{
  "identifierType": "EMAIL",
  "identifier": "thuyenvien001@example.com",
  "otp": "123456",
  "newPassword": "Matkhau@123"
}
```

### 0.4 Đăng nhập

> **Quan trọng:** Payload bắt buộc phải có `identifierType`. Không dùng trường `accountId`.

```http
POST http://localhost:4044/api/logbook/auth/login
Content-Type: application/json

{
  "identifierType": "EMAIL",
  "identifier": "thuyenvien001@example.com",
  "password": "Matkhau@123"
}
```

**Response mong đợi:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "uuid-của-tài-khoản",
    "accountType": "FISHERMAN"
  }
}
```

### 0.5 Làm mới token (Refresh)

```http
POST http://localhost:4044/api/logbook/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK` — trả về `accessToken` + `refreshToken` mới

### 0.6 Dùng token cho các request sau

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Quan trọng:** Dán token vào Swagger UI → chọn **`logbook-user`** (không phải `user`)

### 0.7 Đăng xuất

```http
POST http://localhost:4044/api/logbook/auth/logout
Authorization: Bearer <token>
```

**Response:** `204 No Content` — session bị revoke

---

## 1. Quản lý Account (Tài khoản)

> **Lưu ý:** Thường không cần tạo account thủ công — account được tự động tạo khi đăng ký (xem section 0). Các endpoint này dùng để quản lý account sau khi đã có.

### 1.1 Tạo account

```http
POST http://localhost:4044/api/logbook/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "accountType": "FISHERMAN"
}
```

### 1.2 Xem thông tin tài khoản

```http
GET http://localhost:4044/api/logbook/accounts/{accountId}
Authorization: Bearer <token>
```

### 1.3 Cập nhật tài khoản

```http
PATCH http://localhost:4044/api/logbook/accounts/{accountId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ACTIVE",
  "accountType": "FISHERMAN"
}
```

### 1.4 Xem thông tin notification

```http
GET http://localhost:4044/api/logbook/accounts/{accountId}/notification-info
Authorization: Bearer <token>
```

---

## 2. Quản lý Fisherman Profile (Hồ sơ Thuyền viên)

> **Lưu ý:** Hồ sơ thuyền viên (**Fisherman Profile**) được **tự động tạo** trong quá trình đăng ký tài khoản. Không cần tạo riêng. Endpoint `POST /logbook/fisherman-profiles/:accountId/profile` dùng để **cập nhật** hồ sơ đầy đủ sau khi đã có account.

### 2.1 Tạo hồ sơ thuyền viên (thường không cần — auto-created)

```http
POST http://localhost:4044/api/logbook/fisherman-profiles/{accountId}/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-01-15",
  "gender": "Male",
  "nationality": "Vietnamese",
  "placeOfBirth": "Cần Thơ, Việt Nam",
  "identityDocumentType": "CCCD",
  "identityDocumentNumber": "025123456789",
  "identityDocumentIssuedDate": "2020-01-15",
  "identityDocumentIssuedPlace": "Công an tỉnh Cần Thơ",
  "identityDocumentExpiryDate": "2030-01-15",
  "addressLine": "123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, TP Cần Thơ",
  "provinceCode": "92",
  "districtCode": "921",
  "wardCode": "92101",
  "emergencyContactName": "Trần Thị B",
  "emergencyContactPhone": "0909123456"
}
```

### 2.2 Xem hồ sơ thuyền viên

```http
GET http://localhost:4044/api/logbook/fisherman-profiles/{accountId}/profile
Authorization: Bearer <token>
```

### 2.3 Cập nhật hồ sơ thuyền viên

```http
PATCH http://localhost:4044/api/logbook/fisherman-profiles/{accountId}/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A Updated",
  "addressLine": "456 Đường 30/4, Phường An Nghiệp, Quận Ninh Kiều, TP Cần Thơ",
  "provinceCode": "92",
  "districtCode": "921",
  "wardCode": "92103",
  "emergencyContactName": "Trần Thị C",
  "emergencyContactPhone": "0909987654"
}
```

---

## 3. Quản lý Identifier (Email/Phone)

> Mỗi tài khoản có thể có nhiều identifier (email, phone). Identifier chính được tạo lúc đăng ký.

### 3.1 Thêm identifier mới (email/phone)

```http
POST http://localhost:4044/api/logbook/account-identifiers/{accountId}/identifiers
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "PHONE",
  "value": "0909123456",
  "isPrimary": false
}
```

### 3.2 Xem danh sách identifiers

```http
GET http://localhost:4044/api/logbook/account-identifiers/{accountId}/identifiers
Authorization: Bearer <token>
```

### 3.3 Cập nhật identifier (đặt làm chính)

```http
PATCH http://localhost:4044/api/logbook/account-identifiers/{accountId}/identifiers/{identifierId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPrimary": true
}
```

---

## 4. Quản lý Tàu cá (Vessel)

### 4.1 Tạo tàu cá

```http
POST http://localhost:4044/api/electronic-logbook/vessels
Authorization: Bearer <token>
Content-Type: application/json

{
  "registrationNumber": "CT-12345",
  "vesselName": "Tàu Thắng Lợi 01",
  "vesselType": "Tàu khai thác thủy sản",
  "length": "24.50",
  "width": "6.80",
  "depth": "3.20",
  "grossTonnage": "120.00",
  "enginePower": "450.00",
  "provinceCode": "92",
  "districtCode": "921",
  "wardCode": "92101"
}
```

### 2.2 Cập nhật tàu cá

```http
PATCH http://localhost:4044/api/electronic-logbook/vessels/{vesselId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselName": "Tàu Thắng Lợi 01 (Updated)",
  "vesselType": "Tàu khai thác thủy sản"
}
```

### 2.3 Xem chi tiết tàu cá

```http
GET http://localhost:4044/api/electronic-logbook/vessels/{vesselId}
Authorization: Bearer <token>
```

### 2.4 Liệt kê tàu cá

```http
GET http://localhost:4044/api/electronic-logbook/vessels?search=CT-12345&page=1&limit=10
Authorization: Bearer <token>
```

### 2.5 Xóa tàu cá

```http
DELETE http://localhost:4044/api/electronic-logbook/vessels/{vesselId}
Authorization: Bearer <token>
```

### 2.6 Gán chủ tàu

```http
POST http://localhost:4044/api/electronic-logbook/vessel-owners
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "userId": "uuid-tài-khoản-thuyền-viên",
  "ownershipType": "OWNER",
  "startedAt": "2025-01-01",
  "isCurrent": true
}
```

### 2.7 Cập nhật chủ tàu

```http
PATCH http://localhost:4044/api/electronic-logbook/vessel-owners/{ownerId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "ownershipType": "CO_OWNER",
  "isCurrent": false
}
```

### 2.8 Liệt kê chủ tàu

```http
GET http://localhost:4044/api/electronic-logbook/vessel-owners?vesselId=uuid-tàu&page=1&limit=10
Authorization: Bearer <token>
```

---

## 5. Quản lý Thiết bị khai thác (Fishing Gear)

### 3.1 Tạo thiết bị khai thác

```http
POST http://localhost:4044/api/electronic-logbook/fishing-gears
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "name": "Lưới kéo đáy",
  "gearType": "TRAWL",
  "description": "Lưới kéo đáy, chiều dài lưới 600m"
}
```

### 3.2 Cập nhật thiết bị khai thác

```http
PATCH http://localhost:4044/api/electronic-logbook/fishing-gears/{gearId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Lưới kéo đáy (cập nhật)",
  "gearType": "TRAWL"
}
```

### 3.3 Liệt kê thiết bị khai thác

```http
GET http://localhost:4044/api/electronic-logbook/fishing-gears?vesselId=uuid-tàu&page=1&limit=10
Authorization: Bearer <token>
```

---

## 6. Quản lý Thuyền viên (Crew)

### 4.1 Thêm thuyền viên vào tàu

```http
POST http://localhost:4044/api/electronic-logbook/vessel-crews
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "userId": "uuid-tài-khoản-thuyền-viên",
  "crewRole": "CAPTAIN",
  "startedAt": "2025-01-01",
  "isActive": true
}
```

### 4.2 Cập nhật thuyền viên trên tàu

```http
PATCH http://localhost:4044/api/electronic-logbook/vessel-crews/{crewId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "crewRole": "FISHERMAN",
  "isActive": true
}
```

### 4.3 Liệt kê thuyền viên trên tàu

```http
GET http://localhost:4044/api/electronic-logbook/vessel-crews?vesselId=uuid-tàu&page=1&limit=10
Authorization: Bearer <token>
```

---

## 7. Quản lý Thiết bị đồng bộ (Device)

### 5.1 Đăng ký thiết bị

```http
POST http://localhost:4044/api/electronic-logbook/sync/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

### 5.2 Cập nhật thiết bị

```http
PATCH http://localhost:4044/api/electronic-logbook/sync/devices/{deviceId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "ios",
  "appVersion": "1.1.0"
}
```

### 5.3 Liệt kê thiết bị

```http
GET http://localhost:4044/api/electronic-logbook/sync/devices?platform=android&page=1&limit=10
Authorization: Bearer <token>
```

---

## 8. Chuyến biển — Tạo & Chuẩn bị

### 6.1 Tạo chuyến biển (DRAFT)

> **Lưu ý:** `tripNumber` là string, không phải integer. `departurePortCode` và `arrivalPortCode` là optional.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "tripNumber": "1",
  "departurePortCode": "92101",
  "arrivalPortCode": "92101",
  "departureAt": "2025-01-15T06:00:00Z",
  "arrivalAt": "2025-01-16T07:00:00Z"
}
```

**Response mong đợi:** `201 Created`
```json
{
  "id": "uuid-chuyến-biển",
  "vesselId": "uuid-của-tàu",
  "status": "DRAFT",
  "submissionStatus": "NOT_SUBMITTED"
}
```

### 6.2 Cập nhật chuyến biển

```http
PATCH http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "tripNumber": "1",
  "departurePortCode": "92102",
  "arrivalPortCode": "92102"
}
```

### 6.3 Xem chi tiết chuyến biển

```http
GET http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}
Authorization: Bearer <token>
```

### 6.4 Thêm thiết bị khai thác vào chuyến biển

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trip-gears
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "fishingGearId": "uuid-gear-đã-tạo-ở-mục-3",
  "gearType": "TRAWL",
  "quantity": "2"
}
```

### 6.5 Cập nhật thiết bị khai thác trên chuyến biển

```http
PATCH http://localhost:4044/api/electronic-logbook/fishing-trip-gears/{gearId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": "3"
}
```

### 6.6 Liệt kê thiết bị khai thác của chuyến biển

```http
GET http://localhost:4044/api/electronic-logbook/fishing-trip-gears?fishingTripId=uuid-chuyến-biển&page=1&limit=10
Authorization: Bearer <token>
```

### 6.7 Xóa thiết bị khai thác khỏi chuyến biển

```http
DELETE http://localhost:4044/api/electronic-logbook/fishing-trip-gears/{gearId}
Authorization: Bearer <token>
```

### 6.8 Thêm thuyền viên vào chuyến biển

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trip-crews
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "userId": "uuid-tài-khoản-thuyền-viên",
  "crewRole": "CAPTAIN",
  "joinedAt": "2025-01-15T06:00:00Z"
}
```

### 6.9 Cập nhật thuyền viên trên chuyến biển

```http
PATCH http://localhost:4044/api/electronic-logbook/fishing-trip-crews/{crewId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "crewRole": "FISHERMAN",
  "leftAt": "2025-01-16T08:00:00Z"
}
```

### 6.10 Liệt kê thuyền viên trên chuyến biển

```http
GET http://localhost:4044/api/electronic-logbook/fishing-trip-crews?fishingTripId=uuid-chuyến-biển&page=1&limit=10
Authorization: Bearer <token>
```

### 6.11 Xóa thuyền viên khỏi chuyến biển

```http
DELETE http://localhost:4044/api/electronic-logbook/fishing-trip-crews/{crewId}
Authorization: Bearer <token>
```

### 6.12 Nộp M03 — Kiểm tra trước khi rời cảng (TRƯỚC KHI KHỞI HÀNH)

```http
POST http://localhost:4044/api/electronic-logbook/forms/m03
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "fishingTripId": "uuid-chuyến-biển",
  "inspectionDate": "2025-01-15",
  "inspectionUnit": "Chi cục Thủy sản Cần Thơ",
  "inspectors": ["Ông Trần Văn B", "Bà Lê Thị C"],
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
  "fishingOccupations": ["TRAWL", "PURSE_SEINE"],
  "crewCount": 8,
  "previousTripSubmission": {
    "fishingReportSubmitted": true,
    "fishingLogbookSubmitted": true
  },
  "conclusion": "Đạt yêu cầu",
  "notes": "Tàu đủ điều kiện rời cảng"
}
```

**Response mong đợi:** `201 Created`

### 6.13 Ghi nhận cảng rời (Port Call — Departure)

```http
POST http://localhost:4044/api/electronic-logbook/port-calls
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "portCode": "92101",
  "callType": "DEPARTURE",
  "occurredAt": "2025-01-15T07:30:00Z",
  "latitude": "10.03500",
  "longitude": "105.78700",
  "reason": "Rời cảng khai thác"
}
```

### 6.14 Cập nhật Port Call

```http
PATCH http://localhost:4044/api/electronic-logbook/port-calls/{portCallId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Rời cảng khai thác (cập nhật)"
}
```

### 6.15 Liệt kê Port Calls

```http
GET http://localhost:4044/api/electronic-logbook/port-calls?fishingTripId=uuid-chuyến-biển&page=1&limit=10
Authorization: Bearer <token>
```

### 6.16 Chuẩn bị chuyến biển (DRAFT → PREPARING)

> ⚠️ **Không gửi body** — endpoint này không nhận payload.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}/prepare
Authorization: Bearer <token>
```

### 6.17 Rời cảng (PREPARING → DEPARTED)

> ⚠️ **Không gửi body** — endpoint không nhận payload.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}/depart
Authorization: Bearer <token>
```

**Response:** `status` chuyển từ `DRAFT` → `PREPARING` → `DEPARTED`

### 6.18 Bắt đầu khai thác (DEPARTED → FISHING)

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}/start-fishing
Authorization: Bearer <token>
```

**Response:** `status` chuyển thành `FISHING`

---

## 9. Chuyến biển — Khai thác

### 7.1 Ghi nhận lần khai thác thứ 1 (Fishing Operation)

> **Lưu ý:** Chỉ có `latitude`/`longitude` — KHÔNG có `startLatitude`/`startLongitude`/`endLatitude`/`endLongitude`.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "latitude": "9.52345",
  "longitude": "104.12345",
  "operationStartedAt": "2025-01-15T08:00:00Z",
  "operationEndedAt": "2025-01-15T14:00:00Z",
  "operationType": "TRAWL",
  "fishingGearType": "Lưới kéo đáy",
  "fishingGround": "Vùng biển Tây Nam",
  "depth": "45.0",
  "notes": "Tàu khai thác lần 1"
}
```

### 7.2 Cập nhật Fishing Operation

```http
PATCH http://localhost:4044/api/electronic-logbook/fishing-operations/{operationId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": "9.60000",
  "longitude": "104.20000",
  "operationEndedAt": "2025-01-15T15:00:00Z",
  "notes": "Cập nhật thời gian khai thác"
}
```

### 7.3 Xem chi tiết Fishing Operation

```http
GET http://localhost:4044/api/electronic-logbook/fishing-operations/{operationId}
Authorization: Bearer <token>
```

### 7.4 Ghi nhận sản lượng lần khai thác 1 (Catch Record)

```http
POST http://localhost:4044/api/electronic-logbook/catch-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingOperationId": "uuid-của-operation-vừa-tạo",
  "speciesCode": "TRA",
  "speciesName": "Cá Tra (Pangasianodon hypophthalmus)",
  "quantity": "150.000",
  "unit": "kg",
  "estimatedQuantity": "160.000",
  "condition": "FRESH",
  "notes": "Cá tươi, bảo quản trong đá"
}
```

### 7.5 Cập nhật Catch Record

```http
PATCH http://localhost:4044/api/electronic-logbook/catch-records/{catchId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": "155.000",
  "condition": "FROZEN"
}
```

### 7.6 Ghi nhận lần khai thác thứ 2

```http
POST http://localhost:4044/api/electronic-logbook/fishing-operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "latitude": "9.81234",
  "longitude": "104.34567",
  "operationStartedAt": "2025-01-15T16:00:00Z",
  "operationEndedAt": "2025-01-15T22:00:00Z",
  "operationType": "PURSE_SEINE",
  "fishingGearType": "Lưới vây",
  "fishingGround": "Vùng biển Tây Nam",
  "depth": "30.0"
}
```

### 7.7 Ghi nhận sản lượng lần khai thác 2

```http
POST http://localhost:4044/api/electronic-logbook/catch-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingOperationId": "uuid-operation-thứ-2",
  "speciesCode": "BAS",
  "speciesName": "Cá Bạc (Secutor interruptus)",
  "quantity": "200.000",
  "unit": "kg",
  "condition": "FRESH"
}
```

### 7.8 Xóa Fishing Operation

```http
DELETE http://localhost:4044/api/electronic-logbook/fishing-operations/{operationId}
Authorization: Bearer <token>
```

### 7.9 Bắt đầu hành trình về (FISHING → RETURNING)

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}/start-returning
Authorization: Bearer <token>
```

---

## 10. Chuyến biển — Cập cảng & Bốc dỡ

### 8.1 Ghi nhận cập cảng (Port Call — ARRIVAL)

```http
POST http://localhost:4044/api/electronic-logbook/port-calls
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "portCode": "92101",
  "callType": "ARRIVAL",
  "occurredAt": "2025-01-16T06:00:00Z",
  "latitude": "10.03500",
  "longitude": "105.78700",
  "reason": "Cập cảng bốc dỡ sản phẩm thủy sản"
}
```

### 8.2 Tạo bản ghi hạ nhu cầu (Landing Record)

> **Lưu ý:** `fishingTripId` là bắt buộc.

```http
POST http://localhost:4044/api/electronic-logbook/landing-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "landingPortCode": "92101",
  "landedAt": "2025-01-16T07:00:00Z",
  "totalQuantity": "350.000",
  "notes": "Tổng sản lượng 2 lần khai thác"
}
```

### 8.3 Cập nhật Landing Record

```http
PATCH http://localhost:4044/api/electronic-logbook/landing-records/{landingId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalQuantity": "360.000",
  "notes": "Cập nhật tổng sản lượng"
}
```

### 8.4 Xem chi tiết Landing Record

```http
GET http://localhost:4044/api/electronic-logbook/landing-records/{landingId}
Authorization: Bearer <token>
```

### 8.5 Ghi nhận chi tiết bốc dỡ theo loài (Landing Catch)

```http
POST http://localhost:4044/api/electronic-logbook/landing-catches
Authorization: Bearer <token>
Content-Type: application/json

{
  "landingRecordId": "uuid-landing-record-vừa-tạo",
  "speciesCode": "TRA",
  "speciesName": "Cá Tra",
  "quantity": "150.000",
  "unit": "kg"
}
```

### 8.6 Cập nhật Landing Catch

```http
PATCH http://localhost:4044/api/electronic-logbook/landing-catches/{catchId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": "155.000"
}
```

### 8.7 Xóa Landing Record

```http
DELETE http://localhost:4044/api/electronic-logbook/landing-records/{landingId}
Authorization: Bearer <token>
```

### 8.8 Hoàn thành chuyến biển (RETURNING → COMPLETED)

> ⚠️ **Không gửi body** — endpoint không nhận payload.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}/complete
Authorization: Bearer <token>
```

**Response:** `status` chuyển thành `COMPLETED`

### 8.9 Hủy chuyến biển

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}/cancel
Authorization: Bearer <token>
```

### 8.10 Xóa chuyến biển

```http
DELETE http://localhost:4044/api/electronic-logbook/fishing-trips/{tripId}
Authorization: Bearer <token>
```

### 8.11 Nộp M02 — Kiểm tra tàu cá cập cảng (SAU KHI CẬP CẢNG)

```http
POST http://localhost:4044/api/electronic-logbook/forms/m02
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "fishingTripId": "uuid-chuyến-biển",
  "inspectionDate": "2025-01-16",
  "inspectionUnit": "Chi cục Thủy sản Cần Thơ",
  "inspectors": ["Ông Phạm Văn D", "Bà Hoàng Thị E"],
  "documentChecks": {
    "fishingReport": true,
    "fishingLogbook": true
  },
  "reportedCatchQuantity": "350.000",
  "actualCatchQuantity": "350.000",
  "conclusion": "Khớp lệnh",
  "notes": "Sản lượng khai thác khớp với báo cáo"
}
```

### 8.12 Nộp M01 — Giấy biên nhận sản phẩm thủy sản bốc dỡ

```http
POST http://localhost:4044/api/electronic-logbook/forms/m01
Authorization: Bearer <token>
Content-Type: application/json

{
  "vesselId": "uuid-của-tàu",
  "fishingTripId": "uuid-chuyến-biển",
  "issuanceDate": "2025-01-16",
  "captainName": "Nguyễn Văn A",
  "captainIdNumber": "025123456789",
  "fishingLicenseNumber": "GP-2025-CT-001",
  "fishingLicenseExpiry": "2026-01-01",
  "lengthCategoryOverride": "24.5m",
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
    },
    {
      "speciesCode": "BAS",
      "speciesName": "Cá Bạc",
      "harvestedQuantity": "200.000",
      "purchasedQuantity": "200.000",
      "unit": "kg",
      "buyerName": "Công ty TNHH Thủy sản Miền Tây",
      "buyerOrganization": "CTY-TS-001",
      "buyerAddress": "123 Đường 3/2, Ninh Kiều, Cần Thơ"
    }
  ],
  "notes": "Sản phẩm bốc dỡ tại cảng cá Cần Thơ"
}
```

---

## 11. Sự cố (Incident)

### 9.1 Báo cáo sự cố trong chuyến biển

> **Lưu ý:** `fishingTripId` là optional trong payload.

```http
POST http://localhost:4044/api/electronic-logbook/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "vesselId": "uuid-của-tàu",
  "incidentType": "EQUIPMENT_FAILURE",
  "severity": "MEDIUM",
  "occurredAt": "2025-01-15T12:30:00Z",
  "latitude": "9.60000",
  "longitude": "104.18000",
  "description": "Máy phát điện dự phòng không hoạt động",
  "actionTaken": "Sửa chữa tạm thời, tiếp tục hành trình"
}
```

### 9.2 Cập nhật sự cố

```http
PATCH http://localhost:4044/api/electronic-logbook/incidents/{incidentId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "severity": "LOW",
  "actionTaken": "Đã sửa xong, tiếp tục hành trình"
}
```

### 9.3 Xem chi tiết sự cố

```http
GET http://localhost:4044/api/electronic-logbook/incidents/{incidentId}
Authorization: Bearer <token>
```

### 9.4 Xóa sự cố

```http
DELETE http://localhost:4044/api/electronic-logbook/incidents/{incidentId}
Authorization: Bearer <token>
```

---

## 12. Nhiên liệu (Fuel Record)

### 10.1 Ghi nhận tiêu thụ nhiên liệu

```http
POST http://localhost:4044/api/electronic-logbook/fuel-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "fishingTripId": "uuid-chuyến-biển",
  "recordType": "CONSUMPTION",
  "quantity": "800.000",
  "unit": "lít",
  "occurredAt": "2025-01-16T06:00:00Z",
  "location": "Vùng biển Tây Nam",
  "notes": "Tổng tiêu thụ 2 ngày khai thác"
}
```

### 10.2 Cập nhật Fuel Record

```http
PATCH http://localhost:4044/api/electronic-logbook/fuel-records/{fuelId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": "820.000",
  "notes": "Cập nhật lượng tiêu thụ"
}
```

### 10.3 Xem chi tiết Fuel Record

```http
GET http://localhost:4044/api/electronic-logbook/fuel-records/{fuelId}
Authorization: Bearer <token>
```

### 10.4 Xóa Fuel Record

```http
DELETE http://localhost:4044/api/electronic-logbook/fuel-records/{fuelId}
Authorization: Bearer <token>
```

---

## 13. Biểu mẫu Quy định M01 / M02 / M03

> **Quy trình nộp biểu mẫu:**
> 1. `M02` → nộp **SAU KHI** tàu cập cảng (kiểm tra tàu cá cập cảng)
> 2. `M01` → nộp **CÙNG LÚC** hoặc **SAU** khi bốc dỡ sản phẩm thủy sản
> 3. `M03` → nộp **TRƯỚC KHI** tàu rời cảng (kiểm tra tàu cá rời cảng)

### Tóm tắt payload mẫu cho M01 / M02 / M03

#### M01 — Giấy biên nhận sản phẩm thủy sản bốc dỡ

| Trường | Bắt buộc | Kiểu | Mô tả |
|---|---|---|---|
| `vesselId` | ✅ | UUID | UUID tàu cá |
| `fishingTripId` | ⬜ | UUID | UUID chuyến biển (optional) |
| `issuanceDate` | ⬜ | string | Ngày lập (YYYY-MM-DD) |
| `captainName` | ⬜ | string | Họ tên thuyền trưởng |
| `captainIdNumber` | ⬜ | string | Số CCCD thuyền trưởng |
| `fishingLicenseNumber` | ⬜ | string | Số giấy phép khai thác |
| `fishingLicenseExpiry` | ⬜ | string | Ngày hết hạn giấy phép |
| `lengthCategoryOverride` | ⬜ | string | Phân loại chiều dài (optional) |
| `speciesList` | ⬜ | array | Danh sách loài thủy sản |
| `notes` | ⬜ | string | Ghi chú |

#### M02 — Biên bản kiểm tra tàu cá cập cảng

| Trường | Bắt buộc | Kiểu | Mô tả |
|---|---|---|---|
| `vesselId` | ✅ | UUID | UUID tàu cá |
| `fishingTripId` | ⬜ | UUID | UUID chuyến biển (optional) |
| `inspectionDate` | ⬜ | string | Ngày kiểm tra |
| `inspectionUnit` | ⬜ | string | Đơn vị kiểm tra |
| `inspectors` | ⬜ | array | Danh sách người kiểm tra |
| `documentChecks.fishingReport` | ⬜ | boolean | Kiểm tra báo cáo khai thác |
| `documentChecks.fishingLogbook` | ⬜ | boolean | Kiểm tra nhật ký khai thác |
| `reportedCatchQuantity` | ⬜ | string | Sản lượng khai thác (số liệu tàu báo cáo) |
| `actualCatchQuantity` | ⬜ | string | Sản lượng thực tế (số liệu cơ quan ghi nhận) |
| `conclusion` | ⬜ | string | Kết luận |
| `notes` | ⬜ | string | Ghi chú |

#### M03 — Biên bản kiểm tra tàu cá rời cảng

| Trường | Bắt buộc | Kiểu | Mô tả |
|---|---|---|---|
| `vesselId` | ✅ | UUID | UUID tàu cá |
| `fishingTripId` | ⬜ | UUID | UUID chuyến biển (optional) |
| `inspectionDate` | ⬜ | string | Ngày kiểm tra |
| `inspectionUnit` | ⬜ | string | Đơn vị kiểm tra |
| `inspectors` | ⬜ | array | Danh sách người kiểm tra |
| `documents.*` | ⬜ | boolean | Checklist giấy tờ |
| `equipment.*` | ⬜ | string | Kiểm tra thiết bị (`T` = đạt, `D` = không đạt) |
| `fishingOccupations` | ⬜ | array | Nghề khai thác chính |
| `crewCount` | ⬜ | number | Số thuyền viên |
| `previousTripSubmission.*` | ⬜ | boolean | Chuyến biển trước đã nộp biểu mẫu chưa |
| `conclusion` | ⬜ | string | Kết luận |
| `notes` | ⬜ | string | Ghi chú |

---

## 14. Form Submission Workflow

> **Workflow hoàn chỉnh:**
> `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` → `CONFIRMED`

### 12.1 Tạo form submission (DRAFT)

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "formDefinitionId": "uuid-form-definition-m01",
  "fishingTripId": "uuid-chuyến-biển",
  "vesselId": "uuid-của-tàu"
}
```

### 12.2 Cập nhật dữ liệu form (versioned)

```http
PATCH http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/data
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "issuanceDate": "2025-01-16",
    "captainName": "Nguyễn Văn A",
    "speciesList": [
      {
        "speciesCode": "TRA",
        "speciesName": "Cá Tra",
        "harvestedQuantity": "150.000",
        "purchasedQuantity": "150.000",
        "unit": "kg"
      }
    ]
  }
}
```

### 12.3 Cập nhật metadata form submission

```http
PATCH http://localhost:4044/api/electronic-logbook/form-submissions/{formId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "formDefinitionId": "uuid-form-definition-m01",
  "fishingTripId": "uuid-chuyến-biển"
}
```

### 12.4 Xem chi tiết form submission

```http
GET http://localhost:4044/api/electronic-logbook/form-submissions/{formId}
Authorization: Bearer <token>
```

### 12.5 Nộp form (DRAFT → SUBMITTED)

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/submit
Authorization: Bearer <token>
```

### 12.6 Bắt đầu xem xét (SUBMITTED → UNDER_REVIEW)

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/start-review
Authorization: Bearer <token>
```

### 12.7 Phê duyệt (UNDER_REVIEW → APPROVED)

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/approve
Authorization: Bearer <token>
```

### 12.8 Từ chối (UNDER_REVIEW → REJECTED)

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Sản lượng không khớp với báo cáo khai thác"
}
```

### 12.9 Mở lại (REJECTED → DRAFT)

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/reopen
Authorization: Bearer <token>
```

### 12.10 Hủy form submission

> ⚠️ **Không gửi body**.

```http
POST http://localhost:4044/api/electronic-logbook/form-submissions/{formId}/cancel
Authorization: Bearer <token>
```

### 12.11 Xóa form submission

```http
DELETE http://localhost:4044/api/electronic-logbook/form-submissions/{formId}
Authorization: Bearer <token>
```

### 12.12 Xác nhận M01 (APPROVED → CONFIRMED)

> **Lưu ý:** Path là `/:formSubmissionId/confirm` — KHÔNG có `/remaining/`.

```http
POST http://localhost:4044/api/electronic-logbook/form-submission-confirmations/{formSubmissionId}/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "issuanceDate": "2025-01-16",
  "confirmedQuantity": "350.000",
  "buyerName": "Công ty TNHH Thủy sản Miền Tây",
  "buyerOrganization": "CTY-TS-001",
  "buyerAddress": "123 Đường 3/2, Ninh Kiều, Cần Thơ",
  "notes": "Đã xác nhận bởi cơ quan có thẩm quyền"
}
```

### 12.13 Xem số lượng chưa xác nhận

```http
GET http://localhost:4044/api/electronic-logbook/form-submission-confirmations/remaining/{formSubmissionId}
Authorization: Bearer <token>
```

### 12.14 Xem chi tiết confirmation

```http
GET http://localhost:4044/api/electronic-logbook/form-submission-confirmations/{confirmationId}
Authorization: Bearer <token>
```

### 12.15 Xem lịch sử workflow

```http
GET http://localhost:4044/api/electronic-logbook/form-workflow-histories?formSubmissionId={formId}&page=1&limit=10
Authorization: Bearer <token>
```

### 12.16 Xem phiên bản dữ liệu form

```http
GET http://localhost:4044/api/electronic-logbook/form-submission-versions?formSubmissionId={formId}&page=1&limit=10
Authorization: Bearer <token>
```

### 12.17 Xem chi tiết phiên bản

```http
GET http://localhost:4044/api/electronic-logbook/form-submission-versions/{versionId}
Authorization: Bearer <token>
```

---

## 15. Đồng bộ Offline (Sync)

### 13.1 Push dữ liệu offline

```http
POST http://localhost:4044/api/electronic-logbook/sync/push
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "operations": [
    {
      "operationId": "op-001",
      "entityType": "FISHING_OPERATION",
      "entityId": "uuid-operation",
      "operationType": "CREATE",
      "clientVersion": 1,
      "payload": {
        "fishingTripId": "uuid-chuyến-biển",
        "latitude": "9.52345",
        "longitude": "104.12345",
        "operationStartedAt": "2025-01-15T08:00:00Z",
        "operationEndedAt": "2025-01-15T14:00:00Z",
        "operationType": "TRAWL"
      }
    },
    {
      "operationId": "op-002",
      "entityType": "CATCH_RECORD",
      "entityId": "uuid-catch-record",
      "operationType": "CREATE",
      "clientVersion": 1,
      "payload": {
        "fishingOperationId": "uuid-operation",
        "speciesCode": "TRA",
        "quantity": "150.000"
      }
    }
  ]
}
```

### 13.2 Pull dữ liệu từ server

> **Lưu ý:** `deviceId` được lấy từ token/auth, KHÔNG truyền trong query.

```http
GET http://localhost:4044/api/electronic-logbook/sync/pull?cursor=abc123&limit=100
Authorization: Bearer <token>
```

### 13.3 Tạo Sync Operation (server-side tracking)

```http
POST http://localhost:4044/api/electronic-logbook/sync/operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "operationId": "client-op-001",
  "entityType": "FISHING_OPERATION",
  "entityId": "uuid-operation",
  "operationType": "CREATE",
  "payload": {
    "fishingTripId": "uuid-chuyến-biển",
    "operationType": "TRAWL"
  },
  "clientVersion": 1
}
```

### 13.4 Cập nhật Sync Operation

```http
PATCH http://localhost:4044/api/electronic-logbook/sync/operations/{operationId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

### 13.5 Xem Sync Operations

```http
GET http://localhost:4044/api/electronic-logbook/sync/operations?deviceId=550e8400-e29b-41d4-a716-446655440000&page=1&limit=10
Authorization: Bearer <token>
```

### 13.6 Tạo Sync Conflict

```http
POST http://localhost:4044/api/electronic-logbook/sync/conflicts
Authorization: Bearer <token>
Content-Type: application/json

{
  "syncOperationId": "uuid-sync-operation",
  "entityType": "FISHING_OPERATION",
  "entityId": "uuid-operation",
  "clientData": { "quantity": "150.000" },
  "serverData": { "quantity": "145.000" }
}
```

### 13.7 Cập nhật Sync Conflict

```http
PATCH http://localhost:4044/api/electronic-logbook/sync/conflicts/{conflictId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "CLIENT_WINS"
}
```

### 13.8 Xem Sync Conflicts

```http
GET http://localhost:4044/api/electronic-logbook/sync/conflicts?deviceId=550e8400-e29b-41d4-a716-446655440000&page=1&limit=10
Authorization: Bearer <token>
```

---

## 16. Tài liệu đính kèm (Document)

### 14.1 Tải lên tài liệu cho chuyến biển

```http
POST http://localhost:4044/api/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
ownerType: fishing_trip
ownerId: uuid-chuyến-biển
documentType: image
```

### 14.2 Xem danh sách tài liệu

```http
GET http://localhost:4044/api/documents?ownerType=fishing_trip&ownerId=uuid-chuyến-biển&page=1&limit=10
Authorization: Bearer <token>
```

### 14.3 Xem chi tiết tài liệu

```http
GET http://localhost:4044/api/documents/{documentId}
Authorization: Bearer <token>
```

### 14.4 Tải xuống tài liệu

```http
GET http://localhost:4044/api/documents/{documentId}/download
Authorization: Bearer <token>
```

### 14.5 Cập nhật tài liệu

```http
PATCH http://localhost:4044/api/documents/{documentId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "photo",
  "description": "Hình ảnh bốc dỡ sản phẩm"
}
```

### 14.6 Xóa tài liệu

```http
DELETE http://localhost:4044/api/documents/{documentId}
Authorization: Bearer <token>
```

---

## 17. Form Definition (CRUD quản lý biểu mẫu)

### 15.1 Tạo Form Definition

```http
POST http://localhost:4044/api/electronic-logbook/form-definitions
Authorization: Bearer <token>
Content-Type: application/json

{
  "formCode": "M01",
  "name": "Giấy biên nhận sản phẩm thủy sản bốc dỡ",
  "description": "Mẫu 01 - Theo Thông tư 31/2025/TT-BNNPTNT",
  "version": "1.0",
  "formType": "REGULATORY",
  "effectiveFrom": "2025-01-01",
  "effectiveTo": "2025-12-31"
}
```

### 15.2 Cập nhật Form Definition

```http
PATCH http://localhost:4044/api/electronic-logbook/form-definitions/{definitionId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Giấy biên nhận sản phẩm thủy sản bốc dỡ (cập nhật)",
  "version": "1.1"
}
```

### 15.3 Xem chi tiết Form Definition

```http
GET http://localhost:4044/api/electronic-logbook/form-definitions/{definitionId}
Authorization: Bearer <token>
```

### 15.4 Liệt kê Form Definitions

```http
GET http://localhost:4044/api/electronic-logbook/form-definitions?search=M01&formType=REGULATORY&page=1&limit=10
Authorization: Bearer <token>
```

### 15.5 Xóa Form Definition

```http
DELETE http://localhost:4044/api/electronic-logbook/form-definitions/{definitionId}
Authorization: Bearer <token>
```

---

## Bảng tổng hợp — Trạng thái Chuyến biển

| Action | Endpoint | Body | Status chuyển |
|---|---|---|---|
| Tạo chuyến biển | `POST /fishing-trips` | ✅ `{ vesselId, tripNumber, ... }` | `DRAFT` |
| Chuẩn bị | `POST /fishing-trips/:id/prepare` | ❌ Không body | `DRAFT` → `PREPARING` |
| Rời cảng | `POST /fishing-trips/:id/depart` | ❌ Không body | `PREPARING` → `DEPARTED` |
| Bắt đầu khai thác | `POST /fishing-trips/:id/start-fishing` | ❌ Không body | `DEPARTED` → `FISHING` |
| Bắt đầu về | `POST /fishing-trips/:id/start-returning` | ❌ Không body | `FISHING` → `RETURNING` |
| Hoàn thành | `POST /fishing-trips/:id/complete` | ❌ Không body | `RETURNING` → `COMPLETED` |
| Hủy | `POST /fishing-trips/:id/cancel` | ❌ Không body | * → `CANCELLED` |

## Bảng tổng hợp — Trạng thái Form Submission

| Action | Endpoint | Body | Status chuyển |
|---|---|---|---|
| Tạo form | `POST /form-submissions` | ✅ `{ formDefinitionId, vesselId, ... }` | `DRAFT` |
| Cập nhật metadata | `PATCH /form-submissions/:id` | ✅ `{ formDefinitionId, fishingTripId }` | giữ nguyên |
| Cập nhật dữ liệu | `PATCH /form-submissions/:id/data` | ✅ `{ data: {...} }` | giữ nguyên |
| Nộp | `POST /form-submissions/:id/submit` | ❌ Không body | `DRAFT` → `SUBMITTED` |
| Bắt đầu xem xét | `POST /form-submissions/:id/start-review` | ❌ Không body | `SUBMITTED` → `UNDER_REVIEW` |
| Phê duyệt | `POST /form-submissions/:id/approve` | ❌ Không body | `UNDER_REVIEW` → `APPROVED` |
| Từ chối | `POST /form-submissions/:id/reject` | ✅ `{ reason }` | `UNDER_REVIEW` → `REJECTED` |
| Mở lại | `POST /form-submissions/:id/reopen` | ❌ Không body | `REJECTED` → `DRAFT` |
| Hủy | `POST /form-submissions/:id/cancel` | ❌ Không body | * → `CANCELLED` |
| Xác nhận M01 | `POST /form-submission-confirmations/:id/confirm` | ✅ `{ confirmedQuantity, ... }` | `APPROVED` → `CONFIRMED` |

---

## Bảng tổng hợp — Trạng thái Chuyến biển

| Action | Endpoint | Status chuyển | API method |
|---|---|---|---|
| Tạo chuyến biển | `POST /fishing-trips` | `DRAFT` | `POST` |
| Chuẩn bị | `POST /fishing-trips/:id/prepare` | `DRAFT` → `PREPARING` | `POST` |
| Rời cảng | `POST /fishing-trips/:id/depart` | `PREPARING` → `DEPARTED` | `POST` |
| Bắt đầu khai thác | `POST /fishing-trips/:id/start-fishing` | `DEPARTED` → `FISHING` | `POST` |
| Bắt đầu về | `POST /fishing-trips/:id/start-returning` | `FISHING` → `RETURNING` | `POST` |
| Hoàn thành | `POST /fishing-trips/:id/complete` | `RETURNING` → `COMPLETED` | `POST` |
| Hủy | `POST /fishing-trips/:id/cancel` | * → `CANCELLED` | `POST` |

## Bảng tổng hợp — Trạng thái Form Submission

| Action | Endpoint | SubmissionStatus chuyển | API method |
|---|---|---|---|
| Tạo form | `POST /form-submissions` | `DRAFT` | `POST` |
| Cập nhật dữ liệu | `PATCH /form-submissions/:id/data` | giữ nguyên `DRAFT` | `PATCH` |
| Nộp | `POST /form-submissions/:id/submit` | `DRAFT` → `SUBMITTED` | `POST` |
| Bắt đầu xem xét | `POST /form-submissions/:id/start-review` | `SUBMITTED` → `UNDER_REVIEW` | `POST` |
| Phê duyệt | `POST /form-submissions/:id/approve` | `UNDER_REVIEW` → `APPROVED` | `POST` |
| Từ chối | `POST /form-submissions/:id/reject` | `UNDER_REVIEW` → `REJECTED` | `POST` |
| Mở lại | `POST /form-submissions/:id/reopen` | `REJECTED` → `DRAFT` | `POST` |
| Hủy | `POST /form-submissions/:id/cancel` | * → `CANCELLED` | `POST` |
| Xác nhận | `POST /form-submission-confirmations/.../confirm` | `APPROVED` → `CONFIRMED` | `POST` |

---

## Environment Variables cần thiết

| Service | Variable | Giá trị mẫu |
|---|---|---|
| Gateway-api | `PORT` | `4044` |
| Gateway-api | `ELECTRONIC_LOGBOOK_API_URL` | `http://localhost:4045` |
| Gateway-api | `LOGBOOK_IDENTITY_API_URL` | `http://localhost:4041` |
| Gateway-api | `DOCUMENT_API_URL` | `http://localhost:3044` (document-api) |
| logboook-identity-api | `PORT` | `4041` |
| logboook-identity-api | **`JWT_ACCESS_SECRET`** | **`logbook-jwt-access-secret-change-me`** |
| logboook-identity-api | **`JWT_REFRESH_SECRET`** | **`electronic-logbook-refresh-secret-change-me`** |
| logboook-identity-api | `DATABASE_URL` | `postgresql://...` |
| electronic-logbook-api | `PORT` | `4045` |
| electronic-logbook-api | **`JWT_ACCESS_SECRET`** | **`logbook-jwt-access-secret-change-me`** |
| electronic-logbook-api | `LOGBOOK_IDENTITY_API_URL` | `http://localhost:4041` |
| electronic-logbook-api | `DOCUMENT_API_URL` | `http://localhost:3044` |
| document-api | `PORT` | `3044` |
| document-api | `JWT_SERVICE_SECRET` | `document-api-service-secret-change-me` |
| document-api | `DOCUMENT_API_AUDIENCE` | `document-api` |

> ⚠️ **CRITICAL:** `JWT_ACCESS_SECRET` trong **logboook-identity-api** VÀ **electronic-logbook-api** phải **GIỐNG NHAU** (mặc định: `logbook-jwt-access-secret-change-me`). Nếu khác, token sẽ không được xác thực ở downstream → tất cả protected endpoint trả 401.

---

## Các Bug đã được sửa trong codebase

> Phần này ghi lại các bug nghiêm trọng đã được sửa trong quá trình review.

### Bug 1: JWT Secret Mismatch (CRITICAL — đã sửa)

**Vấn đề:** `logboook-identity-api` tạo token với secret `LOGBOOK_JWT_ACCESS_SECRET`, nhưng `JwtStrategy` đọc từ `JWT_ACCESS_SECRET` (khác default). Kết quả: downstream eLogbook luôn trả 401, logout fail.

**Đã sửa:** `token.util.ts` — đổi default secret sang `logbook-jwt-access-secret-change-me` (khớp với `electronic-logbook-api`). Đảm bảo `.env` ở cả 2 service cùng secret.

### Bug 2: Logout — sessionId không extract được (CRITICAL — đã sửa)

**Vấn đề:** `logout` endpoint đọc `sessionId` từ JWT payload nhưng JWT payload không chứa `sessionId`. Downstream luôn throw `"Session not found"`.

**Đã sửa:**
- `token.util.ts` — thêm `sessionId` vào JWT payload khi tạo access token
- `auth.service.ts` (login & refresh) — truyền `savedSession.id` / `newSession.id` vào payload
- `auth.controller.ts` (downstream) — đọc `sessionId` từ body (Gateway decode JWT và forward)
- `logbook-auth.controller.ts` (Gateway) — decode JWT, extract `sessionId`, gửi kèm body xuống downstream

### Bug 3: Registration DTO không đúng (đã cập nhật guide)

**Vấn đề:** Hướng dẫn cũ dùng `{ identifier, password }` — không có trường `password` trong `RegisterDto`. Mật khẩu được tự động sinh và gửi qua email.

**Đã sửa guide:** Sử dụng DTO đúng `{ fullName, identifierType, identifier }` + thêm bước forgot-password nếu chưa có mật khẩu.

### Bug 4: Login DTO thiếu identifierType (đã cập nhật guide)

**Vấn đề:** Hướng dẫn cũ gửi `{ identifier, password }` — thiếu `identifierType` bắt buộc.

**Đã sửa guide:** Payload đúng: `{ identifierType, identifier, password }`.

### Bug 5: Fisherman Profile path sai (đã cập nhật guide)

**Vấn đề:** Hướng dẫn cũ dùng `POST /logbook/fisherman-profiles` — đúng path là `POST /logbook/fisherman-profiles/:accountId/profile`.

**Đã sửa guide:** Path đúng với `:accountId` param.

### Bug 6: Đăng ký tự động tạo profile (đã cập nhật guide)

**Vấn đề:** Hướng dẫn cũ coi việc tạo Fisherman Profile là bước riêng sau đăng ký. Thực tế: `register()` đã tạo profile tự động.

**Đã sửa guide:** Thêm ghi chú rõ ràng rằng profile được auto-created.

---

---

## Phụ Lục A — Thứ tự test toàn bộ luồng nghiệp vụ (số bước)

```
1.  [Auth]     Đăng ký → Đăng nhập → Lấy token (chọn logbook-user)
2.  [Fisherman] Cập nhật hồ sơ thuyền viên
3.  [Vessel]   Tạo tàu → Cập nhật status=ACTIVE → Chi tiết → Liệt kê
    ⚠️ PHẢI cập nhật status=ACTIVE trước khi tạo fishing trip!
4.  [VesselOwner] Gán chủ tàu → Cập nhật → Liệt kê
5.  [Gear]     Tạo thiết bị khai thác → Cập nhật → Liệt kê
6.  [VesselCrew] Thêm thuyền viên (qua fishermanCode hoặc userId) → Cập nhật → Liệt kê
7.  [Device]   Đăng ký thiết bị → Cập nhật → Liệt kê
8.  [Trip]     ⚠️ Tạo chuyến biển (DRAFT) — CẦN vessel.status=ACTIVE
9.  [TripGear] Thêm thiết bị khai thác vào chuyến → Cập nhật
10. [TripCrew] Thêm thuyền viên vào chuyến (qua fishermanCode) → Cập nhật
11. [M03]      Nộp M03 (kiểm tra rời cảng)
12. [PortCall] Ghi nhận cảng rời → Cập nhật
13. [Trip]     Chuẩn bị → Rời cảng (DEPARTED)
14. [Trip]     Bắt đầu khai thác (FISHING)
15. [Op]       Tạo Fishing Operation 1 → Cập nhật → Chi tiết
16. [Catch]    Catch Record 1 → Cập nhật
17. [Op]       Tạo Fishing Operation 2
18. [Catch]    Catch Record 2
19. [Incident] Báo cáo sự cố → Cập nhật
20. [Fuel]     Ghi nhận tiêu thụ nhiên liệu → Cập nhật
21. [Trip]     Bắt đầu về (RETURNING)
22. [PortCall] Ghi nhận cập cảng
23. [Landing]  Landing Record → Cập nhật → Landing Catch
24. [M02]      Nộp M02 (kiểm tra cập cảng)
25. [M01]      Nộp M01 (biên nhận bốc dỡ)
26. [Trip]     Hoàn thành chuyến biển (COMPLETED)
27. [Form]     Form submission → Update data → Submit → Review → Approve/Reject
28. [Confirm]  Xác nhận M01 (CONFIRMED)
29. [Document] Upload tài liệu → Update → Download → Delete
30. [Sync]     Push/Pull dữ liệu offline + Sync Conflicts
```

**Lưu ý quan trọng**:
- Bước 3: Tàu phải có `status = ACTIVE` trước khi tạo Fishing Trip
- Bước 6, 10: Sử dụng `fishermanCode` (PHASE 8) hoặc `userId` để thêm crew

---

## Phụ Lục B — Tổng hợp endpoints theo nhóm

| Nhóm | Method | Endpoint |
|---|---|---|
| **Auth** | POST | `/api/logbook/auth/register` |
| | POST | `/api/logbook/auth/login` |
| | POST | `/api/logbook/auth/refresh` |
| | POST | `/api/logbook/auth/logout` |
| | POST | `/api/logbook/auth/forgot-password` |
| | POST | `/api/logbook/auth/reset-password` |
| **Account** | GET/PATCH | `/api/logbook/accounts/:id` |
| **Fisherman Profile** | GET/PATCH | `/api/logbook/fisherman-profiles/:accountId/profile` |
| **Account Identifiers** | GET/POST | `/api/logbook/account-identifiers/:accountId/identifiers` |
| | PATCH | `/api/logbook/account-identifiers/:accountId/identifiers/:id` |
| **Vessel** | GET/POST | `/api/electronic-logbook/vessels` |
| | GET/PATCH/DELETE | `/api/electronic-logbook/vessels/:id` |
| **Vessel Owner** | GET/POST | `/api/electronic-logbook/vessel-owners` |
| | PATCH | `/api/electronic-logbook/vessel-owners/:id` |
| **Vessel Crew** | GET/POST | `/api/electronic-logbook/vessel-crews` |
| | PATCH | `/api/electronic-logbook/vessel-crews/:id` |
| **Fishing Gear** | GET/POST | `/api/electronic-logbook/fishing-gears` |
| | PATCH | `/api/electronic-logbook/fishing-gears/:id` |
| **Fishing Trip** | GET/POST | `/api/electronic-logbook/fishing-trips` |
| | PATCH/DELETE | `/api/electronic-logbook/fishing-trips/:id` |
| | POST | `/api/electronic-logbook/fishing-trips/:id/{prepare,depart,start-fishing,start-returning,complete,cancel}` |
| **Fishing Trip Gear** | GET/POST | `/api/electronic-logbook/fishing-trip-gears` |
| | PATCH/DELETE | `/api/electronic-logbook/fishing-trip-gears/:id` |
| **Fishing Trip Crew** | GET/POST | `/api/electronic-logbook/fishing-trip-crews` |
| | PATCH/DELETE | `/api/electronic-logbook/fishing-trip-crews/:id` |
| **Fishing Operation** | GET/POST | `/api/electronic-logbook/fishing-operations` |
| | GET/PATCH/DELETE | `/api/electronic-logbook/fishing-operations/:id` |
| **Catch Record** | GET/POST | `/api/electronic-logbook/catch-records` |
| | PATCH | `/api/electronic-logbook/catch-records/:id` |
| **Port Call** | GET/POST | `/api/electronic-logbook/port-calls` |
| | PATCH | `/api/electronic-logbook/port-calls/:id` |
| **Landing Record** | GET/POST | `/api/electronic-logbook/landing-records` |
| | GET/PATCH/DELETE | `/api/electronic-logbook/landing-records/:id` |
| **Landing Catch** | GET/POST | `/api/electronic-logbook/landing-catches` |
| | PATCH | `/api/electronic-logbook/landing-catches/:id` |
| **Incident** | GET/POST | `/api/electronic-logbook/incidents` |
| | GET/PATCH/DELETE | `/api/electronic-logbook/incidents/:id` |
| **Fuel Record** | GET/POST | `/api/electronic-logbook/fuel-records` |
| | GET/PATCH/DELETE | `/api/electronic-logbook/fuel-records/:id` |
| **Sync Device** | GET/POST | `/api/electronic-logbook/sync/devices` |
| | PATCH | `/api/electronic-logbook/sync/devices/:id` |
| **Sync Operation** | GET/POST | `/api/electronic-logbook/sync/operations` |
| | PATCH | `/api/electronic-logbook/sync/operations/:id` |
| **Sync Conflict** | GET/POST | `/api/electronic-logbook/sync/conflicts` |
| | PATCH | `/api/electronic-logbook/sync/conflicts/:id` |
| **Sync Push/Pull** | POST/GET | `/api/electronic-logbook/sync/{push,pull}` |
| **Regulatory Forms** | POST | `/api/electronic-logbook/forms/{m01,m02,m03}` |
| **Form Submission** | GET/POST | `/api/electronic-logbook/form-submissions` |
| | GET/PATCH | `/api/electronic-logbook/form-submissions/:id` |
| | POST | `/api/electronic-logbook/form-submissions/:id/{submit,start-review,approve,reject,reopen,cancel}` |
| | PATCH | `/api/electronic-logbook/form-submissions/:id/data` |
| **Form Definition** | GET/POST | `/api/electronic-logbook/form-definitions` |
| | GET/PATCH/DELETE | `/api/electronic-logbook/form-definitions/:id` |
| **Form Submission Confirmation** | GET/POST | `/api/electronic-logbook/form-submission-confirmations` |
| | GET | `/api/electronic-logbook/form-submission-confirmations/{:id,remaining/:formSubmissionId}` |
| | POST | `/api/electronic-logbook/form-submission-confirmations/:formSubmissionId/confirm` |
| **Form Submission History** | GET | `/api/electronic-logbook/form-workflow-histories` |
| **Form Submission Version** | GET | `/api/electronic-logbook/form-submission-versions` |
| | GET | `/api/electronic-logbook/form-submission-versions/:id` |
| **Documents** | GET/POST | `/api/documents` |
| | GET/PATCH/DELETE | `/api/documents/:id` |
| | GET | `/api/documents/:id/download` |

---

## PHẦN 8 — USER-SCOPED VISIBILITY & OWNERSHIP (PHASE 8)

### Tổng quan

Mỗi user chỉ có thể truy cập các resource mà họ sở hữu hoặc có liên kết. Khi user gọi API, hệ thống tự động lọc kết quả theo `accountId` của user, đảm bảo:

- **Privacy**: User A không thấy dữ liệu của User B
- **Performance**: Direct ownership query thông qua cột `owner_id` được denormalized
- **Consistency**: Resource được bảo vệ bởi access check ở mọi endpoint

### Ownership Model

```
┌──────────────────────────────────────────────────────────┐
│ User (accountId)                                          │
│   ├── ownerId (denormalized, fast filter)                │
│   │     └──> Tàu cá do user tạo                         │
│   ├── vessel_owners (current=true)                       │
│   │     └──> Tàu cá user là chủ                         │
│   ├── vessel_crew (active=true)                          │
│   │     └──> Tàu cá user là thuyền viên                 │
│   └── fishing_trip_crew                                  │
│         └──> Chuyến biển user tham gia                   │
└──────────────────────────────────────────────────────────┘
```

### Entities có User-Scoped Visibility

| Entity | Trường Owner | Filter Logic |
|---|---|---|
| `Vessel` | `owner_id` | Trực tiếp |
| `FishingTrip` | (qua vessel) | Lọc qua vessel accessible |
| `LandingRecord` | (qua vessel) | Lọc qua vessel accessible |
| `PortCall` | (qua vessel/trip) | Lọc qua vessel accessible |
| `FuelRecord` | (qua vessel/trip) | Lọc qua vessel accessible |
| `Incident` | `owner_id` + vessel | Trực tiếp HOẶC qua vessel |
| `VesselOwner` | (qua vessel) | Lọc qua vessel accessible |
| `VesselCrew` | (qua vessel) | Lọc qua vessel accessible |
| `ClientDevice` | `user_id` | Trực tiếp |

### Test Scenarios

#### Scenario A — Vessel Ownership Isolation

**Setup**: Tạo 2 user, mỗi user tạo 1 tàu riêng

```bash
# User A login & tạo tàu
USER_A_TOKEN=$(curl -s -X POST http://localhost:3000/api/logbook/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@fish.io","password":"Pass123!"}' | jq -r '.accessToken')

USER_A_VESSEL=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/vessels \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber":"VN-A-001","vesselName":"Tàu A","length":15.5,"width":4.2,"grossTonnage":45.0}' | jq -r '.id')

# User B login & tạo tàu
USER_B_TOKEN=$(curl -s -X POST http://localhost:3000/api/logbook/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"b@fish.io","password":"Pass123!"}' | jq -r '.accessToken')

USER_B_VESSEL=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/vessels \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber":"VN-B-001","vesselName":"Tàu B","length":18.0,"width":5.0,"grossTonnage":60.0}' | jq -r '.id')
```

**Test 1**: User A chỉ thấy tàu của mình
```bash
curl -s http://localhost:3000/api/electronic-logbook/vessels \
  -H "Authorization: Bearer $USER_A_TOKEN" | jq '.[].registrationNumber'
# Expected: ["VN-A-001"] — KHÔNG thấy VN-B-001
```

**Test 2**: User A truy cập tàu của User B → 404
```bash
curl -s -X GET http://localhost:3000/api/electronic-logbook/vessels/$USER_B_VESSEL \
  -H "Authorization: Bearer $USER_A_TOKEN" -w "\n%{http_code}\n"
# Expected: 404 (hides existence)
```

**Test 3**: User A cố update tàu của User B → 404
```bash
curl -s -X PATCH http://localhost:3000/api/electronic-logbook/vessels/$USER_B_VESSEL \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vesselName":"Hacked"}' -w "\n%{http_code}\n"
# Expected: 404
```

**Test 4**: User A cố delete tàu của User B → 404
```bash
curl -s -X DELETE http://localhost:3000/api/electronic-logbook/vessels/$USER_B_VESSEL \
  -H "Authorization: Bearer $USER_A_TOKEN" -w "\n%{http_code}\n"
# Expected: 404
```

#### Scenario B — Fishing Trip Creation (Vessel Status Requirement)

**CRITICAL**: Trước khi tạo Fishing Trip, vessel PHẢI có `status = ACTIVE`.

**Lỗi thường gặp**:
```
400 Bad Request
"Vessel must have a status before a trip can be created"
```

**Workflow đúng**:

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/logbook/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@fish.io","password":"Pass123!"}' | jq -r '.accessToken')

# 2. Tạo tàu (ban đầu status = null)
VESSEL=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/vessels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber":"VN-A-001","vesselName":"Tàu A","length":15.5,"width":4.2,"grossTonnage":45.0}')

VESSEL_ID=$(echo $VESSEL | jq -r '.id')
echo "Vessel ID: $VESSEL_ID"
# {"id":"uuid","registrationNumber":"VN-A-001","status":null,...}

# 3. ❌ SAI: Tạo trip ngay → LỖI
curl -s -X POST http://localhost:3000/api/electronic-logbook/fishing-trips \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vesselId\": \"$VESSEL_ID\",
    \"tripNumber\": \"1\",
    \"departurePortCode\": \"92101\",
    \"arrivalPortCode\": \"92101\",
    \"departureAt\": \"2025-01-15T06:00:00Z\",
    \"arrivalAt\": \"2025-01-16T07:00:00Z\"
  }"
# Response: 400 "Vessel must have a status before a trip can be created"

# 4. ✅ ĐÚNG: Cập nhật vessel status = ACTIVE trước
curl -s -X PATCH http://localhost:3000/api/electronic-logbook/vessels/$VESSEL_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}' | jq '.status'
# Response: "ACTIVE"

# 5. ✅ Bây giờ mới tạo trip được
curl -s -X POST http://localhost:3000/api/electronic-logbook/fishing-trips \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vesselId\": \"$VESSEL_ID\",
    \"tripNumber\": \"1\",
    \"departurePortCode\": \"92101\",
    \"arrivalPortCode\": \"92101\",
    \"departureAt\": \"2025-01-15T06:00:00Z\",
    \"arrivalAt\": \"2025-01-16T07:00:00Z\"
  }" | jq '{id, vesselId, tripNumber, status}'
# Response: {"id":"trip-uuid","vesselId":"vessel-uuid","tripNumber":"1","status":"DRAFT"}
```

**Valid Vessel Status Values**:
| Status | Mô tả |
|--------|--------|
| `ACTIVE` | ✅ Tàu hoạt động, có thể tạo trip |
| `INACTIVE` | ❌ Tàu không hoạt động |
| `SUSPENDED` | ❌ Tàu bị đình chỉ |
| `DECOMMISSIONED` | ❌ Tàu đã ngừng hoạt động vĩnh viễn |

**Validation Rules**:
```typescript
// src/domain/fishing-trip/fishing-trip-state-machine.ts
if (!vesselStatus) {
  throw BadRequestException('Vessel must have a status before a trip can be created');
}
if (vesselStatus === 'DECOMMISSIONED') {
  throw BadRequestException('Cannot create a fishing trip for a DECOMMISSIONED vessel');
}
```

### Swagger UI Instructions

#### Cách update vessel status trên Swagger

**Bước 1**: Mở Swagger UI
```
http://localhost:4044/docs
```

**Bước 2**: Authenticate
1. Click **Authorize** button (🔓) ở góc phải
2. Điền token: `Bearer <your_token>`
3. Click **Authorize** → **Close**

**Bước 3**: Update Vessel Status

1. Tìm section **Vessel** trong Swagger
2. Click endpoint **PATCH /api/electronic-logbook/vessels/{id}**
3. Click **Try it out**

4. Điền parameters:
   ```
   id: 70cc76f7-65ba-4350-97ba-4860e535bb07 (UUID của tàu)
   ```

5. Điền Request body:
   ```json
   {
     "vesselName": "Tàu Thắng Lợi 01 (Updated)",
     "vesselType": "Tàu khai thác thủy sản",
     "status": "ACTIVE"
   }
   ```

6. Click **Execute**

7. Kiểm tra Response:
   - ✅ **200 OK**: `"status": "ACTIVE"`
   - ❌ **400 Bad Request**: `"property status should not exist"` → Cần update code (đã fix)

#### Cách tạo Fishing Trip trên Swagger

1. Tìm section **Fishing_trip**
2. Click **POST /api/electronic-logbook/fishing-trips**
3. Click **Try it out**

4. Điền Request body:
   ```json
   {
     "vesselId": "70cc76f7-65ba-4350-97ba-4860e535bb07",
     "tripNumber": "1",
     "departurePortCode": "92101",
     "arrivalPortCode": "92101",
     "departureAt": "2025-01-15T06:00:00Z",
     "arrivalAt": "2025-01-16T07:00:00Z"
   }
   ```

5. Click **Execute**

6. Kiểm tra Response:
   - ✅ **201 Created**: Trip được tạo với `status: "DRAFT"`
   - ❌ **400 Bad Request**: `"Vessel must have a status before a trip can be created"` → Cần set `status: "ACTIVE"` trước

#### Common Swagger Errors

| Error | Nguyên nhân | Fix |
|-------|-------------|-----|
| `401 Unauthorized` | Token hết hạn hoặc thiếu | Authorize lại |
| `403 Forbidden` | Không có quyền | Kiểm tra user ownership |
| `400: property status should not exist` | DTO chưa có status field | Update code (đã fix) |
| `400: Vessel must have a status...` | Vessel chưa set ACTIVE | PATCH vessel với `status: "ACTIVE"` |
| `404 Not Found` | Vessel không tồn tại hoặc không thuộc user | Kiểm tra vessel ID |

#### Scenario B — Incident Ownership

```bash
# User A tạo incident trên tàu của mình
INCIDENT_A=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/incidents \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vesselId\":\"$USER_A_VESSEL\",\"incidentType\":\"engine_failure\",\"severity\":\"high\",\"description\":\"Máy chết giữa biển\"}" | jq -r '.id')

# User A list incidents
curl -s http://localhost:3000/api/electronic-logbook/incidents \
  -H "Authorization: Bearer $USER_A_TOKEN" | jq '.[].id'
# Expected: ["<INCIDENT_A>"]

# User B list incidents — KHÔNG thấy incident của User A
curl -s http://localhost:3000/api/electronic-logbook/incidents \
  -H "Authorization: Bearer $USER_B_TOKEN" | jq '.[].id'
# Expected: [] (empty)
```

#### Scenario C — Vessel Crew Isolation

```bash
# User A thêm crew vào tàu của mình
CREW=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/vessel-crew \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vesselId\":\"$USER_A_VESSEL\",\"userId\":\"crew-uuid\",\"role\":\"deckhand\",\"isActive\":true}" | jq -r '.id')

# User A list crew
curl -s http://localhost:3000/api/electronic-logbook/vessel-crew \
  -H "Authorization: Bearer $USER_A_TOKEN" | jq '.[].id'
# Expected: chỉ crew của tàu A

# User B list crew — KHÔNG thấy crew của tàu A
curl -s http://localhost:3000/api/electronic-logbook/vessel-crew \
  -H "Authorization: Bearer $USER_B_TOKEN" | jq '.[].id'
# Expected: []
```

#### Scenario D — Client Device Isolation

```bash
# User A đăng ký device
DEVICE_A=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/client-devices \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"phone-A-001","platform":"android","appVersion":"1.0.0"}' | jq -r '.id')

# Verify userId được set từ authenticated user (KHÔNG từ DTO)
curl -s http://localhost:3000/api/electronic-logbook/client-devices/$DEVICE_A \
  -H "Authorization: Bearer $USER_A_TOKEN" | jq '.userId'
# Expected: "<USER_A_ACCOUNT_ID>"

# User A cố set userId = User B qua DTO → vẫn bị override
EVIL_DEVICE=$(curl -s -X POST http://localhost:3000/api/electronic-logbook/client-devices \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"phone-evil\",\"userId\":\"$USER_B_ACCOUNT_ID\"}")

echo $EVIL_DEVICE | jq '.userId'
# Expected: "<USER_A_ACCOUNT_ID>" (NOT User B)
```

#### Scenario E — Find By Vessel

```bash
# Endpoint mới: lấy tất cả owners/crew của 1 tàu cụ thể
curl -s http://localhost:3000/api/electronic-logbook/vessel-owners/vessel/$USER_A_VESSEL \
  -H "Authorization: Bearer $USER_A_TOKEN" | jq '.[].id'
# Expected: danh sách owners của tàu A

# User B cố truy cập owners của tàu A → []
curl -s http://localhost:3000/api/electronic-logbook/vessel-owners/vessel/$USER_A_VESSEL \
  -H "Authorization: Bearer $USER_B_TOKEN" | jq '.[].id'
# Expected: [] (vì B không có quyền truy cập tàu A)
```

#### Scenario F — Cannot Reassign Device

```bash
# User A cố reassign device của mình sang User B
curl -s -X PATCH http://localhost:3000/api/electronic-logbook/client-devices/$DEVICE_A \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_B_ACCOUNT_ID\"}" -w "\n%{http_code}\n"
# Expected: 403 Forbidden
```

### Test bằng Jest

```bash
cd electronic-logbook-api
npm test -- --testPathPattern="phase8|authorization"
```

Expected output:
- `authorization.service.spec.ts`: 22 tests passed
- `incident.phase8.spec.ts`: 6 tests passed
- `client-device.phase8.spec.ts`: 17 tests passed
- `vessel-owner.phase8.spec.ts`: 15 tests passed (covers both VesselOwner and VesselCrew)

### Migration

Schema change đã được apply thông qua migration `1789500000002-AddIncidentOwnerId.ts`:

```sql
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS owner_id uuid NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_owner_id
  ON incidents (owner_id);
```

Vessel đã có sẵn `owner_id` từ migration trước (`1789500000001-AddVesselOwnerId.ts`).

---

## PHASE 8 EXT — FISHING OPERATION PROFILE (FISHERMAN CODE)

### Mục đích

Tạo **business identifier** cho ngư dân/thuyền viên để:
- Tìm kiếm người bằng mã ngắn gọn thay vì UUID
- Tách biệt Identity Service (logboook-identity-api) với Business Service (electronic-logbook-api)
- Không lưu thông tin nhạy cảm (CCCD, ngày sinh, địa chỉ) trong business service

### Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│ logboook-identity-api                                    │
│   └── FishermanProfileEntity (CCCD, DOB, address...)   │
└─────────────────────────────────────────────────────────┘
                          │ (logical reference)
                          ▼
┌─────────────────────────────────────────────────────────┐
│ electronic-logbook-api                                   │
│   └── FishingOperationProfile                            │
│         - id: uuid PK                                   │
│         - user_id: uuid (logical ref)                   │
│         - fisherman_code: FSH-000001 (unique)          │
│         - status: ACTIVE/INACTIVE                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ vessel_crew / fishing_trip_crew                         │
│   - user_id: resolved from fisherman_code              │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Sequence cho fisherman_code (thread-safe)
CREATE SEQUENCE fisherman_code_seq START 1 INCREMENT 1;

CREATE TABLE fishing_operation_profiles (
  id              uuid    NOT NULL DEFAULT uuid_generate_v4(),
  user_id         uuid    NOT NULL,
  fisherman_code  varchar(30) NOT NULL,
  status          varchar(30) NOT NULL DEFAULT 'ACTIVE',
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_fishing_operation_profiles PRIMARY KEY (id),
  CONSTRAINT uq_fishing_operation_profiles_user_id UNIQUE (user_id),
  CONSTRAINT uq_fishing_operation_profiles_fisherman_code UNIQUE (fisherman_code)
);

CREATE INDEX idx_fishing_operation_profiles_fisherman_code ON fishing_operation_profiles (fisherman_code);
CREATE INDEX idx_fishing_operation_profiles_user_id ON fishing_operation_profiles (user_id);
CREATE INDEX idx_fishing_operation_profiles_status ON fishing_operation_profiles (status);
```

### Fisherman Code Generation

Format: `FSH-000001` (6 chữ số, zero-padded)

- **Sequence-based**: PostgreSQL `nextval('fisherman_code_seq')` → đảm bảo không trùng lặp khi có concurrent requests
- **Server-generated**: Client KHÔNG được gửi `fishermanCode` trong request
- **Không bao giờ thay đổi**: Mã tồn tại vĩnh viễn, không tái sử dụng

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/electronic-logbook/fishing-operation-profiles?fishermanCode=FSH-000123` | Tìm kiếm theo fisherman code |
| `GET` | `/api/electronic-logbook/fishing-operation-profiles?userId=<uuid>` | Tìm kiếm theo user ID |
| `GET` | `/api/electronic-logbook/fishing-operation-profiles/by-code/:fishermanCode` | Lấy profile theo code |
| `GET` | `/api/electronic-logbook/fishing-operation-profiles/:id` | Lấy profile theo ID |
| `POST` | `/api/electronic-logbook/fishing-operation-profiles` | Tạo profile (auto-gen code) |

### Test Scenarios

#### Scenario 1 — Tạo Fishing Operation Profile

```bash
# Login với token
TOKEN="Bearer $LOGBOOK_TOKEN"

# Tạo profile cho user
curl -s -X POST http://localhost:3000/api/electronic-logbook/fishing-operation-profiles \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "550e8400-e29b-41d4-a716-446655440000"}' | jq

# Response:
# {
#   "id": "uuid-here",
#   "fishermanCode": "FSH-000001",  ← Auto-generated!
#   "status": "ACTIVE",
#   "createdAt": "2026-09-16T..."
# }
```

**Expected**:
- Code bắt đầu từ FSH-000001
- Mỗi lần gọi tăng lên 1 (FSH-000002, FSH-000003...)
- Unique constraint ngăn trùng lặp

#### Scenario 2 — Tìm kiếm bằng Fisherman Code

```bash
# Tìm kiếm chính xác
curl -s "http://localhost:3000/api/electronic-logbook/fishing-operation-profiles?fishermanCode=FSH-000123" \
  -H "Authorization: $TOKEN" | jq

# Response:
# [{
#   "id": "uuid",
#   "fishermanCode": "FSH-000123",
#   "userId": "uuid-of-user",
#   "status": "ACTIVE",
#   "createdAt": "..."
# }]
```

#### Scenario 3 — Thêm thuyền viên vào tàu bằng Fisherman Code

```bash
# Lấy fisherman code trước
CODE="FSH-000123"

# Thêm vào vessel_crew (sử dụng fishermanCode)
curl -s -X POST http://localhost:3000/api/electronic-logbook/vessel-crew \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vesselId\": \"$VESSEL_UUID\",
    \"fishermanCode\": \"$CODE\",
    \"crewRole\": \"CREW\"
  }" | jq

# Backend tự resolve fishermanCode → userId
```

**Flow**:
```
fishermanCode → FishingOperationProfileService.resolveUserIdByCode()
                    ↓
               userId (resolved)
                    ↓
               vessel_crew.userId
```

#### Scenario 4 — Thêm thuyền viên vào chuyến biển bằng Fisherman Code

```bash
curl -s -X POST http://localhost:3000/api/electronic-logbook/fishing-trip-crew \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"fishingTripId\": \"$TRIP_UUID\",
    \"fishermanCode\": \"FSH-000123\",
    \"crewRole\": \"CAPTAIN\"
  }" | jq
```

#### Scenario 5 — Bảo vệ thông tin nhạy cảm

```bash
# KHÔNG hỗ trợ tìm kiếm bằng CCCD
curl -s "http://localhost:3000/api/electronic-logbook/fishing-operation-profiles?cccd=123456789" \
  -H "Authorization: $TOKEN"
# Expected: 400 Bad Request (parameter not allowed)

# KHÔNG expose CCCD trong response
curl -s "http://localhost:3000/api/electronic-logbook/fishing-operation-profiles?fishermanCode=FSH-000123" \
  -H "Authorization: $TOKEN" | jq
# Response KHÔNG chứa: cccd, dateOfBirth, addressLine, identityDocumentNumber...
```

#### Scenario 6 — INACTIVE Profile

```bash
# Profile INACTIVE không thể sử dụng để thêm crew
curl -s -X PATCH http://localhost:3000/api/electronic-logbook/fishing-operation-profiles/:id \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'

# Thử thêm vào tàu
curl -s -X POST http://localhost:3000/api/electronic-logbook/vessel-crew \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vesselId": "...", "fishermanCode": "FSH-000123"}'
# Expected: 400 Bad Request — "Fisherman with code FSH-000123 is inactive"
```

#### Scenario 7 — Concurrent Profile Creation

```bash
# Giả lập 10 requests đồng thời (sử dụng background jobs)
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/api/electronic-logbook/fishing-operation-profiles \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user-$i-uuid\"}" &
done
wait

# Kiểm tra tất cả codes unique
curl -s "http://localhost:3000/api/electronic-logbook/fishing-operation-profiles" \
  -H "Authorization: $TOKEN" | jq '[.[].fishermanCode] | unique | length'
# Expected: 10 (không trùng lặp)
```

### Integration với VesselCrew

```bash
# AddVesselCrewDto hỗ trợ 2 identification modes:
# 1. userId (backward compatible)
# 2. fishermanCode (PHASE 8 - preferred)

# Mode 1: userId trực tiếp
{
  "vesselId": "uuid",
  "userId": "uuid-of-user",
  "crewRole": "CREW"
}

# Mode 2: fishermanCode (tìm kiếm người trước)
{
  "vesselId": "uuid",
  "fishermanCode": "FSH-000123",
  "crewRole": "CREW"
}
```

### Authorization

- **Tìm kiếm profile**: Bất kỳ user nào đã authenticated đều có thể search
- **Tạo profile**: Cần quyền tạo (thường là quản lý tàu)
- **Thêm crew vào tàu**: Vẫn phải qua `ResourceAuthorizationGuard` — user phải có quyền với vessel

```bash
# User không có quyền với tàu cố thêm crew
curl -s -X POST http://localhost:3000/api/electronic-logbook/vessel-crew \
  -H "Authorization: $UNAUTHORIZED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vesselId": "$OTHER_USER_VESSEL", "fishermanCode": "FSH-000123"}'
# Expected: 403 Forbidden
```

### Tests

```bash
cd electronic-logbook-api
npm test -- --testPathPattern="fishing-operation-profile"
```

Expected:
- `fishing-operation-profile.service.spec.ts`: 16 tests passed

### Migration

```bash
npm run migration:run
# Chạy: 1789540000001-FishingOperationProfile.ts
```

---

*Cập nhật lần cuối: Theo Thông tư 31/2025/TT-BNNPTNT — Phụ lục II + PHASE 8 Fishing Operation Profile*
