# Changelog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a low-interruption changelog surface to the module management page: a persistent entry row at the bottom, a bottom sheet for details, and auto-show on first launch after a new version.

**Architecture:** Changelog data lives in a JS module (`utils/changelog-data.js`) rather than a bare JSON file, to avoid the WeChat mini-program JSON static-import limitation. A thin utility (`utils/changelog.js`) handles read-state logic using `uni.getStorageSync/setStorageSync`. Two new Vue components (`ChangelogEntryRow`, `ChangelogSheet`) are integrated into `ModuleManagementPage`.

**Tech Stack:** Vue 3 (Options API, matching existing components), uni-app cross-platform storage APIs, Node.js built-in test runner (`node --test`) for static source-analysis contract tests (tests never execute component or utility code — they only read source files as strings).

---

## Context to Read First

- Design contract: `docs/design/changelog/frontend-changelog.md`
- Behavior contract: `docs/design/changelog/function-changelog.md`
- Existing page: `frontend/components/management/ModuleManagementPage.vue`
- Test conventions: `frontend/__tests__/module-management-layout-contract.test.mjs`
- Run tests: `cd frontend && node --test __tests__/<file>.test.mjs`

---

### Task 1: Changelog data module and utility

**Files:**
- Create: `frontend/utils/changelog-data.js`
- Create: `frontend/utils/changelog.js`
- Create: `frontend/__tests__/changelog-contract.test.mjs`

> **Why a JS module, not JSON?** Static JSON imports (`import x from 'file.json'`) work in the H5/Vite build but fail silently or cause compile errors in the WeChat mini-program compiler, which treats `static/` as verbatim assets. Exporting the data from a `.js` module works uniformly on both platforms.

---

**Step 1: Write the failing test**

`frontend/__tests__/changelog-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const dataPath = path.resolve(repoRoot, 'utils/changelog-data.js');
const utilPath = path.resolve(repoRoot, 'utils/changelog.js');

// ── Data module ─────────────────────────────────────────────────

test('changelog-data.js exists at utils/changelog-data.js', () => {
  assert.ok(fs.existsSync(dataPath), 'changelog-data.js not found');
});

test('changelog-data.js exports an array literal with at least one entry', () => {
  const source = fs.readFileSync(dataPath, 'utf8');
  assert.match(source, /export default\s*\[/, 'must export default array');
  assert.match(source, /version.*v\d+\.\d+\.\d+/, 'must contain at least one versioned entry');
});

test('changelog-data.js entries each have version, title, date, changes fields', () => {
  const source = fs.readFileSync(dataPath, 'utf8');
  assert.match(source, /"version"/, 'must have version field');
  assert.match(source, /"title"/, 'must have title field');
  assert.match(source, /"date"/, 'must have date field');
  assert.match(source, /"changes"/, 'must have changes field');
});

test('changelog-data.js version strings match vMAJOR.MINOR.PATCH format', () => {
  const source = fs.readFileSync(dataPath, 'utf8');
  const versions = [...source.matchAll(/"version":\s*"(v[^"]+)"/g)].map((m) => m[1]);
  assert.ok(versions.length > 0, 'no version strings found');
  for (const v of versions) {
    assert.match(v, /^v\d+\.\d+\.\d+$/, `invalid version format: ${v}`);
  }
});

// ── Utility ─────────────────────────────────────────────────────

test('changelog.js exists at utils/changelog.js', () => {
  assert.ok(fs.existsSync(utilPath), 'changelog.js not found');
});

test('changelog.js exports hasUnread, readLastViewedVersion, writeLastViewedVersion', () => {
  const source = fs.readFileSync(utilPath, 'utf8');
  assert.match(source, /export function hasUnread/, 'must export hasUnread');
  assert.match(source, /export function readLastViewedVersion/, 'must export readLastViewedVersion');
  assert.match(source, /export function writeLastViewedVersion/, 'must export writeLastViewedVersion');
});

test('changelog.js storage calls are wrapped in try/catch', () => {
  const source = fs.readFileSync(utilPath, 'utf8');
  assert.match(source, /try\s*\{[\s\S]*uni\.(get|set)StorageSync[\s\S]*\}\s*catch/, 'storage calls must be in try/catch');
});
```

**Step 2: Run to confirm failures**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

Expected: 7 failures.

---

**Step 3: Create `frontend/utils/changelog-data.js`**

```js
// Changelog entries, ordered newest-first.
// Add a new entry here when cutting a GitHub release tag.
// version format: vMAJOR.MINOR.PATCH
export default [
  {
    version: 'v1.2.0',
    title: '周期阶段提示',
    date: '2026-04-16',
    changes: [
      '新增周期阶段提示',
      '优化首页信息密度',
    ],
  },
  {
    version: 'v1.1.0',
    title: '月经记录模块',
    date: '2026-03-22',
    changes: [
      '新增月经记录模块',
      '优化 UI 布局',
    ],
  },
  {
    version: 'v0.0.0',
    title: '初始化',
    date: '2026-01-01',
    changes: [
      '项目初始化',
    ],
  },
];
```

---

**Step 4: Create `frontend/utils/changelog.js`**

```js
const STORAGE_KEY = 'changelog_lastViewedVersion';
const DEFAULT_VERSION = 'v0.0.0';

/**
 * Returns true if the user has not yet seen the latest changelog entry.
 * The changelog array must be sorted newest-first; index 0 is the latest entry.
 * Comparison is string equality — no semver parsing needed.
 *
 * @param {Array} changelog
 * @param {string} lastViewedVersion
 * @returns {boolean}
 */
export function hasUnread(changelog, lastViewedVersion) {
  if (!Array.isArray(changelog) || changelog.length === 0) return false;
  return changelog[0].version !== lastViewedVersion;
}

/**
 * Reads the stored last-viewed version from device storage.
 * Returns DEFAULT_VERSION if nothing is stored or storage is unavailable.
 *
 * @returns {string}
 */
export function readLastViewedVersion() {
  try {
    return uni.getStorageSync(STORAGE_KEY) || DEFAULT_VERSION;
  } catch {
    return DEFAULT_VERSION;
  }
}

/**
 * Persists the given version as the last-viewed version.
 * Silently swallows storage errors.
 *
 * @param {string} version
 */
export function writeLastViewedVersion(version) {
  try {
    uni.setStorageSync(STORAGE_KEY, version);
  } catch {
    // storage unavailable — ignore
  }
}
```

**Step 5: Run tests — expect all pass**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

**Step 6: Commit**

```bash
git add frontend/utils/changelog-data.js frontend/utils/changelog.js frontend/__tests__/changelog-contract.test.mjs
git commit -m "feat(changelog): add data module, utility, and contract tests"
```

---

### Task 2: ChangelogEntryRow component

**Files:**
- Create: `frontend/components/management/ChangelogEntryRow.vue`
- Modify: `frontend/__tests__/changelog-contract.test.mjs`

---

**Step 1: Add failing tests**

Append to the test file:

```js
const entryRowPath = path.resolve(repoRoot, 'components/management/ChangelogEntryRow.vue');

test('ChangelogEntryRow.vue exists', () => {
  assert.ok(fs.existsSync(entryRowPath), 'ChangelogEntryRow.vue not found');
});

test('ChangelogEntryRow has entries and lastViewedVersion props', () => {
  const source = fs.readFileSync(entryRowPath, 'utf8');
  assert.match(source, /entries/, 'must have entries prop');
  assert.match(source, /lastViewedVersion/, 'must have lastViewedVersion prop');
});

test('ChangelogEntryRow emits open on tap', () => {
  const source = fs.readFileSync(entryRowPath, 'utf8');
  assert.match(source, /\$emit\(['"]open['"]\)/, 'must emit open');
});

test('ChangelogEntryRow hides itself when entries is empty via v-if on entries', () => {
  const source = fs.readFileSync(entryRowPath, 'utf8');
  assert.match(source, /v-if.*entries/, 'must conditionally render based on entries');
});

test('ChangelogEntryRow uses hasUnread from changelog utility', () => {
  const source = fs.readFileSync(entryRowPath, 'utf8');
  assert.match(source, /hasUnread/, 'must use hasUnread');
});
```

**Step 2: Run to confirm failures**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

Expected: 5 new failures.

---

**Step 3: Create `frontend/components/management/ChangelogEntryRow.vue`**

```vue
<template>
  <view
    v-if="entries && entries.length > 0"
    class="changelog-entry-row"
    hover-class="ui-pressable-hover"
    :hover-stay-time="70"
    @tap="$emit('open')"
  >
    <view class="changelog-entry-row__left">
      <view class="changelog-entry-row__title-line">
        <text class="changelog-entry-row__label u-text-body">更新记录</text>
        <view v-if="hasUnreadUpdate" class="changelog-entry-row__dot" />
      </view>
      <text class="changelog-entry-row__preview u-text-caption">最近：{{ entries[0].title }}</text>
    </view>
    <text class="changelog-entry-row__chevron">›</text>
  </view>
</template>

<script>
  import { hasUnread } from '../../utils/changelog.js';

  export default {
    name: 'ChangelogEntryRow',
    emits: ['open'],
    props: {
      entries: {
        type: Array,
        default: () => [],
      },
      lastViewedVersion: {
        type: String,
        default: 'v0.0.0',
      },
    },
    computed: {
      hasUnreadUpdate() {
        return hasUnread(this.entries, this.lastViewedVersion);
      },
    },
  };
</script>

<style lang="scss">
  .changelog-entry-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    gap: 16rpx;
  }

  .changelog-entry-row__left {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    flex: 1;
  }

  .changelog-entry-row__title-line {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .changelog-entry-row__label {
    font-weight: 500;
    color: $text-primary;
  }

  .changelog-entry-row__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 999rpx;
    background: #c9786a;
    flex-shrink: 0;
  }

  .changelog-entry-row__preview {
    color: $text-muted;
  }

  .changelog-entry-row__chevron {
    font-size: 36rpx;
    color: $text-muted;
    line-height: 1;
    flex-shrink: 0;
  }
</style>
```

**Step 4: Run tests — expect all pass**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

**Step 5: Commit**

```bash
git add frontend/components/management/ChangelogEntryRow.vue frontend/__tests__/changelog-contract.test.mjs
git commit -m "feat(changelog): add ChangelogEntryRow component"
```

---

### Task 3: ChangelogSheet component

**Files:**
- Create: `frontend/components/management/ChangelogSheet.vue`
- Modify: `frontend/__tests__/changelog-contract.test.mjs`

---

**Step 1: Add failing tests**

Append to the test file:

```js
const sheetPath = path.resolve(repoRoot, 'components/management/ChangelogSheet.vue');

test('ChangelogSheet.vue exists', () => {
  assert.ok(fs.existsSync(sheetPath), 'ChangelogSheet.vue not found');
});

test('ChangelogSheet has entries and visible props', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /entries/, 'must have entries prop');
  assert.match(source, /visible/, 'must have visible prop');
});

test('ChangelogSheet emits close', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /\$emit\(['"]close['"]\)/, 'must emit close');
});

test('ChangelogSheet renders latest entry changes from entries[0].changes', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /entries\[0\]\.changes/, 'must render entries[0].changes');
});

test('ChangelogSheet renders history from entries.slice(1)', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /entries\.slice\(1\)/, 'must use entries.slice(1) for history accordion');
});

test('ChangelogSheet does not use CSS inset shorthand', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.doesNotMatch(source, /\binset\s*:/, 'must not use inset shorthand — unsupported in older WeChat WebView');
});

test('ChangelogSheet scroll-view has explicit height, not flex:1 only', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /changelog-sheet__scroll[\s\S]*?height\s*:/, 'scroll-view must have explicit height for mini-program');
});
```

**Step 2: Run to confirm failures**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

Expected: 7 new failures.

---

**Step 3: Create `frontend/components/management/ChangelogSheet.vue`**

```vue
<template>
  <view v-if="visible" class="changelog-sheet">
    <!-- Overlay -->
    <view class="changelog-sheet__overlay" @tap="$emit('close')" />

    <!-- Sheet panel -->
    <view
      class="changelog-sheet__panel"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <view class="changelog-sheet__drag-bar-wrapper">
        <view class="changelog-sheet__drag-indicator" />
      </view>

      <scroll-view class="changelog-sheet__scroll" scroll-y>
        <view class="changelog-sheet__content">
          <text class="changelog-sheet__title u-text-title-lg">更新记录</text>

          <text class="changelog-sheet__section-label u-text-caption">最近更新</text>
          <view class="changelog-sheet__change-list">
            <view
              v-for="(change, i) in entries[0].changes"
              :key="i"
              class="changelog-sheet__change-item"
            >
              <text class="changelog-sheet__bullet">·</text>
              <text class="changelog-sheet__change-text u-text-body">{{ change }}</text>
            </view>
          </view>

          <view class="changelog-sheet__divider" />

          <text class="changelog-sheet__section-label u-text-caption">历史版本</text>
          <view class="changelog-sheet__accordion">
            <view
              v-for="(entry, i) in entries.slice(1)"
              :key="entry.version"
              class="changelog-sheet__accordion-item"
            >
              <view
                class="changelog-sheet__accordion-header"
                hover-class="ui-pressable-hover"
                :hover-stay-time="70"
                @tap="toggleAccordion(i)"
              >
                <text class="changelog-sheet__accordion-label u-text-body">{{ entry.version }} {{ entry.title }}</text>
                <text class="changelog-sheet__accordion-chevron">{{ expandedIndex === i ? '˅' : '›' }}</text>
              </view>
              <view v-if="expandedIndex === i" class="changelog-sheet__accordion-body">
                <view
                  v-for="(change, j) in entry.changes"
                  :key="j"
                  class="changelog-sheet__change-item changelog-sheet__change-item--indented"
                >
                  <text class="changelog-sheet__bullet">·</text>
                  <text class="changelog-sheet__change-text u-text-body">{{ change }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
  export default {
    name: 'ChangelogSheet',
    emits: ['close'],
    props: {
      visible: {
        type: Boolean,
        default: false,
      },
      entries: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        expandedIndex: -1,
        touchStartX: 0,
        touchStartY: 0,
      };
    },
    watch: {
      visible(val) {
        if (!val) {
          this.expandedIndex = -1;
          this.touchStartX = 0;
          this.touchStartY = 0;
        }
      },
    },
    methods: {
      toggleAccordion(index) {
        this.expandedIndex = this.expandedIndex === index ? -1 : index;
      },
      onTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      },
      onTouchEnd(e) {
        const deltaX = Math.abs(e.changedTouches[0].clientX - this.touchStartX);
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        // Only dismiss on primarily downward vertical swipe
        if (deltaY > 60 && deltaY > deltaX) {
          this.$emit('close');
        }
      },
    },
  };
</script>

<style lang="scss">
  .changelog-sheet {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 998;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .changelog-sheet__overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.18);
  }

  .changelog-sheet__panel {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 70vh;
    background: #ffffff;
    border-radius: 28rpx 28rpx 0 0;
    display: flex;
    flex-direction: column;
  }

  .changelog-sheet__drag-bar-wrapper {
    display: flex;
    justify-content: center;
    padding: 24rpx 0 16rpx;
    flex-shrink: 0;
  }

  .changelog-sheet__drag-indicator {
    width: 64rpx;
    height: 8rpx;
    border-radius: 999rpx;
    background: #e6ded5;
  }

  // Explicit height required: scroll-view in WeChat mini-program does not
  // scroll with flex:1 alone — it needs a calculated pixel/vh height.
  .changelog-sheet__scroll {
    height: calc(70vh - 64rpx); // 64rpx = drag-bar-wrapper height
  }

  .changelog-sheet__content {
    padding: 32rpx 40rpx 64rpx;
    display: flex;
    flex-direction: column;
  }

  .changelog-sheet__title {
    color: $text-primary;
    margin-bottom: 24rpx;
  }

  .changelog-sheet__section-label {
    color: $text-muted;
    margin-bottom: 16rpx;
  }

  .changelog-sheet__change-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 16rpx;
  }

  .changelog-sheet__change-item {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
  }

  .changelog-sheet__change-item--indented {
    padding-left: 24rpx;
  }

  .changelog-sheet__bullet {
    color: $text-muted;
    font-size: 28rpx;
    line-height: 1.6;
    flex-shrink: 0;
  }

  .changelog-sheet__change-text {
    color: $text-primary;
    line-height: 1.6;
  }

  .changelog-sheet__divider {
    width: 100%;
    height: 1rpx;
    background: #e6ded5;
    margin: 32rpx 0;
  }

  .changelog-sheet__accordion {
    display: flex;
    flex-direction: column;
  }

  .changelog-sheet__accordion-item {
    border-top: 1rpx solid #e6ded5;

    &:last-child {
      border-bottom: 1rpx solid #e6ded5;
    }
  }

  .changelog-sheet__accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 0;
    gap: 16rpx;
  }

  .changelog-sheet__accordion-label {
    font-weight: 500;
    color: $text-primary;
    flex: 1;
  }

  .changelog-sheet__accordion-chevron {
    font-size: 28rpx;
    color: $text-muted;
    flex-shrink: 0;
  }

  .changelog-sheet__accordion-body {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    padding-bottom: 24rpx;
  }
</style>
```

**Step 4: Run tests — expect all pass**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

**Step 5: Commit**

```bash
git add frontend/components/management/ChangelogSheet.vue frontend/__tests__/changelog-contract.test.mjs
git commit -m "feat(changelog): add ChangelogSheet component with accordion history"
```

---

### Task 4: Integrate into ModuleManagementPage

**Files:**
- Modify: `frontend/components/management/ModuleManagementPage.vue`
- Modify: `frontend/__tests__/changelog-contract.test.mjs`

---

**Step 1: Add failing integration tests**

Append to the test file:

```js
const managementPagePath = path.resolve(repoRoot, 'components/management/ModuleManagementPage.vue');

test('ModuleManagementPage imports ChangelogEntryRow and ChangelogSheet', () => {
  const source = fs.readFileSync(managementPagePath, 'utf8');
  assert.match(source, /import ChangelogEntryRow/, 'must import ChangelogEntryRow');
  assert.match(source, /import ChangelogSheet/, 'must import ChangelogSheet');
});

test('ModuleManagementPage uses <ChangelogEntryRow> and <ChangelogSheet> in template', () => {
  const source = fs.readFileSync(managementPagePath, 'utf8');
  assert.match(source, /<ChangelogEntryRow/, 'must use ChangelogEntryRow in template');
  assert.match(source, /<ChangelogSheet/, 'must use ChangelogSheet in template');
});

test('ModuleManagementPage has showChangelogSheet in data', () => {
  const source = fs.readFileSync(managementPagePath, 'utf8');
  assert.match(source, /showChangelogSheet\s*:/, 'must declare showChangelogSheet in data');
});

test('ModuleManagementPage calls readLastViewedVersion on initialize', () => {
  const source = fs.readFileSync(managementPagePath, 'utf8');
  assert.match(source, /readLastViewedVersion\(\)/, 'must call readLastViewedVersion');
});

test('ModuleManagementPage calls writeLastViewedVersion on changelog close', () => {
  const source = fs.readFileSync(managementPagePath, 'utf8');
  assert.match(source, /writeLastViewedVersion/, 'must call writeLastViewedVersion');
});
```

**Step 2: Run to confirm failures**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

Expected: 5 new failures.

---

**Step 3: Edit `frontend/components/management/ModuleManagementPage.vue`**

**3a. Add imports** at the top of the `<script>` block, after the existing imports:

```js
import ChangelogEntryRow from './ChangelogEntryRow.vue';
import ChangelogSheet from './ChangelogSheet.vue';
import changelogEntries from '../../utils/changelog-data.js';
import { readLastViewedVersion, writeLastViewedVersion } from '../../utils/changelog.js';
```

**3b. Register components** — add to the `components` object:

```js
ChangelogEntryRow,
ChangelogSheet,
```

**3c. Add data properties** — add to the `data()` return object:

```js
showChangelogSheet: false,
changelogEntries,
lastViewedVersion: 'v0.0.0',
```

**3d. Add methods** — add to the `methods` object:

```js
openChangelog() {
  this.showChangelogSheet = true;
},
closeChangelog() {
  if (this.changelogEntries.length > 0) {
    writeLastViewedVersion(this.changelogEntries[0].version);
    this.lastViewedVersion = this.changelogEntries[0].version;
  }
  this.showChangelogSheet = false;
},
```

**3e. Patch `initialize()`**

At the very start of the `initialize()` method body (before any existing code), add:

```js
this.lastViewedVersion = readLastViewedVersion();
```

At the end of `initialize()`, after the page model is loaded (i.e., after the `isDemoMode` branch and after `await this.retryInitialLoad()` both settle), add:

```js
// Auto-show on first launch after a new version.
// Deferred to next tick so the page DOM is settled before the sheet appears.
if (
  this.changelogEntries.length > 0 &&
  this.changelogEntries[0].version !== this.lastViewedVersion
) {
  this.$nextTick(() => {
    this.showChangelogSheet = true;
  });
}
```

**3f. Add `<ChangelogEntryRow>` to template**

Inside the root `<view class="management-page u-page-shell">`, inside `<view v-if="page" class="management-page__body">`, after the dev toolbar `<view v-if="isDev">` block, add:

```html
<ChangelogEntryRow
  :entries="changelogEntries"
  :last-viewed-version="lastViewedVersion"
  @open="openChangelog"
/>
```

**3g. Add `<ChangelogSheet>` to template**

Inside the root `<view class="management-page u-page-shell">`, immediately before the closing `</view>` of that root element (after the share modal `</view>`), add:

```html
<ChangelogSheet
  :visible="showChangelogSheet"
  :entries="changelogEntries"
  @close="closeChangelog"
/>
```

**Step 4: Run tests — expect all pass**

```bash
cd frontend && node --test __tests__/changelog-contract.test.mjs
```

**Step 5: Run all contract tests — check for regressions**

```bash
cd frontend && node --test __tests__/*.test.mjs
```

Expected: all pass, no regressions.

**Step 6: Commit**

```bash
git add frontend/components/management/ModuleManagementPage.vue frontend/__tests__/changelog-contract.test.mjs
git commit -m "feat(changelog): integrate ChangelogEntryRow and ChangelogSheet into management page"
```

---

## Done

The feature is complete when:

- `changelog-data.js` has at least one correctly shaped entry
- `ChangelogEntryRow` shows the entry row with unread dot when applicable; hides entirely when the entries array is empty
- `ChangelogSheet` opens and closes, shows latest changes flat, shows prior versions as collapsible accordion with one-at-a-time expansion
- Auto-show fires on app load for a new version and is suppressed after the user closes the sheet
- All contract tests pass with no regressions across `__tests__/*.test.mjs`
