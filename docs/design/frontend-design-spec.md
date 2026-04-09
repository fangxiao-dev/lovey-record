# Frontend Design Spec

## Purpose

This document extracts the current frontend design baseline for this repo into one concise specification.

It is intentionally narrow:

- it records the current design rules
- it does not define agent workflow
- it does not define a general personal asset-management method
- it does not decide when a task must use Pencil or code-first prototyping

Use this document as the shortest maintained entry point when you need to understand what the current UI system is supposed to look like.

Companion references:

- [2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-23-ui-visual-language-guide.md)
- [2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-tokenize-collaboration-rule.md)
- [2026-03-28-ui-collaboration-lessons.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-28-ui-collaboration-lessons.md)
- [menstrual/token-component-mapping.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/token-component-mapping.md)

## Source Of Truth Order

When documents or runtime expressions disagree, use this order:

1. the explicitly named Pencil node or board
2. matching module-level design contracts under `docs/design/<module>/`
3. the cross-module visual rules under `docs/design/`
4. the current runtime implementation

This file is a compressed baseline, not a replacement for named source boards or module contracts.

## Product Character

The active product character is:

- restrained
- warm
- private
- orderly
- tool-first
- light enough for daily use
- polished enough to feel intentional

The interface should not feel like:

- a cute pink period tracker
- a medical product
- a SaaS admin dashboard
- a generic light design system

## Visual Tone

The active visual tone is:

- warm white and pale warm neutrals for base surfaces
- low-noise warm gray text and structure colors
- `#D89A8D` coral-pink as the primary emotional accent
- very light surfaces
- weak shadow
- strong whitespace discipline

The current design direction is closer to:

- iOS-like cleanliness
- KakaoTalk-like friendliness

But it must keep its own warmth and privacy.

## Core Design Rules

### Hierarchy

- build hierarchy through spacing, surface steps, and local emphasis
- do not rely on heavy fills, dark support colors, or large shadow stacks
- keep pages airy and rhythm-driven rather than dense

### Color

- `period` is the main accent family and centers on `#D89A8D`
- `detail-recorded` shares the same warm accent family as `period`
- `detail-recorded` differentiates by eye-marker form, not by a separate loud hue
- support colors stay light and secondary
- `calm` support leans sage green
- `info` support leans pale blue

### Radius And Spacing

Approved radius language:

- `12`
- `16`
- `20`
- `pill`

Approved spacing rhythm:

- `8`
- `12`
- `16`
- `20`
- `24`
- `32`

## Current Token Direction

The active token model is:

- semantic tokens first in runtime consumption
- no page-local hardcoded visual patterns when a reusable semantic already exists
- one-way flow remains `token -> shared component -> page composition`

Minimum semantic token families already implied by the current design baseline:

- `bg.*`
- `text.*`
- `border.*`
- `accent.*`
- `shadow.*`
- `calendar.*`

For the current menstrual baseline, the important semantic names are:

- `accent.period`
- `accent.period.soft`
- `accent.period.contrast`
- `accent.prediction`
- `accent.today`
- `border.today`
- `shadow.selected`
- `calendar.week-divider`

Detailed mapping and migration status remain in [token-component-mapping.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/token-component-mapping.md).

## Component Baseline

The most important shared product surfaces are:

- `AppTopBar`
- `ModuleCard`
- `StatusHeroCard`
- `SelectedDatePanel`
- `CalendarGrid`
- `DateCell`
- `CalendarLegend`

Shared component character:

- light
- calm
- structured
- warm
- not dashboard-like
- not overly decorative

## Menstrual State Rules

The menstrual home baseline must preserve:

- `StatusHeroCard + CalendarGrid + CalendarLegend + SelectedDatePanel + BatchActionButtons`
- single-day editing on the home page
- long-press drag as the primary batch-edit model
- month view as browsing and locating, not as a second editor

Date-state rules:

- `today` is circular and outline-first
- `selected` uses a weak drop shadow
- `period` is the only state that switches text and attached markers to a contrast foreground
- `detail-recorded` uses a small eye marker
- non-`period` detail markers use `accent.period`
- `detail` markers on `period` use `accent.period.contrast`
- `CalendarGrid` owns week structure and week dividers
- `DateCell` owns date-state appearance only

## What This File Does Not Decide

This file does not decide:

- whether a future task must start in Pencil
- whether a future task may go straight to a coded prototype
- how agents should branch between different frontend execution paths
- how to build a larger personal design-asset framework

Those topics should be handled separately once a real implementation path has been practiced and validated in this repo.
