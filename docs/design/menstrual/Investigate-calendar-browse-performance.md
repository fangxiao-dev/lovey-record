# Investigate Calendar Browse Performance

## Purpose

This document records the current investigation result for menstrual home calendar browse performance.

It focuses on one question:

- whether week/month browsing currently reuses local state or re-queries backend data on each navigation

This is an investigation document, not the source of truth for feature semantics. Behavioral contracts remain in:

- [function-calendar.md](./function-calendar.md)
- [frontend-calendar.md](./frontend-calendar.md)
- [frontend-home.md](./frontend-home.md)

## Scope

This investigation covers:

- `frontend/pages/menstrual/home.vue`
- `frontend/services/menstrual/home-contract-service.js`
- `backend/src/services/query.service.ts`
- `backend/src/services/phase5.service.ts`

It does not change product semantics.

## Investigated Symptom

The observed symptom is that switching `聚焦模式 / 月览`, or browsing previous/next windows, feels like it waits on fresh data each time.

The concrete user hypothesis was:

- the page may be querying the database on every week/month switch
- recent calendar data might be small enough to cache locally

## Current Result

### Summary

The current implementation uses `buffered preload`, but it does not use a local result cache.

When the user switches calendar windows, the page keeps the current calendar stable until preload completes, then commits the pending view atomically. This improves transition behavior, but the preload still triggers live queries.

### What happens on browse

Browse entry points:

- [`frontend/pages/menstrual/home.vue:965`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:965) `handleViewModeChange`
- [`frontend/pages/menstrual/home.vue:976`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:976) `handleHeaderPrev`
- [`frontend/pages/menstrual/home.vue:988`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:988) `handleHeaderNext`
- [`frontend/pages/menstrual/home.vue:1000`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:1000) swipe delegates into the same header navigation path

Browse pipeline:

- [`frontend/pages/menstrual/home.vue:668`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:668) `beginBufferedBrowse`
- [`frontend/pages/menstrual/home.vue:597`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:597) `loadBrowseDependencies`
- [`frontend/pages/menstrual/home.vue:638`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:638) `commitBufferedBrowse`

During preload, the page requests:

- [`frontend/services/menstrual/home-contract-service.js:133`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/services/menstrual/home-contract-service.js:133) `loadMenstrualCalendarWindow`
- [`frontend/services/menstrual/home-contract-service.js:161`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/services/menstrual/home-contract-service.js:161) `loadMenstrualDayDetail`
- [`frontend/services/menstrual/home-contract-service.js:108`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/services/menstrual/home-contract-service.js:108) `getSingleDayPeriodAction`

### Current cache behavior

There is no frontend memory cache or storage-backed cache in the menstrual home query path.

The service layer explicitly appends a timestamp to each query:

- [`frontend/services/menstrual/home-contract-service.js:77`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/services/menstrual/home-contract-service.js:77)

This means HTTP-level reuse is intentionally bypassed. The current behavior is effectively "always fetch fresh data".

### Current local reuse

There is some local reuse, but only inside the current in-memory page state:

- the current page remains visible during preload
- `applyLocalBrowseState` can locally switch selected-day presentation without immediately rebuilding from a server response
- `rebuildLocalPage` reuses `rawContracts` already held in memory

Relevant code:

- [`frontend/pages/menstrual/home.vue:510`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:510) `rebuildLocalPage`
- [`frontend/pages/menstrual/home.vue:526`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/pages/menstrual/home.vue:526) `applyLocalBrowseState`

This is UI-state reuse, not query-result caching.

## Backend Query Reality

### Calendar window query

The calendar browse query does hit the database on each request.

Backend entry:

- [`backend/src/services/phase5.service.ts:235`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/phase5.service.ts:235) `getCalendarWindow`

Inside that call, the service re-queries:

- [`backend/src/services/phase5.service.ts:245`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/phase5.service.ts:245) `prisma.dayRecord.findMany`
- [`backend/src/services/phase5.service.ts:266`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/phase5.service.ts:266) `prisma.derivedCycle.findMany`
- [`backend/src/services/phase5.service.ts:282`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/phase5.service.ts:282) `prisma.prediction.findUnique`

The date range itself is not large:

- month view builds one visible month padded to week boundaries
- focused view builds a fixed `21` day window

Range construction:

- [`frontend/services/menstrual/home-contract-service.js:60`](D:/CodeSpace/hbuilder-projects/lovey-record/frontend/services/menstrual/home-contract-service.js:60) `createCalendarQueryRange`

### Day detail query

Single-day detail also re-queries each time:

- [`backend/src/services/query.service.ts:137`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/query.service.ts:137) `getDayRecordDetail`
- [`backend/src/services/query.service.ts:140`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/query.service.ts:140) `prisma.dayRecord.findUnique`

### Single-day period action query

This query is the most suspicious scaling point in the current browse path.

Backend entry:

- [`backend/src/services/query.service.ts:345`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/query.service.ts:345) `getSingleDayPeriodAction`

It currently reloads all period dates for the module/profile pair:

- [`backend/src/services/query.service.ts:348`](D:/CodeSpace/hbuilder-projects/lovey-record/backend/src/services/query.service.ts:348) `prisma.dayRecord.findMany`

This means its cost grows with historical period record volume, not with the visible calendar window only.

## Likely Bottleneck

The current symptom is more consistent with repeated live query latency than with a classic mini-program high-frequency interaction problem.

This browse path is not a `touchmove` / `scroll` hot path. It is a discrete navigation path that waits for preload before animation commit.

The main likely bottleneck categories are:

1. repeated network round trips
2. repeated backend Prisma reads for data that changes infrequently during browse
3. repeated frontend page-model reconstruction after live responses arrive

## What To Check First

If runtime profiling is added later, check these in order:

1. end-to-end time from `beginBufferedBrowse` to `commitBufferedBrowse`
2. request durations for `getCalendarWindow`, `getDayRecordDetail`, and `getSingleDayPeriodAction`
3. whether `getSingleDayPeriodAction` is disproportionately slower once historical records grow
4. whether waiting is still visible after query results are served from memory

## Recommendation

### Recommended first optimization

Add a frontend memory cache for browse queries before attempting framework-level or animation-level optimization.

Recommended order:

1. cache `calendarWindow`
2. cache `dayDetail`
3. cache `singleDayPeriodAction`

Reasoning:

- the visible browse payload is small
- the current page already has a buffered commit model that can consume cached results cleanly
- writes already return `affectedScopes`, which provides a natural invalidation hook
- the symptom does not currently point to `setData` hot-path pressure as the primary issue

### Why not jump directly to storage cache

Persistent local storage may still be useful later, but it should not be the first step.

A memory cache is the lower-risk first move because it avoids:

- storage schema/version handling
- cold-start invalidation complexity
- cross-module-instance contamination
- stale-data behavior surviving process restarts

## Official Sources

The official sources support reducing unnecessary synchronization and avoiding expensive repeated updates, even though they do not prescribe this exact cache design.

- WeChat runtime mechanism: [developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html)
- WeChat performance tips: [developers.weixin.qq.com/miniprogram/dev/framework/performance/tips.html](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips.html)
- uni-app performance guide: [uniapp.dcloud.net.cn/tutorial/performance.html](https://uniapp.dcloud.net.cn/tutorial/performance.html)

## Inference

The following conclusions are engineering inference from code inspection plus the official runtime model, not direct statements from the official docs:

- a frontend memory cache is likely to reduce perceived browse latency more effectively than animation-only tuning
- `getSingleDayPeriodAction` is a stronger long-term scaling risk than `getCalendarWindow`
- "recent 3 months" is operationally small enough for in-memory reuse in this module

