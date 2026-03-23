# UI Visual Language Guide

## Purpose

This guide defines the active visual direction for `lovey-record` so token work, component-library work, and page composition all converge on the same product character.

Use this document as the style contract before changing:
- design tokens
- component-library visuals
- page-level layout and visual hierarchy
- Pencil design drafts that introduce new visual patterns

Companion references:
- [2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-tokenize-collaboration-rule.md)
- [2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-design-tokene.pen)
- [2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)

## Product Character

This product is not a traditional menstrual app and not a health-analysis dashboard.

It should feel like:
- a restrained relationship record tool
- warm, private, and orderly
- light enough for daily use
- polished enough to feel intentional and high quality

It should not feel like:
- a cute pink period tracker
- a medical product
- a SaaS admin dashboard
- a generic light design system

Working keywords:
- warm white
- clean
- restrained
- airy
- soft
- precise
- mini-program friendly
- tool-first, not decoration-first

## Visual Direction

The active direction is:
- warm white and pale warm neutrals as the base
- low-noise warm gray text and structure colors
- `#D89A8D` coral-pink as the primary emotional accent
- the same warm accent family for `period` and `special`, with `special` differentiated by eye-icon form rather than a separate hue
- calm green and pale blue as extension-tag support families
- very light surfaces with careful spacing and radius
- weak shadow, strong whitespace discipline

The target reference quality is closer to:
- iOS cleanliness and composure
- KakaoTalk-like friendliness and clarity

But the product must still keep its own warmth and privacy.

## Color Principles

### Base surfaces

- Page backgrounds should be clean warm white, not yellow and not muddy.
- Card surfaces should be slightly lighter and cleaner than secondary surfaces.
- Background hierarchy should be built with subtle surface shifts, not heavy fills.
- Borders should remain quiet and supportive.

### Primary accent

- `period` keeps a coral-family accent centered on `#D89A8D`.
- The coral hue is correct, but its presentation must stay light.
- Prefer small-area emphasis, labels, icons, and local highlights over large solid blocks.

### Special accent

- `special` no longer uses the previous muddy amber / gold direction.
- `special` now stays in the same warm accent family as `period`.
- The distinction should come from the eye-icon form and marker treatment, not from introducing a second loud hue.
- `special` should usually appear as a filled eye marker, not a large filled area.

### Support tones

- Support colors must remain light, clean, and secondary to the warm accent family.
- `calm` support should lean sage green for `shared / calm / success` semantics.
- `info` support should lean pale blue for `linked / info / extension label` semantics.
- These support families should help the system scale without turning the product into a generic UI kit.

## Material And Hierarchy

The visual problem to avoid is not wrong hue but heavy presentation.

Do not rely on:
- thick solid accent fills
- dark muddy support colors
- large noisy status blocks
- strong shadow as the main layering tool

Prefer hierarchy through:
- whitespace
- surface steps
- corner radius consistency
- local emphasis
- subtle borders
- controlled text contrast

One-line rule:
- hierarchy comes from material and rhythm, not from loud color blocks

## Radius And Spacing Language

### Radius

The shared radius language should stay stable:
- `12`
- `16`
- `20`
- `pill`

Avoid mixing in many extra corner styles unless a new component truly needs one.

### Spacing

Spacing should feel calm and breathable rather than dense or dramatic.

Recommended working rhythm:
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`

Pages should feel structured by rhythm, not by oversized gaps.

## Component Character

The most important components are not generic inputs. They are the product's brand surfaces.

Priority components:
- `AppTopBar`
- `ModuleCard`
- `StatusHeroCard`
- `SelectedDatePanel`
- `CalendarGrid`
- `DateCell`
- `CalendarLegend`

Shared component traits:
- light
- calm
- structured
- warm
- not overly decorative
- not dashboard-like

Specific guidance:
- `StatusHeroCard` should be the page's visual anchor, but not a heavy analytics block.
- `SelectedDatePanel` should feel like a gentle tool surface, not a modal form.
- `ModuleCard` should feel like a stable module container with clear ownership and entry actions.

## Buttons

Buttons must support the product rather than read like a component catalog.

Rules:
- primary buttons should be clear, but not thick or loud
- secondary buttons should feel like soft surface actions
- destructive buttons should be rare and never dominate the board
- informational buttons should avoid generic backend-blue styling

## State Expression Rules

The menstrual home and module-space flows impose strict visual constraints.

Must preserve:
- `shared/private` points to the same module instance
- home answers the current status first
- menstrual home keeps `StatusHeroCard + CalendarGrid + CalendarLegend + SelectedDatePanel + BatchEditPanel`
- single-day editing remains on the home page
- long-press drag remains the primary batch-edit model
- month view is for browsing and locating, not for a second editor
- `period / prediction / today / special` must be distinguishable, but the hierarchy must remain restrained

### Current state semantics

- `period`: the strongest accent state, still controlled
- `prediction`: pale and quiet, currently expressed through a light mint surface
- `today`: outline-first, not a filled legend block
- `special`: same-hue eye-icon cue by default; avoid large filled blocks

## Token Versus State Semantics

Do not confuse token resources with business-state expression.

- `accent-special` is a token resource
  - it defines the color family available for `special`
- `special` is a business-state semantic
  - it defines how the state should appear in the UI

For the current direction:
- `accent-special` and `accent-period` share one warm accent family
- `special` usually consumes that resource through a small filled eye icon, not through a large color fill

## Things To Avoid

- traditional pink menstrual-app styling
- medical white-blue styling
- heavy dashboard semantics
- thick gradients
- strong H5 visual language
- big shadow stacks
- visually rich but system-poor component examples
- page-local one-off visual ideas that bypass tokens and the component library

## Current Approved Conclusions

- `#D89A8D` is the main accent direction for `period`.
- `special` no longer needs an independent hue; it shares the same warm accent family and differentiates by icon form.
- `support.calm` and `support.info` are the approved extension-tag families.
- `special` should prefer a small filled eye icon expression.
- The system should move away from creamy heaviness and toward cleaner, lighter luxury.
- The board and future pages should feel like a high-quality tool product, not a generic light UI kit.

## Working Use

Before adding or revising visual work:
1. check whether the new pattern fits this guide
2. update tokens first if the guide implies a new reusable rule
3. update the token/component-library draft before page composition
4. treat violations as a design-system issue, not a page-level shortcut
