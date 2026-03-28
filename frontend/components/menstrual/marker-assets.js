export const MARKER_ASSET_MAP = Object.freeze({
  'accent.period': '/static/menstrual/view-period.svg',
  'accent.period.contrast': '/static/menstrual/view-contrast.svg'
});

export function getMarkerAssetSrc(markerToken) {
  if (!markerToken) {
    return null;
  }

  return MARKER_ASSET_MAP[markerToken] ?? null;
}
