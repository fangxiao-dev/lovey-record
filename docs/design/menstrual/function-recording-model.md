# Recording Model

## Purpose

This document summarizes the design-facing period model for the menstrual module.

For the full data-model contract, also read [menstrual-domain-model.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/contracts/domain-models/menstrual-domain-model.md).

## Core Rule

- users edit days
- the system derives anchored period segments
- the UI displays anchored period segments and current period state

## Interaction Contract

- `tap` opens single-day inline editing
- `long press` enters multi-select mode
- selected ranges save as day-level records
- no second editing model should bypass the home page

## State Rules

- missing day is interpreted as implicit `none`
- consecutive `isPeriod` days derive an anchored segment block
- `detail-recorded` stays an attached event layer
- future dates are not recordable

## View Rules

- `Segment Window` is the default focused editing view
- `Month View` is a browsing view
- the focused editing surface uses a fixed `14` day / `2` row window
- the default focus priority is:
  1. current period
  2. predicted period
  3. today
- the default focused occurrence lands in the first row of the focused window
- the product remembers the last selected `view type` between `Segment Window` and `Month View`
- that memory restores only the active view, not the previous browse position
