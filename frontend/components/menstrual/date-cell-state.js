const PRESENTATIONS = {
  default: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  },
  futureMuted: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.muted',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  },
  futurePrediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.muted',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  },
  futurePeriod: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  },
  today: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'circle',
    usesDetailMarker: false
  },
  detail: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: true
  },
  prediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  },
  predictionDetail: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: true
  },
  period: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: false
  },
  periodDetail: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: null,
    shape: 'rounded',
    usesDetailMarker: true
  },
  selected: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesDetailMarker: false
  },
  selectedPeriod: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesDetailMarker: false
  },
  selectedPrediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.secondary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesDetailMarker: false
  },
  selectedDetail: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesDetailMarker: true
  },
  selectedPeriodDetail: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesDetailMarker: true
  },
  selectedPredictionDetail: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesDetailMarker: true
  },
  selectedToday: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesDetailMarker: false
  },
  selectedTodayDetail: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesDetailMarker: true
  },
  todayDetail: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'circle',
    usesDetailMarker: true
  },
  todayPeriod: {
    backgroundToken: 'accent.period',
    borderToken: 'border.today',
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: null,
    shape: 'circle',
    usesDetailMarker: false
  },
  todayPrediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'circle',
    usesDetailMarker: false
  },
  todayPredictionDetail: {
    backgroundToken: 'accent.period.soft',
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'circle',
    usesDetailMarker: true
  },
  selectedTodayPrediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesDetailMarker: false
  },
  selectedTodayPredictionDetail: {
    backgroundToken: 'accent.period.soft',
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesDetailMarker: true
  },
  selectedTodayPeriod: {
    backgroundToken: 'accent.period',
    borderToken: 'border.today',
    textToken: 'accent.period.contrast',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesDetailMarker: false
  }
};

export function getDateCellPresentation(variant) {
  const presentation = PRESENTATIONS[variant];

  if (!presentation) {
    throw new Error(`Unsupported DateCell variant: ${variant}`);
  }

  return { ...presentation };
}

export const dateCellVariants = Object.freeze(Object.keys(PRESENTATIONS));
