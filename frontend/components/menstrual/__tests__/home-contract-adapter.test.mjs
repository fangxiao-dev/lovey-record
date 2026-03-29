import test from 'node:test';
import assert from 'node:assert/strict';

import {
	applyClearAttributesToPageModel,
	applyToggleAttributeOptionToPageModel,
	createSeededHomeContracts,
	createMenstrualHomePageModel
} from '../home-contract-adapter.js';

test('home contract adapter maps query responses into the formal menstrual home page model', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	assert.equal(model.topBar.title, '月经记录');
	assert.equal(model.topBar.statusLabel, '私人');
	assert.equal(model.heroCard.eyebrow, '当前状态');
	assert.equal(model.heroCard.title, '经期第 4 天');
	assert.equal(model.heroCard.currentRange.value, '03/26 - 03/31');
	assert.equal(model.heroCard.predictionRange.value, '04/25');
	assert.equal(model.viewModeControl.value, 'three-week');
	assert.equal(model.calendarCard.weeks.length, 3);
	assert.equal(model.calendarCard.weeks.every((week) => week.cells.length === 7), true);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.variant === 'selectedTodayPeriod'),
		true
	);
	assert.equal(model.selectedDatePanel.title, '3 月 29 日');
	assert.equal(model.selectedDatePanel.badge, '今日');
	assert.equal(model.selectedDatePanel.initialPeriodMarked, true);
	assert.equal(model.selectedDatePanel.summaryItems.length, 3);
	assert.equal(model.selectedDatePanel.attributeRows.length, 3);
});

test('home contract adapter builds the calendar from getCalendarWindow and preserves the requested view mode', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();
	const calendarWindow = {
		moduleInstanceId: 'seed-home-module',
		window: {
			startDate: '2026-02-23',
			endDate: '2026-04-05'
		},
		days: [
			{ date: '2026-03-28', isPeriod: true, source: 'auto_filled', isExplicit: true, isDetailRecorded: true },
			{ date: '2026-03-29', isPeriod: true, source: 'auto_filled', isExplicit: true, isDetailRecorded: false },
			{ date: '2026-04-25', isPeriod: false, source: null, isExplicit: false, isDetailRecorded: false }
		],
		marks: [
			{ date: '2026-03-28', kind: 'period' },
			{ date: '2026-03-29', kind: 'period' },
			{ date: '2026-03-29', kind: 'today' },
			{ date: '2026-04-25', kind: 'prediction_start' }
		]
	};

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		calendarWindow,
		today: '2026-03-29',
		focusDate: '2026-03-29',
		viewMode: 'month'
	});

	assert.equal(model.viewModeControl.value, 'month');
	assert.equal(model.headerNav.monthLabel, '2026.03');
	assert.equal(model.calendarCard.weeks.length, 6);
	assert.equal(model.calendarCard.weeks.every((week) => week.cells.length === 7), true);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-03-29' && cell.variant === 'selectedTodayPeriod'),
		true
	);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-03-28' && cell.variant === 'periodDetail'),
		true
	);
});

test('home contract adapter supports implicit non-period day detail without leaking stale selections', () => {
	const { homeView } = createSeededHomeContracts();
	const implicitDayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-04-02',
			isPeriod: false,
			painLevel: null,
			flowLevel: null,
			colorLevel: null,
			note: null,
			source: null,
			isExplicit: false,
			isDetailRecorded: false
		}
	};

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail: implicitDayDetail,
		today: '2026-03-29'
	});

	assert.equal(model.selectedDatePanel.title, '4 月 2 日');
	assert.equal(model.selectedDatePanel.badge, '点击记录');
	assert.equal(model.selectedDatePanel.initialPeriodMarked, false);
	assert.deepEqual(model.selectedDatePanel.summaryItems, []);
	assert.equal(
		model.selectedDatePanel.attributeRows.every((row) => row.options.every((option) => option.selected === false)),
		true
	);
});

test('home contract adapter adds the eye marker to the selected calendar day once attributes are recorded', () => {
	const { homeView } = createSeededHomeContracts();
	const dayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-03-22',
			isPeriod: false,
			painLevel: null,
			flowLevel: null,
			colorLevel: null,
			note: null,
			source: null,
			isExplicit: false,
			isDetailRecorded: false
		}
	};
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	const toggled = applyToggleAttributeOptionToPageModel(model, {
		rowKey: 'pain',
		optionKey: 'pain-light'
	});

	assert.equal(
		toggled.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-03-22' && cell.variant === 'selectedDetail'),
		true
	);
});

test('home contract adapter applies attribute option toggles to both matrix state and summary bar', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	const toggled = applyToggleAttributeOptionToPageModel(model, {
		rowKey: 'pain',
		optionKey: 'pain-light'
	});

	assert.equal(
		toggled.selectedDatePanel.attributeRows.find((row) => row.key === 'pain').options.find((option) => option.key === 'pain-light').selected,
		true
	);
	assert.equal(
		toggled.selectedDatePanel.attributeRows.find((row) => row.key === 'pain').options.find((option) => option.key === 'pain-normal').selected,
		false
	);
	assert.deepEqual(
		toggled.selectedDatePanel.summaryItems.map((item) => [item.key, item.value]),
		[
			['flow', '正常'],
			['pain', '轻'],
			['color', '正常']
		]
	);
});

test('home contract adapter clears all attribute selections and removes summary chips', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	const cleared = applyClearAttributesToPageModel(model);

	assert.deepEqual(cleared.selectedDatePanel.summaryItems, []);
	assert.equal(
		cleared.selectedDatePanel.attributeRows.every((row) => row.options.every((option) => option.selected === false)),
		true
	);
});
