import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

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

test('home batch selection toggles a cell back off when the drag path re-enters it', () => {
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
		batchSelectedKeysState: [],
		toggleBatchSelectionKey: home.methods.toggleBatchSelectionKey,
		activeDate: '2026-03-25',
		allCalendarCells: [
			{ key: '2026-03-25', isoDate: '2026-03-25', selectable: true },
			{ key: '2026-03-26', isoDate: '2026-03-26', selectable: true },
			{ key: '2026-03-27', isoDate: '2026-03-27', selectable: true }
		]
	};

	home.methods.handleBatchStart.call(ctx, { key: '2026-03-25', isoDate: '2026-03-25' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-26', isoDate: '2026-03-26' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-27', isoDate: '2026-03-27' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-26', isoDate: '2026-03-26' });
	home.methods.handleBatchExtend.call(ctx, { key: '2026-03-25', isoDate: '2026-03-25' });

	const selectedBatchKeys = home.computed.selectedBatchKeys.call(ctx);

	assert.deepEqual(selectedBatchKeys, ['2026-03-27']);
	assert.equal(selectedBatchKeys.includes('2026-03-25'), false);
	assert.equal(selectedBatchKeys.includes('2026-03-26'), false);
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
		batchSelectedKeysState: [],
		toggleBatchSelectionKey: home.methods.toggleBatchSelectionKey,
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
		buildBatchRanges: home.methods.buildBatchRanges,
		runCommand(command) {
			return command();
		},
		cancelBatchMode: home.methods.cancelBatchMode
	};

	await home.methods.applyBatchAction.call(ctx);

	assert.equal(ctx.panelMode, 'single-day');
	assert.equal(ctx.activeDate, '2026-03-18');
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
		buildBatchRanges: home.methods.buildBatchRanges,
		runCommand(command) {
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
