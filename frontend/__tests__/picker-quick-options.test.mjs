import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCenteredQuickOptions } from '../utils/picker-quick-options.js';

const ALL_DURATION = Array.from({ length: 20 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }));
const ALL_CYCLE = Array.from({ length: 36 }, (_, i) => ({ value: i + 15, label: `${i + 15}` }));

test('中间值正常居中', () => {
	const result = buildCenteredQuickOptions(6, 6, ALL_DURATION);
	assert.deepStrictEqual(result.map((option) => option.value), [5, 6, 7]);
	assert.deepStrictEqual(result.map((option) => option.selected), [false, true, false]);
});

test('选中值与锚点不同时，仅 selected 标记差异', () => {
	const result = buildCenteredQuickOptions(6, 5, ALL_DURATION);
	assert.deepStrictEqual(result.map((option) => option.value), [5, 6, 7]);
	assert.deepStrictEqual(result.map((option) => option.selected), [true, false, false]);
});

test('锚点在下边界时 clamp 到 [min, min+1, min+2]', () => {
	const result = buildCenteredQuickOptions(1, 1, ALL_DURATION);
	assert.deepStrictEqual(result.map((option) => option.value), [1, 2, 3]);
	assert.ok(result[0].selected);
});

test('锚点在上边界时 clamp 到 [max-2, max-1, max]', () => {
	const result = buildCenteredQuickOptions(20, 20, ALL_DURATION);
	assert.deepStrictEqual(result.map((option) => option.value), [18, 19, 20]);
	assert.ok(result[2].selected);
});

test('自定义值 10 居中为 [9, 10, 11]', () => {
	const result = buildCenteredQuickOptions(10, 10, ALL_DURATION);
	assert.deepStrictEqual(result.map((option) => option.value), [9, 10, 11]);
	assert.ok(result[1].selected);
});

test('周期范围正常工作（anchor=28）', () => {
	const result = buildCenteredQuickOptions(28, 28, ALL_CYCLE);
	assert.deepStrictEqual(result.map((option) => option.value), [27, 28, 29]);
	assert.ok(result[1].selected);
});

test('周期范围在新下边界时 clamp 到 [15, 16, 17]', () => {
	const result = buildCenteredQuickOptions(15, 15, ALL_CYCLE);
	assert.deepStrictEqual(result.map((option) => option.value), [15, 16, 17]);
	assert.ok(result[0].selected);
});

test('allOptions 为空时返回空数组', () => {
	const result = buildCenteredQuickOptions(5, 5, []);
	assert.deepStrictEqual(result, []);
});
