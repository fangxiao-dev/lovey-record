# Module Space And Sharing Manual QA

## Module Space Layout

- [ ] Confirm the app enters the merged `模块空间` page instead of separate entry / private / shared pages.
- [ ] Confirm the page shows both `私人` and `共享` zones in the same screen.
- [ ] Confirm module position alone is enough to understand whether the module is private or shared.
- [ ] Confirm an empty zone still keeps its title and drop-area placeholder.

## Module Selection And Navigation

- [ ] Tap a module tile once and confirm the bottom info panel updates without navigating away.
- [ ] Tap the same module tile again and confirm the module home opens.
- [ ] Tap a different module tile and confirm the bottom info panel switches to that module.

## Manage Mode And Drag Feedback

- [ ] Long press a module tile and confirm the page enters manage mode.
- [ ] Confirm both `私人` and `共享` zones show explicit drop-zone feedback in manage mode.
- [ ] Drag a private module over the shared zone and confirm the shared zone shows a stronger hover / receive state.
- [ ] Drop the module in the shared zone and confirm the UI clearly indicates sharing is now on.
- [ ] Drag a shared module back to the private zone and confirm the private zone shows a stronger hover / receive state.
- [ ] Drop the module in the private zone and confirm the UI clearly indicates sharing is now off.
- [ ] Confirm the bottom info panel switches to manage guidance while manage mode is active.

## Bottom Info Panel

- [ ] Confirm a private module shows summary, `进入模块`, and `改为共享` style actions in the info panel.
- [ ] Confirm a shared module shows summary, `进入模块`, share action, and sharer information in the info panel.
- [ ] Exit manage mode and confirm the regular module info panel content returns.

## Module Home Share Entry

- [ ] Confirm the period module home top bar includes a `共享` entry.
- [ ] In private state, tap `共享` and confirm a soft confirmation panel appears before any share media is shown.
- [ ] Confirm the private-state prompt explains that sharing changes the module to shared rather than copying data.
- [ ] Confirm the primary action in the prompt continues to shared state and then shows share media.
- [ ] In shared state, tap `共享` and confirm the share media panel appears directly.
- [ ] Confirm the shared / private status shown in module home stays consistent with the module position in module space.
