import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MARKER_ASSET_MAP,
  getMarkerAssetSrc
} from '../marker-assets.js';

test('marker assets expose the approved static SVG paths', () => {
  assert.deepEqual(MARKER_ASSET_MAP, {
    'accent.period': '/static/menstrual/view-period.svg',
    'accent.period.contrast': '/static/menstrual/view-contrast.svg'
  });
});

test('getMarkerAssetSrc resolves known tones and rejects unsupported tokens', () => {
  assert.equal(getMarkerAssetSrc('accent.period'), '/static/menstrual/view-period.svg');
  assert.equal(
    getMarkerAssetSrc('accent.period.contrast'),
    '/static/menstrual/view-contrast.svg'
  );
  assert.equal(getMarkerAssetSrc(null), null);
  assert.equal(getMarkerAssetSrc('accent.prediction'), null);
});
