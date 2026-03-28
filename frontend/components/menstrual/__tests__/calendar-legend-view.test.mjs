import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendarLegendPath = path.resolve(__dirname, '..', 'CalendarLegend.vue');

test('calendar legend renders special marker through the shared static asset path', () => {
  const source = fs.readFileSync(calendarLegendPath, 'utf8');

  assert.match(source, /calendar-legend__marker-image/);
  assert.match(source, /getMarkerAssetSrc/);
  assert.doesNotMatch(source, /<svg[\s\S]*calendar-legend__marker-svg/);
});
