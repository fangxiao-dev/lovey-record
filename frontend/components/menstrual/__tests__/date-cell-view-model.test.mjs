import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getDateCellViewModel } from '../date-cell-view-model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dateCellPath = path.resolve(__dirname, '..', 'DateCell.vue');

test('default and selected variants keep transparent surfaces in the view model', () => {
  const defaultViewModel = getDateCellViewModel('default');
  const selectedViewModel = getDateCellViewModel('selected');

  assert.equal(defaultViewModel.rootClasses.includes('date-cell--bg-period'), false);
  assert.equal(defaultViewModel.rootClasses.includes('date-cell--bg-prediction'), false);
  assert.equal(defaultViewModel.rootClasses.includes('date-cell--stroke-selected'), false);
  assert.equal(defaultViewModel.rootClasses.includes('date-cell--stroke-today'), false);
  assert.equal(selectedViewModel.rootClasses.includes('date-cell--bg-period'), false);
  assert.equal(selectedViewModel.rootClasses.includes('date-cell--bg-prediction'), false);
});

test('selected variants retain the visible selected shadow in the view model', () => {
  const selectedViewModel = getDateCellViewModel('selected');
  const selectedSpecialViewModel = getDateCellViewModel('selectedSpecial');

  assert.equal(selectedViewModel.rootClasses.includes('date-cell--selected'), true);
  assert.equal(selectedSpecialViewModel.rootClasses.includes('date-cell--selected'), true);
  assert.equal(selectedViewModel.rootClasses.includes('date-cell--stroke-selected'), true);
  assert.equal(selectedSpecialViewModel.rootClasses.includes('date-cell--stroke-selected'), true);
});

test('selectedPrediction uses the soft period surface instead of the old prediction chip color', () => {
  const selectedPredictionViewModel = getDateCellViewModel('selectedPrediction');

  assert.equal(selectedPredictionViewModel.rootClasses.includes('date-cell--bg-period-soft'), true);
  assert.equal(selectedPredictionViewModel.rootClasses.includes('date-cell--bg-prediction'), false);
});

test('only today and selected families add visible stroke classes', () => {
  const specialViewModel = getDateCellViewModel('special');
  const periodViewModel = getDateCellViewModel('period');
  const todayViewModel = getDateCellViewModel('today');
  const selectedTodaySpecialViewModel = getDateCellViewModel('selectedTodaySpecial');

  assert.equal(specialViewModel.rootClasses.includes('date-cell--stroke-selected'), false);
  assert.equal(periodViewModel.rootClasses.includes('date-cell--stroke-selected'), false);
  assert.equal(periodViewModel.rootClasses.includes('date-cell--stroke-today'), false);
  assert.equal(todayViewModel.rootClasses.includes('date-cell--stroke-today'), true);
  assert.equal(selectedTodaySpecialViewModel.rootClasses.includes('date-cell--stroke-today'), true);
});

test('special marker stays below the date label in DateCell template order', () => {
  const source = fs.readFileSync(dateCellPath, 'utf8');

  assert.match(
    source,
    /<text class="date-cell__label"[\s\S]*?<\/text>\s*<view class="date-cell__marker-slot"/
  );
});
