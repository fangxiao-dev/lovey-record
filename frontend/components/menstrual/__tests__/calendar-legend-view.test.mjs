import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendarLegendPath = path.resolve(__dirname, '..', 'CalendarLegend.vue');

test('calendar legend renders detail marker through the shared static asset path', () => {
  const source = fs.readFileSync(calendarLegendPath, 'utf8');

  assert.match(source, /calendar-legend__marker-image/);
  assert.match(source, /getMarkerAssetSrc/);
  assert.doesNotMatch(source, /<svg[\s\S]*calendar-legend__marker-svg/);
  assert.match(source, /font-size:\s*22rpx;/);
  assert.match(source, /line-height:\s*22rpx;/);
  assert.match(source, /calendar-legend__marker--fill[\s\S]*width:\s*20rpx;[\s\S]*height:\s*20rpx;/);
  assert.match(source, /calendar-legend__marker--eye[\s\S]*width:\s*24rpx;[\s\S]*height:\s*24rpx;/);
});
