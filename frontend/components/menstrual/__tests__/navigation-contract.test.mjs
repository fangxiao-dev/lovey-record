import test from 'node:test';
import assert from 'node:assert/strict';

import {
	isJumpBoundary,
	resolveBrowseNavLabels,
	resolveJumpBoundaryMessage,
	resolveJumpTabItems
} from '../navigation-contract.js';

test('resolveBrowseNavLabels uses week copy in focused mode and month copy in month view', () => {
	assert.deepEqual(resolveBrowseNavLabels('three-week'), {
		leadingLabel: '上周',
		trailingLabel: '下周'
	});
	assert.deepEqual(resolveBrowseNavLabels('month'), {
		leadingLabel: '上个月',
		trailingLabel: '下个月'
	});
});

test('resolveJumpTabItems marks boundary period jumps invalid without making them non-interactive', () => {
	const items = [
		{ key: 'today', label: '今天', disabled: false },
		{ key: 'prediction', label: '下次预测', disabled: false },
		{ key: '_sep', type: 'label', label: '按经期定位' },
		{ key: 'prev-period', label: '向前', disabled: false },
		{ key: 'next-period', label: '向后', disabled: false }
	];

	const resolved = resolveJumpTabItems(items, {
		isBackwardBoundary: true,
		isForwardBoundary: false
	});

	const prev = resolved.find((item) => item.key === 'prev-period');
	const next = resolved.find((item) => item.key === 'next-period');
	const today = resolved.find((item) => item.key === 'today');

	assert.equal(prev?.invalid, true);
	assert.equal(prev?.disabled, false);
	assert.equal(next?.invalid, false);
	assert.equal(next?.disabled, false);
	assert.equal(today?.invalid, false);
	assert.equal(today?.disabled, false);
});

test('resolveJumpBoundaryMessage returns direction-specific no-record copy', () => {
	assert.equal(resolveJumpBoundaryMessage('prev-period'), '向前已无记录');
	assert.equal(resolveJumpBoundaryMessage('next-period'), '向后已无记录');
});

test('isJumpBoundary falls back to missing previous or next targets when boundary flags are absent', () => {
	assert.equal(isJumpBoundary({
		focusedNodeType: 'real-period',
		previousPeriodStart: null,
		nextPeriodStart: '2026-02-08'
	}, 'prev-period'), true);
	assert.equal(isJumpBoundary({
		focusedNodeType: 'prediction',
		previousPeriodStart: '2026-04-06',
		nextPeriodStart: null
	}, 'next-period'), true);
	assert.equal(isJumpBoundary({
		focusedNodeType: 'real-period',
		previousPeriodStart: '2026-02-08',
		nextPeriodStart: '2026-04-06'
	}, 'prev-period'), false);
});
