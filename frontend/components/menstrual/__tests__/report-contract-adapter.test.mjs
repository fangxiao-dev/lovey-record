import test from 'node:test';
import assert from 'node:assert/strict';

import {
	createReportPageViewModel
} from '../report-contract-adapter.js';

test('report contract adapter formats summary, trend, and history from cycle records', () => {
	const viewModel = createReportPageViewModel({
		moduleSettings: {
			defaultPeriodDurationDays: 6,
			defaultPredictionTermDays: 31
		},
		accessState: {
			callerRole: 'partner'
		},
		records: [
			{ startDate: '2026-01-10', endDate: '2026-01-14', durationDays: 5 },
			{ startDate: '2026-02-08', endDate: '2026-02-11', durationDays: 4 },
			{ startDate: '2026-03-10', endDate: '2026-03-14', durationDays: 5 },
			{ startDate: '2026-04-12', endDate: '2026-04-17', durationDays: 6 }
		]
	});

	assert.deepEqual(viewModel.summary.rows, [
		{
			key: 'cycle',
			label: '周期',
			averageText: '30.7 天',
			fluctuationText: '波动 -1 ~ +2 天',
			displayText: '周期 30.7 天   波动 -1 ~ +2 天'
		},
		{
			key: 'duration',
			label: '时长',
			averageText: '5.0 天',
			fluctuationText: '波动 -1 ~ +1 天',
			displayText: '时长 5.0 天   波动 -1 ~ +1 天'
		}
	]);

	assert.deepEqual(viewModel.trend.cycle.points, [
		{ key: '2026-02-08', date: '2026-02-08', value: 29, label: '02/08' },
		{ key: '2026-03-10', date: '2026-03-10', value: 30, label: '03/10' },
		{ key: '2026-04-12', date: '2026-04-12', value: 33, label: '04/12' }
	]);
	assert.deepEqual(viewModel.trend.duration.points, [
		{ key: '2026-01-10', date: '2026-01-10', value: 5, label: '01/10' },
		{ key: '2026-02-08', date: '2026-02-08', value: 4, label: '02/08' },
		{ key: '2026-03-10', date: '2026-03-10', value: 5, label: '03/10' },
		{ key: '2026-04-12', date: '2026-04-12', value: 6, label: '04/12' }
	]);
	assert.equal(viewModel.trend.cycle.hasMinimumPoints, true);
	assert.equal(viewModel.trend.duration.hasMinimumPoints, true);
	assert.deepEqual(viewModel.summary.footer, {
		currentSettingsText: '当前周期 31 天 · 时长 6 天',
		portalMode: 'link',
		targetModuleInstanceId: null
	});

	assert.deepEqual(viewModel.history.rows, [
		{
			key: '2026-04-12',
			yearLabel: '2026',
			startLabel: '04.12',
			endLabel: '04.17',
			durationLabel: '6d',
			cycleLabel: '33d'
		},
		{
			key: '2026-03-10',
			yearLabel: '2026',
			startLabel: '03.10',
			endLabel: '03.14',
			durationLabel: '5d',
			cycleLabel: '30d'
		},
		{
			key: '2026-02-08',
			yearLabel: '2026',
			startLabel: '02.08',
			endLabel: '02.11',
			durationLabel: '4d',
			cycleLabel: '29d'
		},
		{
			key: '2026-01-10',
			yearLabel: '2026',
			startLabel: '01.10',
			endLabel: '01.14',
			durationLabel: '5d',
			cycleLabel: '-'
		}
	]);
});

test('report contract adapter keeps the trend card in empty-state mode until there are at least three valid points', () => {
	const viewModel = createReportPageViewModel({
		records: [
			{ startDate: '2026-03-10', endDate: '2026-03-14', durationDays: 5 },
			{ startDate: '2026-04-12', endDate: '2026-04-17', durationDays: 6 }
		]
	});

	assert.equal(viewModel.trend.cycle.hasMinimumPoints, false);
	assert.equal(viewModel.trend.duration.hasMinimumPoints, false);
	assert.equal(viewModel.trend.emptyStateCopy, '记录 3 次后开始有图');
});

test('report contract adapter uses placeholders instead of zeroes when cycle history is still unavailable', () => {
	const viewModel = createReportPageViewModel({
		records: [
			{ startDate: '2026-04-12', endDate: '2026-04-17', durationDays: 6 }
		]
	});

	assert.deepEqual(viewModel.summary.rows, [
		{
			key: 'cycle',
			label: '周期',
			averageText: '-',
			fluctuationText: '波动 -',
			displayText: '周期 -   波动 -'
		},
		{
			key: 'duration',
			label: '时长',
			averageText: '6.0 天',
			fluctuationText: '波动 -0 ~ +0 天',
			displayText: '时长 6.0 天   波动 -0 ~ +0 天'
		}
	]);
});

test('report contract adapter uses module settings in the footer and falls back safely when settings are missing', () => {
	const withViewerAccess = createReportPageViewModel({
		moduleInstanceId: 'mi_report',
		moduleSettings: {
			defaultPeriodDurationDays: 5,
			defaultPredictionTermDays: 28
		},
		accessState: {
			callerRole: 'viewer'
		},
		records: [
			{ startDate: '2026-04-12', endDate: '2026-04-17', durationDays: 6 }
		]
	});

	assert.deepEqual(withViewerAccess.summary.footer, {
		currentSettingsText: '当前周期 28 天 · 时长 5 天',
		portalMode: 'readonly-warning',
		targetModuleInstanceId: 'mi_report'
	});

	const withoutSettings = createReportPageViewModel({
		moduleInstanceId: 'mi_report'
	});

	assert.deepEqual(withoutSettings.summary.footer, {
		currentSettingsText: '当前周期 - · 时长 -',
		portalMode: 'link',
		targetModuleInstanceId: 'mi_report'
	});
});
