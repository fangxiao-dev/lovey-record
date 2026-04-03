import test from 'node:test';
import assert from 'node:assert/strict';

import {
	applyHeroSnapshotToPageModel,
	applyClearAttributesToPageModel,
	applyBatchPeriodDraftToPageModel,
	applySingleDayPeriodActionToPageModel,
	applyToggleAttributeOptionToPageModel,
	createEmptyDayDetail,
	createSeededHomeContracts,
	createMenstrualHomePageModel,
	resolveJumpTargetDate
} from '../home-contract-adapter.js';

test('home contract adapter maps query responses into the formal menstrual home page model', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: homeView.currentStatusSummary.anchorDate  // Use seed's actual date
	});

	assert.equal(model.topBar.title, '月经记录');
	assert.equal(model.topBar.statusLabel, '私人');
	assert.equal(model.heroCard.label, '当前状态');
	assert.equal(model.heroCard.sharingLabel, '私人');
	// Seed shows out_of_period with just-exited period as "上次"
	assert.equal(model.heroCard.statusFrame.text, '非经期');
	assert.equal(model.heroCard.statusFrame.state, 'out_of_period');
	assert.equal(model.heroCard.previousFrame.label, '上次');
	// Should show currentSegment when out_of_period
	assert.equal(model.heroCard.previousFrame.value,
		homeView.currentStatusSummary.currentSegment
			? `${homeView.currentStatusSummary.currentSegment.startDate.slice(5).replace('-', '.')} - ${homeView.currentStatusSummary.currentSegment.endDate.slice(5).replace('-', '.')}`
			: '暂无记录'
	);
	assert.equal(model.heroCard.nextFrame.label, '下次');
	// Should have prediction
	assert.equal(model.heroCard.nextFrame.value, homeView.predictionSummary.predictedStartDate.slice(5).replace('-', '.'));
	assert.equal(model.viewModeControl.value, 'three-week');
	assert.deepEqual(
		model.jumpTabs.items.map((item) => [item.key, item.label, item.disabled]),
		[
			['today', '今天', false],
			['previous', '上次', false],
			['prediction', '下次预测', false]
		]
	);
	assert.equal(model.calendarCard.weeks.length, 3);
	assert.equal(model.calendarCard.weeks.every((week) => week.cells.length === 7), true);
	// Should have today marker
	assert.ok(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.variant.includes('today')),
		'should have a today cell'
	);
	// Badge depends on whether selected date is today and has attributes
	assert.ok(model.selectedDatePanel.badge);
	assert.equal(model.selectedDatePanel.periodChipText, '月经');
	assert.equal(model.selectedDatePanel.periodChipSelected, false);
	assert.equal(model.selectedDatePanel.attributeRows.length, 3);
});

test('home contract adapter shows "上次" from currentSegment when out_of_period', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();
	// Seed already has out_of_period with currentSegment, so test the display
	assert.equal(homeView.currentStatusSummary.currentStatus, 'out_of_period');
	assert.ok(homeView.currentStatusSummary.currentSegment, 'seed should have currentSegment');

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: homeView.currentStatusSummary.anchorDate  // Use the seed's period date as "today" reference
	});

	assert.equal(model.heroCard.statusFrame.text, '非经期');
	assert.equal(model.heroCard.statusFrame.state, 'out_of_period');
	// When out of period, "上次" shows the segment we just exited (currentSegment)
	const formattedSegment = `${homeView.currentStatusSummary.currentSegment.startDate.slice(5).replace('-', '.')} - ${homeView.currentStatusSummary.currentSegment.endDate.slice(5).replace('-', '.')}`;
	assert.equal(model.heroCard.previousFrame.value, formattedSegment);
	assert.deepEqual(
		model.jumpTabs.items.map((item) => [item.key, item.label, item.disabled]),
		[
			['today', '今天', false],
			['previous', '上次', false],
			['prediction', '下次预测', false]
		]
	);
	assert.equal(model.jumpTabs.items.some((item) => item.key === 'current'), false);
});

test('home contract adapter builds the calendar from getCalendarWindow and preserves the requested view mode', () => {
	// Use static test data, not dynamic seed
	const staticHomeView = {
		moduleInstanceId: 'seed-home-module',
		sharingStatus: 'private',
		currentStatusSummary: {
			currentStatus: 'in_period',
			currentSegment: { startDate: '2026-03-28', endDate: '2026-03-31', durationDays: 4 },
			statusCard: { label: '经期中' },
			previousSegment: null
		},
		predictionSummary: { predictedStartDate: '2026-04-25', predictionWindowStart: '2026-04-23', predictionWindowEnd: '2026-04-27', basedOnCycleCount: 3 }
	};
	const staticDayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-03-29',
			isPeriod: true,
			painLevel: 3,
			flowLevel: 3,
			colorLevel: 3,
			note: null,
			source: 'auto_filled',
			isExplicit: true,
			isDetailRecorded: true
		}
	};

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
		homeView: staticHomeView,
		dayDetail: staticDayDetail,
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

test('home contract adapter can build a month-view calendar locally from homeView marks when calendarWindow is unavailable', () => {
	const { homeView } = createSeededHomeContracts();

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail: createEmptyDayDetail({
			moduleInstanceId: 'seed-home-module',
			profileId: 'seed-home-profile',
			date: '2026-04-27'
		}),
		today: '2026-03-29',
		focusDate: '2026-04-27',
		viewMode: 'month'
	});

	assert.equal(model.viewModeControl.value, 'month');
	assert.equal(model.headerNav.monthLabel, '2026.04');
	assert.equal(model.calendarCard.weeks.length, 5);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-04-27' && cell.variant === 'selected'),
		true
	);
	assert.equal(model.selectedDatePanel.title, '4 月 27 日');
	assert.equal(model.selectedDatePanel.badge, '点击记录');
});

test('home contract adapter renders only prediction_start as prediction instead of the whole prediction window', () => {
	const homeView = {
		moduleInstanceId: 'seed-home-module',
		sharingStatus: 'private',
		currentStatusSummary: {
			currentStatus: 'out_of_period',
			anchorDate: '2026-03-29',
			currentSegment: {
				startDate: '2026-03-20',
				endDate: '2026-03-25',
				durationDays: 6
			},
			statusCard: {
				label: '非经期'
			}
		},
		predictionSummary: {
			predictedStartDate: '2026-04-03',
			predictionWindowStart: '2026-04-01',
			predictionWindowEnd: '2026-04-05',
			basedOnCycleCount: 3
		},
		calendarMarks: [
			{ date: '2026-04-03', kind: 'prediction_start' }
		]
	};

	const localModel = createMenstrualHomePageModel({
		homeView,
		dayDetail: createEmptyDayDetail({
			moduleInstanceId: 'seed-home-module',
			profileId: 'seed-home-profile',
			date: '2026-04-03'
		}),
		today: '2026-04-06',
		focusDate: '2026-04-03',
		viewMode: 'month'
	});
	const localByDate = Object.fromEntries(localModel.calendarCard.weeks.flatMap((week) => week.cells).map((cell) => [cell.key, cell.variant]));
	assert.equal(localByDate['2026-04-01'], 'default');
	assert.equal(localByDate['2026-04-02'], 'default');
	assert.equal(localByDate['2026-04-03'], 'selectedPrediction');

	const windowModel = createMenstrualHomePageModel({
		homeView,
		dayDetail: createEmptyDayDetail({
			moduleInstanceId: 'seed-home-module',
			profileId: 'seed-home-profile',
			date: '2026-04-03'
		}),
		calendarWindow: {
			moduleInstanceId: 'seed-home-module',
			window: {
				startDate: '2026-03-30',
				endDate: '2026-04-05'
			},
			days: [
				{ date: '2026-04-01', isPeriod: false, source: null, isExplicit: false, isDetailRecorded: false },
				{ date: '2026-04-02', isPeriod: false, source: null, isExplicit: false, isDetailRecorded: false },
				{ date: '2026-04-03', isPeriod: false, source: null, isExplicit: false, isDetailRecorded: false }
			],
			marks: [
				{ date: '2026-04-03', kind: 'prediction_start' }
			]
		},
		today: '2026-04-06',
		focusDate: '2026-04-03',
		viewMode: 'month'
	});
	const windowByDate = Object.fromEntries(windowModel.calendarCard.weeks.flatMap((week) => week.cells).map((cell) => [cell.key, cell.variant]));
	assert.equal(windowByDate['2026-04-01'], 'default');
	assert.equal(windowByDate['2026-04-02'], 'default');
	assert.equal(windowByDate['2026-04-03'], 'selectedPrediction');
});

test('home contract adapter uses predictedStartDate for the hero next frame and prediction jump target', () => {
	const { homeView, dayDetail } = createSeededHomeContracts();

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	assert.equal(
		model.heroCard.nextFrame.value,
		homeView.predictionSummary.predictedStartDate.slice(5).replace('-', '.')
	);
	assert.equal(model.jumpTabs.items.find((item) => item.key === 'prediction')?.disabled, false);
	assert.equal(resolveJumpTargetDate(homeView, 'prediction', '2026-03-29'), homeView.predictionSummary.predictedStartDate);
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
	assert.equal(model.selectedDatePanel.periodChipText, '月经');
	assert.equal(model.selectedDatePanel.periodChipSelected, false);
	assert.deepEqual(model.selectedDatePanel.summaryItems, []);
	assert.equal(model.selectedDatePanel.note, '');
	assert.equal(
		model.selectedDatePanel.attributeRows.every((row) => row.options.every((option) => option.selected === false)),
		true
	);
});

test('home contract adapter keeps note-only days recorded without adding an eye marker', () => {
	const { homeView } = createSeededHomeContracts();
	const noteOnlyDayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-04-02',
			isPeriod: false,
			painLevel: null,
			flowLevel: null,
			colorLevel: null,
			note: 'late sleep',
			source: 'manual',
			isExplicit: true,
			isDetailRecorded: false
		}
	};

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail: noteOnlyDayDetail,
		today: '2026-03-29'
	});

	assert.equal(model.selectedDatePanel.badge, '已记录');
	assert.equal(model.selectedDatePanel.note, 'late sleep');
	assert.deepEqual(model.selectedDatePanel.summaryItems, []);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-04-02' && cell.variant.includes('Detail')),
		false
	);
});

test('home contract adapter keeps period-only days recorded without adding an eye marker', () => {
	const { homeView } = createSeededHomeContracts();
	const periodOnlyDayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-04-03',
			isPeriod: true,
			painLevel: null,
			flowLevel: null,
			colorLevel: null,
			note: null,
			source: 'manual',
			isExplicit: true,
			isDetailRecorded: false
		}
	};

	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail: periodOnlyDayDetail,
		today: '2026-03-29'
	});

	assert.equal(model.selectedDatePanel.badge, '已记录');
	assert.equal(model.selectedDatePanel.periodChipText, '月经开始');
	assert.equal(model.selectedDatePanel.periodChipSelected, true);
	assert.deepEqual(model.selectedDatePanel.summaryItems, []);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-04-03' && cell.variant.includes('Detail')),
		false
	);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-04-03' && cell.variant === 'selectedPeriod'),
		true
	);
});

test('home contract adapter keeps the eye marker when today has detail and prediction starts on a later date', () => {
	const { homeView } = createSeededHomeContracts();
	const todayPredictionDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-03-29',
			isPeriod: false,
			painLevel: 2,
			flowLevel: null,
			colorLevel: null,
			note: null,
			source: 'manual',
			isExplicit: true,
			isDetailRecorded: true
		}
	};
	const calendarWindow = {
		moduleInstanceId: 'seed-home-module',
		window: {
			startDate: '2026-03-16',
			endDate: '2026-04-05'
		},
		days: [
			{ date: '2026-03-29', isPeriod: false, source: 'manual', isExplicit: true, isDetailRecorded: true }
		],
		marks: [
			{ date: '2026-03-29', kind: 'today' },
			{ date: '2026-03-31', kind: 'prediction_start' }
		]
	};

	const model = createMenstrualHomePageModel({
		homeView: {
			...homeView,
			predictionSummary: {
				predictedStartDate: '2026-03-31',
				predictionWindowStart: '2026-03-29',
				predictionWindowEnd: '2026-04-02',
				basedOnCycleCount: 2
			}
		},
		dayDetail: todayPredictionDetail,
		calendarWindow,
		today: '2026-03-29',
		focusDate: '2026-03-29',
		viewMode: 'three-week'
	});

	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-03-29' && cell.variant === 'selectedTodayDetail'),
		true
	);
	assert.equal(
		model.calendarCard.weeks.flatMap((week) => week.cells).some((cell) => cell.key === '2026-03-31' && cell.variant === 'futureMuted'),
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
	const { homeView } = createSeededHomeContracts();
	const dayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-03-28',
			isPeriod: true,
			painLevel: 3,
			flowLevel: 3,
			colorLevel: 3,
			note: null,
			source: 'auto_filled',
			isExplicit: true,
			isDetailRecorded: true
		}
	};
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-28'
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

test('home contract adapter optimistically marks a non-period day as period using the resolved action effect', () => {
	const { homeView } = createSeededHomeContracts();
	const dayDetail = createEmptyDayDetail({
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		date: '2026-03-23'
	});
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	const next = applySingleDayPeriodActionToPageModel(model, {
		resolvedAction: {
			action: 'mark-start',
			effect: {
				action: 'mark-start',
				writeDates: ['2026-03-23', '2026-03-24', '2026-03-25'],
				clearDates: []
			}
		}
	});

	const selectedCell = next.calendarCard.weeks.flatMap((week) => week.cells).find((cell) => cell.key === '2026-03-23');
	assert.equal(selectedCell.variant, 'selectedPeriod');
	assert.equal(next.selectedDatePanel.periodChipSelected, true);
	assert.equal(next.selectedDatePanel.periodChipText, '月经开始');
	assert.equal(next.selectedDatePanel.badge, '已记录');
});

test('home contract adapter optimistically truncates later period dates using the resolved action effect', () => {
	const homeView = {
		moduleInstanceId: 'seed-home-module',
		sharingStatus: 'private',
		currentStatusSummary: {
			currentStatus: 'in_period',
			currentSegment: { startDate: '2026-03-23', endDate: '2026-03-27', durationDays: 5 },
			statusCard: { label: '经期中' },
			previousSegment: null
		},
		predictionSummary: null,
		calendarMarks: [
			{ date: '2026-03-23', kind: 'period_start' },
			{ date: '2026-03-24', kind: 'period' },
			{ date: '2026-03-25', kind: 'period' },
			{ date: '2026-03-26', kind: 'period' },
			{ date: '2026-03-27', kind: 'period' }
		]
	};
	const dayDetail = {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		dayRecord: {
			date: '2026-03-25',
			isPeriod: true,
			painLevel: null,
			flowLevel: null,
			colorLevel: null,
			note: null,
			source: 'manual',
			isExplicit: true,
			isDetailRecorded: false
		}
	};
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	const next = applySingleDayPeriodActionToPageModel(model, {
		resolvedAction: {
			action: 'truncate-end',
			effect: {
				action: 'truncate-end',
				writeDates: ['2026-03-23', '2026-03-24', '2026-03-25'],
				clearDates: ['2026-03-26', '2026-03-27']
			}
		}
	});

	const byDate = Object.fromEntries(next.calendarCard.weeks.flatMap((week) => week.cells).map((cell) => [cell.key, cell.variant]));
	assert.equal(byDate['2026-03-25'], 'selectedPeriod');
	assert.equal(byDate['2026-03-26'], 'default');
	assert.equal(byDate['2026-03-27'], 'default');
	assert.equal(next.selectedDatePanel.periodChipSelected, true);
	assert.equal(next.selectedDatePanel.periodChipText, '月经结束');
});

test('home contract adapter applies batch draft to the visible calendar and selected day panel without touching hero', () => {
	const { homeView } = createSeededHomeContracts();
	const dayDetail = createEmptyDayDetail({
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		date: '2026-03-24'
	});
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});
	const originalHero = structuredClone(model.heroCard);

	const next = applyBatchPeriodDraftToPageModel(model, {
		selectedKeys: ['2026-03-23', '2026-03-24'],
		batchDraft: {
			isPeriod: true,
			flowLevel: null,
			painLevel: null,
			colorLevel: null
		},
		activeDate: '2026-03-24'
	});

	const byDate = Object.fromEntries(next.calendarCard.weeks.flatMap((week) => week.cells).map((cell) => [cell.key, cell.variant]));
	assert.equal(byDate['2026-03-23'], 'period');
	assert.equal(byDate['2026-03-24'], 'selectedPeriod');
	assert.equal(next.selectedDatePanel.periodChipSelected, true);
	assert.equal(next.selectedDatePanel.periodChipText, '月经结束');
	assert.deepEqual(next.heroCard, originalHero);
});

test('home contract adapter applies hero snapshot without mutating calendar or selected day panel state', () => {
	const { homeView } = createSeededHomeContracts();
	const dayDetail = createEmptyDayDetail({
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		date: '2026-03-24'
	});
	const model = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29',
		focusDate: '2026-03-24',
		viewMode: 'month'
	});

	const originalCalendar = structuredClone(model.calendarCard);
	const originalPanel = structuredClone(model.selectedDatePanel);
	const next = applyHeroSnapshotToPageModel(model, {
		homeView: {
			...homeView,
			sharingStatus: 'shared',
			currentStatusSummary: {
				currentStatus: 'in_period',
				anchorDate: '2026-03-29',
				currentSegment: {
					startDate: '2026-03-29',
					endDate: '2026-04-01',
					durationDays: 4
				},
				previousSegment: homeView.currentStatusSummary.previousSegment,
				statusCard: {
					label: '经期中'
				}
			},
			predictionSummary: {
				predictedStartDate: '2026-04-21',
				predictionWindowStart: '2026-04-19',
				predictionWindowEnd: '2026-04-23',
				basedOnCycleCount: 4
			}
		},
		today: '2026-03-29'
	});

	assert.equal(next.topBar.statusLabel, '共享');
	assert.equal(next.heroCard.statusFrame.state, 'in_period');
	assert.equal(next.heroCard.statusFrame.text, '经期中');
	assert.equal(next.heroCard.nextFrame.value, '04.21');
	assert.deepEqual(next.calendarCard, originalCalendar);
	assert.deepEqual(next.selectedDatePanel, originalPanel);
	assert.equal(next.selectedDateKey, model.selectedDateKey);
	assert.equal(next.headerNav.monthLabel, model.headerNav.monthLabel);
	assert.equal(next.viewModeControl.value, model.viewModeControl.value);
});
