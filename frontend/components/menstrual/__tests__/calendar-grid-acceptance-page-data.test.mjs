import test from 'node:test';
import assert from 'node:assert/strict';

import { createCalendarGridAcceptancePage } from '../calendar-grid-acceptance-page-data.js';

test('calendar grid acceptance page leads with a month card instead of showcase copy', () => {
	const page = createCalendarGridAcceptancePage();

	assert.equal(page.monthCard.title, '2026 年 3 月');
	assert.equal(page.monthCard.subtitle, '记录中的这一个月');
	assert.equal(page.monthCard.summary.length, 3);
	assert.equal(page.samples.title, '状态补充查看');
});

test('calendar grid acceptance page keeps legend and month data separate from secondary samples', () => {
	const page = createCalendarGridAcceptancePage();

	assert.equal(page.monthCard.weeks.length, 5);
	assert.equal(page.monthCard.weeks.every((week) => week.cells.length === 7), true);
	assert.equal(page.monthCard.legend.length, 3);
	assert.equal(page.samples.items.length, 4);
	assert.equal(
		page.samples.items.every((item) => item.caption && item.caption !== item.variant),
		true
	);
});
