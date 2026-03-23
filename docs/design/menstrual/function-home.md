# Menstrual Home

## Purpose

The menstrual home is the module's main workbench.

It must answer current status before exposing deeper browsing and editing.

## Page Structure

The core structure remains:

- `StatusHeroCard`
- `CalendarGrid`
- `CalendarLegend`
- `SelectedDatePanel`
- `BatchEditPanel`

## Must Preserve

- home answers current status first
- single-day editing stays inline on the home page
- long-press drag is the primary batch-edit path
- month view is browse-only support, not a second editor
- `period / prediction / today / special` remain distinguishable with restrained hierarchy

## States

The home page must cover:

- default state
- recorded state
- single-day edit state
- batch-edit state
- special-mark state
- future-date blocked state

## Visual Direction

The page should feel:

- clean
- warm
- precise
- light but intentional

It should not collapse into:

- a generic pink period app
- a medical dashboard
- a noisy analytics board

