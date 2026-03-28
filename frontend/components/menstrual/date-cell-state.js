const PRESENTATIONS = {
  default: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: false
  },
  futureMuted: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.muted',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: false
  },
  today: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'circle',
    usesSpecialMarker: false
  },
  special: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: true
  },
  prediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: false
  },
  predictionSpecial: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: true
  },
  period: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: null,
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: false
  },
  periodSpecial: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: null,
    shape: 'rounded',
    usesSpecialMarker: true
  },
  selected: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesSpecialMarker: false
  },
  selectedPeriod: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesSpecialMarker: false
  },
  selectedPrediction: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.secondary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesSpecialMarker: false
  },
  selectedSpecial: {
    backgroundToken: null,
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesSpecialMarker: true
  },
  selectedPeriodSpecial: {
    backgroundToken: 'accent.period',
    borderToken: null,
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesSpecialMarker: true
  },
  selectedPredictionSpecial: {
    backgroundToken: 'accent.period.soft',
    borderToken: null,
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'rounded',
    usesSpecialMarker: true
  },
  selectedToday: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: null,
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesSpecialMarker: false
  },
  selectedTodaySpecial: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: 'shadow.selected',
    shape: 'circle',
    usesSpecialMarker: true
  },
  todaySpecial: {
    backgroundToken: null,
    borderToken: 'border.today',
    textToken: 'text.primary',
    markerToken: 'accent.period',
    shadowToken: null,
    shape: 'circle',
    usesSpecialMarker: true
  },
  todayPeriod: {
    backgroundToken: 'accent.period',
    borderToken: 'border.today',
    textToken: 'accent.period.contrast',
    markerToken: 'accent.period.contrast',
    shadowToken: null,
    shape: 'circle',
    usesSpecialMarker: false
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
