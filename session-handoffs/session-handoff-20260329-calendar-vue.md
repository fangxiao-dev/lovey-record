# Session Handoff

## Current Goal

Implement the Calendar Vue component for the menstrual home page, based on the newly written `function-calendar.md` UX contract.

This work is the second major frontend task after `SelectedDatePanel.vue` was updated. It covers the calendar panel (view switch, navigation, date grid, jump tabs, legend, and batch edit panel).

## Completion Status

### Completed

1. **`function-calendar.md`** — Complete authoritative UX contract for the calendar panel
   - Component structure: HeaderNav, SegmentedControl, CalendarGrid, JumpTabs, CalendarLegend
   - View modes: 3-week (default, editable) / month view (browse-only)
   - Jump tab rules: 今天 / 本次 / 下次预测, disable behavior confirmed
   - Batch selection interaction: long-press drag, selectable range (past + today), BatchEditPanel
   - Batch action rules: `设为经期` / `清除记录` (is_period only, attributes untouched)
   - Panel state machine: single-day edit mode vs batch edit mode
   - All `[待确认]` items resolved
   - Status: **verified and final**

2. **`Design-Overview.md`** — Updated to include `function-calendar.md` in the index
   - Status: **complete**

### Not Completed

1. **Calendar Vue components** — Not started
   - `CalendarGrid.vue` — date cell grid with week dividers
   - `CalendarNav.vue` (or inline in parent) — HeaderNav + SegmentedControl
   - `JumpTabs.vue` — 3 shortcut chips
   - `CalendarLegend.vue` — legend strip
   - `BatchEditPanel.vue` — batch edit bottom card

2. **Pencil design review for Calendar** — Not reviewed in depth this session
   - Key nodes: `lpXQB` (3-week view control), `Yzswn` (header nav), `fydEy` (jump tabs), `Y5mJI` (legend)
   - BatchEditPanel: `QPWCu`
   - Recommend taking a screenshot of the full calendar page state in Pencil before starting Vue

3. **CalendarGrid state rendering** — Logic not designed at Vue level
   - Which Pencil date-cell variants map to which CSS classes
   - How the `selected` overlay interacts with existing business state

## What Changed

### Documentation

- **New**: `docs/design/menstrual/function-calendar.md` — authoritative UX contract for the entire calendar panel
- **Updated**: `docs/design/menstrual/Design-Overview.md` — added function-calendar.md to index

### No Code Changes

No Vue components were created or modified in this session. This session was documentation-only.

## Pitfalls And Resolutions

### No pitfalls encountered

This session was research and documentation. No implementation issues arose.

One potential pitfall to watch for in implementation:

**DateCell selected state overlays business state** — The `selected` emphasis (drop shadow + stroke) must not erase `period`, `prediction`, or `today` visual language. This is defined in `date-state-spec.md` overlay priority rules. Implement selected state as an additive layer, not a replacement.

## Open Issues

1. **Pencil design not verified at implementation start** — The Pencil nodes for calendar (lpXQB, Yzswn, fydEy, Y5mJI, QPWCu) were read at data level but no screenshot was taken. The next session should screenshot the full calendar Pencil board before starting Vue to confirm visual intent.

2. **CalendarGrid scroll/window logic not specified** — `function-calendar.md` defines the 3-week rolling window concept and default center priority, but does not define how the scroll is implemented at the Vue level (virtual scroll? static render of 3 weeks? re-render on navigation?). Decide before building.

3. **Long-press + drag detection** — Touch event handling for long-press drag is non-trivial in uni-app/HBuilderX. Confirm which event API to use (`@longpress` + `@touchmove`, or a gesture library) before building `CalendarGrid`.

## Next Recommended Actions

1. **Read the UX contract and date-state spec**
   - `docs/design/menstrual/function-calendar.md` (new — the primary spec)
   - `docs/design/menstrual/date-state-spec.md` (DateCell visual rules)

2. **Take a Pencil screenshot of the calendar area**
   - Open `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
   - Screenshot nodes: `lpXQB`, `Yzswn`, `fydEy`, `Y5mJI`, `QPWCu`
   - Confirms visual intent before writing CSS

3. **Decide on scroll implementation approach** (before writing CalendarGrid)
   - 3-week static render with prev/next swap on nav tap
   - Or infinite scroll with virtual windowing

4. **Implement in this order**
   - `CalendarLegend.vue` (simplest, no interaction)
   - `JumpTabs.vue` (3 chips, disabled state)
   - `CalendarNav.vue` (month label + arrows)
   - `CalendarGrid.vue` (date cells, tap handler, long-press drag)
   - `BatchEditPanel.vue` (shows when batch mode is active)

## Useful References

- **UX contract**: `docs/design/menstrual/function-calendar.md`
- **DateCell visual rules**: `docs/design/menstrual/date-state-spec.md`
- **Recording model**: `docs/design/menstrual/function-recording-model.md`
- **Pencil file**: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
  - Calendar nodes: `lpXQB` (view control), `Yzswn` (nav), `fydEy` (jump tabs), `Y5mJI` (legend), `QPWCu` (BatchEditPanel)
- **Reference component**: `frontend/components/menstrual/SelectedDatePanel.vue` — follow same prop/event pattern
- **Domain model**: `docs/contracts/domain-models/2026-03-23-menstrual-domain-model.md`
