export type SingleDayPeriodRole = 'not-period' | 'start' | 'in-progress' | 'end';
export type SingleDayPeriodAction = 'start' | 'revoke-start' | 'end-here' | 'noop';
export type BridgeType = 'none' | 'forward' | 'backward' | 'both';

type PromptType = 'forward' | 'backward' | 'both';
type EffectAction = 'start' | 'revoke-start' | 'end-here' | 'noop' | 'bridge-forward' | 'bridge-backward' | 'bridge-both';

type Segment = {
  startDate: string;
  endDate: string;
  dates: string[];
};

type ResolveSingleDayPeriodActionInput = {
  selectedDate: string;
  periodDates: string[];
  defaultPeriodDurationDays: number;
};

type SingleDayPeriodEffect = {
  action: EffectAction;
  bridgeType: BridgeType;
  selectedDate: string;
  writeDates: string[];
  clearDates: string[];
  resultingSegment: { startDate: string; endDate: string } | null;
};

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonthDay(date: string) {
  return date.slice(5).replace('-', '/');
}

function addDays(date: string, days: number) {
  const next = toDateOnly(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatDate(next);
}

function diffDays(startDate: string, endDate: string) {
  const start = toDateOnly(startDate).getTime();
  const end = toDateOnly(endDate).getTime();
  return Math.round((end - start) / 86400000);
}

function listDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const totalDays = diffDays(startDate, endDate);

  for (let offset = 0; offset <= totalDays; offset += 1) {
    dates.push(addDays(startDate, offset));
  }

  return dates;
}

function uniqueSortedDates(periodDates: string[]) {
  return [...new Set(periodDates)].sort();
}

function deriveSegments(periodDates: string[]) {
  const orderedDates = uniqueSortedDates(periodDates);
  const segments: Segment[] = [];
  let currentDates: string[] = [];

  for (const date of orderedDates) {
    if (currentDates.length === 0) {
      currentDates = [date];
      continue;
    }

    const previousDate = currentDates[currentDates.length - 1];
    if (diffDays(previousDate, date) === 1) {
      currentDates.push(date);
      continue;
    }

    segments.push({
      startDate: currentDates[0],
      endDate: currentDates[currentDates.length - 1],
      dates: currentDates,
    });
    currentDates = [date];
  }

  if (currentDates.length > 0) {
    segments.push({
      startDate: currentDates[0],
      endDate: currentDates[currentDates.length - 1],
      dates: currentDates,
    });
  }

  return segments;
}

function buildPrompt(type: PromptType, selectedDate: string, existingDate?: string) {
  if (type === 'forward') {
    return {
      required: true,
      type,
      message: `把这段经期延长到 ${formatMonthDay(selectedDate)}？`,
      confirmLabel: '确认',
      cancelLabel: '取消',
    };
  }

  if (type === 'backward') {
    return {
      required: true,
      type,
      message: `已在 ${formatMonthDay(existingDate!)} 标记了经期开始，要提前到 ${formatMonthDay(selectedDate)} 吗？`,
      confirmLabel: '确认',
      cancelLabel: '取消',
    };
  }

  return {
    required: true,
    type,
    message: '附近已有经期记录，是否合并？',
    confirmLabel: '确认',
    cancelLabel: '取消',
  };
}

export function resolveSingleDayPeriodAction(input: ResolveSingleDayPeriodActionInput) {
  const segments = deriveSegments(input.periodDates);
  const selectedSegment = segments.find((segment) => segment.dates.includes(input.selectedDate));

  if (selectedSegment) {
    const isStart = selectedSegment.startDate === input.selectedDate;
    const isEnd = selectedSegment.endDate === input.selectedDate;

    if (isStart) {
      return {
        selectedDate: input.selectedDate,
        role: 'start' as const,
        chip: {
          text: '月经开始',
          selected: true,
        },
        resolvedAction: {
          action: 'revoke-start' as const,
          bridgeType: 'none' as const,
          prompt: null,
          effect: {
            action: 'revoke-start' as const,
            bridgeType: 'none' as const,
            selectedDate: input.selectedDate,
            writeDates: [],
            clearDates: selectedSegment.dates,
            resultingSegment: null,
          },
        },
      };
    }

    if (isEnd) {
      return {
        selectedDate: input.selectedDate,
        role: 'end' as const,
        chip: {
          text: '月经结束',
          selected: true,
        },
        resolvedAction: {
          action: 'noop' as const,
          bridgeType: 'none' as const,
          prompt: null,
          effect: {
            action: 'noop' as const,
            bridgeType: 'none' as const,
            selectedDate: input.selectedDate,
            writeDates: [],
            clearDates: [],
            resultingSegment: {
              startDate: selectedSegment.startDate,
              endDate: selectedSegment.endDate,
            },
          },
        },
      };
    }

    return {
      selectedDate: input.selectedDate,
      role: 'in-progress' as const,
      chip: {
        text: '月经结束',
        selected: true,
      },
      resolvedAction: {
        action: 'end-here' as const,
        bridgeType: 'none' as const,
        prompt: null,
        effect: {
          action: 'end-here' as const,
          bridgeType: 'none' as const,
          selectedDate: input.selectedDate,
          writeDates: [input.selectedDate],
          clearDates: selectedSegment.dates.filter((date) => date > input.selectedDate),
          resultingSegment: {
            startDate: selectedSegment.startDate,
            endDate: input.selectedDate,
          },
        },
      },
    };
  }

  const threshold = Math.max(input.defaultPeriodDurationDays - 1, 0);
  const previousSegment = [...segments]
    .filter((segment) => segment.endDate < input.selectedDate)
    .sort((left, right) => right.endDate.localeCompare(left.endDate))[0];
  const nextSegment = [...segments]
    .filter((segment) => segment.startDate > input.selectedDate)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))[0];

  const forwardGap = previousSegment ? diffDays(previousSegment.endDate, input.selectedDate) - 1 : null;
  const backwardGap = nextSegment ? diffDays(input.selectedDate, nextSegment.startDate) - 1 : null;
  const canBridgeForward = previousSegment !== undefined && forwardGap !== null && forwardGap <= threshold;
  const canBridgeBackward = nextSegment !== undefined && backwardGap !== null && backwardGap <= threshold;

  let bridgeType: BridgeType = 'none';
  let prompt = null;
  let effect: SingleDayPeriodEffect;

  if (canBridgeForward && canBridgeBackward) {
    bridgeType = 'both';
    prompt = buildPrompt('both', input.selectedDate);
    effect = {
      action: 'bridge-both',
      bridgeType,
      selectedDate: input.selectedDate,
      writeDates: listDateRange(addDays(previousSegment!.endDate, 1), nextSegment!.startDate),
      clearDates: [],
      resultingSegment: {
        startDate: previousSegment!.startDate,
        endDate: nextSegment!.endDate,
      },
    };
  } else if (canBridgeForward) {
    bridgeType = 'forward';
    prompt = buildPrompt('forward', input.selectedDate);
    effect = {
      action: 'bridge-forward',
      bridgeType,
      selectedDate: input.selectedDate,
      writeDates: listDateRange(addDays(previousSegment!.endDate, 1), input.selectedDate),
      clearDates: [],
      resultingSegment: {
        startDate: previousSegment!.startDate,
        endDate: input.selectedDate,
      },
    };
  } else if (canBridgeBackward) {
    bridgeType = 'backward';
    prompt = buildPrompt('backward', input.selectedDate, nextSegment!.startDate);
    effect = {
      action: 'bridge-backward',
      bridgeType,
      selectedDate: input.selectedDate,
      writeDates: listDateRange(input.selectedDate, nextSegment!.startDate),
      clearDates: [],
      resultingSegment: {
        startDate: input.selectedDate,
        endDate: nextSegment!.endDate,
      },
    };
  } else {
    effect = {
      action: 'start',
      bridgeType,
      selectedDate: input.selectedDate,
      writeDates: listDateRange(input.selectedDate, addDays(input.selectedDate, input.defaultPeriodDurationDays - 1)),
      clearDates: [],
      resultingSegment: {
        startDate: input.selectedDate,
        endDate: addDays(input.selectedDate, input.defaultPeriodDurationDays - 1),
      },
    };
  }

  return {
    selectedDate: input.selectedDate,
    role: 'not-period' as const,
    chip: {
      text: '月经开始',
      selected: false,
    },
    resolvedAction: {
      action: 'start' as const,
      bridgeType,
      prompt,
      effect,
    },
  };
}
