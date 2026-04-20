import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendarGridPath = path.resolve(__dirname, '..', 'CalendarGrid.vue');
const dateCellPath = path.resolve(__dirname, '..', 'DateCell.vue');

test('CalendarGrid boundary weeks preserve square DateCell sizing by tightening the in-row boundary spacing', () => {
	const calendarGridSource = fs.readFileSync(calendarGridPath, 'utf8');
	const dateCellSource = fs.readFileSync(dateCellPath, 'utf8');

	assert.match(
		calendarGridSource,
		/class="calendar-grid__cells"\s*:class="\{\s*'calendar-grid__cells--with-boundary': weekBoundaryInfo\[weekIndex\]\.inRowBoundaryAfterIndex >= 0\s*\}"/
	);
	assert.match(calendarGridSource, /\.calendar-grid__cells--with-boundary\s*\{[\s\S]*gap:\s*4rpx;/);
	assert.match(calendarGridSource, /\.calendar-grid__boundary-slot\s*\{[\s\S]*padding:\s*0;[\s\S]*min-width:\s*0;/);

	assert.match(dateCellSource, /\.date-cell\s*\{[\s\S]*width:\s*90rpx;/);
	assert.match(dateCellSource, /\.date-cell\s*\{[\s\S]*min-width:\s*90rpx;/);
	assert.match(dateCellSource, /\.date-cell\s*\{[\s\S]*max-width:\s*90rpx;/);
});
