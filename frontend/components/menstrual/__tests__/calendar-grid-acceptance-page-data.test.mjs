import test from 'node:test';
import assert from 'node:assert/strict';

import { createCalendarGridAcceptancePage } from '../calendar-grid-acceptance-page-data.js';

test('calendar grid acceptance page exposes the three-week home demo shell', () => {
	const page = createCalendarGridAcceptancePage();

	assert.equal(page.topBar.title, '月经记录');
	assert.equal(page.topBar.statusLabel, '共享');
	assert.equal(page.heroCard.eyebrow, '当前状态');
	assert.equal(page.heroCard.title, '经期第 2 天');
	assert.equal(page.heroCard.copy, '先看当前状态，再在下方 3 周视图里定位和记录。');
	assert.equal(page.headerNav.monthLabel, '2026.03');
	assert.deepEqual(
		page.jumpTabs.items.map((item) => item.label),
		['今天', '本次', '下次预测']
	);
	assert.deepEqual(
		page.viewModeControl.options.map((item) => item.label),
		['3 周', '月览']
	);
	assert.equal(page.viewModeControl.value, 'three-week');
});

test('calendar grid acceptance page keeps the three-week calendar, legend, and selected panel together', () => {
	const page = createCalendarGridAcceptancePage();

	assert.deepEqual(page.calendarCard.weekdayLabels, ['M', 'T', 'W', 'T', 'F', 'S', 'S']);
	assert.equal(page.calendarCard.weeks.length, 3);
	assert.equal(page.calendarCard.weeks.every((week) => week.cells.length === 7), true);
	assert.deepEqual(page.calendarCard.weeks.map((week) => week.cells.map((cell) => cell.variant)), [
		['default', 'period', 'period', 'period', 'period', 'periodDetail', 'prediction'],
		['prediction', 'prediction', 'selectedDetail', 'default', 'default', 'default', 'default'],
		['today', 'futureMuted', 'futureMuted', 'futureMuted', 'prediction', 'prediction', 'prediction']
	]);
	assert.equal(page.legend.length, 3);
	assert.equal(page.selectedDatePanel.title, '3 月 22 日');
	assert.equal(page.selectedDatePanel.badge, '今日');
	assert.equal(page.selectedDatePanel.initialPeriodMarked, true);
	assert.equal(page.selectedDatePanel.initialEditorOpen, false);
	assert.equal('chips' in page.selectedDatePanel, false);
	assert.deepEqual(
		page.selectedDatePanel.summaryItems.map((item) => [item.key, item.label, item.value]),
		[
			['flow', '流量', '中'],
			['pain', '疼痛', '轻微'],
			['color', '颜色', '标准']
		]
	);
	assert.equal('actionLabel' in page.selectedDatePanel, false);
});
