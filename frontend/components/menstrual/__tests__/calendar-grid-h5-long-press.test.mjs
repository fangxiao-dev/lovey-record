import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVueOptions } from '../../../__tests__/helpers/load-vue-options.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendarGridPath = path.resolve(__dirname, '..', 'CalendarGrid.vue');

function loadCalendarGrid() {
	return loadVueOptions('frontend/components/menstrual/CalendarGrid.vue', {
		DateCell: {}
	});
}

function normalize(value) {
	return JSON.parse(JSON.stringify(value));
}

test('CalendarGrid wires desktop H5 long-press events in addition to touch events', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /mounted\(\)\s*\{/);
	assert.match(source, /beforeUnmount\(\)\s*\{/);
	assert.match(source, /this\.bindDesktopLongPressEvents\(\)/);
	assert.match(source, /this\.unbindDesktopLongPressEvents\(\)/);
	assert.match(source, /addEventListener\('mousedown'/);
	assert.match(source, /addEventListener\('mousemove'/);
	assert.match(source, /addEventListener\('mouseup'/);
	assert.match(source, /addEventListener\('mouseleave'/);
	assert.match(source, /removeEventListener\('mousedown'/);
	assert.match(source, /onMouseDown\(e\)/);
	assert.match(source, /onMouseMove\(e\)/);
	assert.match(source, /onMouseUp\(\)/);
	assert.match(source, /onMouseLeave\(\)/);
});

test('CalendarGrid suppresses the follow-up tap immediately after a long press starts batch mode', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /suppressTapUntil/);
	assert.match(source, /if \(Date\.now\(\) < this\.suppressTapUntil\) return;/);
	assert.match(source, /this\.suppressTapUntil = Date\.now\(\) \+ 500;/);
});

test('CalendarGrid binds desktop event handlers to the component instance before registering native listeners', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /this\._boundMouseDown = this\.onMouseDown\.bind\(this\)/);
	assert.match(source, /this\._boundMouseMove = this\.onMouseMove\.bind\(this\)/);
	assert.match(source, /this\._boundMouseUp = this\.onMouseUp\.bind\(this\)/);
	assert.match(source, /this\._boundMouseLeave = this\.onMouseLeave\.bind\(this\)/);
	assert.match(source, /addEventListener\('mousedown', this\._boundMouseDown\)/);
	assert.match(source, /removeEventListener\('mousedown', this\._boundMouseDown\)/);
});

test('CalendarGrid falls back to DOM bounding rects when selectorQuery cannot resolve H5 desktop cells', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /captureCellRectsFromDom\(\)/);
	assert.match(source, /querySelectorAll\('\.calendar-grid__cell'\)/);
	assert.match(source, /getBoundingClientRect\(\)/);
	assert.match(source, /const fallbackRects = this\.captureCellRectsFromDom\(\)/);
});

test('CalendarGrid only wires root touchmove to the handler so scroll blocking is decided at runtime', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /@touchmove="onTouchMove"/);
	assert.doesNotMatch(source, /@touchmove\.stop\.prevent="onTouchMove"/);
});

test('CalendarGrid only prevents touchmove scrolling while batch drag is active', () => {
	const CalendarGrid = loadCalendarGrid();
	let preventCount = 0;
	const baseCtx = {
		touchStartX: 0,
		touchStartY: 0,
		touchCurrentX: 0,
		touchCurrentY: 0,
		longPressTimer: null,
		cellRects: [{ left: 0, right: 40, top: 0, bottom: 40 }],
		hitTestCell() {
			return -1;
		},
		captureCellRects(onReady) {
			onReady(this.cellRects);
			return true;
		},
		allCells: [],
		$emit() {
			throw new Error('batch events are not expected in this regression test');
		}
	};

	CalendarGrid.methods.handlePointerMove.call(
		{
			...baseCtx,
			batchMode: false
		},
		25,
		40,
		{
			preventDefault() {
				preventCount += 1;
			}
		}
	);

	assert.equal(preventCount, 0);

	CalendarGrid.methods.handlePointerMove.call(
		{
			...baseCtx,
			batchMode: true
		},
		25,
		40,
		{
			preventDefault() {
				preventCount += 1;
			}
		}
	);

	assert.equal(preventCount, 1);
});

test('CalendarGrid locks a meaningful horizontal drag and prevents vertical page scrolling before swipe commit', () => {
	const CalendarGrid = loadCalendarGrid();
	let preventCount = 0;
	const ctx = {
		gestureAxisLock: null,
		swipeCancelled: false,
		longPressTimer: { token: true },
		batchMode: false,
		touchStartX: 100,
		touchStartY: 50,
		touchCurrentX: 100,
		touchCurrentY: 50,
		cellRects: [],
		allCells: [],
		$emit() {
			throw new Error('no grid event should emit while the gesture is still moving');
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 118, 54, {
		preventDefault() {
			preventCount += 1;
		}
	});

	assert.equal(ctx.gestureAxisLock, 'horizontal');
	assert.equal(ctx.swipeCancelled, true);
	assert.equal(ctx.longPressTimer, null);
	assert.equal(preventCount, 1);
});

test('CalendarGrid treats ambiguous diagonal movement as vertical and keeps page scroll available', () => {
	const CalendarGrid = loadCalendarGrid();
	let preventCount = 0;
	const ctx = {
		gestureAxisLock: null,
		swipeCancelled: false,
		longPressTimer: { token: true },
		batchMode: false,
		touchStartX: 100,
		touchStartY: 50,
		touchCurrentX: 100,
		touchCurrentY: 50,
		cellRects: [],
		allCells: [],
		$emit() {
			throw new Error('no swipe should emit during move');
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 112, 64, {
		preventDefault() {
			preventCount += 1;
		}
	});

	assert.equal(ctx.gestureAxisLock, 'vertical');
	assert.equal(ctx.swipeCancelled, false);
	assert.equal(ctx.longPressTimer, null);
	assert.equal(preventCount, 0);
});

test('CalendarGrid treats a stationary long press release as batch entry once the hold duration has elapsed', () => {
	const CalendarGrid = loadCalendarGrid();
	let started = 0;
	const ctx = {
		longPressTimer: { token: true },
		batchMode: false,
		touchStartX: 120,
		touchStartY: 240,
		longPressStartedAt: Date.now() - 550,
		startBatchMode(x, y) {
			started += 1;
			assert.equal(x, 120);
			assert.equal(y, 240);
		},
		$emit() {
			throw new Error('batch-end should not fire before batch-start');
		}
	};

	CalendarGrid.methods.finishLongPress.call(ctx);

	assert.equal(started, 1);
	assert.equal(ctx.longPressTimer, null);
});

test('CalendarGrid reuses cached cell rects for the next batch start until invalidated', () => {
	const CalendarGrid = loadCalendarGrid();
	let captureCalls = 0;
	let selectorQueryUsed = 0;
	let startedCell = null;
	const ctx = {
		cellRects: [{ left: 0, right: 40, top: 0, bottom: 40 }],
		allCells: [{ key: '2026-03-23', selectable: true }],
		batchMode: false,
		suppressTapUntil: 0,
		longPressStartedAt: 123,
		invalidateCellRects() {
			this.cellRects = null;
		},
		captureCellRects(onReady) {
			captureCalls += 1;
			onReady(this.cellRects);
			return true;
		},
		hitTestCell() {
			return 0;
		},
		$emit(event, cell) {
			if (event === 'batch-start') startedCell = cell;
		}
	};

	globalThis.uni = {
		createSelectorQuery() {
			selectorQueryUsed += 1;
			return {
				in() { return this; },
				selectAll() { return this; },
				boundingClientRect() { return this; },
				exec() {}
			};
		}
	};

	CalendarGrid.methods.startBatchMode.call(ctx, 10, 10);

	assert.equal(captureCalls, 1);
	assert.equal(selectorQueryUsed, 0);
	assert.deepEqual(startedCell, { key: '2026-03-23', selectable: true });
});

test('CalendarGrid invalidateCellRects clears cached hit-test geometry', () => {
	const CalendarGrid = loadCalendarGrid();
	const ctx = {
		cellRects: [{ left: 0, right: 40, top: 0, bottom: 40 }]
	};

	CalendarGrid.methods.invalidateCellRects.call(ctx);

	assert.equal(ctx.cellRects, null);
});

test('CalendarGrid invalidates cached rects when weeks change or the page scrolls', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /invalidateCellRects\(\)\s*\{/);
	assert.match(source, /watch:\s*\{\s*weeks:/s);
	assert.match(source, /this\.invalidateCellRects\(\)/);
	assert.match(source, /window\.addEventListener\('scroll', this\._invalidateRects/);
	assert.match(source, /window\.addEventListener\('resize', this\._invalidateRects/);
});

test('CalendarGrid re-captures hit-test rects during batch drag after the weeks watcher invalidates them', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const ctx = {
		longPressTimer: null,
		batchMode: true,
		touchStartX: 0,
		touchStartY: 0,
		touchCurrentX: 0,
		touchCurrentY: 0,
		cellRects: null,
		allCells: [
			{ key: '2026-03-23', selectable: true },
			{ key: '2026-03-24', selectable: true }
		],
		hitTestCell: CalendarGrid.methods.hitTestCell,
		captureCellRects(onReady) {
			this.cellRects = [
				{ left: 0, right: 100, top: 0, bottom: 100 },
				{ left: 100, right: 200, top: 0, bottom: 100 }
			];
			onReady(this.cellRects);
			return true;
		},
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 150, 50, {
		preventDefault() {}
	});

	assert.deepEqual(emitted, [['batch-extend', { key: '2026-03-24', selectable: true }]]);
	assert.equal(ctx.cellRects.length, 2);
});

test('CalendarGrid exposes focusedDate so month view can visually anchor the edited day', () => {
	const source = fs.readFileSync(calendarGridPath, 'utf8');

	assert.match(source, /focusedDate:\s*\{\s*type:\s*String,/s);
	assert.match(source, /calendar-grid__cell--focused/);
});

test('CalendarGrid emits swipe navigation after a horizontal gesture cancels long press without entering batch mode', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const ctx = {
		gestureAxisLock: 'horizontal',
		swipeCancelled: false,
		longPressTimer: { token: true },
		batchMode: false,
		touchStartX: 100,
		touchStartY: 50,
		touchCurrentX: 100,
		touchCurrentY: 50,
		longPressStartedAt: Date.now() - 50,
		$emit(eventName) {
			emitted.push(eventName);
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 180, 54, null);
	assert.equal(ctx.swipeCancelled, true);
	assert.equal(ctx.longPressTimer, null);

	CalendarGrid.methods.finishLongPress.call(ctx);

	assert.deepEqual(emitted, ['swipe-right']);
	assert.equal(ctx.swipeCancelled, false);
});

test('CalendarGrid does not emit swipe navigation after a vertical locked drag', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const ctx = {
		gestureAxisLock: 'vertical',
		swipeCancelled: false,
		longPressTimer: { token: true },
		batchMode: false,
		touchStartX: 100,
		touchStartY: 50,
		touchCurrentX: 100,
		touchCurrentY: 50,
		longPressStartedAt: Date.now() - 50,
		$emit(eventName) {
			emitted.push(eventName);
		}
	};

	CalendarGrid.methods.handlePointerMove.call(ctx, 112, 80, null);
	CalendarGrid.methods.finishLongPress.call(ctx);

	assert.deepEqual(emitted, []);
	assert.equal(ctx.swipeCancelled, false);
});

test('CalendarGrid does not emit swipe navigation while batch drag is active', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const ctx = {
		swipeCancelled: true,
		longPressTimer: null,
		batchMode: true,
		touchStartX: 100,
		touchStartY: 50,
		touchCurrentX: 180,
		touchCurrentY: 54,
		longPressStartedAt: Date.now() - 50,
		$emit(eventName) {
			emitted.push(eventName);
		}
	};

	CalendarGrid.methods.finishLongPress.call(ctx);

	assert.deepEqual(emitted, ['batch-end']);
});

test('CalendarGrid emits a blocked-future-tap payload with the tapped cell anchor rect instead of cell-tap', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const cell = {
		key: '2026-04-07',
		isoDate: '2026-04-07',
		selectable: false,
		variant: 'futureMuted'
	};
	const ctx = {
		busy: false,
		interactive: true,
		suppressTapUntil: 0,
		batchMode: false,
		allCells: [cell],
		cellRects: [{
			left: 120,
			right: 170,
			top: 240,
			bottom: 290
		}],
		isBlockedFutureCell: CalendarGrid.methods.isBlockedFutureCell,
		emitBlockedFutureTap: CalendarGrid.methods.emitBlockedFutureTap,
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	CalendarGrid.methods.onCellTap.call(ctx, cell);

	assert.deepEqual(normalize(emitted), [[
		'blocked-future-tap',
		{
			cell,
			message: '暂无法操控未来 :)',
			anchorRect: {
				left: 120,
				right: 170,
				top: 240,
				bottom: 290
			}
		}
	]]);
});

test('CalendarGrid captures cell rects before emitting blocked-future-tap when no cached rect exists yet', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const cell = {
		key: '2026-04-07',
		isoDate: '2026-04-07',
		selectable: false,
		variant: 'futureMuted'
	};
	const ctx = {
		busy: false,
		interactive: true,
		suppressTapUntil: 0,
		batchMode: false,
		allCells: [cell],
		cellRects: null,
		isBlockedFutureCell: CalendarGrid.methods.isBlockedFutureCell,
		emitBlockedFutureTap: CalendarGrid.methods.emitBlockedFutureTap,
		captureCellRects(onReady) {
			this.cellRects = [{
				left: 90,
				right: 150,
				top: 210,
				bottom: 270
			}];
			onReady(this.cellRects);
			return true;
		},
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	CalendarGrid.methods.onCellTap.call(ctx, cell);

	assert.deepEqual(normalize(emitted), [[
		'blocked-future-tap',
		{
			cell,
			message: '暂无法操控未来 :)',
			anchorRect: {
				left: 90,
				right: 150,
				top: 210,
				bottom: 270
			}
		}
	]]);
});

test('CalendarGrid still emits a normal cell-tap for selectable dates', () => {
	const CalendarGrid = loadCalendarGrid();
	const emitted = [];
	const cell = {
		key: '2026-03-29',
		isoDate: '2026-03-29',
		selectable: true,
		variant: 'today'
	};
	const ctx = {
		busy: false,
		interactive: true,
		suppressTapUntil: 0,
		batchMode: false,
		isBlockedFutureCell: CalendarGrid.methods.isBlockedFutureCell,
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	CalendarGrid.methods.onCellTap.call(ctx, cell);

	assert.deepEqual(emitted, [['cell-tap', cell]]);
});
