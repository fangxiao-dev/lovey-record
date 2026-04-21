import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVueOptions } from '../../../__tests__/helpers/load-vue-options.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

function normalize(value) {
	return JSON.parse(JSON.stringify(value));
}

function createCalendarCells() {
	return [
		{ key: '2026-03-16', isoDate: '2026-03-16', selectable: true, variant: 'default' },
		{ key: '2026-03-17', isoDate: '2026-03-17', selectable: true, variant: 'default' },
		{ key: '2026-03-18', isoDate: '2026-03-18', selectable: true, variant: 'default' },
		{ key: '2026-03-19', isoDate: '2026-03-19', selectable: true, variant: 'default' },
		{ key: '2026-03-30', isoDate: '2026-03-30', selectable: false, variant: 'futureMuted' }
	];
}

test('home batch selection keeps a continuous inclusive range from the anchor to the latest dragged day', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applyTogglePeriodToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});
	const ctx = {
		panelMode: 'single-day',
		batchStartKey: null,
		batchEndKey: null,
		batchHoveredKey: null,
		batchSelectedKeysState: [],
		createEmptyBatchDraft: home.methods.createEmptyBatchDraft,
		enterBatchMode: home.methods.enterBatchMode,
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
		rebuildLocalPage() {
			return this.page;
		},
		activeDate: '2026-03-25',
		allCalendarCells: [
			{ key: '2026-03-01', isoDate: '2026-03-01', selectable: true },
			{ key: '2026-03-02', isoDate: '2026-03-02', selectable: true },
			{ key: '2026-03-03', isoDate: '2026-03-03', selectable: true },
			{ key: '2026-03-04', isoDate: '2026-03-04', selectable: true },
			{ key: '2026-03-05', isoDate: '2026-03-05', selectable: true },
			{ key: '2026-03-06', isoDate: '2026-03-06', selectable: true },
			{ key: '2026-03-07', isoDate: '2026-03-07', selectable: true },
			{ key: '2026-03-08', isoDate: '2026-03-08', selectable: true },
			{ key: '2026-03-09', isoDate: '2026-03-09', selectable: true }
		]
	};

	home.methods.handleBatchStart.call(ctx, { key: '2026-03-01', isoDate: '2026-03-01' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-05', isoDate: '2026-03-05' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-09', isoDate: '2026-03-09' });

	const selectedBatchKeys = home.computed.selectedBatchKeys.call(ctx);

	assert.deepEqual(selectedBatchKeys, [
		'2026-03-01',
		'2026-03-02',
		'2026-03-03',
		'2026-03-04',
		'2026-03-05',
		'2026-03-06',
		'2026-03-07',
		'2026-03-08',
		'2026-03-09'
	]);
	assert.equal(selectedBatchKeys.includes('2026-03-06'), true);
	assert.equal(selectedBatchKeys.includes('2026-03-08'), true);
});

test('home forwards page scroll invalidation to CalendarGrid so stale rect caches are not reused after layout shifts', () => {
	const source = fs.readFileSync(path.resolve(repoRoot, 'frontend/pages/menstrual/home.vue'), 'utf8');

	assert.match(source, /ref="calendarGrid"/);
	assert.match(source, /onPageScroll\(\)\s*\{/);
	assert.match(source, /this\.clearCalendarInlineHint\(\)/);
	assert.match(source, /this\.\$refs\.calendarGrid\?\.invalidateCellRects\?\.\(\)/);
});

test('home template wires blocked future taps into a page-level inline hint layer', () => {
	const source = fs.readFileSync(path.resolve(repoRoot, 'frontend/pages/menstrual/home.vue'), 'utf8');

	assert.match(source, /@blocked-future-tap="handleBlockedFutureTap"/);
	assert.match(source, /menstrual-home__calendar-inline-hint/);
	assert.match(source, /position:\s*fixed/);
});

test('home toggles the page-level calendar inline hint for the same blocked future cell key', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	const payload = {
		cell: { key: '2026-04-07', isoDate: '2026-04-07' },
		message: '暂无法操控未来 :)',
		anchorRect: { left: 120, right: 170, top: 240, bottom: 290 }
	};
	const ctx = {
		calendarInlineHintKey: '',
		calendarInlineHintMessage: '',
		calendarInlineHintAnchorRect: null,
		calendarInlineHintTimer: null,
		clearCalendarInlineHint: home.methods.clearCalendarInlineHint
	};

	home.methods.showCalendarInlineHint.call(ctx, payload);
	assert.equal(ctx.calendarInlineHintKey, '2026-04-07');
	assert.equal(ctx.calendarInlineHintMessage, '暂无法操控未来 :)');
	assert.deepEqual(normalize(ctx.calendarInlineHintAnchorRect), payload.anchorRect);

	home.methods.showCalendarInlineHint.call(ctx, payload);
	assert.equal(ctx.calendarInlineHintKey, '');
	assert.equal(ctx.calendarInlineHintMessage, '');
	assert.equal(ctx.calendarInlineHintAnchorRect, null);
});

test('home handleCellTap clears any visible calendar inline hint before selecting a normal day', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	let cleared = 0;
	const cell = {
		key: '2026-03-29',
		isoDate: '2026-03-29',
		selectable: true
	};
	const ctx = {
		panelMode: 'single-day',
		isBrowseBusy: false,
		focusDate: '2026-03-29',
		viewMode: 'three-week',
		activeDate: '2026-03-28',
		selectedDateKey: null,
		getSelectedDayDetail() {
			return { dayRecord: { date: cell.isoDate } };
		},
		clearCalendarInlineHint() {
			cleared += 1;
		},
		applyLocalBrowseState(args) {
			this.lastBrowseState = args;
		},
		refreshSelectedDayDetail() {
			return Promise.resolve();
		}
	};

	home.methods.handleCellTap.call(ctx, cell);

	assert.equal(cleared, 1);
	assert.equal(ctx.selectedDateKey, cell.isoDate);
	assert.equal(ctx.lastBrowseState.selectedDate, cell.isoDate);
});

test('home batch selection updates the active single-day context to the latest dragged date', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applyTogglePeriodToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	const ctx = {
		panelMode: 'single-day',
		batchStartKey: null,
		batchEndKey: null,
		batchHoveredKey: null,
		batchSelectedKeysState: [],
		createEmptyBatchDraft: home.methods.createEmptyBatchDraft,
		enterBatchMode: home.methods.enterBatchMode,
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
		rebuildLocalPage() {
			return this.page;
		},
		activeDate: '2026-03-25',
		allCalendarCells: [
			{ key: '2026-03-23', isoDate: '2026-03-23', selectable: true },
			{ key: '2026-03-24', isoDate: '2026-03-24', selectable: true }
		]
	};

	home.methods.handleBatchStart.call(ctx, { key: '2026-03-23', isoDate: '2026-03-23' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-24', isoDate: '2026-03-24' });

	assert.equal(ctx.panelMode, 'batch');
	assert.equal(ctx.batchStartKey, '2026-03-23');
	assert.equal(ctx.batchEndKey, '2026-03-24');
	assert.equal(ctx.activeDate, '2026-03-24');
	assert.notEqual(ctx.activeDate, '2026-03-25');
});

test('home batch selection recomputes the full range even when drag jumps across rows', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applyTogglePeriodToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		rebuildLocalPage() {
			return this.page;
		},
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	const ctx = {
		panelMode: 'single-day',
		batchStartKey: null,
		batchEndKey: null,
		batchHoveredKey: null,
		batchSelectedKeysState: [],
		createEmptyBatchDraft: home.methods.createEmptyBatchDraft,
		enterBatchMode: home.methods.enterBatchMode,
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
		rebuildLocalPage() {
			return this.page;
		},
		activeDate: '2026-03-01',
		allCalendarCells: [
			{ key: '2026-03-01', isoDate: '2026-03-01', selectable: true },
			{ key: '2026-03-02', isoDate: '2026-03-02', selectable: true },
			{ key: '2026-03-03', isoDate: '2026-03-03', selectable: true },
			{ key: '2026-03-04', isoDate: '2026-03-04', selectable: true },
			{ key: '2026-03-05', isoDate: '2026-03-05', selectable: true },
			{ key: '2026-03-06', isoDate: '2026-03-06', selectable: true },
			{ key: '2026-03-07', isoDate: '2026-03-07', selectable: true },
			{ key: '2026-03-08', isoDate: '2026-03-08', selectable: true },
			{ key: '2026-03-09', isoDate: '2026-03-09', selectable: true },
			{ key: '2026-03-10', isoDate: '2026-03-10', selectable: true }
		]
	};

	home.methods.handleBatchStart.call(ctx, { key: '2026-03-01', isoDate: '2026-03-01' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-05', isoDate: '2026-03-05' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-09', isoDate: '2026-03-09' });

	assert.deepEqual(home.computed.selectedBatchKeys.call(ctx), [
		'2026-03-01',
		'2026-03-02',
		'2026-03-03',
		'2026-03-04',
		'2026-03-05',
		'2026-03-06',
		'2026-03-07',
		'2026-03-08',
		'2026-03-09'
	]);
	assert.equal(ctx.batchEndKey, '2026-03-09');
});

test('home template shows a batch toggle button when not already in batch mode', () => {
	const source = fs.readFileSync(path.resolve(repoRoot, 'frontend/pages/menstrual/home.vue'), 'utf8');

	assert.match(source, /panelMode !== 'batch'/);
	assert.match(source, /批量选择/);
});

test('home enterBatchMode activates an empty batch state without changing the active date', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		rebuildLocalPage() {
			return this.page;
		},
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	const ctx = {
		panelMode: 'single-day',
		activeDate: '2026-03-25',
		batchStartKey: '2026-03-20',
		batchEndKey: '2026-03-21',
		batchHoveredKey: '2026-03-21',
		batchSelectedKeysState: ['2026-03-20', '2026-03-21'],
		batchDraft: {
			isPeriod: false,
			flowLevel: 2,
			painLevel: 4,
			colorLevel: 5
		},
		createEmptyBatchDraft: home.methods.createEmptyBatchDraft,
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
		rebuildLocalPage() {
			return this.page;
		}
	};

	home.methods.enterBatchMode.call(ctx);

	assert.equal(ctx.panelMode, 'batch');
	assert.equal(ctx.activeDate, '2026-03-25');
	assert.equal(ctx.batchStartKey, null);
	assert.equal(ctx.batchEndKey, null);
	assert.equal(ctx.batchHoveredKey, null);
	assert.deepEqual(normalize(ctx.batchSelectedKeysState), []);
	assert.deepEqual(normalize(ctx.batchDraft), {
		isPeriod: true,
		flowLevel: null,
		painLevel: null,
		colorLevel: null
	});
});

test('home handleCellTap starts batch selection from the tapped day when batch mode is empty', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		rebuildLocalPage() {
			return this.page;
		},
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	const ctx = {
		panelMode: 'batch',
		activeDate: '2026-03-25',
		batchStartKey: null,
		batchEndKey: null,
		batchHoveredKey: null,
		batchSelectedKeysState: [],
		allCalendarCells: [
			{ key: '2026-03-23', isoDate: '2026-03-23', selectable: true },
			{ key: '2026-03-24', isoDate: '2026-03-24', selectable: true }
		],
		isBrowseBusy: false,
		createEmptyBatchDraft: home.methods.createEmptyBatchDraft,
		enterBatchMode: home.methods.enterBatchMode,
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
		rebuildLocalPage() {
			return this.page;
		},
		refreshSelectedDayDetail() {
			throw new Error('single-day refresh should not run while starting empty batch selection');
		},
		applyLocalBrowseState() {
			throw new Error('single-day browse state should not run while starting empty batch selection');
		}
	};

	home.methods.handleCellTap.call(ctx, {
		key: '2026-03-23',
		isoDate: '2026-03-23',
		selectable: true
	});

	assert.equal(ctx.panelMode, 'batch');
	assert.equal(ctx.activeDate, '2026-03-23');
	assert.equal(ctx.batchStartKey, '2026-03-23');
	assert.equal(ctx.batchEndKey, '2026-03-23');
	assert.equal(ctx.batchHoveredKey, '2026-03-23');
	assert.deepEqual(home.computed.selectedBatchKeys.call(ctx), ['2026-03-23']);
});

test('home handleCellTap ignores future-muted dates while batch mode is empty', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({})
	});

	const ctx = {
		panelMode: 'batch',
		activeDate: '2026-03-25',
		batchStartKey: null,
		batchEndKey: null,
		batchHoveredKey: null,
		batchSelectedKeysState: [],
		allCalendarCells: [{ key: '2026-03-30', isoDate: '2026-03-30', selectable: false }],
		isBrowseBusy: false,
		enterBatchMode: home.methods.enterBatchMode,
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
		rebuildLocalPage() {
			return this.page;
		}
	};

	home.methods.handleCellTap.call(ctx, {
		key: '2026-03-30',
		isoDate: '2026-03-30',
		selectable: false
	});

	assert.equal(ctx.activeDate, '2026-03-25');
	assert.equal(ctx.batchStartKey, null);
	assert.deepEqual(home.computed.selectedBatchKeys.call(ctx), []);
});

test('home applyBatchAction exits batch mode and keeps the latest dragged day as the selected single-day date', async () => {
	const persistCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applyBatchPeriodDraftToPageModel: (page) => ({ ...page, id: 'optimistic-batch-page' }),
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applyTogglePeriodToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		persistBatchPeriodRange: async (payload) => {
			persistCalls.push(payload);
		},
		persistSelectedDateNote: async () => {},
		persistSelectedDateDetails: async () => {},
		persistSelectedDatePeriodState: async () => {}
	});

	const ctx = {
		page: { id: 'previous-page' },
		selectedBatchKeys: ['2026-03-16', '2026-03-18'],
		allCalendarCells: [
			{ key: '2026-03-16', isoDate: '2026-03-16', selectable: true },
			{ key: '2026-03-17', isoDate: '2026-03-17', selectable: true },
			{ key: '2026-03-18', isoDate: '2026-03-18', selectable: true }
		],
		contractContext: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		batchDraft: {
			isPeriod: true,
			flowLevel: null,
			painLevel: null,
			colorLevel: null
		},
		batchAction: 'clear-record',
		activeDate: '2026-03-18',
		panelMode: 'batch',
		batchStartKey: '2026-03-16',
		batchEndKey: '2026-03-18',
		batchHoveredKey: '2026-03-18',
		batchSelectedKeysState: ['2026-03-16', '2026-03-18'],
		buildBatchRanges: home.methods.buildBatchRanges,
		runOptimisticBatchMutation(nextPage, command) {
			this.page = nextPage;
			this.panelMode = 'single-day';
			this.batchStartKey = null;
			this.batchEndKey = null;
			this.batchHoveredKey = null;
			this.batchSelectedKeysState = [];
			return command();
		},
		cancelBatchMode: home.methods.cancelBatchMode
	};

	await home.methods.applyBatchAction.call(ctx);

	assert.equal(ctx.panelMode, 'single-day');
	assert.equal(ctx.activeDate, '2026-03-18');
	assert.equal(ctx.page.id, 'optimistic-batch-page');
	assert.equal(ctx.batchStartKey, null);
	assert.equal(ctx.batchEndKey, null);
	assert.equal(ctx.batchAction, 'clear-record');
	assert.equal(persistCalls.length, 2);
	assert.equal(persistCalls[0].action, 'set-period');
	assert.equal(persistCalls[0].startDate, '2026-03-16');
	assert.equal(persistCalls[0].endDate, '2026-03-16');
	assert.equal(persistCalls[0].context.moduleInstanceId, 'seed-module');
	assert.equal(persistCalls[1].startDate, '2026-03-18');
	assert.equal(persistCalls[1].endDate, '2026-03-18');
});

test('home applyBatchAction keeps the latest batch-hovered day instead of the previously tapped single-day date', async () => {
	const persistCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applyBatchPeriodDraftToPageModel: (page) => page,
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applyTogglePeriodToPageModel: () => {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		persistBatchPeriodRange: async (payload) => {
			persistCalls.push(payload);
		}
	});

	const ctx = {
		selectedBatchKeys: ['2026-03-23', '2026-03-24'],
		allCalendarCells: [
			{ key: '2026-03-23', isoDate: '2026-03-23', selectable: true },
			{ key: '2026-03-24', isoDate: '2026-03-24', selectable: true },
			{ key: '2026-03-25', isoDate: '2026-03-25', selectable: true }
		],
		contractContext: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		batchDraft: {
			isPeriod: true,
			flowLevel: null,
			painLevel: null,
			colorLevel: null
		},
		activeDate: '2026-03-24',
		panelMode: 'batch',
		batchStartKey: '2026-03-23',
		batchEndKey: '2026-03-24',
		batchHoveredKey: '2026-03-24',
		batchSelectedKeysState: ['2026-03-23', '2026-03-24'],
		buildBatchRanges: home.methods.buildBatchRanges,
		runOptimisticBatchMutation(nextPage, command) {
			this.page = nextPage;
			this.panelMode = 'single-day';
			this.batchStartKey = null;
			this.batchEndKey = null;
			this.batchHoveredKey = null;
			this.batchSelectedKeysState = [];
			return command();
		},
		cancelBatchMode: home.methods.cancelBatchMode
	};

	await home.methods.applyBatchAction.call(ctx);

	assert.equal(ctx.activeDate, '2026-03-24');
	assert.equal(ctx.panelMode, 'single-day');
	assert.equal(persistCalls.length, 1);
	assert.equal(persistCalls[0].startDate, '2026-03-23');
	assert.equal(persistCalls[0].endDate, '2026-03-24');
});

test('home runOptimisticMutation invalidates browse cache before refreshing affected scopes', async () => {
	const calls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		invalidateMenstrualBrowseCacheByScopes(payload) {
			calls.push(['invalidate', payload]);
		}
	});

	const ctx = {
		page: { id: 'current-page' },
		loadError: '',
		isMutating: false,
		contractContext: {
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		activeDate: '2026-03-24',
		focusDate: '2026-03-24',
		viewMode: 'month',
		invalidateBrowseCache: home.methods.invalidateBrowseCache,
		async refreshByScopes(scopes) {
			calls.push(['refresh', scopes]);
		}
	};

	await home.methods.runOptimisticMutation.call(ctx, { id: 'optimistic-page' }, async () => ({
		affectedScopes: ['calendar', 'prediction']
	}));

	assert.deepEqual(normalize(calls), [
		['invalidate', {
			affectedScopes: ['calendar', 'prediction'],
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile',
			activeDate: '2026-03-24',
			focusDate: '2026-03-24',
			viewMode: 'month'
		}],
		['refresh', ['calendar', 'prediction']]
	]);
});

test('home runCommand invalidates browse cache before refreshing affected scopes', async () => {
	const calls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		invalidateMenstrualBrowseCacheByScopes(payload) {
			calls.push(['invalidate', payload]);
		}
	});

	const ctx = {
		loadError: '',
		isMutating: false,
		contractContext: {
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		activeDate: '2026-03-25',
		focusDate: '2026-03-24',
		viewMode: 'three-week',
		invalidateBrowseCache: home.methods.invalidateBrowseCache,
		async refreshByScopes(scopes) {
			calls.push(['refresh', scopes]);
		}
	};

	await home.methods.runCommand.call(ctx, async () => ({
		affectedScopes: ['dayDetail']
	}));

	assert.deepEqual(normalize(calls), [
		['invalidate', {
			affectedScopes: ['dayDetail'],
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile',
			activeDate: '2026-03-25',
			focusDate: '2026-03-24',
			viewMode: 'three-week'
		}],
		['refresh', ['dayDetail']]
	]);
});

test('home runOptimisticBatchMutation invalidates browse cache before refreshing affected scopes', async () => {
	const calls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		invalidateMenstrualBrowseCacheByScopes(payload) {
			calls.push(['invalidate', payload]);
		}
	});

	const ctx = {
		page: { id: 'previous-page' },
		panelMode: 'batch',
		batchStartKey: '2026-03-23',
		batchEndKey: '2026-03-24',
		batchHoveredKey: '2026-03-24',
		batchSelectedKeysState: ['2026-03-23', '2026-03-24'],
		activeDate: '2026-03-24',
		loadError: '',
		isMutating: false,
		contractContext: {
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		focusDate: '2026-03-24',
		viewMode: 'month',
		invalidateBrowseCache: home.methods.invalidateBrowseCache,
		async refreshByScopes(scopes) {
			calls.push(['refresh', scopes]);
		}
	};

	await home.methods.runOptimisticBatchMutation.call(ctx, { id: 'optimistic-batch-page' }, async () => ({
		affectedScopes: ['calendar', 'dayDetail', 'prediction']
	}));

	assert.deepEqual(normalize(calls), [
		['invalidate', {
			affectedScopes: ['calendar', 'dayDetail', 'prediction'],
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile',
			activeDate: '2026-03-24',
			focusDate: '2026-03-24',
			viewMode: 'month'
		}],
		['refresh', ['calendar', 'dayDetail', 'prediction']]
	]);
});

test('home applyBatchAction exits batch mode even while optimistic batch mutation keeps the page in mutating state', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applyBatchPeriodDraftToPageModel: (page) => ({ ...page, id: 'optimistic-batch-page' }),
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: () => ({}),
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		persistBatchPeriodRange: async () => {}
	});

	const ctx = {
		page: { id: 'previous-page' },
		selectedBatchKeys: ['2026-03-23', '2026-03-24'],
		allCalendarCells: [
			{ key: '2026-03-23', isoDate: '2026-03-23', selectable: true },
			{ key: '2026-03-24', isoDate: '2026-03-24', selectable: true }
		],
		contractContext: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		batchDraft: {
			isPeriod: true,
			flowLevel: null,
			painLevel: null,
			colorLevel: null
		},
		activeDate: '2026-03-24',
		panelMode: 'batch',
		batchStartKey: '2026-03-23',
		batchEndKey: '2026-03-24',
		batchHoveredKey: '2026-03-24',
		batchSelectedKeysState: ['2026-03-23', '2026-03-24'],
		buildBatchRanges: home.methods.buildBatchRanges,
		cancelBatchMode: home.methods.cancelBatchMode,
		isMutating: false,
		runOptimisticBatchMutation: async function(nextPage, command) {
			this.page = nextPage;
			this.panelMode = 'single-day';
			this.batchStartKey = null;
			this.batchEndKey = null;
			this.batchHoveredKey = null;
			this.batchSelectedKeysState = [];
			this.isMutating = true;
			try {
				await command();
			} finally {
				this.isMutating = false;
			}
		}
	};

	await home.methods.applyBatchAction.call(ctx);

	assert.equal(ctx.panelMode, 'single-day');
	assert.equal(ctx.page.id, 'optimistic-batch-page');
	assert.equal(ctx.batchStartKey, null);
	assert.equal(ctx.batchEndKey, null);
});

test('home handleTogglePeriod uses optimistic mutation immediately when no confirmation is required', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applyBatchPeriodDraftToPageModel: () => ({}),
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: (pageModel) => ({ ...pageModel, id: 'optimistic-period-page' }),
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async () => ({ affectedScopes: ['calendar', 'dayDetail', 'prediction'] })
	});

	const calls = [];
	const ctx = {
		page: { id: 'previous-page' },
		contractContext: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		activeDate: '2026-03-23',
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'mark-start',
					prompt: null,
					effect: {
						action: 'mark-start',
						writeDates: ['2026-03-23'],
						clearDates: []
					}
				}
			}
		},
		runOptimisticMutation(nextPage, command) {
			calls.push({ type: 'optimistic', nextPage });
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.equal(calls.length, 1);
	assert.equal(calls[0].nextPage.id, 'optimistic-period-page');
});

test('home handleTogglePeriod waits for confirmation before optimistic commit when prompt is required', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applyBatchPeriodDraftToPageModel: () => ({}),
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: (pageModel) => ({ ...pageModel, id: 'optimistic-period-page' }),
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async () => ({ affectedScopes: ['calendar', 'dayDetail', 'prediction'] }),
		uni: {
			showModal({ success }) {
				success({ confirm: false });
			}
		}
	});

	const calls = [];
	const ctx = {
		page: { id: 'previous-page' },
		contractContext: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		activeDate: '2026-03-23',
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'bridge',
					prompt: {
						required: true,
						message: 'confirm'
					},
					effect: {
						action: 'bridge',
						writeDates: ['2026-03-23'],
						clearDates: []
					}
				}
			}
		},
		runOptimisticMutation(nextPage, command) {
			calls.push({ type: 'optimistic', nextPage });
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.equal(calls.length, 0);
});

test('home refreshByScopes reconciles calendar and day detail before scheduling deferred hero refresh', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		resolveRefreshPlan: () => ({
			immediate: 'calendar+dayDetail',
			deferredHero: true
		})
	});

	const order = [];
	const ctx = {
		activeDate: '2026-03-23',
		focusDate: '2026-03-23',
		viewMode: 'three-week',
		async refreshCalendarWindow() {
			order.push('calendar');
		},
		async refreshSelectedDayDetail() {
			order.push('dayDetail');
		},
		scheduleDeferredHeroRefresh() {
			order.push('hero');
		}
	};

	await home.methods.refreshByScopes.call(ctx, ['calendar', 'dayDetail', 'prediction']);

	assert.deepEqual(order, ['calendar', 'dayDetail', 'hero']);
});

test('home scheduleDeferredHeroRefresh reports failure without rolling back page state', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		resolveRefreshPlan: () => ({
			immediate: 'skip',
			deferredHero: true
		})
	});

	const ctx = {
		page: { id: 'optimistic-page' },
		loadError: '',
		activeDate: '2026-03-23',
		focusDate: '2026-03-23',
		viewMode: 'three-week',
		heroRefreshRequestId: 0,
		refreshHeroSnapshot: async () => {
			throw new Error('hero query failed');
		}
	};

	home.methods.scheduleDeferredHeroRefresh.call(ctx, ['prediction']);
	await new Promise((resolve) => setTimeout(resolve, 0));

	assert.equal(ctx.page.id, 'optimistic-page');
	assert.match(ctx.loadError, /^写入成功，但主页摘要刷新失败/);
});

test('home refreshHeroSnapshot ignores stale hero responses and applies only the latest snapshot', async () => {
	let resolveFirst;
	let resolveSecond;
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		loadMenstrualHomeView: ({ activeDate }) => new Promise((resolve) => {
			if (activeDate === '2026-03-23') {
				resolveFirst = () => resolve({ sharingStatus: 'private', currentStatusSummary: { statusCard: { label: '旧' } } });
				return;
			}
			resolveSecond = () => resolve({ sharingStatus: 'shared', currentStatusSummary: { statusCard: { label: '新' } } });
		}),
		loadMenstrualModuleSettings: async () => ({}),
		applyHeroSnapshotToPageModel: (page, { homeView }) => ({
			...page,
			heroCard: {
				...page.heroCard,
				statusFrame: {
					...page.heroCard.statusFrame,
					text: homeView.currentStatusSummary.statusCard.label
				}
			}
		})
	});

	const ctx = {
		page: {
			heroCard: {
				statusFrame: { text: '初始' }
			}
		},
		rawContracts: {
			homeView: { sharingStatus: 'private' }
		},
		contractContext: {
			today: '2026-03-29'
		},
		heroRefreshRequestId: 0,
		isRefreshingHero: false
	};

	const first = home.methods.refreshHeroSnapshot.call(ctx, {
		activeDate: '2026-03-23',
		backgroundRequestId: 1
	});
	ctx.heroRefreshRequestId = 2;
	const second = home.methods.refreshHeroSnapshot.call(ctx, {
		activeDate: '2026-03-24',
		backgroundRequestId: 2
	});

	resolveFirst();
	resolveSecond();
	await Promise.all([first, second]);

	assert.equal(ctx.page.heroCard.statusFrame.text, '新');
	assert.equal(ctx.rawContracts.homeView.sharingStatus, 'shared');
});

test('calendar grid does not extend batch selection into a future-muted cell', () => {
	const CalendarGrid = loadVueOptions('frontend/components/menstrual/CalendarGrid.vue', {
		DateCell: {},
		uni: {
			createSelectorQuery() {
				return {
					in() {
						return this;
					},
					selectAll() {
						return this;
					},
					boundingClientRect() {
						return this;
					},
					exec() {}
				};
			}
		}
	});

	const emitted = [];
	const ctx = {
		longPressTimer: null,
		batchMode: true,
		touchStartX: 0,
		touchStartY: 0,
		cellRects: [
			{ left: 0, right: 100, top: 0, bottom: 100 },
			{ left: 100, right: 200, top: 0, bottom: 100 }
		],
		allCells: [
			{ key: '2026-03-18', selectable: true },
			{ key: '2026-03-30', selectable: false }
		],
		hitTestCell: CalendarGrid.methods.hitTestCell,
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 150, 50, {
		preventDefault() {}
	});

	assert.deepEqual(emitted, []);
});

test('calendar grid extends batch selection when drag stays on a selectable past cell', () => {
	const CalendarGrid = loadVueOptions('frontend/components/menstrual/CalendarGrid.vue', {
		DateCell: {},
		uni: {
			createSelectorQuery() {
				return {
					in() {
						return this;
					},
					selectAll() {
						return this;
					},
					boundingClientRect() {
						return this;
					},
					exec() {}
				};
			}
		}
	});

	const emitted = [];
	const ctx = {
		longPressTimer: null,
		batchMode: true,
		touchStartX: 0,
		touchStartY: 0,
		cellRects: [
			{ left: 0, right: 100, top: 0, bottom: 100 },
			{ left: 100, right: 200, top: 0, bottom: 100 }
		],
		allCells: [
			{ key: '2026-03-18', selectable: true },
			{ key: '2026-03-19', selectable: true }
		],
		hitTestCell: CalendarGrid.methods.hitTestCell,
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 150, 50, {
		preventDefault() {}
	});

	assert.deepEqual(emitted, [['batch-extend', { key: '2026-03-19', selectable: true }]]);
});

test('calendar grid previews selected batch cells as period before save when batchDraft marks them as period', () => {
	const CalendarGrid = loadVueOptions('frontend/components/menstrual/CalendarGrid.vue', {
		DateCell: {}
	});

	const ctx = {
		selectedKeys: ['2026-03-23', '2026-03-24', '2026-03-25'],
		previewPeriodMarked: true
	};

	assert.equal(
		CalendarGrid.methods.effectiveVariant.call(ctx, { key: '2026-03-23', variant: 'default' }),
		'selectedPeriod'
	);
	assert.equal(
		CalendarGrid.methods.effectiveVariant.call(ctx, { key: '2026-03-24', variant: 'todayDetail' }),
		'selectedTodayPeriodDetail'
	);
	assert.equal(
		CalendarGrid.methods.effectiveVariant.call(ctx, { key: '2026-03-25', variant: 'predictionDetail' }),
		'selectedPeriodDetail'
	);
});

test('calendar grid previews selected batch cells as non-period before save when batchDraft clears period', () => {
	const CalendarGrid = loadVueOptions('frontend/components/menstrual/CalendarGrid.vue', {
		DateCell: {}
	});

	const ctx = {
		selectedKeys: ['2026-03-23', '2026-03-24', '2026-03-25'],
		previewPeriodMarked: false
	};

	assert.equal(
		CalendarGrid.methods.effectiveVariant.call(ctx, { key: '2026-03-23', variant: 'period' }),
		'selected'
	);
	assert.equal(
		CalendarGrid.methods.effectiveVariant.call(ctx, { key: '2026-03-24', variant: 'periodDetail' }),
		'selectedDetail'
	);
	assert.equal(
		CalendarGrid.methods.effectiveVariant.call(ctx, { key: '2026-03-25', variant: 'todayPeriodDetail' }),
		'selectedTodayDetail'
	);
});

test('home single-day period tap routes directly to applySingleDayPeriodAction when no confirmation is required', async () => {
	const applyCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: (pageModel) => ({
			...pageModel,
			id: 'optimistic-single-day-page'
		}),
		applyTogglePeriodToPageModel: () => {
			throw new Error('legacy toggle helper should not be used for single-day smart period editing');
		},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async (payload) => {
			applyCalls.push(payload);
		},
		uni: {
			showModal() {
				throw new Error('showModal should not run when confirmation is not required');
			}
		}
	});

	const ctx = {
		panelMode: 'single-day',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-29',
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'end-here',
					prompt: null,
					effect: {
						action: 'end-here',
						writeDates: ['2026-03-29'],
						clearDates: []
					}
				}
			}
		},
		runOptimisticMutation(nextPage, command) {
			assert.equal(nextPage.id, 'optimistic-single-day-page');
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.deepEqual(normalize(applyCalls), [{
		context: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-29',
		action: 'end-here'
	}]);
});

test('home single-day bridge cancel shows confirmation and does not mutate', async () => {
	const applyCalls = [];
	let modalConfig = null;
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: () => ({
			id: 'optimistic-single-day-page'
		}),
		applyTogglePeriodToPageModel: () => {
			throw new Error('legacy toggle helper should not be used for single-day smart period editing');
		},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async (payload) => {
			applyCalls.push(payload);
		},
		uni: {
			showModal(options) {
				modalConfig = options;
				options.success({ confirm: false, cancel: true });
			}
		}
	});

	const ctx = {
		panelMode: 'single-day',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-22',
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'start',
					prompt: {
						required: true,
						type: 'backward',
						message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
						confirmLabel: '确认',
						cancelLabel: '取消'
					},
					effect: {
						action: 'start',
						writeDates: ['2026-03-22'],
						clearDates: []
					}
				}
			}
		},
		runOptimisticMutation(command) {
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, false);

	assert.equal(modalConfig.title, '提示');
	assert.equal(modalConfig.content, '已在 03/24 标记了经期开始，要提前到 03/22 吗？');
	assert.equal(modalConfig.confirmText, '确认');
	assert.equal(modalConfig.cancelText, '取消');
	assert.deepEqual(applyCalls, []);
});

test('home single-day bridge confirm calls applySingleDayPeriodAction with confirmed true', async () => {
	const applyCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: () => ({
			id: 'optimistic-single-day-page'
		}),
		applyTogglePeriodToPageModel: () => {
			throw new Error('legacy toggle helper should not be used for single-day smart period editing');
		},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async (payload) => {
			applyCalls.push(payload);
		},
		uni: {
			showModal(options) {
				options.success({ confirm: true, cancel: false });
			}
		}
	});

	const ctx = {
		panelMode: 'single-day',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-22',
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'start',
					prompt: {
						required: true,
						type: 'backward',
						message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
						confirmLabel: '确认',
						cancelLabel: '取消'
					},
					effect: {
						action: 'start',
						writeDates: ['2026-03-22'],
						clearDates: []
					}
				}
			}
		},
		runOptimisticMutation(nextPage, command) {
			assert.equal(nextPage.id, 'optimistic-single-day-page');
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, false);

	assert.deepEqual(normalize(applyCalls), [{
		context: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-22',
		action: 'start',
		confirmed: true
	}]);
});

test('home captures a pending undo action after a supported non-period single-day success', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: () => ({
			id: 'optimistic-single-day-page'
		}),
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async () => ({ affectedScopes: ['calendar', 'dayDetail', 'prediction'] })
	});

	const ctx = {
		panelMode: 'single-day',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-22',
		pendingUndoAction: null,
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'start',
					prompt: null,
					effect: {
						action: 'start',
						writeDates: ['2026-03-22'],
						clearDates: []
					}
				}
			}
		},
		resolvePendingUndoCommand: home.methods.resolvePendingUndoCommand,
		isSupportedSinglePeriodUndoAction: home.methods.isSupportedSinglePeriodUndoAction,
		createPendingUndoAction: home.methods.createPendingUndoAction,
		showPendingUndoAction: home.methods.showPendingUndoAction,
		scheduleUndoExpiry() {},
		clearPendingUndoAction() {
			this.pendingUndoAction = null;
		},
		runOptimisticMutation(nextPage, command) {
			assert.equal(nextPage.id, 'optimistic-single-day-page');
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.equal(ctx.pendingUndoAction.undoAction.action, 'revoke-start');
	assert.equal(ctx.pendingUndoAction.visible, true);
});

test('home maps a forward-bridge single-day success to an end-here undo command at the previous segment end', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: () => ({
			id: 'optimistic-single-day-page'
		}),
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-04-20',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async () => ({ affectedScopes: ['calendar', 'dayDetail', 'prediction'] }),
		uni: {
			showModal(options) {
				options.success({ confirm: true, cancel: false });
			}
		}
	});

	const ctx = {
		panelMode: 'single-day',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-04-20',
		pendingUndoAction: null,
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'start',
					bridgeType: 'forward',
					prompt: {
						required: true,
						type: 'forward',
						message: '把这段经期延长到 04/20？',
						confirmLabel: '确认',
						cancelLabel: '取消'
					},
					effect: {
						action: 'bridge-forward',
						bridgeType: 'forward',
						selectedDate: '2026-04-20',
						writeDates: ['2026-04-18', '2026-04-19', '2026-04-20'],
						clearDates: [],
						resultingSegment: {
							startDate: '2026-04-13',
							endDate: '2026-04-20'
						}
					}
				}
		}
		},
		resolvePendingUndoCommand: home.methods.resolvePendingUndoCommand,
		isSupportedSinglePeriodUndoAction: home.methods.isSupportedSinglePeriodUndoAction,
		createPendingUndoAction: home.methods.createPendingUndoAction,
		showPendingUndoAction: home.methods.showPendingUndoAction,
		scheduleUndoExpiry() {},
		clearPendingUndoAction() {
			this.pendingUndoAction = null;
		},
		runOptimisticMutation(nextPage, command) {
			assert.equal(nextPage.id, 'optimistic-single-day-page');
			return command();
		},
		uni: {
			showModal(options) {
				options.success({ confirm: true, cancel: false });
			}
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.equal(ctx.pendingUndoAction.undoAction.action, 'end-here');
	assert.equal(ctx.pendingUndoAction.undoAction.activeDate, '2026-04-17');
	assert.equal(ctx.pendingUndoAction.visible, true);
});

test('home does not capture undo for unsupported single-day outcomes', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		applyClearAttributesToPageModel: () => {},
		applySelectedDateNoteToPageModel: () => {},
		applyToggleAttributeOptionToPageModel: () => {},
		applySingleDayPeriodActionToPageModel: () => ({
			id: 'optimistic-single-day-page'
		}),
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		loadMenstrualHomePageModel: async () => ({}),
		applySingleDayPeriodAction: async () => ({ affectedScopes: ['calendar', 'dayDetail', 'prediction'] })
	});

	const ctx = {
		panelMode: 'single-day',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-29',
		pendingUndoAction: null,
		rawContracts: {
			singleDayPeriodAction: {
				resolvedAction: {
					action: 'end-here',
					prompt: null,
					effect: {
						action: 'end-here',
						writeDates: ['2026-03-29'],
						clearDates: []
					}
				}
			}
		},
		resolvePendingUndoCommand: home.methods.resolvePendingUndoCommand,
		isSupportedSinglePeriodUndoAction: home.methods.isSupportedSinglePeriodUndoAction,
		createPendingUndoAction: home.methods.createPendingUndoAction,
		showPendingUndoAction: home.methods.showPendingUndoAction,
		scheduleUndoExpiry() {},
		clearPendingUndoAction() {
			this.pendingUndoAction = null;
		},
		runOptimisticMutation(nextPage, command) {
			assert.equal(nextPage.id, 'optimistic-single-day-page');
			return command();
		}
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.equal(ctx.pendingUndoAction, null);
});

test('home batch period toggles never create a pending undo action', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const ctx = {
		panelMode: 'batch',
		batchDraft: {
			isPeriod: false,
			flowLevel: null,
			painLevel: null,
			colorLevel: null
		},
		pendingUndoAction: null
	};

	await home.methods.handleTogglePeriod.call(ctx, true);

	assert.equal(ctx.batchDraft.isPeriod, true);
	assert.equal(ctx.pendingUndoAction, null);
});

test('home handleUndoTap dispatches the reverse single-day command and clears undo state on success', async () => {
	const commandCalls = [];
	const cacheInvalidations = [];
	const refreshCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		applySingleDayPeriodAction: async (payload) => {
			commandCalls.push(payload);
			return { affectedScopes: ['calendar', 'dayDetail', 'prediction'] };
		},
		uni: {
			showToast() {
				throw new Error('showToast should not run on successful undo');
			}
		}
	});

	const ctx = {
		isMutating: false,
		loadError: '',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		pendingUndoAction: {
			key: 'undo-1',
			visible: true,
			undoAction: {
				action: 'revoke-start',
				activeDate: '2026-03-22'
			}
		},
		clearPendingUndoAction: home.methods.clearPendingUndoAction,
		invalidateBrowseCache(scopes) {
			cacheInvalidations.push(scopes);
		},
		async refreshByScopes(scopes) {
			refreshCalls.push(scopes);
		}
	};

	await home.methods.handleUndoTap.call(ctx);

	assert.deepEqual(normalize(commandCalls.at(-1)), {
		context: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-03-22',
		action: 'revoke-start'
	});
	assert.equal(ctx.pendingUndoAction, null);
	assert.deepEqual(cacheInvalidations, [['calendar', 'dayDetail', 'prediction']]);
	assert.deepEqual(refreshCalls, [['calendar', 'dayDetail', 'prediction']]);
});

test('home handleUndoTap supports forward-bridge rollback via end-here at the previous segment end', async () => {
	const commandCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-04-20',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		applySingleDayPeriodAction: async (payload) => {
			commandCalls.push(payload);
			return { affectedScopes: ['calendar', 'dayDetail', 'prediction'] };
		},
		uni: {
			showToast() {
				throw new Error('showToast should not run on successful undo');
			}
		}
	});

	const ctx = {
		isMutating: false,
		loadError: '',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		pendingUndoAction: {
			key: 'undo-forward-1',
			visible: true,
			undoAction: {
				action: 'end-here',
				activeDate: '2026-04-17'
			}
		},
		clearPendingUndoAction: home.methods.clearPendingUndoAction,
		invalidateBrowseCache() {},
		async refreshByScopes() {}
	};

	await home.methods.handleUndoTap.call(ctx);

	assert.deepEqual(normalize(commandCalls.at(-1)), {
		context: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		activeDate: '2026-04-17',
		action: 'end-here'
	});
	assert.equal(ctx.pendingUndoAction, null);
});

test('home handleUndoTap clears undo state and shows a failure toast when reverse command fails', async () => {
	const toastCalls = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		applySingleDayPeriodAction: async () => {
			throw new Error('undo failed');
		},
		uni: {
			showToast(payload) {
				toastCalls.push(payload);
			}
		}
	});

	const ctx = {
		isMutating: false,
		loadError: '',
		contractContext: {
			apiBaseUrl: 'http://localhost:3004',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module'
		},
		pendingUndoAction: {
			key: 'undo-1',
			visible: true,
			undoAction: {
				action: 'revoke-start',
				activeDate: '2026-03-22'
			}
		},
		clearPendingUndoAction: home.methods.clearPendingUndoAction,
		invalidateBrowseCache() {
			throw new Error('invalidateBrowseCache should not run after undo failure');
		},
		refreshByScopes() {
			throw new Error('refreshByScopes should not run after undo failure');
		}
	};

	await home.methods.handleUndoTap.call(ctx);

	assert.equal(ctx.pendingUndoAction, null);
	assert.equal(toastCalls.at(-1).title, '撤回失败');
	assert.equal(toastCalls.at(-1).icon, 'none');
});

test('home root tap clears a visible pending undo action', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const ctx = {
		calendarInlineHintTimer: null,
		calendarInlineHintKey: 'hint',
		calendarInlineHintMessage: 'future blocked',
		calendarInlineHintAnchorRect: { left: 1, right: 2, top: 3, bottom: 4 },
		pendingUndoAction: {
			key: 'undo-1',
			visible: true,
			undoAction: { action: 'revoke-start', activeDate: '2026-03-22' }
		},
		clearCalendarInlineHint: home.methods.clearCalendarInlineHint,
		clearPendingUndoAction: home.methods.clearPendingUndoAction,
		undoExpiryTimer: null
	};

	home.methods.handleHomeRootTap.call(ctx);

	assert.equal(ctx.calendarInlineHintKey, '');
	assert.equal(ctx.pendingUndoAction, null);
});

test('home scheduleUndoExpiry clears the pending undo action after two seconds', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const ctx = {
		pendingUndoAction: {
			key: 'undo-1',
			visible: true,
				undoAction: { action: 'revoke-start', activeDate: '2026-03-22' }
		},
		undoExpiryTimer: null,
		clearPendingUndoAction: home.methods.clearPendingUndoAction
	};

	home.methods.scheduleUndoExpiry.call(ctx);
	assert.notEqual(ctx.undoExpiryTimer, null);

	await new Promise((resolve) => setTimeout(resolve, 2100));

	assert.equal(ctx.pendingUndoAction, null);
});

test('home showPendingUndoAction clears an existing undo before asynchronously showing the next one', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const events = [];
	const nextUndo = {
		key: 'undo-2',
		visible: true,
		undoAction: { action: 'start', activeDate: '2026-03-23' }
	};
	const ctx = {
		pendingUndoAction: {
			key: 'undo-1',
			visible: true,
			undoAction: { action: 'clear-record', activeDate: '2026-03-22' }
		},
		undoExpiryTimer: null,
		scheduleUndoExpiry() {
			events.push('schedule');
		},
		clearPendingUndoAction() {
			events.push('clear');
			this.pendingUndoAction = null;
		}
	};

	home.methods.showPendingUndoAction.call(ctx, nextUndo);

	assert.deepEqual(events, ['clear']);
	assert.equal(ctx.pendingUndoAction, null);

	await new Promise((resolve) => setTimeout(resolve, 10));

	assert.deepEqual(events, ['clear', 'schedule']);
	assert.equal(ctx.pendingUndoAction, nextUndo);
});

test('home handleHeaderNext delegates browse navigation into buffered preload instead of rebuilding immediately', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		shiftFocusDate: () => '2026-04-01'
	});

	const calls = [];
	const ctx = {
		isNavigationBusy: false,
		focusDate: '2026-03-25',
		viewMode: 'month',
		rebuildLocalPage() {
			return this.page;
		},
		beginBufferedBrowse(payload) {
			calls.push(payload);
		},
		applyLocalBrowseState() {
			throw new Error('legacy eager browse path should not run');
		}
	};

	home.methods.handleHeaderNext.call(ctx);

	assert.equal(calls.length, 1);
	assert.equal(calls[0].selectedDate, '2026-04-01');
	assert.equal(calls[0].focusDate, '2026-04-01');
	assert.equal(calls[0].viewMode, 'month');
	assert.equal(calls[0].direction, 'next');
	assert.equal(calls[0].effect, 'slide');
});

test('home month-view calendar stays interactive and passes focusedDate only for month mode', () => {
	const source = fs.readFileSync(path.resolve(repoRoot, 'frontend/pages/menstrual/home.vue'), 'utf8');

	assert.match(source, /:interactive="true"/);
	assert.match(source, /:focused-date="viewMode === 'month' \? activeDate : null"/);
});

test('home header nav keeps prev and next buttons visually valid for free paging', () => {
	const source = fs.readFileSync(path.resolve(repoRoot, 'frontend/pages/menstrual/home.vue'), 'utf8');

	assert.match(source, /:prev-invalid="false"/);
	assert.match(source, /:next-invalid="false"/);
});

test('home calendar swipe handlers reuse the existing header navigation flow', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});
	const calls = [];
	const ctx = {
		isBrowseBusy: false,
		panelMode: 'single-day',
		handleHeaderNext() {
			calls.push('next');
		},
		handleHeaderPrev() {
			calls.push('prev');
		}
	};

	home.methods.handleCalendarSwipeLeft.call(ctx);
	home.methods.handleCalendarSwipeRight.call(ctx);

	assert.deepEqual(calls, ['next', 'prev']);
});

test('home calendar swipe handlers stay blocked during batch mode or browse transitions', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});
	const calls = [];
	const batchCtx = {
		isBrowseBusy: false,
		panelMode: 'batch',
		handleHeaderNext() {
			calls.push('next');
		},
		handleHeaderPrev() {
			calls.push('prev');
		}
	};
	const busyCtx = {
		isBrowseBusy: true,
		panelMode: 'single-day',
		handleHeaderNext() {
			calls.push('next');
		},
		handleHeaderPrev() {
			calls.push('prev');
		}
	};

	home.methods.handleCalendarSwipeLeft.call(batchCtx);
	home.methods.handleCalendarSwipeRight.call(busyCtx);

	assert.deepEqual(calls, []);
});

test('home month-view batch selection clamps overflow cells outside the focused month', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		resolveJumpTargetDate: () => null,
		shiftFocusDate: () => null
	});
	const ctx = {
		viewMode: 'month',
		focusDate: '2026-04-15',
		batchStartKey: '2026-03-31',
		batchEndKey: '2026-04-02',
		batchSelectedKeysState: [],
		allCalendarCells: [
			{ key: '2026-03-31', isoDate: '2026-03-31', selectable: true },
			{ key: '2026-04-01', isoDate: '2026-04-01', selectable: true },
			{ key: '2026-04-02', isoDate: '2026-04-02', selectable: true }
		]
	};

	home.methods.syncBatchSelectionRange.call(ctx);

	assert.deepEqual(ctx.batchSelectedKeysState, ['2026-04-01', '2026-04-02']);
	assert.equal(ctx.batchSelectedKeysState.includes('2026-03-31'), false);
});

test('home beginBufferedBrowse keeps the current page stable until animation commit', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const currentPage = { id: 'current-page' };
	const pendingPayload = {
		pageModel: { id: 'pending-page', calendarCard: { weeks: [], weekdayLabels: [] } },
		rawContracts: { homeView: {}, moduleSettings: {}, focusDate: '2026-04-01', viewMode: 'month' },
		activeDate: '2026-04-01',
		focusDate: '2026-04-01',
		viewMode: 'month'
	};
	let animationStarted = false;
	let maskScheduled = false;
	const ctx = {
		rawContracts: { homeView: {}, moduleSettings: {} },
		isNavigationBusy: false,
		loadError: 'stale',
		panelMode: 'batch',
		page: currentPage,
		currentCalendarKey: 3,
		pendingCalendarKey: 0,
		browseRequestId: 0,
		browseTransitionPhase: 'idle',
		browseTransitionDirection: null,
		browseTransitionEffect: 'slide',
		pendingBrowsePayload: null,
		browseMaskShown: false,
		rebuildLocalPage() {
			return this.page;
		},
		clearHeaderInlineMessage() {},
		scheduleBrowseMask() {
			maskScheduled = true;
		},
		loadBrowseDependencies: async () => pendingPayload,
		startBrowseAnimation() {
			animationStarted = true;
			this.browseTransitionPhase = 'animating';
		}
	};

	await home.methods.beginBufferedBrowse.call(ctx, {
		selectedDate: '2026-04-01',
		focusDate: '2026-04-01',
		viewMode: 'month',
		direction: 'next',
		effect: 'fade'
	});

	assert.equal(ctx.page, currentPage);
	assert.equal(ctx.loadError, '');
	assert.equal(ctx.panelMode, 'single-day');
	assert.equal(ctx.pendingBrowsePayload, pendingPayload);
	assert.equal(ctx.pendingCalendarKey, 4);
	assert.equal(ctx.browseTransitionDirection, 'next');
	assert.equal(ctx.browseTransitionEffect, 'fade');
	assert.equal(maskScheduled, true);
	assert.equal(ctx.browseMaskShown, false);
	assert.equal(animationStarted, true);
});

test('home onLoad restores the remembered view type without restoring a historical browse position', () => {
	const storage = new Map([['menstrual-home-view-mode', 'month']]);
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		mergeH5RouteQuery: (options) => options,
		resolveRuntimeOpenid: ({ explicitOpenid, fallbackOpenid }) => explicitOpenid || fallbackOpenid,
		DEFAULT_MENSTRUAL_HOME_CONTEXT: {
			today: '2026-03-29',
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-openid',
			moduleInstanceId: 'seed-module',
			profileId: 'seed-profile'
		},
		uni: {
			getStorageSync(key) {
				return storage.get(key);
			},
			setStorageSync(key, value) {
				storage.set(key, value);
			}
		}
	});

	let retryCalled = false;
	const ctx = {
		contractContext: {},
		activeDate: '',
		focusDate: '',
		viewMode: 'three-week',
		resolveRememberedViewMode: home.methods.resolveRememberedViewMode,
		retryInitialLoad() {
			retryCalled = true;
		}
	};

	home.onLoad.call(ctx, {
		today: '2026-04-20',
		openid: 'owner-openid',
		apiBaseUrl: 'http://localhost:3004',
		moduleInstanceId: 'module-1',
		profileId: 'profile-1'
	});

	assert.equal(ctx.viewMode, 'month');
	assert.equal(ctx.activeDate, '2026-04-20');
	assert.equal(ctx.focusDate, '2026-04-20');
	assert.equal(ctx.contractContext.today, '2026-04-20');
	assert.equal(retryCalled, true);
});

test('home handleViewModeChange persists the selected view type before starting buffered browse', () => {
	const writes = [];
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {},
		uni: {
			getStorageSync() {
				return '';
			},
			setStorageSync(key, value) {
				writes.push([key, value]);
			}
		}
	});

	const calls = [];
	const ctx = {
		isNavigationBusy: false,
		activeDate: '2026-03-29',
		focusDate: '2026-03-24',
		viewMode: 'three-week',
		rememberViewMode: home.methods.rememberViewMode,
		beginBufferedBrowse(payload) {
			calls.push(payload);
		}
	};

	home.methods.handleViewModeChange.call(ctx, 'month');

	assert.deepEqual(writes, [['menstrual-home-view-mode', 'month']]);
	assert.equal(calls.length, 1);
	assert.equal(calls[0].viewMode, 'month');
	assert.equal(calls[0].focusDate, '2026-03-24');
});

test('home commitBufferedBrowse applies the pending payload atomically and clears transition state', () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const pendingPayload = {
		pageModel: { id: 'next-page' },
		rawContracts: { homeView: {}, moduleSettings: {}, focusDate: '2026-04-01', viewMode: 'month' },
		activeDate: '2026-04-01',
		focusDate: '2026-04-01',
		viewMode: 'month'
	};
	let timerCleared = false;
	const ctx = {
		browseRequestId: 5,
		pendingBrowsePayload: pendingPayload,
		pendingCalendarKey: 8,
		currentCalendarKey: 7,
		browseTransitionPhase: 'animating',
		browseTransitionDirection: 'next',
		browseTransitionEffect: 'fade',
		clearBrowseAnimationTimer() {
			timerCleared = true;
		},
		clearBrowseMaskTimer() {}
	};

	home.methods.commitBufferedBrowse.call(ctx, 5);

	assert.equal(ctx.page, pendingPayload.pageModel);
	assert.equal(ctx.rawContracts, pendingPayload.rawContracts);
	assert.equal(ctx.activeDate, '2026-04-01');
	assert.equal(ctx.focusDate, '2026-04-01');
	assert.equal(ctx.viewMode, 'month');
	assert.equal(ctx.currentCalendarKey, 8);
	assert.equal(ctx.pendingBrowsePayload, null);
	assert.equal(ctx.pendingCalendarKey, 0);
	assert.equal(ctx.browseTransitionPhase, 'idle');
	assert.equal(ctx.browseTransitionDirection, null);
	assert.equal(ctx.browseTransitionEffect, 'slide');
	assert.equal(timerCleared, true);
});

test('home beginBufferedBrowse restores idle state when preload fails', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	let resetCalled = false;
	const ctx = {
		rawContracts: { homeView: {}, moduleSettings: {} },
		isNavigationBusy: false,
		loadError: '',
		panelMode: 'single-day',
		browseRequestId: 0,
		browseTransitionPhase: 'idle',
		rebuildLocalPage() {
			return this.page;
		},
		clearHeaderInlineMessage() {},
		scheduleBrowseMask() {},
		loadBrowseDependencies: async () => {
			throw new Error('calendar query failed');
		},
		resetBufferedBrowse() {
			resetCalled = true;
			this.browseTransitionPhase = 'idle';
		}
	};

	await home.methods.beginBufferedBrowse.call(ctx, {
		selectedDate: '2026-04-01',
		focusDate: '2026-04-01',
		viewMode: 'month'
	});

	assert.equal(resetCalled, true);
	assert.equal(ctx.loadError, '联调环境请求失败');
	assert.equal(ctx.browseTransitionPhase, 'idle');
});

test('home scheduleBrowseMask only reveals the overlay when preloading outlives the delay', async () => {
	const home = loadVueOptions('frontend/pages/menstrual/home.vue', {
		CalendarGrid: {},
		CalendarLegend: {},
		HeaderNav: {},
		JumpTabs: {},
		SelectedDatePanel: {},
		SegmentedControl: {}
	});

	const ctx = {
		browseTransitionPhase: 'preloading',
		browseMaskDelayTimer: null,
		browseMaskShown: false
	};
	ctx.clearBrowseMaskTimer = home.methods.clearBrowseMaskTimer;

	home.methods.scheduleBrowseMask.call(ctx);
	assert.equal(ctx.browseMaskShown, false);

	await new Promise((resolve) => setTimeout(resolve, 140));
	assert.equal(ctx.browseMaskShown, true);

	home.methods.clearBrowseMaskTimer.call(ctx);
	assert.equal(ctx.browseMaskShown, false);
});
