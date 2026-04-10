# Module Management Page

## Purpose

The module management page is the canonical place for browsing the available module set and managing the currently selected module from the same page.

For the frontend/UI presentation contract, read:

- [frontend-module-management-page.md](./frontend-module-management-page.md)

## Core Interaction Contract

The page is a single default view with two linked parts:

- a top module list
- a lower selected-module management card

The module list is responsible for selection.

The lower card is responsible for module-specific actions.

## Responsibilities

- show modules in one flat recent-usage list
- preserve private/shared meaning for each module instance
- allow the user to inspect and act on the selected module without navigating away first

## Selection Rule

- tapping a module card selects that module
- selection updates the lower `模块管理` card content
- tapping a module card does not enter the module

Module entry must happen only through the explicit `进入` action inside the lower management card.

## Page Composition

The page should keep these durable sections:

- `模块空间`
- `功能模块`
- `模块管理`

The page should not add separate top-level states for:

- batch management
- long-press management mode
- drag-and-drop ownership reassignment

## Module Ordering

- modules are ordered by recent usage
- the current MVP may render only one module, but the ordering rule must remain stable for future modules

## Ownership And Sharing Meaning

- private/shared meaning still refers to the same module instance, not duplicated data
- ownership/shared state should be visible on each module card
- ownership/shared meaning is explanatory only on this page; it is not a page-level grouping mechanism

The detailed same-instance rule remains defined in [function-sharing-expression.md](./function-sharing-expression.md).

## Lower Management Card

The lower `模块管理` card is the single-module control surface for the selected module.

For the current menstrual module it must support:

- reading current summary values
- applying quick settings through a compact row of chips
- exposing a `自定义` trigger when the quick chips do not contain the desired value
- opening a single-column custom picker for the active setting without changing the horizontal summary layout
- entering the module
- starting or continuing sharing flow
- deleting the module

Current sharing-entry rule:

- the `共享` action opens the same join/acceptance surface used by other sharing entry points
- the action is a navigation into the sharing flow, not an inline toggle on this page
- real shared state is still determined by module access state, not by whether the user has opened the sharing surface

## Quick Setting Flow

The quick setting area is a two-column control surface that keeps the summary cards above it unchanged:

- left side controls the period-duration value
- right side controls the cycle value
- each side keeps a short chip row for the common values
- each side includes a `自定义` trigger that opens the custom picker state for that same value family

The custom picker is a vertical single-column picker. It is an expansion state of the same setting group, not a separate page section.

Rules:

- the picker should preserve the surrounding card rhythm
- the picker should write back into the same setting group it was opened from
- the picker must not turn the summary cards into editable controls
- the summary cards stay read-only and stay in the left / right horizontal arrangement

## Must Preserve

- module entry remains explicit and direct through the `进入` button
- selecting a module and entering a module remain separate actions
- private/shared meaning stays understandable without splitting the page into ownership sections
- selected-module actions operate on the same module instance shown in the top list
- the summary cards stay horizontal and separate from the custom picker flow
- the module tile shared marker appears only after real shared state is established

## Must Avoid

- replacing the dashboard as the default landing
- reintroducing private/shared split sections as the main structure
- making module cards enter the module on tap
- hiding ownership or shared-state context
- moving core actions out of the lower management card
