# Menstrual Phase Status Function

## Purpose

This document defines the functional contract for the cycle phase status feature.

It upgrades the Hero area from a binary `经期第N天 / 非经期` model to a four-phase cycle model with a hint layer.

For the frontend/UI presentation contract, read the paired frontend doc:

- [frontend-phase-status.md](./frontend-phase-status.md)

## Background

The prior model only distinguished `in-period` from `out-of-period`. The out-of-period state carried no information about where the user was in their cycle. This feature breaks the out-of-period interval into three named phases.

## Phase Model

The four phases cover the complete cycle:

| Phase | Chinese | Trigger |
|---|---|---|
| 经期 | Period | Day 1 through end of period |
| 卵泡期 | Follicular | End of period through day before ovulation window |
| 排卵期 | Ovulation | Around cycle day `cycle_length − 14`, ±1–2 days |
| 黄体期 | Luteal | After ovulation window through day before next period |

### Phase Boundary Rules (MVP)

- **经期**: `today` is within the current period segment
- **排卵期 window**: centered on `cycle_start + cycle_length − 14`, spanning ±2 days (5-day window)
- **卵泡期**: between period end and start of ovulation window
- **黄体期**: between end of ovulation window and next predicted period start

All phase boundaries derive from:

- `lastPeriodStartDate`
- `defaultPeriodDurationDays` (from module settings)
- `defaultCycleLengthDays` (from module settings)

No user-entered ovulation or symptom data is consumed in this MVP.

## Luteal Late-Stage Marker

The luteal phase has an internal sub-state:

- **黄体期 · 早段**: from luteal start through day `nextPeriodPredictedStart − 8`
- **黄体期 · 前7天**: from day `nextPeriodPredictedStart − 7` through day before next period

The front-end uses this sub-state to apply amber emphasis. The computation is the same as the luteal phase; only the visual treatment changes.

## Hint Layer

Each phase exposes one hint string shown inline with the phase name.

### Hint Rules

- One active hint per phase at a time
- Hints rotate across a small pre-defined set per phase (rotation logic is defined at the frontend layer)
- Hint strings may contain a variable slot, e.g. `还有 {n} 天经期`
- The variable `{n}` resolves to `daysUntilNextPeriod` derived from the phase computation
- Hint copy is non-assertive: phrases like "可能" and "注意" are preferred over definitive claims

### Hint Set (MVP)

| Phase | Example hints |
|---|---|
| 经期 | 注意休息 |
| 卵泡期 | 状态逐渐恢复 |
| 排卵期 | 精力可能较好 |
| 黄体期 · 早段 | 注意身体变化 |
| 黄体期 · 前7天 | 月经可能临近 / 还有 {n} 天经期 |

The exact text set and rotation order are a frontend concern and may expand without changing this contract.

## Prediction Reliability Warning

When the phase model is operating on limited data, the hero must surface a reliability indicator.

- Trigger: fewer than 3 period records exist
- Treatment: an `!` button appears alongside the phase name
- Tapping `!` shows a short modal: the prediction may improve as more cycles are recorded
- The reliability indicator does not suppress the phase display; it annotates it

## Out of Scope

- User-entered ovulation data
- Symptom-based phase adjustment
- AI personalization
- Multi-hint cards or complex explanatory copy
- Calendar grid changes for phase visualization

## Related Docs

- [frontend-phase-status.md](./frontend-phase-status.md)
- [function-home.md](./function-home.md)
- [function-cycle-tracking.md](./function-cycle-tracking.md)
