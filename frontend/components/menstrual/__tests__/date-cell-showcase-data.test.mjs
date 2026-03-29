import test from 'node:test';
import assert from 'node:assert/strict';

import { createDateCellShowcaseBoard } from '../date-cell-showcase-data.js';

test('showcase board exposes the base and derived state groups in the approved order', () => {
  const board = createDateCellShowcaseBoard();

  assert.deepEqual(
    board.groups.map((group) => group.id),
    ['base', 'selected', 'today']
  );

  assert.deepEqual(
    board.groups.map((group) => group.items.map((item) => item.variant)),
    [
      ['default', 'detail', 'prediction', 'period', 'today', 'futureMuted'],
      [
        'selectedPeriodDetail',
        'selectedPredictionDetail',
        'selectedDetail',
        'selected',
        'selectedTodayDetail'
      ],
      ['todayDetail', 'todayPeriod']
    ]
  );
});

test('showcase board keeps the selected and today derivative groups visually focused', () => {
  const board = createDateCellShowcaseBoard();
  const selectedGroup = board.groups[1];
  const todayGroup = board.groups[2];

  assert.equal(selectedGroup.emphasis, 'selected');
  assert.equal(todayGroup.emphasis, 'today');
  assert.deepEqual(
    selectedGroup.items.map((item) => item.variant),
    ['selectedPeriodDetail', 'selectedPredictionDetail', 'selectedDetail', 'selected', 'selectedTodayDetail']
  );
});

test('showcase labels stay aligned with the current approved state names', () => {
  const board = createDateCellShowcaseBoard();
  const labels = Object.fromEntries(
    board.groups.flatMap((group) => group.items.map((item) => [item.variant, item.label]))
  );

  assert.equal(labels.default, '普通态');
  assert.equal(labels.prediction, '预测态');
  assert.equal(labels.period, '月经态');
  assert.equal(labels.selectedTodayDetail, '选中+今天+详情');
  assert.equal(labels.todayPeriod, '今天+月经');
});
