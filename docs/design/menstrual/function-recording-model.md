# Recording Model

## Purpose

This document summarizes the design-facing period model for the menstrual module.

For the full data-model contract, also read [menstrual-domain-model.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts/domain-models/2026-03-23-menstrual-domain-model.md).

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

- `Segment Window` is the default editing view
- `Month View` is a browsing view
- the default center priority is:
  1. current period
  2. predicted period
  3. today


