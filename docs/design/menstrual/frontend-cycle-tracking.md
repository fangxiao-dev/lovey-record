# Menstrual Tracking App - UI Specification (MVP)

## 1. Overall Layout

Single page structure:

----------------------------------

[ Weak Header ]

[ Summary Card ]

[ Trend Area ]

[ History List ]

----------------------------------

---

## 1.1 Page Positioning

- this is a secondary report page inside the menstrual module
- it is entered from home through a separate secondary entry card
- it does not replace home and does not inherit editing responsibilities

---

## 1.2 Header

The page header should be weak.

Required:

- back action
- low-presence title

Do not add:

- large hero
- subtitle
- settings action
- prediction chips

Suggested title direction:

- `周期记录`

---

## 2. Summary Card

### 2.1 Role

The summary card is the first reading layer.

It should feel like a calm account summary, not a dashboard.

---

### 2.2 Content

Show exactly two rows:

- cycle average and fluctuation
- duration average and fluctuation

Final row shape:

- `周期 28.6 天   波动 -2 ~ +4 天`
- `时长 5.2 天   波动 -1 ~ +2 天`

---

### 2.3 Layout

Use one card with two rows.

Each row stays on one line.

Recommended reading order inside a row:

- left: metric label + average value
- right: fluctuation range

Do not split these into:

- four mini-cards
- four stacked text blocks
- oversized dashboard numerals

---

### 2.4 Visual Direction

- same warm-white card material as menstrual home
- restrained typography
- light separation between the two rows only
- no extra icons are required

---

## 3. Trend Area

### 3.1 Structure

Tab-based switch:

[ Cycle | Duration ]

---

### 3.2 Chart Design

#### Type
- Smooth line (low tension)
- No fill

---

### 3.3 Elements

Include:
- Line
- Points

Exclude:
- Labels
- Legend
- Grid
- Axis text

---

### 3.4 Visual Style

Line:
- Medium opacity (60–70%)

Points:
- Solid color
- Slightly stronger than line

Background:
- Clean
- No heavy shadows

---

### 3.5 Axis

X-axis:
- Hidden

Y-axis:
- Optional (minimal ticks or none)

---

### 3.6 Interaction

Tap point → show tooltip

Tooltip content:

- Date
- Cycle length (if exists)
- Duration

---

### 3.7 Empty State

If data < 3:

Display:

`记录 3 次后开始有图`

Rules:

- keep the trend card visible
- do not render the chart
- do not switch to a full-page empty state

---

## 4. Tab Behavior

### Tab 1: Cycle
- y = cycle_length

### Tab 2: Duration
- y = duration

Switch:
- instant
- no animation required (optional fade)

---

## 5. History List

### 5.1 Layout

Light table-like format:

| Start | End | Duration | Cycle |

---

### 5.2 Sorting

- Latest first (DESC)

---

### 5.3 Row Content

Example:

| Apr 06 | Apr 10 | 5d | 28d |

---

### 5.4 Special Cases

First row:
- cycle = "-"

---

### 5.5 Highlight

Optional:
- current/latest cycle slightly highlighted

---

## 6. Visual Hierarchy

| Element | Priority |
|--------|--------|
| Summary card | High |
| Trend card | Medium-High |
| History list | Medium |
| Background | Low |

---

## 7. Design Principles

- Calm
- Minimal
- Non-intrusive
- No judgment
- Warm
- Orderly

---

## 8. Interaction Philosophy

Top:
→ "read the summary"

Middle:
→ "see pattern"

Bottom:
→ "verify data"

---

## 9. Do NOT Add (MVP Constraint)

- No analytics labels
- No predictions
- No alerts
- No health scoring
- No settings guidance text
- No editing actions

---

## 10. Future UI Extension (Not now)

- overlay symptoms (color-coded points)
- prediction dotted line
- subtle range shading
