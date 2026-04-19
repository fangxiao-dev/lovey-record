# Month Boundary Markers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the 3-week calendar window spans two months, show (A) a vertical divider line and (B) a stacked month-chip at the column boundary, with boundary-adjacent cells pulling their background away from the edge; also update the `HeaderNav` month title to show the full window span.

**Architecture:** Two independent changes — (1) a pure-function label formatter in the adapter layer (no component changes), and (2) a computed-property + template + CSS change entirely inside `CalendarGrid.vue`. No new files.

**Tech Stack:** Vue 3, uni-app, SCSS design tokens, Node built-in `node:test`

---

## Background

### How the 3-week window is computed

`createCalendarDatesForViewMode` in `home-contract-adapter.js`:
```js
const startDate = addDays(startOfWeek(focusDate), -7);
return createDateRange(startDate, addDays(startDate, 20));
```
`startOfWeek` returns the Monday of the week containing `focusDate`.
Window = 21 days (3 full weeks).

### Current month label

`formatMonthLabel(dateString)` (line 63) takes a single date and returns `YYYY · M月`.
It is called at line 870 in `createMenstrualHomePageModel` for `headerNav.monthLabel`, always using `resolvedFocusDate`.

### CalendarGrid data shape

Each `week` has a `cells` array. Each `cell` has:
- `isoDate` — ISO string `'2026-04-30'`
- `label` — display string `'30'`
- `variant` — state string

Weeks are separated by a `calendar-grid__divider` (`1px`, `$calendar-week-divider`).
The cells row is a 7-column CSS grid (`calendar-grid__cells`).

### Test runner
```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

---

## Task 1 — `formatWindowMonthLabel` pure function + tests

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js` (after line 66, before `createDateRange`)
- Test: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

### Step 1 — Write the failing tests

Add at the bottom of the test file, before the closing:

```js
test('formatWindowMonthLabel via createMenstrualHomePageModel: single month', () => {
  // focusDate 2026-04-19 (Sun) → startOfWeek = Apr 13 → window Apr 06–Apr 26 (all April)
  const { homeView, moduleSettings } = createSeededHomeContracts();
  const model = createMenstrualHomePageModel({
    homeView,
    moduleSettings,
    dayDetail: createEmptyDayDetail({
      moduleInstanceId: 'seed-home-module',
      profileId: 'seed-home-profile',
      date: '2026-04-19'
    }),
    today: '2026-04-19',
    focusDate: '2026-04-19',
    viewMode: 'three-week'
  });
  assert.equal(model.headerNav.monthLabel, '2026 · 4月');
});

test('formatWindowMonthLabel via createMenstrualHomePageModel: cross-month same year', () => {
  // focusDate 2026-04-26 (Sun) → startOfWeek = Apr 20 → window Apr 13–May 03
  const { homeView, moduleSettings } = createSeededHomeContracts();
  const model = createMenstrualHomePageModel({
    homeView,
    moduleSettings,
    dayDetail: createEmptyDayDetail({
      moduleInstanceId: 'seed-home-module',
      profileId: 'seed-home-profile',
      date: '2026-04-26'
    }),
    today: '2026-04-26',
    focusDate: '2026-04-26',
    viewMode: 'three-week'
  });
  assert.equal(model.headerNav.monthLabel, '26 · 4月 ~ 5月');
});

test('formatWindowMonthLabel via createMenstrualHomePageModel: cross-year', () => {
  // focusDate 2025-12-28 (Sun) → startOfWeek = Dec 22 → window Dec 15–Jan 04 2026
  const minimalHomeView = {
    moduleInstanceId: 'test',
    sharingStatus: 'private',
    currentStatusSummary: {
      currentStatus: 'out_of_period',
      anchorDate: null,
      currentSegment: null,
      previousSegment: null,
      statusCard: { label: '非经期' }
    },
    calendarMarks: [],
    predictionSummary: null
  };
  const model = createMenstrualHomePageModel({
    homeView: minimalHomeView,
    moduleSettings: { defaultPeriodDurationDays: 5, defaultPredictionTermDays: 28 },
    dayDetail: createEmptyDayDetail({
      moduleInstanceId: 'test',
      profileId: 'test-profile',
      date: '2025-12-28'
    }),
    today: '2025-12-28',
    focusDate: '2025-12-28',
    viewMode: 'three-week'
  });
  assert.equal(model.headerNav.monthLabel, '25 · 12月 ~ 26 · 1月');
});
```

### Step 2 — Run; confirm all three fail

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: 3 new tests **FAIL** (wrong label format), all existing tests pass.

### Step 3 — Add `formatWindowMonthLabel` to the adapter

In `home-contract-adapter.js`, add immediately after `formatMonthLabel` (after line 66):

```js
function formatWindowMonthLabel(windowStartDate, windowEndDate) {
  const start = toDateOnly(windowStartDate);
  const end   = toDateOnly(windowEndDate);
  const sy = start.getUTCFullYear();
  const ey = end.getUTCFullYear();
  const sm = start.getUTCMonth() + 1;
  const em = end.getUTCMonth() + 1;

  if (sy === ey && sm === em) {
    return `${sy} · ${sm}月`;
  }
  if (sy === ey) {
    return `${String(sy).slice(2)} · ${sm}月 ~ ${em}月`;
  }
  return `${String(sy).slice(2)} · ${sm}月 ~ ${String(ey).slice(2)} · ${em}月`;
}
```

### Step 4 — Wire into `createMenstrualHomePageModel`

In `createMenstrualHomePageModel` (around line 869), replace:
```js
headerNav: {
  monthLabel: formatMonthLabel(resolvedFocusDate),
```
with:
```js
headerNav: {
  monthLabel: (() => {
    if (viewMode !== 'three-week') return formatMonthLabel(resolvedFocusDate);
    const winStart = addDays(startOfWeek(resolvedFocusDate), -7);
    const winEnd   = addDays(winStart, 20);
    return formatWindowMonthLabel(winStart, winEnd);
  })(),
```

### Step 5 — Run; confirm all tests pass

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: all tests **PASS** including the 3 new ones.
Existing `monthLabel` assertions at lines 302 and 332 both use `viewMode: 'month'` and keep returning `YYYY · M月` format — they must still pass unchanged.

### Step 6 — Commit

```bash
git add frontend/components/menstrual/home-contract-adapter.js \
        frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "feat(calendar): window-aware month label in 3-week view header"
```

---

## Task 2 — CalendarGrid: boundary detection computed property

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue` (script `computed` section)

### Step 1 — Add `weekBoundaryInfo` computed

In the `computed:` block, after `allCells`, add:

```js
weekBoundaryInfo() {
  return this.resolvedWeeks.map((week, weekIndex) => {
    // --- within-row boundary ---
    let inRowBoundaryAfterIndex = -1;
    for (let i = 0; i < 6; i++) {
      const a = week.cells[i]?.isoDate;
      const b = week.cells[i + 1]?.isoDate;
      if (a && b) {
        const ma = new Date(a + 'T00:00:00Z').getUTCMonth();
        const mb = new Date(b + 'T00:00:00Z').getUTCMonth();
        if (ma !== mb) { inRowBoundaryAfterIndex = i; break; }
      }
    }

    const inRowNewMonth = inRowBoundaryAfterIndex >= 0
      ? new Date(week.cells[inRowBoundaryAfterIndex + 1].isoDate + 'T00:00:00Z').getUTCMonth() + 1
      : null;

    // --- between-row boundary (this row's divider is a month boundary) ---
    const prevWeek = weekIndex > 0 ? this.resolvedWeeks[weekIndex - 1] : null;
    let betweenRowBoundary = false;
    let betweenRowNewMonth = null;
    if (prevWeek?.cells[6]?.isoDate && week.cells[0]?.isoDate) {
      const pm = new Date(prevWeek.cells[6].isoDate + 'T00:00:00Z').getUTCMonth();
      const cm = new Date(week.cells[0].isoDate + 'T00:00:00Z').getUTCMonth();
      if (pm !== cm) {
        betweenRowBoundary = true;
        betweenRowNewMonth = new Date(week.cells[0].isoDate + 'T00:00:00Z').getUTCMonth() + 1;
      }
    }

    return { inRowBoundaryAfterIndex, inRowNewMonth, betweenRowBoundary, betweenRowNewMonth };
  });
},
```

### Step 2 — Verify no runtime error

Check the H5 dev server renders the calendar without error. No visible change yet — this step only adds data.

### Step 3 — Commit

```bash
git add frontend/components/menstrual/CalendarGrid.vue
git commit -m "feat(CalendarGrid): compute month boundary info per week"
```

---

## Task 3 — CalendarGrid: template — divider, chip, boundary classes

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue` (template only)

### Step 1 — Add `cellIndex` to the inner `v-for`

Change:
```html
<view v-for="cell in week.cells" :key="cell.key || cell.label"
```
to:
```html
<view v-for="(cell, cellIndex) in week.cells" :key="cell.key || cell.label"
```

### Step 2 — Add boundary classes to the cell wrapper

In the same `<view>` element, extend `:class`:
```html
:class="[
  { 'calendar-grid__cell--tappable': interactive && cell.selectable !== false && !busy },
  { 'calendar-grid__cell--boundary-right': weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex === cellIndex },
  { 'calendar-grid__cell--boundary-left': weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex + 1 === cellIndex && weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex >= 0 }
]"
```

### Step 3 — Add within-row divider + chip after the cells `v-for`

Inside `<view class="calendar-grid__cells">`, after the closing `</view>` of the cells `v-for`, add:

```html
<!-- (A) Month boundary vertical divider + (B) chip — within-row -->
<template v-if="weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex >= 0">
  <view
    class="calendar-grid__month-divider"
    aria-hidden="true"
    :style="{ left: ((weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex + 1) / 7 * 100) + '%' }"
  />
  <view
    class="calendar-grid__month-chip"
    aria-hidden="true"
    :style="{ left: ((weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex + 1) / 7 * 100) + '%' }"
  >
    <text>{{ weekBoundaryInfo[weekIndex].inRowNewMonth }}</text>
    <text>月</text>
  </view>
</template>
```

### Step 4 — Update the week-divider for between-row boundary

Replace:
```html
<view v-if="weekIndex > 0" class="calendar-grid__divider" aria-hidden="true"></view>
```
with:
```html
<view
  v-if="weekIndex > 0"
  class="calendar-grid__divider"
  :class="{ 'calendar-grid__divider--month-boundary': weekBoundaryInfo[weekIndex].betweenRowBoundary }"
  aria-hidden="true"
>
  <template v-if="weekBoundaryInfo[weekIndex].betweenRowBoundary">
    <view class="calendar-grid__divider-segment" />
    <view class="calendar-grid__month-chip calendar-grid__month-chip--between-row">
      <text>{{ weekBoundaryInfo[weekIndex].betweenRowNewMonth }}</text>
      <text>月</text>
    </view>
    <view class="calendar-grid__divider-segment" />
  </template>
</view>
```

### Step 5 — Verify visually (H5 dev)

Navigate to a 3-week window that spans two months. The boundary column should now show the divider and chip. Between-row boundary (last day = Sunday) should show chip inside the week divider slot.

### Step 6 — Commit

```bash
git add frontend/components/menstrual/CalendarGrid.vue
git commit -m "feat(CalendarGrid): render month boundary divider and chip in 3-week view"
```

---

## Task 4 — CalendarGrid: CSS for all new elements

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue` (`<style>` block)

### Step 1 — Add `position: relative; overflow: visible` to `.calendar-grid__cells`

```scss
.calendar-grid__cells {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  column-gap: 8rpx;
  row-gap: 12rpx;
  justify-items: center;
  position: relative;   /* ← ADD: anchor for absolute chip/divider */
  overflow: visible;    /* ← ADD: allow chip to poke into row gap above */
}
```

### Step 2 — Boundary-adjacent cell background pull

```scss
/* Pull the DateCell box away from the month boundary edge */
.calendar-grid__cell--boundary-right > .date-cell {
  margin-right: 20rpx;
}
.calendar-grid__cell--boundary-left > .date-cell {
  margin-left: 20rpx;
}
```

### Step 3 — Vertical divider (A)

```scss
.calendar-grid__month-divider {
  position: absolute;
  top: 4rpx;
  bottom: 4rpx;
  width: 1px;
  background: $calendar-week-divider;
  pointer-events: none;
  z-index: 1;
  transform: translateX(-50%);
}
```

### Step 4 — Month chip (B) — shared base styles

```scss
.calendar-grid__month-chip {
  background: $color-brown-500;  /* #a29488 — warm neutral, distinct from period + prediction */
  color: $color-warm-000;
  font-size: 18rpx;
  font-weight: $font-weight-semibold;
  padding: 6rpx;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
  pointer-events: none;
  z-index: 2;
}

/* Position when inside .calendar-grid__cells (within-row boundary) */
.calendar-grid__cells .calendar-grid__month-chip {
  position: absolute;
  top: -16rpx;               /* poke into the row gap above */
  transform: translateX(-50%);
}

/* Position when inside .calendar-grid__divider--month-boundary (between-row) */
.calendar-grid__month-chip--between-row {
  position: static;
  transform: none;
}
```

### Step 5 — Between-row boundary divider styles

```scss
.calendar-grid__divider--month-boundary {
  height: auto;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.calendar-grid__divider-segment {
  flex: 1;
  height: 1px;
  background: $calendar-week-divider;
}
```

### Step 6 — Visual QA checklist

Check these 5 scenarios in H5 dev by navigating the 3-week window:

| Scenario | Navigate to | Expect |
|---|---|---|
| Single month | Window fully in April | No chip/divider, header `2026 · 4月` |
| Within-row, both default | Apr 27 window (Apr 30 / May 1 both default) | Chip + divider between 30 and 01 |
| Within-row, boundary-right = period | Window where Apr 30 is period | Period box pulled left, chip readable |
| Within-row, both colored | Period + prediction flanking boundary | Both boxes pulled, chip legible between them |
| Between-row | Window where Apr ends on Sunday | Chip in week-divider slot, no vertical divider |

### Step 7 — Run adapter tests to confirm no regression

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: all pass.

### Step 8 — Commit

```bash
git add frontend/components/menstrual/CalendarGrid.vue
git commit -m "feat(CalendarGrid): CSS for month boundary chip and divider"
```
