# Period Application Contract Draft

**Date:** 2026-03-23

## Purpose

This document captures the application-layer contract between the period domain model and a future backend prototype or service layer.

It is still a draft, but it is concrete enough to support:

- backend endpoint design
- local-first service implementation
- stable payload and read-model discussions
- frontend mock service work if needed later

It does not commit the project to REST, RPC, or a specific database model.

## Contract Style

The contract is expressed in application-service terms:

- commands change state
- queries return read models
- payloads use camelCase
- dates use `YYYY-MM-DD`
- missing day records are represented as absent persistence and `isPeriod: false` in read models

## Shared Envelope Direction

### Command result

```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "mi_123",
    "updatedAt": "2026-03-23T14:00:00Z",
    "recomputed": {
      "segmentChanged": true,
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
- `recordPeriodDay`
- `clearPeriodDay`
- `recordDayDetails`
- `recordDayNote`
- `updateDefaultPeriodDuration`
- `shareModuleInstance`
- `revokeModuleAccess`

## Query Directions

- `getModuleHomeView`
- `getDayRecordDetail`
- `getCalendarWindow`
- `getPredictionSummary`
- `getModuleAccessState`
- `getModuleSettings`

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
  "isPeriod": true,
  "painLevel": 3,
  "flowLevel": 3,
  "colorLevel": 3,
  "note": "short note",
  "source": "auto_filled",
  "isExplicit": true,
  "isDetailRecorded": true
}
```

Rules:

- if no explicit record exists, query responses should still be able to return:

```json
{
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
```

- `source` is an internal behavior explanation field; user-visible semantics treat `manual` and `auto_filled` as equally valid period days
- `isDetailRecorded` represents whether any of `painLevel`, `flowLevel`, or `colorLevel` is recorded for the day

### `AnchoredPeriodSegmentReadModel`

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "anchorDate": "2026-03-23",
  "endDate": "2026-03-28",
  "durationDays": 6,
  "defaultPeriodDurationDays": 6,
  "derivedFromDates": [
    "2026-03-23",
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27",
    "2026-03-28"
  ]
}
```

### `ModuleSettingsReadModel`

```json
{
  "moduleInstanceId": "mi_123",
  "defaultPeriodDurationDays": 6
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

### `recordPeriodDay`

Purpose:

- mark one date as being in period
- if the previous day is not in period, treat this date as the first day of a new anchored segment
- automatically fill later dates according to the current default period duration

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-23"
}
```

Effects:

- if the previous day is not period, create a new anchor
- create or confirm the selected day as period
- auto-fill the tail of the segment according to the configured default duration
- trigger segment and prediction recomputation

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "dayRecordChanged": true,
  "segmentAnchorRecognized": true,
  "autoFilledDates": [
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27",
    "2026-03-28"
  ],
  "recomputed": {
    "segmentChanged": true,
    "predictionChanged": true
  }
}
```

### `clearPeriodDay`

Purpose:

- remove one date from the current period interpretation
- if the removed date is inside the current tail, truncate that date and every later date in the same derived tail

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-25"
}
```

Effects:

- remove the explicit record for the selected date
- remove later period dates that belong to the same tail interpretation
- remove attached attributes and note for removed dates
- recompute derived outputs

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-25",
  "removedDates": [
    "2026-03-25",
    "2026-03-26",
    "2026-03-27",
    "2026-03-28"
  ],
  "recomputed": {
    "segmentChanged": true,
    "predictionChanged": true
  }
}
```

### `recordDayDetails`

Purpose:

- update attached 5-level daily fields for one period day

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

Clearing behavior:

- `painLevel`, `flowLevel`, and `colorLevel` may each be `null`
- when all three are `null`, the command clears recorded attribute details for that day
- this does NOT change period status for the day

Effects:

- update an existing `day_record`
- if no `day_record` exists yet for that date, create an explicit non-period `day_record` with `isPeriod: false`
- do not create a new period day implicitly through detail changes alone
- if the new detail values differ from the default pattern, read models may surface a deviation label

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "detailChanged": true,
  "isDetailRecorded": true
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
- if no `day_record` exists yet for that date, create an explicit non-period `day_record` with `isPeriod: false`
- reject invalid note lengths

Limit:

- maximum length is `500` characters

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-23",
  "noteChanged": true
}
```

### `updateDefaultPeriodDuration`

Purpose:

- adjust the default period duration used for future auto-fill behavior

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "defaultPeriodDurationDays": 6
}
```

Effects:

- update module-level settings
- future first-day records use the new duration
- existing historical records are not silently rewritten unless the product later adds an explicit reapply action

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "defaultPeriodDurationDays": 6,
  "settingsChanged": true
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
- visible period/prediction window
- calendar marks
- selected day detail when applicable
- prediction summary
- module settings

Suggested response shape:

```json
{
  "moduleInstanceId": "mi_123",
  "sharingStatus": "private",
  "currentStatusSummary": {
    "status": "in_period",
    "anchorDate": "2026-03-23",
    "currentSegment": {
      "anchorDate": "2026-03-23",
      "endDate": "2026-03-28",
      "durationDays": 6,
      "defaultPeriodDurationDays": 6
    }
  },
  "visibleWindow": {
    "kind": "segment_window",
    "startDate": "2026-03-23",
    "endDate": "2026-04-14"
  },
  "calendarMarks": [
    { "date": "2026-03-23", "kind": "period_start" },
    { "date": "2026-03-24", "kind": "period" },
    { "date": "2026-03-23", "kind": "today" },
    { "date": "2026-04-12", "kind": "prediction_start" }
  ],
  "selectedDay": null,
  "predictionSummary": {
    "predictedStartDate": "2026-04-12",
    "predictionWindowStart": "2026-04-10",
    "predictionWindowEnd": "2026-04-14",
    "basedOnCycleCount": 4
  },
  "moduleSettings": {
    "defaultPeriodDurationDays": 6
  }
}
```

### `getDayRecordDetail`

Returns:

- one day's period record if present
- implicit non-period if absent
- attached levels
- note
- source and deviation interpretation

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
    "isPeriod": true,
    "painLevel": 3,
    "flowLevel": 4,
    "colorLevel": 2,
    "note": "short note",
    "source": "manual",
    "isExplicit": true,
    "isDetailRecorded": true
  }
}
```

### `getCalendarWindow`

Returns:

- requested date window
- day rows for every requested date
- derived marks for period start, period, prediction start, and today when applicable

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
      "isPeriod": true,
      "source": "manual",
      "isExplicit": true
    },
    {
      "date": "2026-03-24",
      "isPeriod": true,
      "source": "auto_filled",
      "isExplicit": true
    },
    {
      "date": "2026-03-31",
      "isPeriod": false,
      "source": null,
      "isExplicit": false
    }
  ],
  "marks": [
    { "date": "2026-03-23", "kind": "period_start" },
    { "date": "2026-03-24", "kind": "period" },
    { "date": "2026-03-23", "kind": "today" }
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

### `getModuleSettings`

Returns:

- current default period duration for the module instance

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
  "moduleSettings": {
    "defaultPeriodDurationDays": 6
  }
}
```

## Recommended First Stable Slice

If the team wants the smallest practical first contract, stabilize these first:

- `recordPeriodDay`
- `clearPeriodDay`
- `recordDayDetails`
- `updateDefaultPeriodDuration`
- `getModuleHomeView`
- `getDayRecordDetail`
- `getCalendarWindow`

This slice is enough to support:

- first-time entry
- one-tap period start
- automatic period fill
- tail correction
- detail refinement
- settings refresh
- prediction refresh
- same-instance private/shared behavior

## Open Questions

- whether the default period duration should be versioned historically or only stored as the current setting
- whether deviation should stay a pure read-model interpretation or later gain explicit saved explanation fields
