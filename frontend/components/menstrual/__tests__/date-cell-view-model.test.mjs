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

test('predictionSpecial reuses the soft prediction surface with the shared eye marker', () => {
  const predictionSpecialViewModel = getDateCellViewModel('predictionSpecial');

  assert.deepEqual(predictionSpecialViewModel.rootClasses, ['date-cell--bg-period-soft']);
  assert.deepEqual(predictionSpecialViewModel.labelClasses, ['date-cell__label--primary']);
  assert.deepEqual(predictionSpecialViewModel.markerClasses, ['date-cell__marker-icon--period']);
  assert.equal(predictionSpecialViewModel.usesSpecialMarker, true);
});

test('todayPrediction keeps today stroke and circle geometry on top of prediction fill', () => {
  const todayPredictionViewModel = getDateCellViewModel('todayPrediction');

  assert.deepEqual(todayPredictionViewModel.rootClasses, [
    'date-cell--circle',
    'date-cell--bg-period-soft',
    'date-cell--border-today',
    'date-cell--stroke-today'
  ]);
  assert.deepEqual(todayPredictionViewModel.labelClasses, ['date-cell__label--primary']);
  assert.equal(todayPredictionViewModel.usesSpecialMarker, false);
});

test('selectedToday aliases preserve today stroke and only add selected shadow', () => {
  const selectedTodayPredictionViewModel = getDateCellViewModel('selectedTodayPrediction');
  const selectedTodayPeriodViewModel = getDateCellViewModel('selectedTodayPeriod');

  assert.deepEqual(selectedTodayPredictionViewModel.rootClasses, [
    'date-cell--circle',
    'date-cell--bg-period-soft',
    'date-cell--border-today',
    'date-cell--stroke-today',
    'date-cell--selected'
  ]);
  assert.deepEqual(selectedTodayPredictionViewModel.labelClasses, ['date-cell__label--primary']);
  assert.equal(selectedTodayPredictionViewModel.rootClasses.includes('date-cell--stroke-selected'), false);

  assert.deepEqual(selectedTodayPeriodViewModel.rootClasses, [
    'date-cell--circle',
    'date-cell--bg-period',
    'date-cell--border-today',
    'date-cell--stroke-today',
    'date-cell--selected'
  ]);
  assert.deepEqual(selectedTodayPeriodViewModel.labelClasses, ['date-cell__label--period-contrast']);
  assert.equal(selectedTodayPeriodViewModel.rootClasses.includes('date-cell--stroke-selected'), false);
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

test('special marker uses a shared glyph contract instead of image assets', () => {
  const source = fs.readFileSync(dateCellPath, 'utf8');
  const specialViewModel = getDateCellViewModel('special');
  const selectedPeriodSpecialViewModel = getDateCellViewModel('selectedPeriodSpecial');

  assert.equal(specialViewModel.markerName, 'visibility');
  assert.equal(selectedPeriodSpecialViewModel.markerName, 'visibility');
  assert.equal(specialViewModel.markerSrc, null);
  assert.equal(selectedPeriodSpecialViewModel.markerSrc, null);
  assert.doesNotMatch(source, /date-cell__marker-image/);
  assert.match(source, /date-cell__marker-icon/);
});
