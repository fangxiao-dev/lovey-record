# Module Management Page Frontend

## Purpose

This document defines the durable frontend/UI presentation contract for the module management page.

For feature semantics, interaction meaning, and behavioral rules, read the paired function doc:

- [function-module-management-page.md](./function-module-management-page.md)

The current Pencil baseline for this page is:

- `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- default page node: `g7clh`
- quick-setting row reference: `SjubL`
- custom picker reference: `Piw9E`
- refined interaction instance: `cfnQ1`
- extracted component-library references: `Primitive/SharedLegendChip`, `Primitive/ModuleTileCompact`, `Primitive/ModuleShareButton`, `Primitive/ModuleActionRow`, `Composite/ModuleBoardFlat`, `Composite/ModuleManagementCard`

## Page Structure

The module management page is a single default view with two stacked sections:

- `模块空间`
- `模块管理`

It no longer uses:

- a top-right `管理` button
- separate default / info / management page states
- dedicated private and shared page sections
- long helper paragraphs

## Module Space Section

The top section should contain:

- page title `模块空间`
- one lightweight helper line: `点击卡片查看下方摘要和操作。`
- one `功能模块` board

The `功能模块` board should contain:

- a top-right legend for shared-module meaning
- a flat module list ordered by recent usage
- one selected module tile at a time for the active module
- one lightweight continuation line for future modules

### Legend Placement

The legend belongs inside the board header area on the right side.

Rules:

- use compact chips
- use a green dot for `共享模块`
- treat the legend as orientation only, not as an action area

## Module Tile

Each module tile should remain visually compact and quiet.

The tile should show:

- centered module name
- top-right status dot using the calm green marker tone from node `ZYPE8`, only when the module is actually shared
- module icon

The tile should not show:

- a separate text label inside the card for `私人` / `共享`
- extra descriptive copy
- direct entry actions

Interaction rule:

- tapping a tile selects the module and updates the lower `模块管理` card
- tapping a tile does not enter the module directly

## Module Management Card

The lower section is a single card for the currently selected module.

For the current menstrual module, the card contains:

- module title `月经记录`
- two summary frames: `经期时长` and `月经周期`
- one quick-setting area with compact chips plus a `自定义` trigger on each value family
- one single-column custom picker expansion state for the active quick-setting family
- one action row with `进入`, `共享`, and `删除`

This card replaces the earlier split between a separate summary block and a separate action block.

## Quick Setting Area

The quick-setting area should follow the compact row style defined by node `SjubL`.

Rules:

- keep the controls visually light and immediate
- keep the duration and cycle value groups side by side
- keep the summary cards above in a stable left / right arrangement
- use the `自定义` trigger to open the single-column picker state for that same value group
- selected values should read clearly without becoming louder than the primary action button

The custom picker should follow the `Piw9E` state family:

- it is an inline expansion state for the active setting group
- it uses a single vertical value column
- the current frontend implementation uses a custom five-slot wheel that matches node `1uo2J` more closely than native `picker-view`
- the wheel keeps a compact warm-grey shell, a slightly slimmer white pill indicator, and a light top/bottom fade so the first and last values appear partially revealed
- duration picker stays left-aligned to its own setting group, while cycle picker stays right-aligned to its own setting group
- it should preserve the warm card styling and not break the card rhythm
- it should not turn the summary cards into editable controls

## Action Row

The action row should keep a clear hierarchy:

- `进入` is the primary action
- `共享` is secondary and uses the calm-green button style sourced from token node `qD9vb`
- `删除` is destructive but visually contained inside the same card

Interaction rule:

- the `共享` button navigates into the same join/acceptance surface used by other sharing entry points
- it should not visually toggle the card into a fake `已共享` state before real shared status is returned

Layout rule:

- keep all three actions inside the management card
- do not move `删除` into a separate footer or overflow menu in this page contract

## Visual Direction

The page should feel:

- clean
- warm
- compact
- directly actionable

It should not collapse into:

- a text-heavy settings page
- a split ownership dashboard
- a batch-management console

## Semantic Dependency

This file defines the UI contract only.

Behavioral rules for module ordering, shared/private meaning, selected-module update behavior, and action semantics must be maintained in [function-module-management-page.md](./function-module-management-page.md).
