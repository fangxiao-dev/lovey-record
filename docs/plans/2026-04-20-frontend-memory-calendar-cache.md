# Frontend Memory Calendar Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** add a frontend memory cache for menstrual home browse queries so week/month switching can reuse recent data in the current session instead of always waiting on live requests.

**Architecture:** keep the current `buffered preload -> pending payload -> atomic commit` browse pipeline, but route its query dependencies through a small in-memory cache in `home-contract-service.js`. Start with query-result caching rather than changing product contracts or backend APIs, and use existing command `affectedScopes` plus browse keys to invalidate stale entries after writes.

**Tech Stack:** uni-app Vue 3, JavaScript service modules, Node built-in `node:test`

---

## Background Constraints

- The current browse pipeline lives in `frontend/pages/menstrual/home.vue`.
- Live query helpers live in `frontend/services/menstrual/home-contract-service.js`.
- The first implementation should not change backend contracts.
- The cache is session-memory only. Do not use `uni.setStorage` in this plan.
- The first target is browse responsiveness, not cold-start persistence.

## Cache Scope

### Included in v1

1. `calendarWindow`
2. `dayDetail`
3. `singleDayPeriodAction`

### Explicitly excluded from v1

- `homeView`
- `moduleSettings`
- `moduleAccessState`
- storage persistence across app restarts
- backend-side caching

### Reason for the scope

- browse navigation already depends directly on the three included query types
- they have clear cache keys
- they have clear invalidation triggers from existing command scopes

## Key Design Rules

### Query keys

- `calendarWindow`: `moduleInstanceId + profileId + viewMode + startDate + endDate`
- `dayDetail`: `moduleInstanceId + profileId + date`
- `singleDayPeriodAction`: `moduleInstanceId + date`

### TTL

- use a short TTL in v1, for example `5 minutes`
- stale entries may be returned only if still within TTL and not invalidated by local writes

### Invalidation

- `calendar` scope invalidates cached calendar windows that overlap the current affected browse range
- `dayDetail` scope invalidates the current selected date detail/action entry
- `prediction` scope invalidates calendar windows and single-day action entries related to the active module instance

### Session boundary

- cache must live only in JS module memory
- cache resets on app reload / process restart

---

### Task 1: Add failing tests for service-level memory cache behavior

**Files:**
- Modify: `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`
- Modify: `frontend/services/menstrual/home-contract-service.js`

**Step 1: Inspect existing test patterns for service modules**

Read neighboring tests to match mocking style and import structure:

- `frontend/services/menstrual/__tests__/module-shell-service.test.mjs`
- `frontend/services/menstrual/__tests__/report-contract-service.test.mjs`

**Step 2: Write failing tests for calendarWindow cache hit**

Add tests that assert:

- the second identical `loadMenstrualCalendarWindow` call reuses the cached result
- the underlying request helper is called only once

Suggested test names:

```js
test('loadMenstrualCalendarWindow reuses in-memory result for identical browse key', async () => {})
test('loadMenstrualCalendarWindow misses cache when view window key changes', async () => {})
```

**Step 3: Write failing tests for dayDetail and singleDayPeriodAction cache hit**

Suggested test names:

```js
test('loadMenstrualDayDetail reuses cached result for identical day key', async () => {})
test('getSingleDayPeriodAction reuses cached result for identical module-and-date key', async () => {})
```

**Step 4: Run the targeted test file and confirm failure**

Run:

```bash
node --test frontend/services/menstrual/__tests__/home-contract-service.test.mjs
```

Expected:

- new tests FAIL
- failure points to missing cache behavior or missing test seam exports

**Step 5: Commit**

```bash
git add frontend/services/menstrual/__tests__/home-contract-service.test.mjs
git commit -m "test(menstrual): cover memory cache behavior for browse queries"
```

---

### Task 2: Implement cache primitives in home-contract-service

**Files:**
- Modify: `frontend/services/menstrual/home-contract-service.js`
- Test: `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`

**Step 1: Add small internal cache stores and key builders**

Add separate Maps or one typed store for:

- calendar window entries
- day detail entries
- single-day action entries

Create pure helpers for:

```js
function buildCalendarWindowCacheKey(context) {}
function buildDayDetailCacheKey(context) {}
function buildSingleDayActionCacheKey(input) {}
function isFreshCacheEntry(entry, now = Date.now()) {}
```

**Step 2: Add a shared cached-query helper**

Add one helper that:

- checks key existence
- checks TTL freshness
- returns cached value when valid
- otherwise performs the live request and stores the result

Shape example:

```js
async function loadWithMemoryCache({ store, key, ttlMs, loader }) {}
```

**Step 3: Route the three browse queries through the memory cache**

Apply the helper to:

- `loadMenstrualCalendarWindow`
- `loadMenstrualDayDetail`
- `getSingleDayPeriodAction`

Do not cache:

- `loadMenstrualHomeView`
- `loadMenstrualModuleSettings`
- `loadMenstrualHomePageModel`

**Step 4: Export test-only reset hooks if needed**

If the tests need explicit isolation, export a minimal test hook such as:

```js
export function __resetMenstrualHomeMemoryCacheForTest() {}
```

Keep this hook narrowly scoped and clearly labeled as test-only.

**Step 5: Run the targeted tests and confirm pass**

Run:

```bash
node --test frontend/services/menstrual/__tests__/home-contract-service.test.mjs
```

Expected:

- cache-hit and cache-miss tests PASS
- no existing service tests regress

**Step 6: Commit**

```bash
git add frontend/services/menstrual/home-contract-service.js frontend/services/menstrual/__tests__/home-contract-service.test.mjs
git commit -m "feat(menstrual): add in-memory cache for browse queries"
```

---

### Task 3: Add invalidation hooks driven by existing refresh scopes

**Files:**
- Modify: `frontend/services/menstrual/home-contract-service.js`
- Modify: `frontend/pages/menstrual/home.vue`
- Test: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
- Test: `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`

**Step 1: Add explicit invalidation helpers in the service layer**

Add helpers such as:

```js
export function invalidateMenstrualBrowseCacheByScopes(input) {}
export function invalidateMenstrualCalendarCacheForRange(input) {}
export function invalidateMenstrualDayCachesForDate(input) {}
```

The implementation should stay key-driven, not page-model-driven.

**Step 2: Decide the minimum invalidation payload from home.vue**

Use data already available after commands:

- `moduleInstanceId`
- `profileId`
- `activeDate`
- `focusDate`
- `viewMode`
- returned `affectedScopes`

Avoid inventing new backend response fields in v1.

**Step 3: Call invalidation before refresh-by-scopes re-queries**

In mutation flows, invalidate relevant cache entries before:

- `refreshCalendarWindow`
- `refreshSelectedDayDetail`
- deferred hero refresh paths that depend on browse state freshness

Likely insertion points:

- `runOptimisticMutation`
- `runCommand`
- `runOptimisticBatchMutation`

**Step 4: Add failing then passing tests for invalidation**

Cover at least:

- `calendar` scope invalidates current browse window cache
- `dayDetail` scope invalidates the selected day detail cache
- `prediction` scope invalidates related calendar/action cache

**Step 5: Run tests and confirm pass**

Run:

```bash
node --test frontend/services/menstrual/__tests__/home-contract-service.test.mjs
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected:

- invalidation tests PASS
- browse transition tests still PASS

**Step 6: Commit**

```bash
git add frontend/services/menstrual/home-contract-service.js frontend/pages/menstrual/home.vue frontend/services/menstrual/__tests__/home-contract-service.test.mjs frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
git commit -m "feat(menstrual): invalidate browse cache from mutation scopes"
```

---

### Task 4: Optionally prewarm adjacent month windows after stable browse commit

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/services/menstrual/home-contract-service.js`
- Test: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`

**Step 1: Add a non-blocking prewarm helper**

Add a helper for month-view browse prewarm only:

```js
async function prewarmAdjacentMonthWindows(context) {}
```

Rules:

- only run when `viewMode === 'month'`
- prewarm previous and next month window keys
- do not block current browse commit
- ignore failures silently or log them as debug-only

**Step 2: Trigger prewarm after browse commit or snapshot settle**

Possible safe points:

- after `commitBufferedBrowse`
- after `refreshHomeSnapshot`

Choose one stable insertion point. Do not trigger duplicate prewarms from multiple paths.

**Step 3: Add tests that prove prewarm is non-blocking**

Suggested test name:

```js
test('month browse prewarm starts after commit without delaying visible browse commit', async () => {})
```

**Step 4: Run tests and confirm pass**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
node --test frontend/services/menstrual/__tests__/home-contract-service.test.mjs
```

Expected:

- commit behavior remains unchanged
- prewarm does not turn into a required await on the browse critical path

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/services/menstrual/home-contract-service.js frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs frontend/services/menstrual/__tests__/home-contract-service.test.mjs
git commit -m "feat(menstrual): prewarm adjacent month browse windows"
```

---

### Task 5: Verification and documentation closeout

**Files:**
- Verify: `frontend/services/menstrual/home-contract-service.js`
- Verify: `frontend/pages/menstrual/home.vue`
- Verify: `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`
- Verify: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
- Verify: `docs/design/menstrual/Investigate-calendar-browse-performance.md`

**Step 1: Verify cache scope matches the plan**

Confirm:

- browse cache is memory-only
- no storage persistence was introduced
- `homeView` and `moduleSettings` remain uncached in v1

**Step 2: Run automated verification**

Run:

```bash
node --test frontend/services/menstrual/__tests__/home-contract-service.test.mjs
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected:

- all targeted tests PASS

**Step 3: Manual runtime verification**

Minimum checklist:

1. enter menstrual home and switch between `聚焦模式 / 月览`
2. browse next/previous windows repeatedly within the same session
3. confirm repeated revisits feel faster and do not show stale content after writes
4. edit one day or batch-write a range
5. return to the affected window and confirm cache invalidation preserves correctness

**Step 4: Record unverified items explicitly**

If not completed, note:

- H5 verified or not
- WeChat DevTools verified or not
- true-device verified or not

**Step 5: Commit**

```bash
git add frontend/services/menstrual/home-contract-service.js frontend/pages/menstrual/home.vue frontend/services/menstrual/__tests__/home-contract-service.test.mjs frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs docs/design/menstrual/Investigate-calendar-browse-performance.md
git commit -m "feat(menstrual): finalize frontend memory cache for calendar browse"
```

