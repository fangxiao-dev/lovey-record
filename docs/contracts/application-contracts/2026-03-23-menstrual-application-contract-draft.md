# Menstrual Application Contract Draft

**日期：** 2026-03-23

## Purpose

This document captures the application-layer contract that sits between the menstrual domain model and a future backend prototype or frontend service layer.

It is still a draft, but it is concrete enough to support:

- frontend mock service work
- local-first service implementation
- backend prototype endpoint design
- stable payload and read-model discussions

It does not commit the project to REST, RPC, or a specific database model.

## Contract Style

The contract is expressed in application-service terms:

- commands change state
- queries return read models
- payloads use camelCase
- dates use `YYYY-MM-DD`
- missing day state is represented as `none` in read models, even though it is implicit in persistence

## Shared Envelope Direction

This is not mandatory transport shape, but it is the recommended application-layer structure for the prototype.

### Command result

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "mi_123",
    "updatedAt": "2026-03-23T14:00:00Z",
    "recomputed": {
      "cycleChanged": true,
      "predictionChanged": true
    }
  },
  "error": null
}
```

### Query result

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

### Error shape

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "NOTE_TOO_LONG",
    "message": "Note exceeds the allowed length."
  }
}
```

## Commands

- `createModuleInstance`
- `recordDayState`
- `recordDayDetails`
- `recordDayNote`
- `recordDateRangeAsPeriod`
- `clearDayRecord`
- `shareModuleInstance`
- `revokeModuleAccess`

## Query Directions

- `getModuleHomeView`
- `getDayRecordDetail`
- `getCalendarWindow`
- `getPredictionSummary`
- `getModuleAccessState`

## Shared Payload Objects

### `DayRecordDetailInput`

```json
{
  "painLevel": 3,
  "flowLevel": 3,
  "colorLevel": 3
}
```

Rules:

- each field accepts `1..5`
- default is `3`

### `DayRecordReadModel`

```json
{
  "date": "2026-03-23",
  "bleedingState": "period",
  "painLevel": 3,
  "flowLevel": 3,
  "colorLevel": 3,
  "note": "short note",
  "isExplicit": true
}
```

Rules:

- if no explicit record exists, query responses should still be able to return:

```json
{
  "date": "2026-03-23",
  "bleedingState": "none",
  "painLevel": null,
  "flowLevel": null,
  "colorLevel": null,
  "note": null,
  "isExplicit": false
}
```

### `PredictionReadModel`

```json
{
  "predictedStartDate": "2026-04-12",
  "predictionWindowStart": "2026-04-10",
  "predictionWindowEnd": "2026-04-14",
  "basedOnCycleCount": 4
}
```

### `ModuleAccessReadModel`

```json
{
  "moduleInstanceId": "mi_123",
  "sharingStatus": "shared",
  "ownerUserId": "user_owner",
  "activePartners": [
    {
      "userId": "user_partner",
      "role": "partner",
      "accessStatus": "active"
    }
  ]
}
```

## Suggested Command Contracts

### `recordDayState`

Purpose:

- create or update the explicit primary state for one day

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23",
  "bleedingState": "period"
}
```

or

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23",
  "clear": true
}
```

Effects:

- upsert or clear `day_record`
- trigger cycle and prediction recomputation

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "dayRecordChanged": true,
  "recomputed": {
    "cycleChanged": true,
    "predictionChanged": true
  }
}
```

### `recordDayDetails`

Purpose:

- update attached 5-level daily fields for one day

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23",
  "painLevel": 3,
  "flowLevel": 4,
  "colorLevel": 2
}
```

Effects:

- update or create a `day_record` with default main-state assumptions only if the product later allows that path
- otherwise require the day record to already exist

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "detailChanged": true
}
```

### `recordDayNote`

Purpose:

- attach a short note to one day

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23",
  "note": "short note"
}
```

Effects:

- save note if within length limit
- reject invalid note lengths

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "noteChanged": true
}
```

### `recordDateRangeAsPeriod`

Purpose:

- batch create or update continuous `period` day records

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "startDate": "2026-03-20",
  "endDate": "2026-03-24"
}
```

Effects:

- create or update one `day_record` per day
- set `bleeding_state = period`
- initialize attached detail fields to default values if needed
- recompute derived cycle and prediction outputs

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "range": {
    "startDate": "2026-03-20",
    "endDate": "2026-03-24"
  },
  "updatedDayCount": 5,
  "recomputed": {
    "cycleChanged": true,
    "predictionChanged": true
  }
}
```

### `clearDayRecord`

Purpose:

- return one date to implicit `none`

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23"
}
```

Effects:

- remove explicit record
- remove attached attributes and note
- recompute derived outputs

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "dayRecordRemoved": true,
  "recomputed": {
    "cycleChanged": true,
    "predictionChanged": true
  }
}
```

### `shareModuleInstance`

Purpose:

- expand access for one existing module instance

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "partnerUserId": "user_partner"
}
```

Effects:

- keep same module instance
- create or activate `ModuleAccess`
- set instance sharing status to `shared`

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "sharingStatus": "shared",
  "partnerUserId": "user_partner",
  "accessStatus": "active"
}
```

### `revokeModuleAccess`

Purpose:

- stop partner access while preserving data

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "partnerUserId": "user_partner"
}
```

Effects:

- revoke `ModuleAccess`
- preserve all existing records
- if no active partner access remains, instance may return to `private`

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "sharingStatus": "private",
  "partnerUserId": "user_partner",
  "accessStatus": "revoked"
}
```

## Suggested Query Contracts

### `getModuleHomeView`

Returns:

- module instance identity
- sharing state
- current status summary
- visible cycle window or browsing window
- calendar marks
- selected day detail when applicable
- prediction summary

Suggested response shape:

```json
{
  "moduleInstanceId": "mi_123",
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
    "startDate": "2026-03-16",
    "endDate": "2026-04-05"
  },
  "calendarMarks": [
    { "date": "2026-03-20", "kind": "period" },
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
}
```

### `getDayRecordDetail`

Returns:

- one day's explicit state if present
- implicit `none` if absent
- attached levels
- note

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23"
}
```

Suggested response shape:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "dayRecord": {
    "date": "2026-03-23",
    "bleedingState": "period",
    "painLevel": 3,
    "flowLevel": 4,
    "colorLevel": 2,
    "note": "short note",
    "isExplicit": true
  }
}
```

### `getCalendarWindow`

Returns:

- requested date window
- explicit day states
- derived cycle marks
- prediction marks
- today marker

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31"
}
```

Suggested response shape:

```json
{
  "moduleInstanceId": "mi_123",
  "window": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-31"
  },
  "days": [
    {
      "date": "2026-03-23",
      "bleedingState": "period",
      "isExplicit": true
    },
    {
      "date": "2026-03-24",
      "bleedingState": "none",
      "isExplicit": false
    }
  ],
  "marks": [
    { "date": "2026-03-20", "kind": "period" },
    { "date": "2026-03-23", "kind": "today" },
    { "date": "2026-04-12", "kind": "prediction_start" }
  ]
}
```

### `getPredictionSummary`

Returns:

- predicted next start date
- prediction window
- supporting explanation fields if needed later

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123"
}
```

Suggested response shape:

```json
{
  "moduleInstanceId": "mi_123",
  "prediction": {
    "predictedStartDate": "2026-04-12",
    "predictionWindowStart": "2026-04-10",
    "predictionWindowEnd": "2026-04-14",
    "basedOnCycleCount": 4
  }
}
```

### `getModuleAccessState`

Returns:

- owner identity
- current sharing status
- active partner access state

Suggested input:

```json
{
  "moduleInstanceId": "mi_123"
}
```

Suggested response shape:

```json
{
  "moduleInstanceId": "mi_123",
  "sharingStatus": "shared",
  "ownerUserId": "user_owner",
  "activePartners": [
    {
      "userId": "user_partner",
      "role": "partner",
      "accessStatus": "active"
    }
  ]
}
```

## Recommended First Stable Slice

If the team wants the smallest practical first contract, stabilize these first:

- `recordDateRangeAsPeriod`
- `recordDayState`
- `clearDayRecord`
- `getModuleHomeView`
- `getDayRecordDetail`
- `getModuleAccessState`

This slice is enough to support:

- first-time entry
- single-day editing
- range recording
- derived cycle and prediction refresh
- same-instance private/shared behavior

## Open Questions

- whether `recordDayDetails` may create a record when no explicit `bleeding_state` exists yet, or must only update an existing record
- the exact note length limit
- which fields belong in the first stable read model for `getModuleHomeView`
- whether command and query naming should stay domain-oriented or be adapted to frontend service naming
