# Module Home Manual QA

## Calendar Interaction

- [ ] Tap a day in Cycle Window and confirm the inline panel shows single-day state actions.
- [ ] Long press a day in Cycle Window and confirm range mode starts from that day.
- [ ] In batch mode, confirm `保存` and `取消` appear in the jump-tab row instead of a bottom panel.
- [ ] Extend the selection to a later day and confirm cells toggle on along the drag path.
- [ ] Drag out and back over the same cells (for example `25 -> 27 -> 25`) and confirm the revisited cells toggle back off.
- [ ] Drag across today into future dates and confirm future cells are not added to the selected set.
- [ ] Switch to `月览` and confirm range mode cannot be entered there.
- [ ] Start from one selected day, then batch from another day and confirm the single-day selection context follows the latest drag position.
- [ ] Cancel range mode and confirm the calendar returns to the latest single-day context reached during the batch gesture with no persisted changes.
- [ ] Save batch selection and confirm all selected days render as explicit `period` days without detail markers.
- [ ] After save, confirm batch mode closes and the page returns to the latest dragged day's single-day panel.

## Day-State Editing

- [ ] Set an empty day to `period` and confirm the block appears immediately.
- [ ] Set a recorded day to `spotting` and confirm the dot remains while the cycle boundary recalculates.
- [ ] Clear a recorded day and confirm the explicit record disappears.
- [ ] Open the same day again and confirm the panel reflects the saved state.

## Quick Actions

- [ ] Tap `今天来了` and confirm today becomes an explicit `period` day.
- [ ] Tap `今天结束了` during an active cycle and confirm the block closes on today.
- [ ] Tap `记录异常` and confirm the detail form still loads for the selected day.

## Regression Checks

- [ ] Month View still renders and allows browsing adjacent months.
- [ ] History page still opens derived cycles from the same module instance.
- [ ] Shared/private entry labels still point to the same module instance.
