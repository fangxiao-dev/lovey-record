# Frontend Integration API Examples

**Purpose:** give the frontend a runtime-facing API reference with concrete request and response examples for the currently exposed backend endpoints.

**Base URL**
- Commands: `/api/commands`
- Queries: `/api/queries`

**Authentication**
- All command and query endpoints require the `x-wx-openid` request header.
- Missing or empty `x-wx-openid` returns:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "MISSING_OPENID",
    "message": "x-wx-openid header is required"
  }
}
```

**Shared response envelope**

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

## Stable Command Endpoints

### `POST /api/commands/createModuleInstance`

Request body:

```json
{}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "moduleInstance": {
      "id": "module-1",
      "moduleType": "menstrual",
      "ownerUserId": "user-1",
      "profileId": "profile-1",
      "sharingStatus": "PRIVATE"
    }
  },
  "error": null
}
```

Current runtime note:
- `updateDefaultPeriodDuration` is owner-only in runtime.

### `POST /api/commands/recordPeriodDay`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "date": "2026-03-23"
}
```

Example response shape currently exposed by runtime:

```json
{
  "ok": true,
  "data": {
    "dayRecord": {
      "id": "day-1",
      "isPeriod": true,
      "source": "MANUAL",
      "painLevel": null,
      "flowLevel": null,
      "colorLevel": null
    },
    "autoFilledDates": [
      "2026-03-24",
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28"
    ],
    "cycleAnchorRecognized": true
  },
  "error": null
}
```

Current runtime notes:
- use this endpoint to mark a day as period and trigger auto-fill/recomputation
- period-only marking does not imply detail recording
- `source` is currently returned in raw runtime enum casing here

### `POST /api/commands/clearPeriodDay`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "date": "2026-03-25"
}
```

Example response shape currently exposed by runtime:

```json
{
  "ok": true,
  "data": {
    "removedDates": [
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28"
    ]
  },
  "error": null
}
```

Current runtime notes:
- use this endpoint to clear a period day and truncate later derived tail days when applicable

### `POST /api/commands/recordDayDetails`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "date": "2026-03-23",
  "painLevel": 3,
  "flowLevel": 4,
  "colorLevel": 2
}
```

To clear all recorded attributes while keeping period status unchanged:

```json
{
  "moduleInstanceId": "module-1",
  "date": "2026-03-23",
  "painLevel": null,
  "flowLevel": null,
  "colorLevel": null
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "detailChanged": true,
        "isDetailRecorded": true
  },
  "error": null
}
```

### `POST /api/commands/recordDayNote`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "date": "2026-03-23",
  "note": "short note"
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "noteChanged": true
  },
  "error": null
}
```

Current validation note:
- `docs/contracts` defines a `500` character maximum for `note`
- runtime rejects notes longer than `500` characters with `NOTE_TOO_LONG`

### `POST /api/commands/updateDefaultPeriodDuration`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "defaultPeriodDurationDays": 7
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "defaultPeriodDurationDays": 7,
    "settingsChanged": true
  },
  "error": null
}
```

### `POST /api/commands/shareModuleInstance`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "partnerUserId": "user-2"
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "sharingStatus": "shared",
    "partnerUserId": "user-2",
    "accessStatus": "active"
  },
  "error": null
}
```

### `POST /api/commands/revokeModuleAccess`

Request body:

```json
{
  "moduleInstanceId": "module-1",
  "partnerUserId": "user-2"
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "sharingStatus": "private",
    "partnerUserId": "user-2",
    "accessStatus": "revoked"
  },
  "error": null
}
```

## Stable Query Endpoints

### `GET /api/queries/getModuleHomeView`

Query params:

```json
{
  "moduleInstanceId": "module-1"
}
```

Example response currently exposed by runtime:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "sharingStatus": "private",
    "currentStatusSummary": {
      "status": "in_period",
      "anchorDate": "2026-03-23",
      "currentCycle": {
        "startDate": "2026-03-20",
        "endDate": "2026-03-24",
        "durationDays": 5
      }
    },
    "visibleWindow": {
      "kind": "cycle_window",
      "startDate": "2026-03-20",
      "endDate": "2026-04-14"
    },
    "calendarMarks": [
      { "date": "2026-03-20", "kind": "period_start" },
      { "date": "2026-03-23", "kind": "today" },
      { "date": "2026-04-12", "kind": "prediction_start" }
    ],
    "selectedDay": null,
    "predictionSummary": {
      "predictedStartDate": "2026-04-12",
      "predictionWindowStart": "2026-04-10",
      "predictionWindowEnd": "2026-04-14",
      "basedOnCycleCount": 4
    }
  },
  "error": null
}
```

### `GET /api/queries/getDayRecordDetail`

Query params:

```json
{
  "moduleInstanceId": "module-1",
  "profileId": "profile-1",
  "date": "2026-03-23"
}
```

Example response with explicit record:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "profileId": "profile-1",
    "dayRecord": {
      "date": "2026-03-23",
      "isPeriod": true,
      "painLevel": 3,
      "flowLevel": 4,
      "colorLevel": 2,
      "note": "note",
      "source": "manual",
      "isExplicit": true,
      "isDetailRecorded": true
    }
  },
  "error": null
}
```

Example response with no explicit record:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "profileId": "profile-1",
    "dayRecord": {
      "date": "2026-03-23",
      "isPeriod": false,
      "painLevel": null,
      "flowLevel": null,
      "colorLevel": null,
      "note": null,
      "source": null,
      "isExplicit": false,
      "isDetailRecorded": false
    }
  },
  "error": null
}
```

### `GET /api/queries/getCalendarWindow`

Query params:

```json
{
  "moduleInstanceId": "module-1",
  "profileId": "profile-1",
  "startDate": "2026-03-20",
  "endDate": "2026-03-22"
}
```

Example response shape:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "window": {
      "startDate": "2026-03-20",
      "endDate": "2026-03-22"
    },
    "days": [
      {
        "date": "2026-03-20",
        "isPeriod": true,
        "source": "manual",
        "isExplicit": true,
      "isDetailRecorded": false
      },
      {
        "date": "2026-03-21",
        "isPeriod": false,
        "source": null,
        "isExplicit": false,
      "isDetailRecorded": false
      },
      {
        "date": "2026-03-22",
        "isPeriod": false,
        "source": "manual",
        "isExplicit": true,
      "isDetailRecorded": false
      }
    ],
    "marks": [
      { "date": "2026-03-20", "kind": "period_start" },
      { "date": "2026-03-21", "kind": "today" },
      { "date": "2026-03-22", "kind": "prediction_start" }
    ]
  },
  "error": null
}
```

### `GET /api/queries/getPredictionSummary`

Query params:

```json
{
  "moduleInstanceId": "module-1",
  "profileId": "profile-1"
}
```

Example response shape:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "prediction": {
      "predictedStartDate": "2026-04-12",
      "predictionWindowStart": "2026-04-10",
      "predictionWindowEnd": "2026-04-14",
      "basedOnCycleCount": 4
    }
  },
  "error": null
}
```

### `GET /api/queries/getModuleAccessState`

Query params:

```json
{
  "moduleInstanceId": "module-1"
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "sharingStatus": "shared",
    "ownerUserId": "user-1",
    "activePartners": [
      {
        "userId": "user-2",
        "role": "partner",
        "accessStatus": "active"
      }
    ]
  },
  "error": null
}
```

### `GET /api/queries/getModuleSettings`

Query params:

```json
{
  "moduleInstanceId": "module-1"
}
```

Example response:

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "module-1",
    "moduleSettings": {
      "defaultPeriodDurationDays": 6
    }
  },
  "error": null
}
```

## Current Integration Notes
- `GET /health` is public and does not require `x-wx-openid`.
- All other currently exposed routes are auth-gated.
- Query examples above reflect the current runtime code, which is what the frontend should integrate against first.
- `getModuleHomeView` currently returns `currentCycle` and `visibleWindow.kind = "cycle_window"`, not the newer contract wording.
- `getModuleHomeView` also does not currently include `moduleSettings` in the response body.
- `recordDayNote` rejects overlong notes with `NOTE_TOO_LONG`.
- `updateDefaultPeriodDuration` is owner-only in runtime.
- Some runtime field names still need a follow-up contract cleanup to fully match `docs/contracts`.
