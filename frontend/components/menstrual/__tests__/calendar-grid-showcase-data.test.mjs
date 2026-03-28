import test from 'node:test';
import assert from 'node:assert/strict';

import { createCalendarGridShowcase } from '../calendar-grid-showcase-data.js';

test('calendar grid showcase exposes two week rows with seven cells each', () => {
	const board = createCalendarGridShowcase();

	assert.equal(board.weeks.length, 2);
	assert.equal(board.weeks[0].cells.length, 7);
	assert.equal(board.weeks[1].cells.length, 7);
	assert.equal(board.weekdayLabels.length, 7);
});

test('calendar grid showcase keeps week divider structure separate from date state', () => {
	const board = createCalendarGridShowcase();
	const secondWeekVariants = board.weeks[1].cells.map((cell) => cell.variant);

	assert.deepEqual(secondWeekVariants, [
		'futureMuted',
		'futureMuted',
		'futureMuted',
		'futureMuted',
		'futureMuted',
		'futureMuted',
		'futureMuted'
	]);
	assert.equal(
		board.weeks.flatMap((week) => week.cells).every((cell) => cell.caption === undefined),
		true
	);
});
