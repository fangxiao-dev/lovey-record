# Menstrual Cycle Tracking - Functional Specification (MVP)

## 1. Scope

This MVP focuses only on:

- report-page summary metrics
- Period start date tracking
- Cycle calculation
- Duration calculation
- Trend visualization (cycle & duration)
- History verification list

Out of scope:
- Symptoms analysis
- Predictions
- Health recommendations

---

## 2. Core Data Model

### Period Record

Each record represents one period entry:

- start_date (required)
- end_date (optional, derived or user input)

---

### Derived Fields

#### 1. Duration (经期时长)
duration = end_date - start_date + 1

#### 2. Cycle Length (周期)
cycle_length = current.start_date - previous.start_date

Notes:
- First record → cycle_length = null
- Missing previous → no cycle calculation

---

## 3. Data Processing Logic

### 3.1 Record Ordering

- Sort by start_date ASC (for calculation)
- Display DESC (latest first)

---

### 3.2 Cycle Calculation Rules

- Only calculate if previous record exists
- Ignore records that cannot produce a valid cycle interval
- No interpolation

This means:

- cycle calculation requires two consecutive usable period starts
- a record may still contribute `duration` if its duration can be determined
- missing or non-usable cycle context does not invalidate an otherwise valid duration value

---

### 3.3 Duration Handling

If:
- user marks end → use exact
- user only marks days → infer end_date

---

### 3.4 Data Validity

Reject:
- overlapping periods
- end_date < start_date

---

## 4. Trend Data Preparation

### Input

List of cycles:

[
  {date: 2026-01, cycle: 28, duration: 5},
  {date: 2026-02, cycle: 30, duration: 4},
]

---

### Output for Chart

Two datasets:

#### Cycle Dataset
- x: start_date
- y: cycle_length

#### Duration Dataset
- x: start_date
- y: duration

Chart rendering rules:

- `周期` trend keeps its historical-range y-axis behavior
- `时长` trend must render from `0` on the y-axis because the metric range is intentionally small
- both trends render as a simple line with solid dots
- the previous column/bar expression is no longer used

---

### Data Filtering

- Remove null cycle values
- Minimum required points: 3

If < 3:
→ do not render the chart
→ keep the trend container visible
→ show helper copy: `记录 3 次后开始有图`

---

## 5. Interaction Logic

### Tap on Data Point

Returns:

- cycle_length
- duration
- date

---

## 6. Summary Metrics

### 6.1 Summary Scope

The report page summary shows exactly two metric groups:

- average cycle + fluctuation range
- average duration + fluctuation range

This summary is read-only and expresses historical facts only.

It must not:

- reference prediction
- use current settings as the fluctuation baseline
- provide health interpretation
- provide settings guidance

---

### 6.2 Average Rules

Average cycle:

- use all valid cycle_length values
- keep exactly one decimal place

Average duration:

- use all valid duration values
- keep exactly one decimal place

Examples:

- `28.6`
- `29.0`

---

### 6.3 Fluctuation Rules

Display format:

- `-x ~ +y`

Precision:

- integer days only

Baseline:

- historical average
- not the current configured duration or any settings value

Interpretation:

- `x` = average minus historical minimum
- `y` = historical maximum minus average

Both sides are displayed as integer days for scan readability.

---

### 6.4 Summary Row Output

The functional output is two flattened rows:

- `周期 28.6 天   波动 -2 ~ +4 天`
- `时长 5.2 天   波动 -1 ~ +2 天`

This is a display contract, not four independent metric blocks.

---

### 6.5 Current Settings Hint

Below the two historical summary rows, the report page shows one independent hint row for the module's current settings:

- `当前周期 X 天 · 时长 Y 天`

Rules:

- this row uses the module's current settings values
- it must not reuse the latest history row or derive values from the latest period record
- it is a navigation / permission affordance, not a third summary metric row
- editable users jump to the current module's management page
- read-only users see `!` instead of the jump affordance
- tapping `!` shows a permission explanation modal stating that current settings cannot be changed under read-only access

---

### 6.6 Report-Page Align Action Contract

The report page also owns one local settings-alignment action:

- `一键对齐`

This action is part of the report page itself.

It must:

- stay on the report page
- open a report-local custom modal
- not navigate to management before or after execution

The management page remains the manual-settings surface.
The report page `一键对齐` is only a fast alignment flow that writes the same settings model.

---

### 6.7 Align Candidate Calculation Rules

`一键对齐` uses historical averages from the report dataset and converts them into the next settings values.

Average sources:

- next `时长` uses the average of all valid `duration`
- next `周期` uses the average of all valid `cycle_length`

Rounding rule:

- both averages use standard nearest-integer rounding before applying the aligned setting values

Executable scenarios:

- `empty`
- `duration-only`
- `full`

Scenario rules:

- `empty`: no usable records for alignment, so no update can run
- `duration-only`: there is enough data to align `时长`, but not enough valid cycle data to align `周期`
- `full`: there is enough data to align both `时长` and `周期`

Minimum data interpretation:

- `0` records -> `empty`
- `1` record -> `duration-only`
- `2+` usable records with at least one valid `cycle_length` -> `full`

---

### 6.8 Align Modal Copy And Diff Contract

Approved non-executable / partial-data copy must appear exactly as follows:

- `还没有统计到数据噢，先记一笔吧`
- `周期统计至少需要两次记录，本次只会更改时长噢`

For executable scenarios, the modal diff rows use this exact format:

- `周期：<old> 天 -> <next> 天`
- `时长：<old> 天 -> <next> 天`

Where:

- `<old>` is the current module setting shown in the report footer
- `<next>` is the rounded historical average target for this action

In `duration-only`:

- the exact copy `周期统计至少需要两次记录，本次只会更改时长噢` must still be shown
- only the `时长` line is executable and persisted
- `周期` remains unchanged

In `empty`:

- the exact copy `还没有统计到数据噢，先记一笔吧` must be shown
- no diff execution is offered

---

### 6.9 Permission, Optimistic Update, And Rollback Rules

Readonly behavior:

- readonly users cannot mutate settings from report
- if the report footer is in readonly mode, `一键对齐` must be blocked
- the flow must follow the same permission semantics as other report-page setting mutations

Optimistic behavior:

- after confirm, the report footer updates immediately to the target value set
- `duration-only` updates only `时长`
- `full` updates both `周期` and `时长`

Rollback behavior:

- if the align update fails, the report footer must roll back to the exact pre-confirm values
- the user must receive a failure result instead of leaving the optimistic values on screen

---

## 7. Edge Cases

### Case 1: First Entry
- No cycle
- Not plotted

### Case 2: Sparse Data
- Summary can still render from available history
- Trend area does not render chart
- Show helper copy instead

### Case 3: Irregular Data
- No smoothing correction
- Raw data only

---

## 8. System Behavior Summary

| Layer | Behavior |
|------|--------|
| Input | manual period recording |
| Logic | derive cycle + duration, then aggregate averages and fluctuation |
| Output | summary + trend + history |

---

## 9. Future Extension (Not in MVP)

- Prediction model
- Stability detection
- Symptom correlation
