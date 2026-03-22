# Module Home Manual QA

## Calendar Interaction

- [ ] Tap a day in Cycle Window and confirm the inline panel shows single-day state actions.
- [ ] Long press a day in Cycle Window and confirm range mode starts from that day.
- [ ] Extend the selection to a later day and confirm the selected range highlights continuously.
- [ ] Save the selection and confirm all selected days render as one derived `period` block.
- [ ] Cancel range mode and confirm the calendar returns to normal selection state.

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
