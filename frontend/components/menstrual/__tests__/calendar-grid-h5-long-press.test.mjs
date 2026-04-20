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
		longPressTimer: null,
		hitTestCell() {
			return -1;
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
