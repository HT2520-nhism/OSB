# Hướng dẫn chi tiết: Lấy Microsoft ID Token để test API

## Tổng quan

API này sử dụng Microsoft Entra ID (Azure AD) để xác thực người dùng. Để test endpoint `/api/auth/login`, bạn cần có một Microsoft ID Token hợp lệ.

## Yêu cầu

- Email thuộc domain được phép: `@seacom.net.vn` hoặc `@osbholding.com`
- Microsoft Azure AD App Registration với:
  - `TENANT_ID`: ID của Azure AD tenant
  - `CLIENT_ID`: Application (client) ID
  - Token phải có các claims: `preferred_username`, `given_name`, `family_name`

## Các cách lấy Microsoft ID Token

### Cách 1: Sử dụng Azure Portal (Dễ nhất cho testing)

#### Bước 1: Đăng nhập Azure Portal

1. Truy cập: https://portal.azure.com
2. Đăng nhập bằng tài khoản Microsoft có domain `@seacom.net.vn` hoặc `@osbholding.com`

#### Bước 2: Lấy token từ Browser Developer Tools

1. Mở Azure Portal trong trình duyệt
2. Mở Developer Tools (F12)
3. Vào tab **Network** (Mạng)
4. Refresh trang Azure Portal
5. Tìm request đến `login.microsoftonline.com`
6. Trong request headers, tìm `Authorization: Bearer <token>`
7. Copy token đó để sử dụng

**Lưu ý**: Token này có thể là Access Token, không phải ID Token. Cần đảm bảo là ID Token.

### Cách 2: Sử dụng Postman (Khuyến nghị)

#### Bước 1: Tạo OAuth 2.0 Request trong Postman

1. Mở Postman
2. Tạo request mới: `POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token`
3. Vào tab **Authorization**
4. Chọn type: **OAuth 2.0**
5. Click **Get New Access Token**

#### Bước 2: Cấu hình OAuth 2.0

Điền thông tin sau:

```
Grant Type: Authorization Code
Callback URL: https://oauth.pstmn.io/v1/callback
Auth URL: https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize
Access Token URL: https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
Client ID: {CLIENT_ID}
Client Secret: {CLIENT_SECRET} (nếu có)
Scope: openid profile email
State: (để trống)
Client Authentication: Send as Basic Auth header
```

**Thay thế:**

- `{TENANT_ID}`: Tenant ID của bạn
- `{CLIENT_ID}`: Client ID của Azure AD App
- `{CLIENT_SECRET}`: Client Secret (nếu app yêu cầu)

#### Bước 3: Lấy Token

1. Click **Get New Access Token**
2. Đăng nhập bằng Microsoft account
3. Chấp nhận permissions
4. Copy **ID Token** (không phải Access Token)

### Cách 3: Sử dụng curl (Command Line)

#### Bước 1: Lấy Authorization Code

Mở trình duyệt và truy cập URL sau (thay thế các giá trị):

```bash
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize?\
client_id={CLIENT_ID}\
&response_type=code\
&redirect_uri=http://localhost:3000/callback\
&response_mode=query\
&scope=openid profile email\
&state=12345
```

Sau khi đăng nhập, bạn sẽ được redirect về `http://localhost:3000/callback?code={AUTHORIZATION_CODE}`

Copy `AUTHORIZATION_CODE` từ URL.

#### Bước 2: Đổi Authorization Code thành ID Token

```bash
curl -X POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id={CLIENT_ID}" \
  -d "client_secret={CLIENT_SECRET}" \
  -d "code={AUTHORIZATION_CODE}" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "grant_type=authorization_code" \
  -d "scope=openid profile email"
```

Response sẽ có dạng:

```json
{
  "token_type": "Bearer",
  "scope": "openid profile email",
  "expires_in": 3600,
  "access_token": "...",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ...",
  "refresh_token": "..."
}
```

Copy giá trị `id_token` để sử dụng.

### Cách 4: Sử dụng MSAL (Microsoft Authentication Library) - Node.js

#### Bước 1: Cài đặt MSAL

```bash
npm install @azure/msal-node
```

#### Bước 2: Tạo script lấy token

Xem file `scripts/get-microsoft-token.ts` trong project này.

#### Bước 3: Chạy script

```bash
npm run get-token
```

### Cách 5: Sử dụng Azure CLI

#### Bước 1: Đăng nhập Azure CLI

```bash
az login
```

#### Bước 2: Lấy token

```bash
az account get-access-token --resource https://graph.microsoft.com
```

**Lưu ý**: Token này là Access Token, không phải ID Token. Cần sử dụng cách khác để lấy ID Token.

### Cách 6: Sử dụng Browser Console (Nhanh nhất cho testing)

Mở Browser Console (F12) và chạy script sau:

```javascript
// Thay thế các giá trị này
const TENANT_ID = 'your-tenant-id';
const CLIENT_ID = 'your-client-id';
const REDIRECT_URI = 'http://localhost:3000/callback';

// Tạo authorization URL
const authUrl =
  `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `response_type=id_token&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_mode=fragment&` +
  `scope=openid profile email&` +
  `nonce=12345&` +
  `state=67890`;

console.log('Mở URL này trong trình duyệt:');
console.log(authUrl);

// Sau khi đăng nhập, bạn sẽ được redirect về redirect_uri với ID token trong URL fragment
// Ví dụ: http://localhost:3000/callback#id_token=eyJhbGciOiJSUzI1NiIs...
```

## Kiểm tra Token

### Decode JWT Token

Bạn có thể decode token tại: https://jwt.io

Token phải có các claims sau:

- `aud`: Phải bằng `CLIENT_ID`
- `iss`: Phải bằng `https://login.microsoftonline.com/{TENANT_ID}/v2.0`
- `preferred_username`: Email của user
- `given_name`: Tên của user
- `family_name`: Họ của user
- `email`: Email của user (nếu có)

### Test Token với API

1. Mở Swagger UI: http://localhost:3031/docs
2. Tìm endpoint `POST /api/auth/login`
3. Click "Try it out"
4. Paste ID token vào field `token`
5. Click "Execute"

## Troubleshooting

### Lỗi: "Email domain not allowed"

- Đảm bảo email trong token thuộc domain `@seacom.net.vn` hoặc `@osbholding.com`

### Lỗi: "Token không hợp lệ"

- Kiểm tra token chưa hết hạn
- Đảm bảo đang sử dụng ID Token, không phải Access Token
- Kiểm tra `aud` claim phải đúng với `CLIENT_ID`
- Kiểm tra `iss` claim phải đúng với tenant

### Lỗi: "Email not found in token"

- Đảm bảo token có claim `preferred_username` hoặc `email`

### Token hết hạn

- ID Token thường có thời gian sống ngắn (1 giờ)
- Cần lấy token mới khi token hết hạn

## Thông tin cấu hình cần thiết

Để lấy token, bạn cần các thông tin sau từ Azure AD App Registration:

### Cách lấy Tenant ID (QUAN TRỌNG!)

**Tenant ID** là một GUID (32 ký tự hex) có định dạng: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### Cách 1: Từ Azure Portal (Dễ nhất)

1. Đăng nhập vào [Azure Portal](https://portal.azure.com)
2. Tìm và click vào **Azure Active Directory** (hoặc **Microsoft Entra ID**)
3. Vào **Overview** (Tổng quan)
4. Tìm mục **Tenant ID** - đây là giá trị bạn cần
5. Copy Tenant ID (ví dụ: `12345678-1234-1234-1234-123456789abc`)

**⚠️ LƯU Ý QUAN TRỌNG:**
- Tenant ID phải là một GUID hợp lệ, KHÔNG phải là text `{TENANT_ID}` hoặc `{tenant_id}`
- Tenant ID có định dạng: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (32 ký tự hex với dấu gạch ngang)
- Nếu bạn thấy lỗi "Specified tenant identifier '{tenant_id}' is neither a valid DNS name", nghĩa là bạn chưa thay thế placeholder bằng Tenant ID thực tế

#### Cách 2: Từ URL Azure Portal

Khi bạn đăng nhập Azure Portal, URL sẽ có dạng:
```
https://portal.azure.com/#@yourdomain.onmicrosoft.com/resource/...
```

Hoặc bạn có thể xem Tenant ID trong URL của Azure AD:
```
https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview
```

#### Cách 3: Sử dụng Azure CLI

```bash
az login
az account show --query tenantId --output tsv
```

#### Cách 4: Từ PowerShell

```powershell
Connect-AzAccount
Get-AzContext | Select-Object -ExpandProperty Tenant
```

### Cách lấy Client ID

1. Đăng nhập vào [Azure Portal](https://portal.azure.com)
2. Tìm và click vào **Azure Active Directory** > **App registrations**
3. Tìm và click vào ứng dụng của bạn (hoặc tạo mới nếu chưa có)
4. Vào **Overview** (Tổng quan)
5. Tìm mục **Application (client) ID** - đây là Client ID bạn cần
6. Copy Client ID (ví dụ: `87654321-4321-4321-4321-cba987654321`)

### Cách lấy Client Secret (nếu cần)

1. Trong App Registration, vào **Certificates & secrets**
2. Click **New client secret**
3. Nhập mô tả và chọn thời hạn hết hạn
4. Click **Add**
5. **QUAN TRỌNG**: Copy giá trị Secret ngay lập tức (bạn sẽ không thể xem lại sau khi đóng trang)
6. Lưu Secret này ở nơi an toàn

### Ví dụ cấu hình đúng

```bash
# ✅ ĐÚNG - Tenant ID là GUID thực tế
TENANT_ID=12345678-1234-1234-1234-123456789abc
MS_CLIENT_ID=87654321-4321-4321-4321-cba987654321

# ❌ SAI - Vẫn là placeholder
TENANT_ID={TENANT_ID}
TENANT_ID=your-tenant-id
TENANT_ID={tenant_id}
```

### Kiểm tra Tenant ID hợp lệ

Tenant ID phải:
- ✅ Có định dạng GUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ Có 36 ký tự (32 hex + 4 dấu gạch ngang)
- ✅ Chỉ chứa chữ số và chữ cái a-f (hex)
- ❌ KHÔNG được chứa text như `{TENANT_ID}` hoặc `your-tenant-id`

## Tài liệu tham khảo

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [OAuth 2.0 Authorization Code Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [MSAL Node.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
