# Period Application Contract Draft

**Created:** 2026-03-23
**Last Updated:** 2026-04-03

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
- `applySingleDayPeriodAction`
- `recordPeriodRange`
- `clearPeriodRange`
- `recordDayDetails`
- `recordDayNote`
- `updateDefaultPeriodDuration`
- `updateDefaultPredictionTerm`
- `shareModuleInstance`
- `revokeModuleAccess`

## Query Directions

- `getModuleHomeView`
- `getDayRecordDetail`
- `getCalendarWindow`
- `getPredictionSummary`
- `getModuleAccessState`
- `getModuleSettings`
- `getSingleDayPeriodAction`

## Home Status And Shortcut Semantics

The menstrual home hero now separates:

- current status semantics
- historical / predictive reference ranges

The frontend must not derive these meanings from ad-hoc UI rules. The application-layer home read model is the stable source.

### `HomeCurrentStatus`

Allowed values for the current MVP:

- `in_period`
- `out_of_period`

Future-compatible values may later include states such as:

- `luteal_phase`
- `approaching_period`

Rules:

- `in_period` means `today` is inside the latest continuous period segment's inclusive range
- `out_of_period` means no latest continuous period segment covers `today`
- if the latest persisted segment ends before `today`, the home must render `out_of_period`
- if later edits bridge or extend the segment so the recomputed latest segment covers `today`, the home must render `in_period` again

### `HomeStatusCard`

```json
{
  "status": "in_period",
  "label": "经期中",
  "rangeText": "03.29 - 03.30"
}
```

Rules:

- this is the primary home status expression
- when `status = in_period`, `rangeText` must describe the latest continuous segment that contains `today`
- when `status = out_of_period`, `rangeText` should be `null`
- frontend should render `经期中：MM.DD - MM.DD` for `in_period`
- frontend should render `不在经期中` for `out_of_period`

### `SegmentReferenceReadModel`

```json
{
  "startDate": "2026-03-29",
  "endDate": "2026-03-30"
}
```

Rules:

- represents one continuous period segment reference for home shortcuts and hero info frames
- absence means the value is currently unavailable, not an implicit `null range`

### Home Hero Reference Frames

The hero keeps two fixed reference frames:

- `previous`
- `next`

Rules:

- `previous` points to the continuous segment immediately before the latest segment
- `next` points to `predictionSummary`
- if `previous` is missing, frontend should render `暂无记录`
- if `next` is missing, frontend should render `暂无记录`
- the home shortcut row should expose `上次` as a jump target and disable it when `previous` is missing
- the home shortcut row may continue exposing `今天`
- the previous `本次` shortcut semantics are absorbed by the status card and no longer appear as a separate home shortcut

### Home Hero Status Source

The home hero must compute its status from the recomputed latest segment, not from stale cached text.

Required behavior:

- if the latest segment includes `today`, hero shows `经期中`
- if the latest segment ends before `today` and there is at least one blank day after the end, hero shows `不在经期中`
- if a later bridge, extension, revoke, or truncation changes the latest segment, hero status and ranges must update from the recomputed result in the next home read model refresh

### Home Read Model Direction

`getModuleHomeView` should stabilize around these additional home-facing fields:

```json
{
  "currentStatusSummary": {
    "status": "out_of_period",
    "anchorDate": "2026-03-29",
    "currentSegment": {
      "startDate": "2026-03-29",
      "endDate": "2026-03-30",
      "durationDays": 2
    },
    "statusCard": {
      "status": "out_of_period",
      "label": "不在经期中",
      "rangeText": null
    },
    "previousSegment": {
      "startDate": "2026-03-01",
      "endDate": "2026-03-05"
    }
  }
}
```

Rules:

- `currentSegment` remains the latest actual segment even when `today` is outside it
- `statusCard` expresses whether that latest segment currently covers `today`
- `previousSegment` is optional and should be omitted when unavailable
- frontend should treat these fields as the durable semantic contract once implemented, rather than recomputing previous/latest segment ranking locally

## Single-Day Smart Period Editing Contract

Single-day period editing is no longer interpreted as a generic boolean `isPeriod` toggle in the UI.

The frontend must render a contextual chip based on the selected date's derived role inside the current continuous period segment:

- `not-period` => `月经`
- `start` => `月经开始`
- `in-progress` => `月经结束`
- `end` => `月经结束`

The persisted source of truth remains day-based:

- `day_record.isPeriod`

Segment role is derived from neighboring continuous period dates and is not stored as a new persisted field.

### `SingleDayPeriodRole`

Allowed values:

- `not-period`
- `start`
- `in-progress`
- `end`

Rules:

- this is derived from the currently selected date and the surrounding continuous period segment
- this is a UI-facing semantic role, not a persisted database field

### `SingleDayPeriodAction`

Allowed values:

- `start`
- `revoke-start`
- `end-here`
- `noop`

Rules:

- `start` means "start a new segment here or bridge from here"
- `revoke-start` means "the selected day is already the segment start; tapping the selected `月经开始` revokes the whole segment"
- `end-here` means "the selected day becomes the final day of the segment"
- `noop` is currently allowed only when the selected day is already `end` and the user taps `月经结束`

### `BridgeType`

Allowed values:

- `none`
- `forward`
- `backward`
- `both`

Rules:

- bridging only applies to `start` actions on a `not-period` day
- bridge threshold is `defaultPeriodDurationDays - 1`

### `SingleDayPeriodPrompt`

```json
{
  "required": true,
  "type": "forward",
  "message": "把这段经期延长到 03/15？",
  "confirmLabel": "确认",
  "cancelLabel": "取消"
}
```

Rules:

- `required = true` only when bridging is about to modify an already existing segment shape
- if no confirmation is needed, this field should be `null`
- frontend should render the backend-provided `message` directly

### `SingleDayPeriodEffect`

```json
{
  "action": "bridge-backward",
  "bridgeType": "backward",
  "selectedDate": "2026-03-22",
  "writeDates": [
    "2026-03-22",
    "2026-03-23",
    "2026-03-24"
  ],
  "clearDates": [],
  "resultingSegment": {
    "startDate": "2026-03-22",
    "endDate": "2026-03-28"
  }
}
```

Rules:

- `writeDates` lists dates whose period membership will be set or confirmed as `true`
- `clearDates` lists dates whose period membership will be cleared
- `resultingSegment` describes the final continuous segment that contains the selected date after the action is applied

### `ResolveSingleDayPeriodActionInput`

```json
{
  "moduleInstanceId": "mi_123",
  "date": "2026-03-22"
}
```

### `ResolveSingleDayPeriodActionResult`

```json
{
  "selectedDate": "2026-03-22",
  "role": "not-period",
  "chip": {
    "text": "月经",
    "selected": false
  },
  "resolvedAction": {
    "action": "start",
    "bridgeType": "backward",
    "prompt": {
      "required": true,
      "type": "backward",
      "message": "已在 03/24 标记了经期开始，要提前到 03/22 吗？",
      "confirmLabel": "确认",
      "cancelLabel": "取消"
    },
    "effect": {
      "action": "bridge-backward",
      "bridgeType": "backward",
      "selectedDate": "2026-03-22",
      "writeDates": ["2026-03-22", "2026-03-23", "2026-03-24"],
      "clearDates": [],
      "resultingSegment": {
        "startDate": "2026-03-22",
        "endDate": "2026-03-28"
      }
    }
  }
}
```

Rules:

- the frontend should not infer bridge type or prompt copy by itself once this contract is stable

### Single-Day Action Semantics

`start` on `not-period`:

- if bridging does not apply:
  - set the selected date as a new segment start
  - auto-fill forward by `N-1`, where `N = defaultPeriodDurationDays`
- if bridging applies:
  - require confirmation first
  - after confirmation, write the bridged dates and recompute the resulting segment

`revoke-start` on `start`:

- chip text remains `月经开始`
- chip appears selected
- tapping it revokes the entire current segment
- required effect: clear all dates in the selected segment

`end-here` on `in-progress`:

- keep the selected date as `period`
- clear all later dates in the same segment
- the selected date becomes the new segment end

`noop` on `end`:

- tapping `月经结束` results in no change
- this should not silently clear the selected date

### Resolver And Apply Direction

The application layer supports two stages:

1. resolve the action
2. apply the action

Recommended direction:

- query: `getSingleDayPeriodAction`
- command: `applySingleDayPeriodAction`

Reasoning:

- the frontend needs the contextual chip semantics before the user taps
- bridge prompts are easier to render from a read-style resolver than from a write command that may or may not mutate
- this keeps confirmation UX explicit and testable
- it avoids overloading `recordPeriodDay` with multiple unrelated meanings

Recommended flow:

1. frontend loads selected date context
2. frontend calls `getSingleDayPeriodAction`
3. backend returns:
   - derived role
   - chip text
   - selected state
   - resolved action
   - optional prompt
   - effect preview
4. if no confirmation is required:
   - frontend calls `applySingleDayPeriodAction`
5. if confirmation is required:
   - frontend shows the prompt first
   - on confirm, frontend calls `applySingleDayPeriodAction`

Suggested apply input:

```json
{
  "moduleInstanceId": "mi_123",
  "selectedDate": "2026-03-22",
  "action": "start",
  "confirmed": true
}
```

Rules:

- `confirmed` should be `false` or omitted for actions that do not require confirmation
- for bridge actions that require confirmation, frontend should only send `confirmed: true` after the user accepts the prompt
- backend must still validate that the action remains valid at apply time if underlying data changed between resolve and apply

Concurrency guard:

- apply-time validation must re-check the selected date's current segment context before mutating
- a `decisionKey` fingerprint is optional for now; apply-time revalidation is mandatory

Recommended apply result without confirmation:

```json
{
  "moduleInstanceId": "mi_123",
  "selectedDate": "2026-03-22",
  "appliedAction": "end-here",
  "confirmationRequired": false,
  "effect": {
    "writeDates": ["2026-03-22"],
    "clearDates": ["2026-03-23", "2026-03-24"],
    "resultingSegment": {
      "startDate": "2026-03-20",
      "endDate": "2026-03-22"
    }
  },
  "recomputed": {
    "segmentChanged": true,
    "predictionChanged": true
  }
}
```

Recommended apply result requiring confirmation:

```json
{
  "moduleInstanceId": "mi_123",
  "selectedDate": "2026-03-22",
  "appliedAction": null,
  "confirmationRequired": true,
  "prompt": {
    "required": true,
    "type": "backward",
    "message": "已在 03/24 标记了经期开始，要提前到 03/22 吗？",
    "confirmLabel": "确认",
    "cancelLabel": "取消"
  },
  "effectPreview": {
    "action": "bridge-backward",
    "bridgeType": "backward",
    "selectedDate": "2026-03-22",
    "writeDates": ["2026-03-22", "2026-03-23", "2026-03-24"],
    "clearDates": [],
    "resultingSegment": {
      "startDate": "2026-03-22",
      "endDate": "2026-03-28"
    }
  }
}
```

### Prompt Copy Contract

The frozen prompt texts are:

- forward bridge:
  - `把这段经期延长到 MM/DD？`
- backward bridge:
  - `已在 MM/DD 标记了经期开始，要提前到 MM/DD 吗？`
- two-sided bridge:
  - `附近已有经期记录，是否合并？`

Rules:

- `MM/DD` values must be provided from the resolved action context
- prompt buttons should be `取消` and `确认`

### Existing Command Reinterpretation

`recordPeriodDay` is no longer sufficient as the long-term semantic surface by itself.

The stable single-day meaning now covers:

- plain forward auto-fill from a fresh start
- revoking a whole segment from its start
- truncating a segment at the selected day
- forward, backward, and two-sided bridging with confirmation

Implementation should stop treating `recordPeriodDay` as a blind write-only toggle and instead treat it as a resolved single-day period action flow.

### Relationship With Batch Commands

Batch semantics remain unchanged:

- `recordPeriodRange` writes the explicit selected range only
- `clearPeriodRange` clears the explicit selected range only
- batch commands do not use smart bridging
- batch commands do not use single-day `开始/结束` semantics

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
  "endDate": "2026-03-27",
  "durationDays": 5,
  "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>",
  "derivedFromDates": [
    "2026-03-23",
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27"
  ]
}
```

### `ModuleSettingsReadModel`

```json
{
  "moduleInstanceId": "mi_123",
  "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>",
  "defaultPredictionTermDays": "<DEFAULT_PREDICTION_TERM_DAYS>"
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

Rules:

- `predictedStartDate` is derived from the latest period segment start plus `defaultPredictionTermDays`
- `basedOnCycleCount` remains a compatibility field and is not the prediction source of truth
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

- legacy compatibility command for marking one date as being in period
- older behavior treated this as a direct write that could recognize a new anchored segment and auto-fill later dates according to the current default period duration

Current direction:

- frontend single-day interaction should no longer call this command directly
- the stable semantic surface for single-day editing is now `getSingleDayPeriodAction` + `applySingleDayPeriodAction`
- this older command may remain temporarily for backward compatibility or internal reuse

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
- do not write default detail values or note content just because period was toggled
- if detail values or note already exist on an explicit day, period toggling should preserve them
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

- legacy compatibility command for clearing one date from the current period interpretation

Current direction:

- frontend single-day interaction should no longer call this command directly
- contextual single-day revoke/truncate behavior should be exposed through `applySingleDayPeriodAction`

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "profileId": "profile_123",
  "date": "2026-03-25"
}
```

### `recordPeriodRange`

Purpose:

- mark a contiguous date range as period through one explicit batch action
- support the home-page long-press batch edit flow without implying attribute recording

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "startDate": "2026-03-23",
  "endDate": "2026-03-27"
}
```

Effects:

- create or update explicit `day_record` rows for each selected date
- set `isPeriod = true` for all selected dates
- do not auto-fill outside the selected range
- do not modify `painLevel`, `flowLevel`, `colorLevel`, or `note` on existing explicit rows
- newly created rows should keep detail fields and note empty so batch period marking alone does not create detail markers
- recompute derived outputs after the range is applied

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "recordedDates": [
    "2026-03-23",
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27"
  ]
}
```

### `clearPeriodRange`

Purpose:

- clear period membership across one contiguous date range through one explicit batch action

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "startDate": "2026-03-23",
  "endDate": "2026-03-27"
}
```

Effects:

- set `isPeriod = false` for every selected explicit period day
- do not modify `painLevel`, `flowLevel`, `colorLevel`, or `note`
- leave explicit rows in place when other recorded data remains
- recompute derived outputs after the range is cleared

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "clearedDates": [
    "2026-03-23",
    "2026-03-24",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27"
  ]
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
  "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>"
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
  "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>",
  "settingsChanged": true
}

### `updateDefaultPredictionTerm`

Purpose:

- adjust the fixed prediction term used to compute the next predicted period start

Suggested input:

```json
{
  "moduleInstanceId": "mi_123",
  "defaultPredictionTermDays": "<DEFAULT_PREDICTION_TERM_DAYS>"
}
```

Effects:

- update module-level settings
- future prediction recomputation uses the new term

Suggested response data:

```json
{
  "moduleInstanceId": "mi_123",
  "defaultPredictionTermDays": "<DEFAULT_PREDICTION_TERM_DAYS>",
  "settingsChanged": true
}
```
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
      "endDate": "2026-03-27",
      "durationDays": 5,
      "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>"
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
    "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>",
    "defaultPredictionTermDays": "<DEFAULT_PREDICTION_TERM_DAYS>"
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

- current default period duration and prediction term for the module instance

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
    "defaultPeriodDurationDays": "<DEFAULT_PERIOD_DURATION_DAYS>",
    "defaultPredictionTermDays": "<DEFAULT_PREDICTION_TERM_DAYS>"
  }
}
```

## Recommended First Stable Slice

If the team wants the smallest practical first contract, stabilize these first:

- `getSingleDayPeriodAction`
- `applySingleDayPeriodAction`
- `recordDayDetails`
- `updateDefaultPeriodDuration`
- `getModuleHomeView`
- `getDayRecordDetail`
- `getCalendarWindow`

This slice is enough to support:

- first-time entry
- contextual single-day `月经 / 月经开始 / 月经结束`
- bridge confirmation before single-day merge/extension
- apply-time revalidation for single-day edits
- detail refinement
- settings refresh
- prediction refresh
- same-instance private/shared behavior

## Open Questions

- whether the default period duration should be versioned historically or only stored as the current setting
- whether deviation should stay a pure read-model interpretation or later gain explicit saved explanation fields
