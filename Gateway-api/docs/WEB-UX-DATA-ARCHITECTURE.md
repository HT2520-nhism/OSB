# WEB-UX-DATA-ARCHITECTURE.md

> **Mục đích:** Mô tả cách Web app tương tác với hệ thống qua Gateway.

---

## Nguyên tắc

1. Web sử dụng **CÙNG Business API** như Mobile
2. KHÔNG tạo API riêng chỉ vì Web
3. Web có thể hiển thị nhiều data hơn (vì màn hình lớn)
4. Nhưng KHÔNG gọi nhiều hơn 1 API cho một màn hình quan trọng

---

## Sơ đồ tổng quan

```
┌─────────────────────────────────────────┐
│              WEB APP                     │
│  ┌──────────┐    ┌──────────┐           │
│  │  Users   │    │  Admin   │           │
│  │ (Public) │    │(Internal)│           │
│  └────┬─────┘    └────┬─────┘           │
│       │                │                  │
└───────┼────────────────┼─────────────────┘
        │                │
        ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│   GATEWAY API    │  │   ADMIN PANEL    │
│   (Same API)     │  │   (Same API)     │
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

## Web Flows

### Admin Dashboard

```
GET /api/electronic-logbook/dashboard
   ↓
Show:
- Total vessels
- Active trips
- Pending inspections
- Today's catch
```

### Trip Management (Web)

```
GET /api/electronic-logbook/fishing-trips?page=1&limit=20&status=COMPLETED
   ↓
Table view with:
- Trip #
- Vessel
- Captain (need identity)
- Status
- Submission status
- Catch
```

### Trip Detail (Web - Admin)

```
GET /api/electronic-logbook/fishing-trips/:id/overview
   ↓
Show complete trip data:
- All sections from overview
- Add: history, audit log, full timeline
- Add: action buttons (approve, reject, request changes)
```

### Inspection Management

```
GET /api/electronic-logbook/form-submissions?status=APPROVED
   ↓
List of approved forms
   ↓
Click → GET /forms/m03/:id/overview (when implemented)
   ↓
Show full M03/M02/M01 inspection data
```

### Reports

```
GET /api/electronic-logbook/fishing-trips?from=&to=&status=COMPLETED
   ↓
Export to Excel/CSV
   ↓
Generate monthly/yearly catch reports
```

---

## Web vs Mobile - Sự khác biệt

| Aspect | Mobile | Web |
|--------|--------|-----|
| Screen size | Small | Large |
| Data per screen | Minimal | Can show more |
| Pagination | Smaller (10-20) | Larger (50-100) |
| Interactions | Tap, swipe | Click, hover |
| Offline | Required | Not required |
| Real-time | Polling | WebSocket/SSE future |
| Document preview | Native viewer | Browser viewer |

**Nhưng cùng Business API endpoints!**

---

## Admin Specific Features (Web Only)

### 1. Bulk Operations
- Approve multiple forms at once
- Bulk export trips
- Bulk vessel registration

### 2. Advanced Filtering
- Date range picker
- Multi-select filters
- Saved filter presets
- Custom sorting

### 3. Detailed Reports
- Catch summary by species
- Trip performance by vessel
- Compliance dashboard
- Revenue report (if applicable)

### 4. Drill-down Views
- Trip timeline
- Form workflow history
- Audit trail
- Cross-service analytics

---

## API Usage Patterns

### Web List Page

```typescript
// Same endpoint, different pagination
const res = await fetch(
  `/api/electronic-logbook/fishing-trips?page=1&limit=50&status=COMPLETED`
);
// Use enhanced response with catch summary
```

### Web Detail Page

```typescript
// Same Trip Overview endpoint
const overview = await fetch(
  `/api/electronic-logbook/fishing-trips/${id}/overview`
);
// Show all sections in tabs/accordions
```

### Web Search

```typescript
// Use search query params
const res = await fetch(
  `/api/electronic-logbook/vessels?search=CT-001&page=1&limit=10`
);
```

---

## Performance Considerations for Web

### Server-Side
- Same aggregation pattern as Mobile
- Larger pagination allowed
- Optional: caching layer for read-heavy data

### Client-Side
- Virtual scrolling for large lists
- Lazy loading for detail sections
- Debounced search
- Memoization for repeated calls

---

## Web UI States

| State | Web Display |
|-------|-------------|
| Loading | Skeleton screens + spinner |
| Success | Full data display |
| Empty | Empty state + CTA |
| Error | Error banner with retry |
| Offline | (Not applicable for most Web) |
| Maintenance | Maintenance banner |

---

## Web Admin Screens (Future)

| Screen | API | Notes |
|--------|-----|-------|
| Dashboard | `/dashboard` (admin variant) | Platform-wide stats |
| Vessel Registry | `/vessels` | List with admin actions |
| Trip Audit | `/fishing-trips?audit=true` | With audit trail |
| Form Approval | `/form-submissions?status=APPROVED` | Approval queue |
| Compliance | `/trips?compliance=non-compliant` | Compliance dashboard |
| Reports | `/reports/catch?from=&to=` | Statistical reports |

---

## Files Reference

| Layer | File |
|-------|------|
| Web | Component-based (React, Vue, etc.) |
| API | Same as Mobile |
| Gateway | Same aggregation endpoints |

---

## Best Practices

### DO ✅

- Cùng Business API cho cả Web và Mobile
- Pagination lớn hơn cho Web
- Multi-select actions cho admin
- Export/print friendly views
- Keyboard shortcuts
- Breadcrumb navigation

### DON'T ❌

- Tạo API riêng cho Web
- Bypass Gateway
- Show data không cần thiết
- Heavy client-side joins
- Polling ngắn hạn (consider WebSocket)

---

## Migration Path

### Phase 1 (Current)
- ✅ Gateway aggregation endpoints
- ✅ Client-ready DTOs
- ✅ Swagger documentation

### Phase 2
- 🔄 M01/M02/M03 Overview endpoints
- 🔄 Identity enrichment
- 🔄 Port lookup

### Phase 3
- Web-specific admin features
- Bulk operations
- Advanced reporting

---

## Notes

- Web có thể sử dụng tất cả endpoints đã implement
- Không tạo breaking changes
- Tất cả Mobile workflows đều apply cho Web
