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

test('changelog-data.js entries each have version, title, date, anchorCommit, changes fields', () => {
  const source = fs.readFileSync(dataPath, 'utf8');
  assert.match(source, /"version"/, 'must have version field');
  assert.match(source, /"title"/, 'must have title field');
  assert.match(source, /"date"/, 'must have date field');
  assert.match(source, /"anchorCommit"/, 'must have anchorCommit field');
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

test('changelog-data.js anchorCommit values are full Git SHAs', () => {
  const source = fs.readFileSync(dataPath, 'utf8');
  const commitIds = [...source.matchAll(/"anchorCommit":\s*"([0-9a-f]+)"/g)].map((m) => m[1]);
  assert.ok(commitIds.length > 0, 'no anchorCommit values found');
  for (const commitId of commitIds) {
    assert.match(commitId, /^[0-9a-f]{40}$/, `invalid anchorCommit format: ${commitId}`);
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

// ── ChangelogEntryRow ────────────────────────────────────────────

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

// ── ChangelogSheet ───────────────────────────────────────────────

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

test('ChangelogSheet renders latest entry date in the header row', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /entries\[0\]\.date/, 'must render entries[0].date');
});

test('ChangelogSheet renders history from entries.slice(1)', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /entries\.slice\(1\)/, 'must use entries.slice(1) for history accordion');
});

test('ChangelogSheet renders history item dates in each accordion header', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /entry\.date/, 'must render entry.date in history accordion headers');
});

test('ChangelogSheet does not use CSS inset shorthand', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.doesNotMatch(source, /\binset\s*:/, 'must not use inset shorthand — unsupported in older WeChat WebView');
});

test('ChangelogSheet scroll-view has explicit height, not flex:1 only', () => {
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /changelog-sheet__scroll[\s\S]*?height\s*:/, 'scroll-view must have explicit height for mini-program');
});

// ── ModuleManagementPage integration ────────────────────────────

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
