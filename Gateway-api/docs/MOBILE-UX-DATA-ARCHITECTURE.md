# MOBILE-UX-DATA-ARCHITECTURE.md

> **Mục đích:** Mô tả cách Mobile app tương tác với hệ thống qua Gateway.

---

## Sơ đồ tổng quan

```
┌─────────────────────────────────────────┐
│            MOBILE APP                    │
│  ┌──────────┐    ┌──────────┐           │
│  │  Online  │    │  Offline │           │
│  │   Mode   │    │   Mode   │           │
│  └────┬─────┘    └────┬─────┘           │
│       │                │                  │
└───────┼────────────────┼─────────────────┘
        │                │
        ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│   GATEWAY API    │  │   LOCAL STORAGE  │
│   (Direct)       │  │   - Queue/Outbox │
│                  │  │   - Cached Data  │
└────────┬─────────┘  └────────┬─────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────┐
│         DOMAIN SERVICES                  │
│  ┌────────────┐ ┌──────────┐ ┌────────┐│
│  │ Electronic │ │ Document │ │Identity││
│  │  Logbook   │ │  Service │ │Service ││
│  └────────────┘ └──────────┘ └────────┘│
└─────────────────────────────────────────┘
```

---

## Online Mode

### Flow

```
Mobile App
   ↓
Direct API call to Gateway
   ↓
Gateway orchestrates
   ↓
Domain services respond
   ↓
Gateway composes aggregation
   ↓
Mobile gets client-ready response
```

### Ví dụ: Màn hình Trip Detail

1. Mobile gọi: `GET /api/electronic-logbook/fishing-trips/:id/overview`
2. Gateway gọi song song các service:
   - Electronic Logbook: trip, vessel, crew, gear, operations, landing, port calls, incidents, fuel, forms
   - Document Service: documents related to trip
3. Gateway compose response
4. Mobile hiển thị UI ngay

**Số API call từ Client: 1**

---

## Offline Mode

### Flow

```
User Action on Mobile
   ↓
Save to Local Storage
   ↓
Add to Outbox/Queue
   ↓
Try Sync when Online
   ↓
If Success: Mark as synced
If Failure: Keep in queue with retry
```

### Data Model cho Offline

```typescript
interface OfflineRecord {
  id: string;              // Client-generated UUID
  entityType: string;      // FISHING_OPERATION, CATCH_RECORD, etc.
  entityId: string;        // Server UUID (if exists)
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
  clientVersion: number;
}
```

### Local Storage

```typescript
interface LocalCache {
  vessels: Vessel[];           // Cached vessel list
  trips: Trip[];               // Active trips
  operations: Operation[];     // Pending operations
  catches: Catch[];            // Pending catches
  syncQueue: OfflineRecord[];  // Outbox queue
  syncMeta: {
    lastSyncedAt: string;
    deviceId: string;
    pendingCount: number;
  };
}
```

### Sync Strategy

```
When device comes online:
  1. Check syncQueue
  2. POST /api/electronic-logbook/sync/push
     - Send all pending operations
  3. Process responses:
     - Success → Mark as SYNCED, move to server
     - Conflict → Show in conflicts UI
     - Error → Keep in queue with retry
  4. GET /api/electronic-logbook/sync/pull
     - Get latest data from server
     - Update local cache
  5. Update syncMeta.lastSyncedAt
```

---

## UI States cho Mobile

### Loading State
```
- Show skeleton screens
- Show spinner only if >500ms
- Show progress for sync
```

### Success State
```
- Render data from aggregation response
- Show last sync time
- Show "X pending changes" indicator
```

### Empty State
```
- Show "No data" message
- Show CTA to create new
- For lists: empty illustration
```

### Offline State
```
- Show "Offline" banner
- Use cached data
- Show "X pending" count
- Disable destructive actions
```

### Partial Failure State
```
- Render available data
- Show warnings for failed sections
- Allow retry for failed sections
```

### Sync States

| State | UI Display |
|-------|------------|
| `SYNCED` | ✓ Synced (green) |
| `PENDING` | ⏳ X pending (yellow) |
| `SYNCING` | 🔄 Syncing... |
| `FAILED` | ⚠️ X failed (red) - tap to retry |
| `CONFLICT` | ⚠️ X conflicts (orange) - tap to resolve |

---

## Offline Capabilities by Screen

| Screen | Offline Support | Notes |
|--------|----------------|-------|
| Login | ❌ No | Requires online |
| Dashboard | ✅ Yes | Cached data |
| My Vessels | ✅ Yes | Cached list, allow create |
| Vessel Detail | ✅ Yes | Cached, allow edit |
| Fishing Trip List | ✅ Yes | Cached |
| **Trip Detail** | ✅ Yes | **Key offline screen** |
| Create Trip | ✅ Yes | Save to queue |
| M03 (Departure) | ✅ Yes | Save to queue |
| Fishing Operations | ✅ Yes | Save to queue |
| Catch Records | ✅ Yes | Save to queue |
| Fuel Records | ✅ Yes | Save to queue |
| Incident | ✅ Yes | Save to queue |
| Landing | ✅ Yes | Save to queue |
| M01 (Receipt) | ✅ Yes | Save to queue |
| M02 (Inspection) | ✅ Yes | Save to queue |
| Documents | ⚠️ Limited | Metadata cached, file upload needs network |

---

## Sync Conflict Resolution

### Khi có conflict:

```
User sees conflict alert:
  "Data was changed on server. Choose:"
  - [Keep Mine]
  - [Use Server's]
  - [Show Diff]

Backend response:
  {
    "syncOperationId": "...",
    "clientData": {...},
    "serverData": {...},
    "resolution": "PENDING"
  }
```

### API calls:
- `POST /sync/conflicts` - Detect conflict
- `PATCH /sync/conflicts/:id` - Resolve conflict

---

## Error Handling

### Network Errors

```typescript
// Catch and fallback
try {
  const response = await api.get('/overview');
  return response.data;
} catch (err) {
  if (err.status === 401) return redirectToLogin();
  if (err.status >= 500) return showCachedData();
  if (!navigator.onLine) return showOfflineData();
  throw err;
}
```

### Validation Errors (400)

```typescript
interface ValidationError {
  statusCode: 400;
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
```

### Business Rule Errors

```typescript
interface BusinessError {
  code: string;        // VESSEL_NOT_READY
  message: string;
  details?: object;
}
```

---

## Mobile API Contract Summary

### Client chỉ cần biết:
1. **Nghiệp vụ**: "Tôi đang làm gì?"
2. **Dữ liệu cần**: "Tôi cần thông tin gì?"
3. **Thao tác tiếp**: "Bước tiếp theo là gì?"
4. **Sync state**: "Đã đồng bộ chưa?"
5. **Documents**: "Có tài liệu nào không?"

### Client KHÔNG cần biết:
1. ❌ Microservice topology
2. ❌ Service URLs
3. ❌ Database schema
4. ❌ Internal service names
5. ❌ Authentication flow details

---

## Implementation Notes

### Gateway Aggregation Pattern

```typescript
// Gateway composition:
async getTripOverview(tripId, auth) {
  // PARALLEL: All independent fetches
  const [trip, vessel, crew, gear, ops, landing, ports, incidents, fuel, forms, docs] = 
    await Promise.all([
      fetch('/fishing-trips/' + tripId, auth),
      fetch('/vessels/' + vesselId, auth),
      fetch('/fishing-trip-crews?fishingTripId=' + tripId, auth),
      fetch('/fishing-trip-gears?fishingTripId=' + tripId, auth),
      fetch('/fishing-operations?fishingTripId=' + tripId, auth),
      fetch('/landing-records?fishingTripId=' + tripId, auth),
      fetch('/port-calls?fishingTripId=' + tripId, auth),
      fetch('/incidents?fishingTripId=' + tripId, auth),
      fetch('/fuel-records?fishingTripId=' + tripId, auth),
      fetch('/form-submissions?fishingTripId=' + tripId, auth),
      fetch('/documents?ownerType=fishing_trip&ownerId=' + tripId, auth),
    ]);
  
  // Sequential: dependent operations
  for (const form of forms) {
    const def = await fetch('/form-definitions/' + form.formDefinitionId, auth);
    // determine M01/M02/M03
  }
  
  // Compose
  return {
    trip, vessel, crew, gear, operations: ops, landing, ...
  };
}
```

### Mobile Side

```typescript
// Mobile app:
async loadTripDetail(tripId: string) {
  const overview = await api.get(
    `/electronic-logbook/fishing-trips/${tripId}/overview`,
  );
  
  // All data ready - just render!
  renderTripScreen(overview);
}
```

---

## Files Reference

| Layer | File | Purpose |
|-------|------|---------|
| Mobile | Local cache + outbox | Offline storage |
| Gateway | aggregation.service.ts | Compose response |
| Gateway | aggregation.controller.ts | Expose endpoints |
| Domain | electronic-logbook-api | Business rules |
| Domain | document-api | File management |
| Domain | logbook-identity-api | User identity |

---

## Best Practices

### DO ✅

- Hiển thị rõ trạng thái sync
- Cache data khi online
- Background sync khi có network
- Queue operations khi offline
- Show conflicts cho user giải quyết
- Partial failure graceful
- Single API call per screen

### DON'T ❌

- Để UI phụ thuộc vào internal services
- Bắt user nhớ CCCD
- Show stack trace
- Show storage_path
- Bypass authentication
- Tạo business logic ở Mobile
- 10+ API calls cho một màn hình
