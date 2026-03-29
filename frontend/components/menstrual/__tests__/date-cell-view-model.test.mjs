import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getDateCellViewModel } from '../date-cell-view-model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dateCellPath = path.resolve(__dirname, '..', 'DateCell.vue');
const semanticTokensPath = path.resolve(__dirname, '..', '..', '..', 'styles', 'tokens', 'semantic.scss');

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
  const selectedDetailViewModel = getDateCellViewModel('selectedDetail');

  assert.equal(selectedViewModel.rootClasses.includes('date-cell--selected'), true);
  assert.equal(selectedDetailViewModel.rootClasses.includes('date-cell--selected'), true);
  assert.equal(selectedViewModel.rootClasses.includes('date-cell--stroke-selected'), true);
  assert.equal(selectedDetailViewModel.rootClasses.includes('date-cell--stroke-selected'), true);
});

test('selected shadow token is strengthened for the three-week home demo', () => {
  const semanticTokensSource = fs.readFileSync(semanticTokensPath, 'utf8');

  assert.match(semanticTokensSource, /\$shadow-selected:\s*0 8rpx 8rpx \$color-black-alpha-24;/);
});

test('selectedPrediction uses the soft period surface instead of the old prediction chip color', () => {
  const selectedPredictionViewModel = getDateCellViewModel('selectedPrediction');

  assert.equal(selectedPredictionViewModel.rootClasses.includes('date-cell--bg-period-soft'), true);
  assert.equal(selectedPredictionViewModel.rootClasses.includes('date-cell--bg-prediction'), false);
});

test('predictionDetail reuses the soft prediction surface with the shared eye marker', () => {
  const predictionDetailViewModel = getDateCellViewModel('predictionDetail');

  assert.deepEqual(predictionDetailViewModel.rootClasses, ['date-cell--bg-period-soft']);
  assert.deepEqual(predictionDetailViewModel.labelClasses, ['date-cell__label--primary']);
  assert.deepEqual(predictionDetailViewModel.markerClasses, ['date-cell__marker-icon--period']);
  assert.equal(predictionDetailViewModel.markerSrc, '/static/menstrual/view-period.svg');
  assert.equal(predictionDetailViewModel.usesDetailMarker, true);
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
  assert.equal(todayPredictionViewModel.usesDetailMarker, false);
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

test('selected non-today variants stay square while today remains circular', () => {
  const selectedDetailViewModel = getDateCellViewModel('selectedDetail');
  const todayViewModel = getDateCellViewModel('today');

  assert.equal(selectedDetailViewModel.rootClasses.includes('date-cell--circle'), false);
  assert.equal(todayViewModel.rootClasses.includes('date-cell--circle'), true);
});

test('periodDetail keeps contrast marker while selectedDetail stays non-period', () => {
  const periodDetailViewModel = getDateCellViewModel('periodDetail');
  const selectedDetailViewModel = getDateCellViewModel('selectedDetail');

  assert.deepEqual(periodDetailViewModel.labelClasses, ['date-cell__label--period-contrast']);
  assert.deepEqual(periodDetailViewModel.markerClasses, ['date-cell__marker-icon--period-contrast']);
  assert.deepEqual(selectedDetailViewModel.labelClasses, ['date-cell__label--primary']);
  assert.deepEqual(selectedDetailViewModel.markerClasses, ['date-cell__marker-icon--period']);
});

test('only today and selected families add visible stroke classes', () => {
  const detailViewModel = getDateCellViewModel('detail');
  const periodViewModel = getDateCellViewModel('period');
  const todayViewModel = getDateCellViewModel('today');
  const selectedTodayDetailViewModel = getDateCellViewModel('selectedTodayDetail');

  assert.equal(detailViewModel.rootClasses.includes('date-cell--stroke-selected'), false);
  assert.equal(periodViewModel.rootClasses.includes('date-cell--stroke-selected'), false);
  assert.equal(periodViewModel.rootClasses.includes('date-cell--stroke-today'), false);
  assert.equal(todayViewModel.rootClasses.includes('date-cell--stroke-today'), true);
  assert.equal(selectedTodayDetailViewModel.rootClasses.includes('date-cell--stroke-today'), true);
});

test('detail marker stays below the date label in DateCell template order', () => {
  const source = fs.readFileSync(dateCellPath, 'utf8');

  assert.match(
    source,
    /<text class="date-cell__label"[\s\S]*?<\/text>\s*<view class="date-cell__marker-slot"/
  );
});

test('detail marker uses shared static assets instead of inline svg paths', () => {
  const source = fs.readFileSync(dateCellPath, 'utf8');
  const detailViewModel = getDateCellViewModel('detail');
  const selectedPeriodDetailViewModel = getDateCellViewModel('selectedPeriodDetail');

  assert.equal(detailViewModel.markerSrc, '/static/menstrual/view-period.svg');
  assert.equal(selectedPeriodDetailViewModel.markerSrc, '/static/menstrual/view-contrast.svg');
  assert.equal(detailViewModel.markerName, null);
  assert.equal(selectedPeriodDetailViewModel.markerName, null);
  assert.match(source, /date-cell__marker-image/);
  assert.doesNotMatch(source, /<svg class="date-cell__marker-svg"/);
});

test('date cell source uses a compact square base size for the three-week grid', () => {
  const source = fs.readFileSync(dateCellPath, 'utf8');

  assert.match(source, /width:\s*90rpx;/);
  assert.match(source, /height:\s*90rpx;/);
});
