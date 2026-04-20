import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendarGridPath = path.resolve(__dirname, '..', 'CalendarGrid.vue');
const dateCellPath = path.resolve(__dirname, '..', 'DateCell.vue');

test('CalendarGrid boundary weeks let DateCell shrink instead of forcing a fixed 90rpx box', () => {
	const calendarGridSource = fs.readFileSync(calendarGridPath, 'utf8');
	const dateCellSource = fs.readFileSync(dateCellPath, 'utf8');

	assert.match(calendarGridSource, /\.calendar-grid__cell\s*\{[\s\S]*min-width:\s*0;/);
	assert.match(calendarGridSource, /\.calendar-grid__boundary-slot\s*\{[\s\S]*flex:\s*0 0 auto;/);

	assert.match(
		dateCellSource,
		/\.date-cell\s*\{[\s\S]*width:\s*100%;[\s\S]*max-width:\s*90rpx;/
	);
	assert.doesNotMatch(
		dateCellSource,
		/\.date-cell\s*\{\s*width:\s*90rpx;/
	);
});
