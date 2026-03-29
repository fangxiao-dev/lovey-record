import { getDateCellPresentation } from './date-cell-state.js';
import { getMarkerAssetSrc } from './marker-assets.js';

const TOKEN_CLASS_MAP = {
  'accent.period': 'date-cell--bg-period',
  'accent.period.soft': 'date-cell--bg-period-soft',
  'accent.prediction': 'date-cell--bg-prediction',
  'border.today': 'date-cell--border-today',
  'shadow.selected': 'date-cell--selected',
  'text.primary': 'date-cell__label--primary',
  'text.secondary': 'date-cell__label--secondary',
  'text.muted': 'date-cell__label--muted',
  'accent.period.contrast': 'date-cell__label--period-contrast',
  'marker:accent.period': 'date-cell__marker-icon--period',
  'marker:accent.period.contrast': 'date-cell__marker-icon--period-contrast'
};

export function getDateCellViewModel(variant) {
  const presentation = getDateCellPresentation(variant);
  const rootClasses = [];
  const hasTodayStroke = presentation.borderToken === 'border.today';
  const hasSelectedStroke = Boolean(presentation.shadowToken) && !hasTodayStroke;

  if (presentation.shape === 'circle') {
    rootClasses.push('date-cell--circle');
  }

  if (presentation.backgroundToken) {
    rootClasses.push(TOKEN_CLASS_MAP[presentation.backgroundToken]);
  }

  if (presentation.borderToken) {
    rootClasses.push(TOKEN_CLASS_MAP[presentation.borderToken], 'date-cell--stroke-today');
  }

  if (presentation.shadowToken) {
    rootClasses.push(TOKEN_CLASS_MAP[presentation.shadowToken]);
  }

  if (hasSelectedStroke) {
    rootClasses.push('date-cell--stroke-selected');
  }

  return {
    rootClasses: rootClasses.filter(Boolean),
    labelClasses: [TOKEN_CLASS_MAP[presentation.textToken]].filter(Boolean),
    markerClasses: presentation.usesDetailMarker && presentation.markerToken
      ? [TOKEN_CLASS_MAP[`marker:${presentation.markerToken}`]].filter(Boolean)
      : [],
    markerName: null,
    markerSrc: presentation.usesDetailMarker
      ? getMarkerAssetSrc(presentation.markerToken)
      : null,
    usesDetailMarker: presentation.usesDetailMarker
  };
}
