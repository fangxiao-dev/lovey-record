import test from 'node:test';
import assert from 'node:assert/strict';

import { createDateCellShowcaseSections } from '../date-cell-showcase-data.js';

test('showcase sections expose the approved variant groups in display order', () => {
  const sections = createDateCellShowcaseSections();

  assert.deepEqual(
    sections.map((section) => section.id),
    ['base', 'selected', 'today']
  );

  assert.deepEqual(
    sections.map((section) => section.items.map((item) => item.variant)),
    [
      ['default', 'futureMuted', 'special'],
      ['selected', 'selectedPeriod', 'selectedPrediction', 'selectedSpecial'],
      ['today', 'todayPeriod', 'todaySpecial']
    ]
  );
});

test('showcase labels stay aligned with the current approved state names', () => {
  const sections = createDateCellShowcaseSections();
  const labels = Object.fromEntries(
    sections.flatMap((section) => section.items.map((item) => [item.variant, item.label]))
  );

  assert.equal(labels.default, '默认');
  assert.equal(labels.futureMuted, '未来');
  assert.equal(labels.special, '特殊');
  assert.equal(labels.selectedPrediction, '选中-预测');
  assert.equal(labels.todayPeriod, '今天-经期');
});
