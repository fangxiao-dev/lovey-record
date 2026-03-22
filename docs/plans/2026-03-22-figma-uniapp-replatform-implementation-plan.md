# Figma + uni-app Replatform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the menstrual-tracking MVP around Figma-structured design inputs and a uni-app frontend, while preserving the same-instance sharing model and the existing `day_record` business rules.

**Architecture:** Freeze the new UI/source-of-truth contract first, then scaffold uni-app around a componentized page structure that maps to Figma. Migrate business logic and domain helpers into framework-neutral services/composables, wrap `uni.*` platform capabilities, and treat the current native mini program code as reference only.

**Tech Stack:** Figma + Figma MCP, uni-app, Vue 3 SFCs, JavaScript for initial bootstrap unless explicitly upgraded, local-first persistence, existing domain/service tests as migration reference

---

### Task 1: Freeze the replatform contract

**Files:**
- Modify: `project-context.md`
- Modify: `tech-stack-investigate.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Create: `docs/plans/2026-03-22-figma-uniapp-replatform-design.md`
- Create: `docs/plans/2026-03-22-figma-uniapp-migration-inventory.md`

**Step 1: Document the new mainline**

Freeze these facts:
- Figma is the UI truth source
- uni-app is the new implementation layer
- native page code is migration reference only

**Step 2: Freeze migration boundaries**

Document:
- which pages remain
- which states are part of module-home rather than separate pages
- which old logic is portable
- which native code must be rewritten

**Step 3: Verify the contract docs**

Run: manual doc review
Expected: no doc still claims native WeChat page development is the preferred mainline

### Task 2: Create the uni-app application skeleton

**Files:**
- Create: `package.json` updates or uni-app bootstrap files as needed
- Create: `main.js`
- Create: `App.vue`
- Create: `pages.json`
- Create: `manifest.json`
- Create: `uni.scss`
- Create: `pages/index/index.vue`
- Create: `pages/modules/index.vue`
- Create: `pages/module-home/index.vue`

**Step 1: Decide the scaffold baseline**

Choose one:
- uni-app + Vue 3 + JavaScript
- uni-app + Vue 3 + TypeScript

Default recommendation: JavaScript first, because the existing migration source and tests are already JS-centric.

**Step 2: Create the minimal runnable shell**

Add:
- app entry files
- route definitions
- one minimal page per required MVP route
- theme layer placeholder for Figma tokens

**Step 3: Run in WeChat DevTools**

Run: compile the uni-app project to WeChat Mini Program and open it in WeChat DevTools
Expected: the app boots without runtime errors and route navigation works

### Task 3: Translate the Figma page inventory into a uni-app route map

**Files:**
- Modify: `pages.json`
- Create: `docs/checklists/route-contract.md`
- Create: `pages/shared-space/index.vue`
- Create: `pages/history/index.vue`
- Create: `pages/settings/index.vue` or `pages/reminders/index.vue`

**Step 1: Freeze required routes**

Include:
- entry page
- modules page
- shared-space page
- module-home page
- optional history/settings placeholders if still in scope

**Step 2: Freeze state-only views**

Ensure:
- day detail becomes a module-home state
- batch edit becomes a module-home state
- special-mark display becomes a module-home state

**Step 3: Verify route coverage**

Run: manual route walkthrough
Expected: every required user flow maps to one explicit route or one explicit page state

### Task 4: Build the foundational component system from Figma

**Files:**
- Create: `components/AppTopBar.vue`
- Create: `components/PrimaryActionButton.vue`
- Create: `components/SecondaryActionButton.vue`
- Create: `components/ModuleCard.vue`
- Create: `components/SharedStateBadge.vue`
- Create: `components/EmptyStateBlock.vue`
- Modify: `uni.scss`

**Step 1: Map Figma tokens into code**

Define:
- color tokens
- spacing tokens
- radius tokens
- typography tokens

**Step 2: Implement shared primitives**

Build the common shells used by:
- entry page
- modules page
- shared-space page
- module-home page

**Step 3: Verify component consistency**

Run: manual visual verification in WeChat DevTools
Expected: shared primitives render with one consistent design language

### Task 5: Migrate domain logic into uni-app-friendly services and composables

**Files:**
- Create: `utils/date.js` or migrate from existing file
- Create: `services/cycle-record-service.js`
- Create: `services/module-instance-service.js`
- Create: `composables/useCalendarViewModel.js`
- Create: `services/platform/storage.js`
- Create: `services/platform/navigation.js`
- Test: `tests/` migration targets as applicable

**Step 1: Port pure business helpers first**

Move:
- date utilities
- `day_record` creation and validation
- cycle derivation
- module-instance queries

**Step 2: Split page-shaped service code**

Refactor current `module-home-service` logic into:
- pure calendar view-model helpers
- composables that prepare page state
- platform wrappers for storage/navigation

**Step 3: Verify business logic against existing examples**

Run: Node-based tests or equivalent migration harness
Expected: day-state rules, prediction helpers, and shared-state labeling still behave as expected

### Task 6: Rebuild the module-home page around Figma components

**Files:**
- Create: `components/StatusHeroCard.vue`
- Create: `components/CalendarModeSegment.vue`
- Create: `components/CalendarHeaderNav.vue`
- Create: `components/CalendarJumpTabs.vue`
- Create: `components/CalendarGrid.vue`
- Create: `components/DateCell.vue`
- Create: `components/CalendarLegend.vue`
- Create: `components/SelectedDatePanel.vue`
- Create: `components/DayStateChipGroup.vue`
- Create: `components/AttributeFieldCard.vue`
- Create: `components/BatchEditPanel.vue`
- Modify: `pages/module-home/index.vue`

**Step 1: Implement the static component layout**

Render:
- hero card
- calendar shell
- legend
- selected-date panel
- batch-edit panel placeholder

**Step 2: Wire single-day editing**

Support:
- selecting a date
- showing current state
- toggling `period / special / clear`
- triggering the “月经正常” shortcut

**Step 3: Wire range-selection mode**

Support:
- long press or equivalent gesture entry
- drag selection / deselection
- batch save / cancel
- future-date rejection

**Step 4: Verify on seeded data**

Run: WeChat DevTools with deterministic scenarios
Expected:
- state card updates correctly
- calendar states are visually distinguishable
- single-day and range editing both write the same day-state model

### Task 7: Rebuild supporting pages around the same component system

**Files:**
- Modify: `pages/index/index.vue`
- Modify: `pages/modules/index.vue`
- Modify: `pages/shared-space/index.vue`
- Modify: `pages/history/index.vue`
- Modify: `pages/settings/index.vue` or `pages/reminders/index.vue`

**Step 1: Rebuild the entry and modules pages**

Use:
- shared top bar
- entry action card
- module card
- shared-state badge

**Step 2: Rebuild the shared-space shell**

Keep:
- same-instance module access
- shared-state label
- placeholder invitation copy if real invitation is not yet in scope

**Step 3: Decide history/settings depth**

Either:
- rebuild as lightweight placeholders first
- or defer them if module-home already covers the MVP validation loop

**Step 4: Verify navigation flow**

Run: route walkthrough in WeChat DevTools
Expected: private and shared entry points reach the same module instance without dead ends

### Task 8: Re-run end-to-end MVP verification on the new mainline

**Files:**
- Create: `docs/checklists/uniapp-mvp-acceptance.md`
- Modify: `README.md`

**Step 1: Write acceptance checks**

Include:
- app boots in WeChat DevTools from uni-app build
- entry page routes correctly
- modules page shows correct shared/private state
- module-home supports single-day editing
- module-home supports batch editing
- shared and private routes point to the same module instance

**Step 2: Execute manual verification**

Run: full walkthrough in WeChat DevTools against the uni-app build
Expected: all core menstrual MVP flows work without falling back to the native reference implementation

**Step 3: Report gaps honestly**

If history/settings or invitation UX are still placeholders, document them explicitly instead of implying they are complete
