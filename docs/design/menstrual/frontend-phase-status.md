# Menstrual Phase Status Frontend

## Purpose

This document defines the UI presentation contract for the cycle phase status feature.

For behavioral rules, phase boundary logic, and hint semantics, read the paired function doc:

- [function-phase-status.md](./function-phase-status.md)

## Hero Status Row — Updated Structure

The primary status frame in `StatusHeroCard` replaces the flat `经期第N天 / 非经期` text with a two-group inline row when a cycle phase exists:

```
[phase_icon] 阶段名   [warning_icon] 提示文本
```

Both groups are left-aligned in a single horizontal container. The hint group sits directly after the phase name group with a 16px gap — it does not float to the right edge.

### Layout

```
statusRow (horizontal, alignItems: center, gap: 16)
  └─ phaseGroup (horizontal, gap: 8, alignItems: center)
       ├─ phase_icon  22×22
       └─ phase_name  fontSize 17, weight 600
  └─ hintGroup (horizontal, gap: 5, alignItems: center)
       ├─ warning_icon  14×14
       └─ hint_text  fontSize 12, color: text.secondary
```

The `statusRow` container is `fit_content` width — it does not stretch to fill the card.

## Icon Assets

Runtime path (implementation): `frontend/static/menstrual/`

| Phase | Filename | Design draft source |
|---|---|---|
| 卵泡期 | `embryo.svg` | `docs/design-drafts/assets/embryo.svg` |
| 排卵期 | `sun.svg` | `docs/design-drafts/assets/sun.svg` |
| 黄体期 | `moon.svg` | `docs/design-drafts/assets/moon.svg` |
| Hint (all phases) | `warning.svg` | `docs/design-drafts/assets/warning.svg` |

Copy the four SVGs from `docs/design-drafts/assets/` into `frontend/static/menstrual/` as part of Task 3 before wiring the component.

The `经期第N天` state keeps its existing icon (`frontend/static/icons/coffee.svg`) and layout unchanged.
If no historical period segment exists yet, `StatusHeroCard` must fall back to the empty state `暂无记录` and show the invitation copy defined in [frontend-home.md](./frontend-home.md); it should not render the phase row or reliability warning.
If historical data exists but the prediction chain does not yet support fine-grained phase classification, `StatusHeroCard` should render a neutral coarse cycle state instead of pretending the user is in `卵泡期`.

Frozen coarse-state copy:

- primary status: `记录中`
- hint text: `记录更多以生成预测`

## Emphasis States

Two visual states exist: **neutral** and **amber emphasis**.

### Neutral (卵泡期, 黄体期 · 早段)

- `phaseGroup`: transparent background
- `phase_name` color: `color.text.primary` (#2F2A26)
- Card fill: `color.bg.card` (#FFFFFF)
- No border

### Amber Emphasis (排卵期, 黄体期 · 前7天)

- `phaseGroup` becomes a pill: `cornerRadius: 999`, `fill: #FBF0D8`, `padding: [6, 12]`
- `phase_name` color: `color.accent.detail` (#B08D57)
- Card fill: `#FFFDF8`
- Card stroke: `{ align: inside, fill: #E8D5A3, thickness: 1 }`

For 黄体期 · 前7天, the `hint_text` color also shifts to `color.accent.detail` (#B08D57) to reinforce the approaching-period signal.

No new design system color variables are required. `color.accent.detail` (#B08D57) is already in the token set.

## Prediction Reliability Indicator

When records < 3, an `!` button renders inline with the phase name (after the phase text, before the hint group). Tapping shows a short bottom-sheet or tooltip with reliability copy. The phase display is not suppressed.

## Hint Rotation

The active hint rotates across the phase's hint set. Rotation is session-stable (same hint persists within one app session, advances on next app open or after a configurable interval). Hints that contain `{n}` resolve `n` to `daysUntilNextPeriod` before rendering.

## Reference Row (上次 / 下次)

Position and structure unchanged from the current hero. The amber emphasis state does not affect the reference row.

## Visual Spec Summary

| State | Card bg | Phase name color | Phase group bg | Hint color |
|---|---|---|---|---|
| 卵泡期 | #FFFFFF | #2F2A26 | transparent | #72685F |
| 排卵期 | #FFFDF8 | #B08D57 | #FBF0D8 pill | #72685F |
| 黄体期 早 | #FFFFFF | #2F2A26 | transparent | #72685F |
| 黄体期 前7天 | #FFFDF8 | #B08D57 | #FBF0D8 pill | #B08D57 |
| 经期 | unchanged | unchanged | unchanged | unchanged |

## Semantic Dependency

Phase boundary computation, luteal sub-state threshold, and hint variable resolution must remain in the contract adapter layer, not inline in the component. The component receives a resolved `PhaseStatusViewModel`:

```js
{
  phase: '卵泡期' | '排卵期' | '黄体期' | '经期' | null,
  isLutealLate: boolean,           // true when 黄体期 && daysUntilNext <= 7
  emphasis: boolean,               // true when 排卵期 or isLutealLate
  hint: string,                    // fully resolved, variables substituted
  showReliabilityWarning: boolean,
  daysUntilNextPeriod: number | null
}
```

Rules:

- when `phase !== null`, the `phase` field uses Chinese string literals throughout — adapter, tests, and component branches must all use the same values
- `phase = null` means the hero is currently using the neutral coarse cycle state rather than one of the three predicted out-of-period phases
- the component must not invent its own fallback phase label when `phase = null`; it should use the frozen coarse-state copy supplied by the adapter or parent page
- phase UI should remain anchored to the same `predictedStartDate` source as the hero `下次` range; do not derive a separate display-only phase timeline inside the component

## Related Docs

- [function-phase-status.md](./function-phase-status.md)
- [frontend-home.md](./frontend-home.md)
