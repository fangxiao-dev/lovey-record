import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dateCellVariants,
  getDateCellPresentation
} from '../date-cell-state.js';

test('default state keeps plain text and no derived markers', () => {
  const presentation = getDateCellPresentation('default');

  assert.deepEqual(presentation, {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  });
});

test('futureMuted state uses muted text without extra fill', () => {
  const presentation = getDateCellPresentation('futureMuted');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.textToken, 'text.muted');
  assert.equal(presentation.usesDetailMarker, false);
});

test('todayPeriod keeps today outline while switching to period contrast text', () => {
  const presentation = getDateCellPresentation('todayPeriod');

  assert.equal(presentation.backgroundToken, 'accent.period');
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.textToken, 'accent.period.contrast');
  assert.equal(presentation.shape, 'circle');
});

test('todayPrediction keeps the today circle while showing prediction fill', () => {
  const presentation = getDateCellPresentation('todayPrediction');

  assert.equal(presentation.backgroundToken, 'accent.period.soft');
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesDetailMarker, false);
});

test('selectedDetail uses selected shadow and period-colored marker', () => {
  const presentation = getDateCellPresentation('selectedDetail');

  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.usesDetailMarker, true);
});

test('today keeps circle geometry and today border without strong fill', () => {
  const presentation = getDateCellPresentation('today');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesDetailMarker, false);
});

test('detail keeps plain surface but adds the eye marker in period accent', () => {
  const presentation = getDateCellPresentation('detail');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.usesDetailMarker, true);
});

test('predictionDetail keeps prediction fill while adding the shared detail marker', () => {
  const presentation = getDateCellPresentation('predictionDetail');

  assert.equal(presentation.backgroundToken, 'accent.period.soft');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.usesDetailMarker, true);
});

test('selected only adds the shared selected shadow', () => {
  const presentation = getDateCellPresentation('selected');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.usesDetailMarker, false);
});

test('selectedPeriod switches both text and marker to period contrast', () => {
  const presentation = getDateCellPresentation('selectedPeriod');

  assert.equal(presentation.backgroundToken, 'accent.period');
  assert.equal(presentation.textToken, 'accent.period.contrast');
  assert.equal(presentation.markerToken, 'accent.period.contrast');
  assert.equal(presentation.shadowToken, 'shadow.selected');
});

test('selectedPrediction uses prediction fill with secondary text and selected shadow', () => {
  const presentation = getDateCellPresentation('selectedPrediction');

  assert.equal(presentation.backgroundToken, 'accent.period.soft');
  assert.equal(presentation.textToken, 'text.secondary');
  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.usesDetailMarker, false);
});

test('todayDetail preserves today outline while keeping period-colored detail marker', () => {
  const presentation = getDateCellPresentation('todayDetail');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesDetailMarker, true);
});

test('selectedTodayPrediction keeps the today circle while layering selected shadow', () => {
  const presentation = getDateCellPresentation('selectedTodayPrediction');

  assert.equal(presentation.backgroundToken, 'accent.period.soft');
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesDetailMarker, false);
});

test('selectedTodayPeriod keeps period contrast while adding selected shadow over today geometry', () => {
  const presentation = getDateCellPresentation('selectedTodayPeriod');

  assert.equal(presentation.backgroundToken, 'accent.period');
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.textToken, 'accent.period.contrast');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesDetailMarker, false);
});

test('dateCellVariants exposes the full approved variant matrix', () => {
  assert.deepEqual(dateCellVariants, [
    'default',
    'futureMuted',
    'today',
    'detail',
    'prediction',
    'predictionDetail',
    'period',
    'periodDetail',
    'selected',
    'selectedPeriod',
    'selectedPrediction',
    'selectedDetail',
    'selectedPeriodDetail',
    'selectedPredictionDetail',
    'selectedToday',
    'selectedTodayDetail',
    'todayDetail',
    'todayPeriod',
    'todayPrediction',
    'selectedTodayPrediction',
    'selectedTodayPeriod'
  ]);
});

test('unsupported variants fail fast', () => {
  assert.throws(
    () => getDateCellPresentation('unknown'),
    /Unsupported DateCell variant: unknown/
  );
});
