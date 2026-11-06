# UI-DATA-CONTRACT.md

> **Phase:** API/Gateway Data Contract for Mobile + Web
> **Version:** 2.0
> **Updated:** 2025-01-15

---

## Mục tiêu

Cung cấp API response đầy đủ cho từng màn hình Mobile/Web, giảm thiểu số request cần thiết.

**Nguyên tắc thiết kế:**
- 1 màn hình = 1 API call tối đa
- Response phải client-ready (không cần frontend tự join)
- Business logic vẫn thuộc domain service
- Gateway chỉ orchestration và aggregation

---

## Screen Matrix

### 1. Dashboard

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Captain, Owner |
| **API** | `GET /api/electronic-logbook/dashboard` |
| **Priority** | Mobile HIGH, Web HIGH |

**Required Data:**
```json
{
  "myVessels": {
    "count": 0,
    "vessels": [
      {
        "id": "uuid",
        "registrationNumber": "CT-001",
        "vesselName": "Tàu Thắng Lợi",
        "status": "ACTIVE"
      }
    ]
  },
  "activeTrips": {
    "count": 0,
    "trips": [
      {
        "id": "uuid",
        "tripNumber": "1",
        "status": "FISHING",
        "vesselName": "Tàu Thắng Lợi",
        "departureAt": "2025-01-15T06:00:00Z"
      }
    ]
  },
  "pendingSync": {
    "count": 0,
    "oldestPendingAt": "2025-01-15T06:00:00Z"
  }
}
```

---

### 2. Vessel List

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Owner |
| **API** | `GET /api/electronic-logbook/vessels?page=1&limit=20` |
| **Priority** | Mobile HIGH, Web HIGH |

**Required Data:**
```json
{
  "data": [
    {
      "id": "uuid",
      "registrationNumber": "CT-001",
      "vesselName": "Tàu Thắng Lợi",
      "vesselType": "Tàu khai thác thủy sản",
      "length": 24.5,
      "status": "ACTIVE",
      "provinceCode": "92",
      "ownerName": "Nguyễn Văn A",
      "activeTrip": {
        "id": "uuid",
        "status": "FISHING"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 3. Vessel Detail

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Owner, Admin |
| **API** | `GET /api/electronic-logbook/vessels/:id` |
| **Priority** | Mobile HIGH, Web HIGH |

**Required Data:**
```json
{
  "vessel": {
    "id": "uuid",
    "registrationNumber": "CT-001",
    "vesselName": "Tàu Thắng Lợi",
    "vesselType": "Tàu khai thác thủy sản",
    "length": 24.5,
    "width": 6.8,
    "depth": 3.2,
    "grossTonnage": 120.0,
    "enginePower": 450.0,
    "status": "ACTIVE",
    "provinceCode": "92",
    "districtCode": "921",
    "wardCode": "92101",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-10T00:00:00Z"
  },
  "owner": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "Nguyễn Văn A",
    "ownershipType": "OWNER",
    "isCurrent": true
  },
  "captain": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "Trần Văn B",
    "fishermanCode": "FSH-001",
    "crewRole": "CAPTAIN",
    "isActive": true
  },
  "crew": [
    {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "Lê Văn C",
      "fishermanCode": "FSH-002",
      "crewRole": "FISHERMAN",
      "isActive": true
    }
  ],
  "gear": [
    {
      "id": "uuid",
      "name": "Lưới kéo đáy",
      "gearType": "TRAWL",
      "quantity": 2
    }
  ],
  "statistics": {
    "totalTrips": 15,
    "completedTrips": 12,
    "totalCatch": 4500.0,
    "crewCount": 8
  }
}
```

---

### 4. Fishing Trip List

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Captain, Owner |
| **API** | `GET /api/electronic-logbook/fishing-trips?page=1&limit=20` |
| **Priority** | Mobile HIGH, Web HIGH |

**Required Data:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tripNumber": "1",
      "vessel": {
        "id": "uuid",
        "registrationNumber": "CT-001",
        "vesselName": "Tàu Thắng Lợi"
      },
      "status": "COMPLETED",
      "submissionStatus": "SUBMITTED",
      "departureAt": "2025-01-15T06:00:00Z",
      "arrivalAt": "2025-01-16T07:00:00Z",
      "departurePortCode": "92101",
      "arrivalPortCode": "92101",
      "catchSummary": {
        "totalWeight": 350.0,
        "speciesCount": 2
      },
      "crewCount": 8,
      "operationCount": 2,
      "documentCount": 3,
      "createdAt": "2025-01-14T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 5. Fishing Trip Overview (CRITICAL)

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Captain, Owner |
| **API** | `GET /api/electronic-logbook/fishing-trips/:id/overview` |
| **Priority** | Mobile CRITICAL, Web CRITICAL |

**Required Data:**
```json
{
  "trip": {
    "id": "uuid",
    "tripNumber": "1",
    "status": "FISHING",
    "submissionStatus": "NOT_SUBMITTED",
    "departurePortCode": "92101",
    "arrivalPortCode": "92101",
    "departureAt": "2025-01-15T06:00:00Z",
    "arrivalAt": "2025-01-16T07:00:00Z",
    "createdAt": "2025-01-14T00:00:00Z",
    "updatedAt": "2025-01-15T08:00:00Z"
  },
  "vessel": {
    "id": "uuid",
    "registrationNumber": "CT-001",
    "vesselName": "Tàu Thắng Lợi",
    "vesselType": "Tàu khai thác thủy sản",
    "length": 24.5,
    "width": 6.8,
    "depth": 3.2,
    "grossTonnage": 120.0,
    "enginePower": 450.0,
    "provinceCode": "92"
  },
  "captain": {
    "userId": "uuid",
    "fullName": "Trần Văn B",
    "fishermanCode": "FSH-001",
    "crewRole": "CAPTAIN"
  },
  "crew": [
    {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "Lê Văn C",
      "fishermanCode": "FSH-002",
      "crewRole": "FISHERMAN",
      "joinedAt": "2025-01-15T06:00:00Z"
    }
  ],
  "gear": [
    {
      "id": "uuid",
      "name": "Lưới kéo đáy",
      "gearType": "TRAWL",
      "quantity": 2
    }
  ],
  "operations": [
    {
      "id": "uuid",
      "latitude": 9.52345,
      "longitude": 104.12345,
      "operationStartedAt": "2025-01-15T08:00:00Z",
      "operationEndedAt": "2025-01-15T14:00:00Z",
      "operationType": "TRAWL",
      "fishingGearType": "Lưới kéo đáy",
      "fishingGround": "Vùng biển Tây Nam",
      "depth": 45.0,
      "catches": [
        {
          "id": "uuid",
          "speciesCode": "TRA",
          "speciesName": "Cá Tra",
          "quantity": 150.0,
          "unit": "kg",
          "estimatedQuantity": 160.0,
          "condition": "FRESH"
        }
      ]
    }
  ],
  "catchSummary": {
    "totalWeight": 350.0,
    "speciesCount": 2,
    "bySpecies": [
      {
        "speciesCode": "TRA",
        "speciesName": "Cá Tra",
        "totalQuantity": 150.0,
        "unit": "kg"
      },
      {
        "speciesCode": "BAS",
        "speciesName": "Cá Bạc",
        "totalQuantity": 200.0,
        "unit": "kg"
      }
    ]
  },
  "landing": {
    "id": "uuid",
    "landingPortCode": "92101",
    "landedAt": "2025-01-16T07:00:00Z",
    "totalQuantity": 350.0,
    "catches": [
      {
        "id": "uuid",
        "speciesCode": "TRA",
        "speciesName": "Cá Tra",
        "quantity": 150.0,
        "unit": "kg"
      }
    ]
  },
  "portCalls": [
    {
      "id": "uuid",
      "portCode": "92101",
      "callType": "DEPARTURE",
      "occurredAt": "2025-01-15T07:30:00Z",
      "latitude": 10.035,
      "longitude": 105.787,
      "reason": "Rời cảng khai thác"
    },
    {
      "id": "uuid",
      "portCode": "92101",
      "callType": "ARRIVAL",
      "occurredAt": "2025-01-16T06:00:00Z",
      "latitude": 10.035,
      "longitude": 105.787,
      "reason": "Cập cảng bốc dỡ"
    }
  ],
  "incidents": [],
  "fuelRecords": [
    {
      "id": "uuid",
      "recordType": "CONSUMPTION",
      "quantity": 800.0,
      "unit": "lít",
      "occurredAt": "2025-01-16T06:00:00Z",
      "location": "Vùng biển Tây Nam"
    }
  ],
  "forms": {
    "m03": {
      "id": "uuid",
      "status": "APPROVED",
      "submittedAt": "2025-01-15T07:00:00Z",
      "inspectionDate": "2025-01-15",
      "conclusion": "Đạt yêu cầu"
    },
    "m02": null,
    "m01": null
  },
  "documents": [
    {
      "id": "uuid",
      "documentCode": "DOC-001",
      "documentType": "image",
      "originalFileName": "landing-photo.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 123456,
      "uploadedAt": "2025-01-16T07:30:00Z"
    }
  ],
  "workflow": {
    "currentStep": "FISHING",
    "completedSteps": ["DRAFT", "PREPARING", "DEPARTED"],
    "nextStep": "RETURNING",
    "requiredActions": [],
    "canDepart": false,
    "canStartFishing": false,
    "canReturn": true,
    "canComplete": false
  },
  "sync": {
    "status": "SYNCED",
    "lastSyncedAt": "2025-01-15T08:00:00Z",
    "pendingChanges": 0
  }
}
```

---

### 6. M01 - Giấy biên nhận bốc dỡ (CRITICAL)

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Captain |
| **API** | `GET /api/electronic-logbook/forms/m01/:formSubmissionId/overview` |
| **Priority** | Mobile CRITICAL, Web CRITICAL |

**Required Data (đối chiếu với Phụ lục II):**
```json
{
  "form": {
    "id": "uuid",
    "status": "APPROVED",
    "version": 1,
    "submittedAt": "2025-01-16T08:00:00Z",
    "approvedAt": "2025-01-16T10:00:00Z"
  },
  "formDefinition": {
    "formCode": "M01",
    "name": "Giấy biên nhận sản phẩm thủy sản khai thác bốc dỡ",
    "version": "1.0"
  },
  "receipt": {
    "issuanceDate": "2025-01-16",
    "serialNumber": "M01-2025-001"
  },
  "unloadingLocation": {
    "portCode": "92101",
    "address": "Cảng cá Cần Thơ, Xã Mỹ Khánh, Huyện Phong Điền, TP Cần Thơ"
  },
  "vessel": {
    "registrationNumber": "CT-001",
    "vesselName": "Tàu Thắng Lợi",
    "length": 24.5,
    "lengthCategory": "24m-40m",
    "vesselType": "Tàu khai thác thủy sản"
  },
  "owner": {
    "fullName": "Nguyễn Văn A",
    "address": "123 Đường 3/2, Ninh Kiều, Cần Thơ"
  },
  "captain": {
    "name": "Trần Văn B",
    "idNumber": "025123456789",
    "fishermanCode": "FSH-001"
  },
  "fishingLicense": {
    "number": "GP-2025-CT-001",
    "expiryDate": "2026-01-01"
  },
  "gear": [
    {
      "gearType": "TRAWL",
      "quantity": 2,
      "name": "Lưới kéo đáy"
    }
  ],
  "species": [
    {
      "speciesCode": "TRA",
      "speciesName": "Cá Tra (Pangasianodon hypophthalmus)",
      "harvestedQuantity": 150.0,
      "purchasedQuantity": 150.0,
      "unit": "kg",
      "buyer": {
        "name": "Công ty TNHH Thủy sản Miền Tây",
        "organization": "CTY-TS-001",
        "address": "123 Đường 3/2, Ninh Kiều, Cần Thơ"
      }
    },
    {
      "speciesCode": "BAS",
      "speciesName": "Cá Bạc (Secutor interruptus)",
      "harvestedQuantity": 200.0,
      "purchasedQuantity": 200.0,
      "unit": "kg",
      "buyer": {
        "name": "Công ty TNHH Thủy sản Miền Tây",
        "organization": "CTY-TS-001",
        "address": "123 Đường 3/2, Ninh Kiều, Cần Thơ"
      }
    }
  ],
  "totals": {
    "totalHarvested": 350.0,
    "totalPurchased": 350.0,
    "unit": "kg"
  },
  "confirmation": {
    "status": "CONFIRMED",
    "confirmedQuantity": 350.0,
    "buyerName": "Công ty TNHH Thủy sản Miền Tây",
    "confirmedAt": "2025-01-16T12:00:00Z"
  },
  "trip": {
    "id": "uuid",
    "tripNumber": "1",
    "departureAt": "2025-01-15T06:00:00Z",
    "arrivalAt": "2025-01-16T07:00:00Z"
  }
}
```

---

### 7. M02 - Biên bản kiểm tra cập cảng (CRITICAL)

| Aspect | Detail |
|--------|--------|
| **User Role** | Inspector, Admin |
| **API** | `GET /api/electronic-logbook/forms/m02/:formSubmissionId/overview` |
| **Priority** | Mobile CRITICAL, Web CRITICAL |

**Required Data (đối chiếu với Phụ lục II):**
```json
{
  "form": {
    "id": "uuid",
    "status": "APPROVED",
    "version": 1,
    "submittedAt": "2025-01-16T09:00:00Z",
    "approvedAt": "2025-01-16T11:00:00Z"
  },
  "formDefinition": {
    "formCode": "M02",
    "name": "Biên bản kiểm tra tàu cá cập cảng",
    "version": "1.0"
  },
  "inspection": {
    "serialNumber": "M02-2025-001",
    "inspectionDate": "2025-01-16",
    "inspectionTime": "08:00",
    "inspectionUnit": "Chi cục Thủy sản Cần Thơ",
    "portCode": "92101",
    "portAddress": "Cảng cá Cần Thơ, Xã Mỹ Khánh, Huyện Phong Điền, TP Cần Thơ",
    "inspectors": [
      {
        "name": "Ông Phạm Văn D",
        "position": "Kiểm tra viên"
      }
    ]
  },
  "vessel": {
    "registrationNumber": "CT-001",
    "vesselName": "Tàu Thắng Lợi",
    "vesselType": "Tàu khai thác thủy sản",
    "length": 24.5,
    "grossTonnage": 120.0
  },
  "owner": {
    "fullName": "Nguyễn Văn A",
    "address": "123 Đường 3/2, Ninh Kiều, Cần Thơ"
  },
  "captain": {
    "fullName": "Trần Văn B",
    "address": "456 Đường 30/4, Ninh Kiều, Cần Thơ",
    "fishermanCode": "FSH-001"
  },
  "previousTrip": {
    "tripNumber": "1",
    "departurePortCode": "92101",
    "departureAt": "2025-01-15T06:00:00Z"
  },
  "documents": {
    "fishingReport": true,
    "fishingLogbook": true
  },
  "catchComparison": {
    "reportedQuantity": 350.0,
    "actualQuantity": 350.0,
    "unit": "kg",
    "matched": true,
    "bySpecies": [
      {
        "speciesCode": "TRA",
        "speciesName": "Cá Tra",
        "reportedQuantity": 150.0,
        "actualQuantity": 150.0,
        "matched": true
      },
      {
        "speciesCode": "BAS",
        "speciesName": "Cá Bạc",
        "reportedQuantity": 200.0,
        "actualQuantity": 200.0,
        "matched": true
      }
    ]
  },
  "conclusion": "Khớp lệnh",
  "notes": "Sản lượng khai thác khớp với báo cáo",
  "trip": {
    "id": "uuid",
    "tripNumber": "1"
  }
}
```

---

### 8. M03 - Biên bản kiểm tra rời cảng (CRITICAL)

| Aspect | Detail |
|--------|--------|
| **User Role** | Inspector, Admin |
| **API** | `GET /api/electronic-logbook/forms/m03/:formSubmissionId/overview` |
| **Priority** | Mobile CRITICAL, Web CRITICAL |

**Required Data (đối chiếu với Phụ lục II):**
```json
{
  "form": {
    "id": "uuid",
    "status": "APPROVED",
    "version": 1,
    "submittedAt": "2025-01-15T07:30:00Z",
    "approvedAt": "2025-01-15T08:00:00Z"
  },
  "formDefinition": {
    "formCode": "M03",
    "name": "Biên bản kiểm tra tàu cá rời cảng",
    "version": "1.0"
  },
  "inspection": {
    "serialNumber": "M03-2025-001",
    "inspectionDate": "2025-01-15",
    "inspectionTime": "07:00",
    "inspectionUnit": "Chi cục Thủy sản Cần Thơ",
    "portCode": "92101",
    "portAddress": "Cảng cá Cần Thơ, Xã Mỹ Khánh, Huyện Phong Điền, TP Cần Thơ",
    "inspectors": [
      {
        "name": "Ông Trần Văn B",
        "position": "Trưởng đoàn kiểm tra"
      },
      {
        "name": "Bà Lê Thị C",
        "position": "Kiểm tra viên"
      }
    ]
  },
  "vessel": {
    "registrationNumber": "CT-001",
    "vesselName": "Tàu Thắng Lợi",
    "vesselType": "Tàu khai thác thủy sản",
    "length": 24.5,
    "grossTonnage": 120.0,
    "enginePower": 450.0
  },
  "owner": {
    "fullName": "Nguyễn Văn A",
    "ownershipType": "Chủ tàu"
  },
  "captain": {
    "fullName": "Trần Văn B",
    "fishermanCode": "FSH-001"
  },
  "documents": {
    "vesselRegistration": true,
    "crewList": true,
    "technicalSafetyCertificate": true,
    "captainQualification": true,
    "fishingLicense": true,
    "chiefEngineerQualification": true,
    "fishingLogbookOrPurchase": true,
    "foodSafetyCertificate": true,
    "allValid": true
  },
  "equipment": {
    "navigationEquipment": "T",
    "lifesavingFirefighting": "T",
    "communicationSignaling": "T",
    "vesselMonitoring": "T",
    "allPassed": true
  },
  "fishingOccupations": [
    {
      "code": "TRAWL",
      "name": "Nghề lưới kéo",
      "checked": true
    },
    {
      "code": "PURSE_SEINE",
      "name": "Nghề lưới vây",
      "checked": false
    }
  ],
  "vesselMarking": true,
  "crewCount": 8,
  "previousTrip": {
    "tripNumber": "0",
    "fishingReportSubmitted": true,
    "fishingLogbookSubmitted": true,
    "allSubmitted": true
  },
  "conclusion": "Đạt yêu cầu",
  "notes": "Tàu đủ điều kiện rời cảng",
  "trip": {
    "id": "uuid",
    "tripNumber": "1"
  }
}
```

---

### 9. Landing Detail

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Captain |
| **API** | `GET /api/electronic-logbook/landing-records/:id/overview` |
| **Priority** | Mobile HIGH, Web HIGH |

**Required Data:**
```json
{
  "landing": {
    "id": "uuid",
    "landingPortCode": "92101",
    "portName": "Cảng cá Cần Thơ",
    "landedAt": "2025-01-16T07:00:00Z",
    "totalQuantity": 350.0,
    "unit": "kg",
    "notes": "Tổng sản lượng 2 lần khai thác",
    "createdAt": "2025-01-16T07:00:00Z"
  },
  "trip": {
    "id": "uuid",
    "tripNumber": "1",
    "departureAt": "2025-01-15T06:00:00Z"
  },
  "vessel": {
    "id": "uuid",
    "registrationNumber": "CT-001",
    "vesselName": "Tàu Thắng Lợi"
  },
  "catches": [
    {
      "id": "uuid",
      "speciesCode": "TRA",
      "speciesName": "Cá Tra",
      "quantity": 150.0,
      "unit": "kg"
    },
    {
      "id": "uuid",
      "speciesCode": "BAS",
      "speciesName": "Cá Bạc",
      "quantity": 200.0,
      "unit": "kg"
    }
  ],
  "operations": [
    {
      "id": "uuid",
      "operationType": "TRAWL",
      "operationStartedAt": "2025-01-15T08:00:00Z",
      "operationEndedAt": "2025-01-15T14:00:00Z",
      "catchCount": 1
    }
  ]
}
```

---

### 10. Sync Status

| Aspect | Detail |
|--------|--------|
| **User Role** | Fisherman, Captain |
| **API** | `GET /api/electronic-logbook/sync/status` |
| **Priority** | Mobile HIGH, Web MEDIUM |

**Required Data:**
```json
{
  "device": {
    "deviceId": "uuid",
    "platform": "android",
    "appVersion": "1.0.0",
    "lastSyncAt": "2025-01-15T08:00:00Z"
  },
  "pending": {
    "count": 3,
    "operations": [
      {
        "operationId": "op-001",
        "entityType": "FISHING_OPERATION",
        "operationType": "CREATE",
        "createdAt": "2025-01-15T08:00:00Z"
      }
    ]
  },
  "conflicts": {
    "count": 1,
    "conflicts": [
      {
        "id": "uuid",
        "entityType": "CATCH_RECORD",
        "entityId": "uuid",
        "detectedAt": "2025-01-15T09:00:00Z",
        "resolution": "PENDING"
      }
    ]
  },
  "lastSync": {
    "at": "2025-01-15T08:00:00Z",
    "status": "SUCCESS",
    "operationsProcessed": 10
  }
}
```

---

## Implementation Status

| Screen | API | Status | Priority |
|--------|-----|--------|----------|
| Dashboard | `GET /dashboard` | 🔴 NOT IMPLEMENTED | HIGH |
| Vessel List | `GET /vessels` | ✅ ADEQUATE | HIGH |
| Vessel Detail | `GET /vessels/:id` | 🟡 PARTIAL | HIGH |
| Trip List | `GET /fishing-trips` | 🟡 PARTIAL | HIGH |
| **Trip Overview** | `GET /fishing-trips/:id/overview` | 🔴 NOT IMPLEMENTED | **CRITICAL** |
| **M01 Overview** | `GET /forms/m01/:id/overview` | 🔴 NOT IMPLEMENTED | **CRITICAL** |
| **M02 Overview** | `GET /forms/m02/:id/overview` | 🔴 NOT IMPLEMENTED | **CRITICAL** |
| **M03 Overview** | `GET /forms/m03/:id/overview` | 🔴 NOT IMPLEMENTED | **CRITICAL** |
| Landing Detail | `GET /landing-records/:id/overview` | 🔴 NOT IMPLEMENTED | HIGH |
| Sync Status | `GET /sync/status` | 🔴 NOT IMPLEMENTED | HIGH |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | IMPLEMENTED and adequate |
| 🟡 | PARTIAL - needs enrichment |
| 🔴 | NOT IMPLEMENTED - needs new endpoint |
| ⬜ | OPTIONAL - not critical |
