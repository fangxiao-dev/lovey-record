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
    usesSpecialMarker: false
  });
});

test('futureMuted state uses muted text without extra fill', () => {
  const presentation = getDateCellPresentation('futureMuted');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.textToken, 'text.muted');
  assert.equal(presentation.usesSpecialMarker, false);
});

test('todayPeriod keeps today outline while switching to period contrast text', () => {
  const presentation = getDateCellPresentation('todayPeriod');

  assert.equal(presentation.backgroundToken, 'accent.period');
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.textToken, 'accent.period.contrast');
  assert.equal(presentation.shape, 'circle');
});

test('selectedSpecial uses selected shadow and period-colored marker', () => {
  const presentation = getDateCellPresentation('selectedSpecial');

  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.usesSpecialMarker, true);
});

test('today keeps circle geometry and today border without strong fill', () => {
  const presentation = getDateCellPresentation('today');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesSpecialMarker, false);
});

test('special keeps plain surface but adds the eye marker in period accent', () => {
  const presentation = getDateCellPresentation('special');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.usesSpecialMarker, true);
});

test('selected only adds the shared selected shadow', () => {
  const presentation = getDateCellPresentation('selected');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.textToken, 'text.primary');
  assert.equal(presentation.usesSpecialMarker, false);
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

  assert.equal(presentation.backgroundToken, 'accent.prediction');
  assert.equal(presentation.textToken, 'text.secondary');
  assert.equal(presentation.shadowToken, 'shadow.selected');
  assert.equal(presentation.usesSpecialMarker, false);
});

test('todaySpecial preserves today outline while keeping period-colored special marker', () => {
  const presentation = getDateCellPresentation('todaySpecial');

  assert.equal(presentation.backgroundToken, null);
  assert.equal(presentation.borderToken, 'border.today');
  assert.equal(presentation.markerToken, 'accent.period');
  assert.equal(presentation.shape, 'circle');
  assert.equal(presentation.usesSpecialMarker, true);
});

test('dateCellVariants exposes the full approved variant matrix', () => {
  assert.deepEqual(dateCellVariants, [
    'default',
    'futureMuted',
    'today',
    'special',
    'selected',
    'selectedPeriod',
    'selectedPrediction',
    'selectedSpecial',
    'todaySpecial',
    'todayPeriod'
  ]);
});

test('unsupported variants fail fast', () => {
  assert.throws(
    () => getDateCellPresentation('unknown'),
    /Unsupported DateCell variant: unknown/
  );
});
