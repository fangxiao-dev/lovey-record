# Day-State Recording Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the menstrual module interaction and data model to a day-record source of truth with derived cycles and a 3-week cycle window as the primary editor.

**Architecture:** Keep `day_record` as the only persisted truth for menstrual status, derive cycle blocks from consecutive `period` days, and collapse editing into one homepage model. The homepage remains the main editor: tap for single-day attribute editing, long-press to enter drag-select/drag-cancel multi-select, and month view remains browse-only.

**Tech Stack:** Native WeChat Mini Program, JavaScript, local storage, deterministic seed data, existing module/shared-space shell

---

### Task 1: Freeze the day-state contract

**Files:**
- Modify: `docs/plans/2026-03-16-menstrual-module-design.md`
- Modify: `docs/period_model.md`
- Modify: `docs/calendar_style.md`
- Test: `docs/checklists/day-state-rules.md`

**Step 1: Write the contract for persisted state**

Document exact rules for:
- `day_record` as source of truth
- implicit `none` for missing dates
- `period` and `spotting` as explicit states
- derived cycle blocks from consecutive `period` dates

**Step 2: Write the interaction contract**

Document:
- tap opens day detail and attribute editing
- long press enters multi-select mode
- drag selects or deselects continuous dates based on the long-press start cell state
- save applies default `period` plus default/normal observations to the selected range
- month view is browse-only

**Step 3: Add rule examples**

Include examples for:
- deleting a day in the middle of a block
- filling a missing day to merge two blocks
- a single-day `period`
- `spotting` adjacent to a `period` block

**Step 4: Commit**

```bash
git add docs/plans/2026-03-16-menstrual-module-design.md docs/period_model.md docs/calendar_style.md docs/checklists/day-state-rules.md
git commit -m "docs: freeze day-state recording rules"
```

### Task 2: Refactor the domain model to day records and derived cycles

**Files:**
- Modify: `models/cycle-record.js`
- Create: `models/day-record.js`
- Modify: `services/cycle-record-service.js`
- Modify: `mock/seed-data.js`
- Test: `tests/models/day-record.spec.js`

**Step 1: Write the failing tests**

Cover:
- missing day resolves to implicit `none`
- consecutive `period` days derive a single cycle
- removing a middle day splits a cycle
- adjacent `spotting` does not extend a cycle boundary

**Step 2: Run the tests to confirm failure**

Run: project test harness for the new day-record tests
Expected: failures because the model still assumes cycle-first records

**Step 3: Implement the day-record model**

Add:
- explicit day-record shape
- helpers to upsert a single day
- helpers to apply a range of `period` days
- helpers to clear a single day

**Step 4: Implement derived cycle aggregation**

Build:
- grouping of consecutive `period` dates
- cycle summary fields for start, end, and duration
- prediction inputs based on cycle starts only

**Step 5: Re-run tests**

Run: project test harness for day-record and prediction helpers
Expected: all targeted tests pass

**Step 6: Commit**

```bash
git add models/cycle-record.js models/day-record.js services/cycle-record-service.js mock/seed-data.js tests/models/day-record.spec.js
git commit -m "refactor: adopt day-record source of truth"
```

### Task 3: Add homepage multi-select editing in the 3-week cycle window

**Files:**
- Modify: `pages/module-home/index.js`
- Modify: `pages/module-home/index.wxml`
- Modify: `pages/module-home/index.wxss`
- Test: `docs/checklists/module-home-manual-qa.md`

**Step 1: Write the manual QA cases**

Cover:
- tap vs long-press separation
- entering and exiting multi-select mode
- dragging to select or deselect a continuous range
- tapping a single cell inside multi-select mode toggles just that day
- saving a range writes default `period` and default/normal observations

**Step 2: Implement selection mode state**

Add:
- anchor date
- selected date list
- drag mode (`select` / `deselect`) derived from long-press start cell state
- selection-mode UI state
- explicit save and cancel paths

**Step 3: Wire save to range day-record upsert**

When the user saves:
- apply `period` to all selected dates
- refresh the derived cycle blocks
- exit selection mode cleanly

**Step 4: Keep tap-based single-day editing intact**

Ensure:
- tap still opens day detail and attributes panel
- tap outside selection mode does not accidentally select dates
- blank days can still be edited individually
- tap inside selection mode can toggle a single day as a micro-adjustment

**Step 5: Verify in WeChat DevTools**

Run: manual interaction testing on seeded data
Expected:
- no conflict between tap and long press
- selected range saves correctly
- cycle background updates immediately

**Step 6: Commit**

```bash
git add pages/module-home/index.js pages/module-home/index.wxml pages/module-home/index.wxss docs/checklists/module-home-manual-qa.md
git commit -m "feat: add multi-select day range editing"
```

### Task 4: Replace quick actions with panel-first recording

**Files:**
- Modify: `pages/module-home/index.js`
- Modify: `pages/module-home/index.wxml`
- Modify: `services/cycle-record-service.js`
- Test: `tests/history/cycle-record-service.test.js`

**Step 1: Write failing tests for panel-first recording**

Cover:
- single-day `月经正常` writes `period` plus default/normal observations
- single-day attribute editing does not require an explicit "异常" mode
- removing the quick actions area does not create a second data model

**Step 2: Implement panel-first recording helpers**

Map:
- single-day "月经正常" to a day-record helper with default observations
- manual property edits to the same day-record helper family as range save

**Step 3: Remove quick-action-first assumptions**

Ensure the service no longer requires:
- explicit start/end object creation
- a separate "记录异常" flow before editing attributes
- a dedicated quick actions area for common recording

**Step 4: Re-run tests**

Run: service tests
Expected: panel-first recording passes while using the same day-state model

**Step 5: Commit**

```bash
git add pages/module-home/index.js pages/module-home/index.wxml services/cycle-record-service.js tests/history/cycle-record-service.test.js
git commit -m "refactor: adopt panel-first day-state recording"
```

### Task 5: Re-run MVP verification against the new model

**Files:**
- Modify: `docs/checklists/mvp-acceptance.md`
- Modify: `docs/plans/2026-03-16-menstrual-module-implementation-plan.md`

**Step 1: Update the acceptance checklist**

Include checks for:
- homepage 3-week cycle window as primary editor
- long-press multi-select range save
- tap-based single-day editing
- derived cycle block rendering
- same-instance behavior in shared and private entry points

**Step 2: Run manual verification in WeChat DevTools**

Run: full menstrual module walkthrough
Expected:
- day-state edits persist
- derived blocks render consistently
- month view stays browse-only
- shared/private entry points show the same module instance

**Step 3: Commit**

```bash
git add docs/checklists/mvp-acceptance.md docs/plans/2026-03-16-menstrual-module-implementation-plan.md
git commit -m "docs: align QA with day-state model"
```
