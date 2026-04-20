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
| 排卵期 | Ovulation | Around predicted ovulation center `predicted_start − 14`, ±2 days |
| 黄体期 | Luteal | After ovulation window through day before next period |

### Phase Boundary Rules (MVP)

- The phase model is a **prediction-based cycle classification**, not a claim about the user's exact physiological ovulation day.
- The frontend should treat `predictionSummary.predictedStartDate` as the primary anchor for out-of-period phase computation so that the hero phase and the hero `下次` range always derive from the same prediction chain.
- `defaultCycleLengthDays` may still exist as an upstream prediction input, but phase display should not depend on it directly once `predictedStartDate` is available.

Use these derived dates:

- `periodStartDate = currentSegment.startDate`
- `periodEndDate = currentSegment.endDate`, or `periodStartDate + defaultPeriodDurationDays - 1` when the end date is absent
- `predictedStartDate = predictionSummary.predictedStartDate`
- `ovulationCenterDate = predictedStartDate - 14`
- `ovulationWindowStartDate = ovulationCenterDate - 2`
- `ovulationWindowEndDate = ovulationCenterDate + 2`
- `lateLutealStartDate = predictedStartDate - 7`

Then classify with fixed priority:

- **经期**: `today ∈ [periodStartDate, periodEndDate]`
- **排卵期**: `today ∈ [ovulationWindowStartDate, ovulationWindowEndDate]`
- **卵泡期**: `today < ovulationWindowStartDate` after the current period ends
- **黄体期**: `today > ovulationWindowEndDate && today < predictedStartDate`

Priority is mandatory:

- `经期 > 排卵期 > 卵泡期 > 黄体期`

This prevents abnormal user inputs such as a very short cycle or a very long period duration from causing overlapping visual states.

All phase boundaries derive from:

- `currentSegment.startDate`
- `defaultPeriodDurationDays` (from module settings)
- `predictionSummary.predictedStartDate`

No user-entered ovulation or symptom data is consumed in this MVP.

### Incomplete Prediction Fallback

When historical period data exists but the app still cannot safely classify one of the three out-of-period phases, the hero should not present this as an error or abnormal state.

Rules:

- if no historical period segment exists, the home still uses the empty state `暂无记录`
- if historical period data exists but `predictedStartDate` is unavailable or not yet trustworthy enough for fine-grained phase classification, the hero should enter a **coarse cycle state** rather than forcing `卵泡期`
- the coarse cycle state is a product-level neutral status for “inside an active cycle, but phase not yet refined”
- the coarse cycle state's frozen user-facing copy is:
  - primary status: `记录中`
  - hint text: `记录更多以生成预测`
- this coarse cycle state is **not an exception state**

## Luteal Late-Stage Marker

The luteal phase has an internal sub-state:

- **黄体期 · 早段**: from luteal start through day `nextPeriodPredictedStart − 8`
- **黄体期 · 前7天**: from day `nextPeriodPredictedStart − 7` through day before next period

The front-end uses this sub-state to apply amber emphasis. The computation is the same as the luteal phase; only the visual treatment changes.

This is a flag layered on top of `黄体期`, not a fifth phase.

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
