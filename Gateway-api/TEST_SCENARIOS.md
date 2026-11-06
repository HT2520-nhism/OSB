# Kịch bản Test Logbook-Identity API + Notification API

## Chuẩn bị

### 1. Kiểm tra Services đang chạy

| Service | Port | URL |
|---------|------|-----|
| logboook-identity-api | 3041 | http://localhost:3041 |
| notification-api | 3035 | http://localhost:3035 |
| Gateway-api | 3030 | http://localhost:3030 |

### 2. Cấu hình SMTP (.env notification-api)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=SATURN
SMTP_FROM_EMAIL=your-email@gmail.com
```

---

## 1. ĐĂNG KÝ TÀI KHOẢN (Register)

### POST /api/auth/register (Direct logboook-identity-api)
**URL:** http://localhost:3041/api/auth/register

```json
{
  "fullName": "Nguyễn Văn A",
  "identifierType": "EMAIL",
  "identifier": "nguyenvana@example.com",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "nationality": "Vietnamese",
  "placeOfBirth": "Hanoi, Vietnam",
  "identityDocumentNumber": "012345678901",
  "provinceCode": "HN",
  "districtCode": "D001",
  "wardCode": "W001"
}
```

### POST /logbook/auth/register (Qua Gateway)
**URL:** http://localhost:3030/logbook/auth/register

```json
{
  "fullName": "Trần Thị B",
  "identifierType": "PHONE",
  "identifier": "+84901234567",
  "dateOfBirth": "1992-03-20",
  "gender": "Female"
}
```

### Expected Response (201 Created)

```json
{
  "response": {
    "accountId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "nguyenvana@example.com",
    "status": "PENDING",
    "message": "Registration successful. Please verify your email."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Email nhận được

- **Template:** `user.registered`
- **Subject:** Tài khoản của bạn đã được tạo - SATURN
- **Nội dung:** Thông tin đăng nhập + mật khẩu tạm

---

## 2. ĐĂNG NHẬP (Login)

### POST /api/auth/login (Direct)
**URL:** http://localhost:3041/api/auth/login

```json
{
  "identifierType": "EMAIL",
  "identifier": "nguyenvana@example.com",
  "password": "TempPassword123!"
}
```

### POST /logbook/auth/login (Qua Gateway)
**URL:** http://localhost:3030/logbook/auth/login

```json
{
  "identifierType": "EMAIL",
  "identifier": "nguyenvana@example.com",
  "password": "TempPassword123!"
}
```

### Headers (tự động thêm bởi Gateway)
```
X-Forwarded-For: 192.168.1.1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
```

### Expected Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "account": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "nguyenvana@example.com",
    "status": "ACTIVE",
    "accountType": "FISHERMAN"
  }
}
```

### Email nhận được (nếu thiết bị mới)

- **Template:** `identity.login.new_device`
- **Subject:** Đăng nhập từ thiết bị mới - SATURN
- **Thông tin:** Device, Platform, IP, Location, Login Time

---

## 3. LÀM MỚI TOKEN (Refresh Token)

### POST /api/auth/refresh

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Expected Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

## 4. ĐĂNG XUẤT (Logout)

### POST /api/auth/logout

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expected Response (204 No Content)

---

## 5. QUÊN MẬT KHẨU (Forgot Password)

### POST /api/auth/forgot-password

```json
{
  "identifierType": "EMAIL",
  "identifier": "nguyenvana@example.com"
}
```

### Expected Response (200 OK)

```json
{
  "message": "Verification code sent to your email",
  "expiresIn": 5
}
```

### Email nhận được

- **Template:** `identity.password_reset`
- **Subject:** Đặt lại mật khẩu - SATURN
- **Nội dung:** OTP 6 số (có hiệu lực 5 phút)

---

## 6. ĐẶT LẠI MẬT KHẨU (Reset Password)

### POST /api/auth/reset-password

```json
{
  "identifierType": "EMAIL",
  "identifier": "nguyenvana@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

### Expected Response (200 OK)

```json
{
  "message": "Password reset successfully"
}
```

### Email nhận được

- **Template:** `identity.password_changed`
- **Subject:** Mật khẩu đã được thay đổi - SATURN
- **Thông tin:** Thời gian đổi mật khẩu

---

## 7. TẠO FISHERMAN PROFILE

### POST /api/fisherman-profiles/:accountId/profile

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL:** http://localhost:3041/api/fisherman-profiles/550e8400-e29b-41d4-a716-446655440000/profile

```json
{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "nationality": "Vietnamese",
  "placeOfBirth": "Hanoi, Vietnam",
  "identityDocumentType": "CCCD",
  "identityDocumentNumber": "012345678901",
  "identityDocumentIssuedDate": "2020-01-01",
  "identityDocumentIssuedPlace": "Hanoi Police Department",
  "identityDocumentExpiryDate": "2030-01-01",
  "addressLine": "123 Main Street, Ward 1, District 1",
  "provinceCode": "HN",
  "districtCode": "D001",
  "wardCode": "W001",
  "emergencyContactName": "Trần Thị B",
  "emergencyContactPhone": "+84987654321"
}
```

### POST /logbook/fisherman-profiles/:accountId/profile (Qua Gateway)

**URL:** http://localhost:3030/logbook/fisherman-profiles/550e8400-e29b-41d4-a716-446655440000/profile

### Expected Response (201 Created)

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "accountId": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "Nguyễn Văn A",
  "status": "ACTIVE",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "nationality": "Vietnamese",
  "placeOfBirth": "Hanoi, Vietnam",
  "identityDocument": {
    "type": "CCCD",
    "number": "012345678901",
    "issuedDate": "2020-01-01",
    "issuedPlace": "Hanoi Police Department",
    "expiryDate": "2030-01-01"
  },
  "address": {
    "addressLine": "123 Main Street, Ward 1, District 1",
    "provinceCode": "HN",
    "districtCode": "D001",
    "wardCode": "W001"
  },
  "emergencyContact": {
    "name": "Trần Thị B",
    "phone": "+84987654321"
  },
  "createdAt": "2026-08-20T10:00:00Z",
  "updatedAt": "2026-08-20T10:00:00Z"
}
```

---

## 8. LẤY THÔNG TIN FISHERMAN PROFILE

### GET /api/fisherman-profiles/:accountId/profile

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expected Response (200 OK)

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "accountId": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "Nguyễn Văn A",
  "status": "ACTIVE",
  ...
}
```

---

## 9. CẬP NHẬT FISHERMAN PROFILE

### PATCH /api/fisherman-profiles/:accountId/profile

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "addressLine": "456 New Street, Ward 2, District 2",
  "emergencyContactPhone": "+84912345678"
}
```

---

## 10. LẤY THÔNG TIN ACCOUNT

### GET /api/accounts/:id

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expected Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nguyenvana@example.com",
  "phone": null,
  "status": "ACTIVE",
  "accountType": "FISHERMAN",
  "failedLoginAttempts": 0,
  "lockedUntil": null,
  "createdAt": "2026-08-20T10:00:00Z",
  "updatedAt": "2026-08-20T10:00:00Z"
}
```

---

## 11. CẬP NHẬT ACCOUNT

### PATCH /api/accounts/:id

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "status": "ACTIVE"
}
```

---

## 12. THÊM ACCOUNT IDENTIFIER

### POST /api/account-identifiers/:accountId/identifiers

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "type": "PHONE",
  "value": "+84901234567",
  "isPrimary": true
}
```

### Expected Response (201 Created)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "accountId": "550e8400-e29b-41d4-a716-446655440000",
  "identifierType": "PHONE",
  "identifier": "+84901234567",
  "isPrimary": true,
  "isVerified": false,
  "createdAt": "2026-08-20T10:00:00Z"
}
```

---

## 13. LẤY DANH SÁCH IDENTIFIERS

### GET /api/account-identifiers/:accountId/identifiers

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expected Response (200 OK)

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "accountId": "550e8400-e29b-41d4-a716-446655440000",
    "identifierType": "EMAIL",
    "identifier": "nguyenvana@example.com",
    "isPrimary": true,
    "isVerified": true
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "accountId": "550e8400-e29b-41d4-a716-446655440000",
    "identifierType": "PHONE",
    "identifier": "+84901234567",
    "isPrimary": false,
    "isVerified": false
  }
]
```

---

## 14. CẬP NHẬT IDENTIFIER

### PATCH /api/account-identifiers/:accountId/identifiers/:identifierId

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "isPrimary": true
}
```

---

## Test qua Gateway API (Tổng hợp)

| STT | Endpoint | Method | Auth | Mô tả |
|-----|----------|--------|------|-------|
| 1 | /logbook/auth/register | POST | No | Đăng ký tài khoản mới |
| 2 | /logbook/auth/login | POST | No | Đăng nhập |
| 3 | /logbook/auth/refresh | POST | No | Làm mới token |
| 4 | /logbook/auth/logout | POST | Yes | Đăng xuất |
| 5 | /logbook/accounts | POST | Yes | Tạo account |
| 6 | /logbook/accounts/:id | GET | Yes | Lấy thông tin account |
| 7 | /logbook/accounts/:id | PATCH | Yes | Cập nhật account |
| 8 | /logbook/accounts/:id/notification-info | GET | Yes | Lấy info cho notification |
| 9 | /logbook/fisherman-profiles/:accountId/profile | POST | Yes | Tạo fisherman profile |
| 10 | /logbook/fisherman-profiles/:accountId/profile | GET | Yes | Lấy fisherman profile |
| 11 | /logbook/fisherman-profiles/:accountId/profile | PATCH | Yes | Cập nhật fisherman profile |
| 12 | /logbook/account-identifiers/:accountId/identifiers | POST | Yes | Thêm identifier |
| 13 | /logbook/account-identifiers/:accountId/identifiers | GET | Yes | Lấy danh sách identifiers |
| 14 | /logbook/account-identifiers/:accountId/identifiers/:id | PATCH | Yes | Cập nhật identifier |

---

## Luồng Test Đầy Đủ

```
1. REGISTER (nhận email với mật khẩu tạm)
   ↓
2. LOGIN (nhận accessToken + refreshToken)
   ↓
3. GET ACCOUNT INFO (xác nhận account đã tạo)
   ↓
4. CREATE FISHERMAN PROFILE (tạo profile chi tiết)
   ↓
5. ADD PHONE IDENTIFIER (thêm số điện thoại)
   ↓
6. REFRESH TOKEN (làm mới access token)
   ↓
7. LOGOUT (đăng xuất)
```

### Test Quên/Đặt lại mật khẩu

```
1. FORGOT PASSWORD (nhận email với OTP)
   ↓
2. RESET PASSWORD với OTP (đổi mật khẩu mới)
   ↓
3. LOGIN với mật khẩu mới
   ↓
4. LOGIN thất bại nhiều lần (nhận email account locked)
```

---

## Các Enum Values

### IdentifierType
- `EMAIL`
- `PHONE`

### AccountType
- `FISHERMAN`
- `ADMIN`

### IdentityDocumentType
- `CCCD` - Căn cước công dân
- `CMND` - Chứng minh nhân dân
- `PASSPORT` - Hộ chiếu

### AccountStatus
- `PENDING` - Chờ xác minh
- `ACTIVE` - Hoạt động
- `SUSPENDED` - Tạm ngưng
- `LOCKED` - Bị khóa

### ProfileStatus
- `PENDING` - Chờ duyệt
- `ACTIVE` - Hoạt động
- `REJECTED` - Bị từ chối
- `EXPIRED` - Hết hạn

---

## Lưu ý quan trọng

1. **Services:** Đảm bảo tất cả services đang chạy trước khi test
2. **Email:** Cần cấu hình SMTP đúng để nhận email
3. **Database:** Chạy migrations trước khi test
4. **Templates:** Notification service sẽ tự động seed email templates khi khởi động
5. **OTP:** Mã OTP có hiệu lực trong 5 phút
6. **Rate Limit:** Có thể có giới hạn số lần request (đặc biệt với OTP)
