import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

function normalize(value) {
	return JSON.parse(JSON.stringify(value));
}

function loadVueOptions(relativePath, injected = {}) {
	const filePath = path.resolve(repoRoot, relativePath);
	const source = fs.readFileSync(filePath, 'utf8');
	const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
	if (!scriptMatch) {
		throw new Error(`No <script> block found in ${filePath}`);
	}

	const transformed = scriptMatch[1]
		.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
		.replace(/export default/, 'module.exports =');

	const module = { exports: {} };
	const sandbox = vm.createContext({
		module,
		exports: module.exports,
		console,
		setTimeout,
		clearTimeout,
		...injected
	});
	vm.runInContext(transformed, sandbox, { filename: filePath });
	return module.exports;
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
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
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
	assert.match(source, /this\.\$refs\.calendarGrid\?\.invalidateCellRects\?\.\(\)/);
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
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
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
		syncBatchSelectionRange: home.methods.syncBatchSelectionRange,
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
