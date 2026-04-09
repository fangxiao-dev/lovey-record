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
- Ignore incomplete data
- No interpolation

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
