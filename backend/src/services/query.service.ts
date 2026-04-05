import prisma from '../db/prisma';
import { getModuleSettings as getModuleSettingsRecord } from './moduleSettings.service';
import { resolveSingleDayPeriodAction } from './singleDayPeriodAction.service';

type AccessInput = {
  moduleInstanceId: string;
  userId: string;
};

type DayDetailInput = {
  moduleInstanceId: string;
  profileId: string;
  date: string;
  userId: string;
};

type SingleDayPeriodActionInput = {
  moduleInstanceId: string;
  date: string;
  userId: string;
};

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonthDay(date: Date) {
  return formatDate(date).slice(5).replace('-', '.');
}

function diffDaysInclusive(startDate: Date, endDate: Date) {
  const utcStart = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const utcEnd = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  return Math.floor((utcEnd - utcStart) / 86400000) + 1;
}

function lower(value: string | null | undefined) {
  return value ? value.toLowerCase() : value;
}

function hasUsablePrediction(prediction: {
  predictedStartDate: Date;
  predictionWindowStart: Date;
  predictionWindowEnd: Date;
  basedOnCycleCount: number;
} | null) {
  return Boolean(prediction && prediction.basedOnCycleCount > 0);
}

function isDetailRecorded(record: { painLevel: number | null; flowLevel: number | null; colorLevel: number | null }) {
  return [record.painLevel, record.flowLevel, record.colorLevel].some((value) => value !== null);
}

function getTodayDateOnly() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return toDateOnly(formatDate(new Date(now.getTime() - offset)));
}

function isDateWithinSegment(date: Date, segment: { startDate: Date; endDate: Date } | null) {
  if (!segment) {
    return false;
  }

  return date >= segment.startDate && date <= segment.endDate;
}

function formatSegment(segment: { startDate: Date; endDate: Date; durationDays: number } | null) {
  if (!segment) {
    return null;
  }

  return {
    startDate: formatDate(segment.startDate),
    endDate: formatDate(segment.endDate),
    durationDays: segment.durationDays,
  };
}

function createStatusCard(
  currentStatus: 'in_period' | 'out_of_period',
  currentSegment: ReturnType<typeof formatSegment>,
  today: Date,
) {
  if (currentStatus === 'in_period' && currentSegment) {
    const currentDayNumber = diffDaysInclusive(toDateOnly(currentSegment.startDate), today);
    return { label: `经期第${currentDayNumber}天` };
  }

  return { label: '非经期' };
}

async function requireAccess(moduleInstanceId: string, userId: string, profileId?: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: {
      id: moduleInstanceId,
      ...(profileId ? { profileId } : {}),
      OR: [
        { ownerUserId: userId },
        {
          accesses: {
            some: {
              userId,
              accessStatus: 'ACTIVE',
            },
          },
        },
      ],
    },
  });

  if (!moduleInstance) {
    const error = new Error('MODULE_ACCESS_DENIED') as Error & { code?: string; statusCode?: number };
    error.code = 'MODULE_ACCESS_DENIED';
    error.statusCode = 403;
    throw error;
  }

  return moduleInstance;
}

export async function getDayRecordDetail(input: DayDetailInput) {
  await requireAccess(input.moduleInstanceId, input.userId, input.profileId);

  const record = await prisma.dayRecord.findUnique({
    where: {
      moduleInstanceId_profileId_date: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: input.profileId,
        date: toDateOnly(input.date),
      },
    },
  });

  if (!record) {
    return {
      moduleInstanceId: input.moduleInstanceId,
      profileId: input.profileId,
      dayRecord: {
        date: input.date,
        isPeriod: false,
        painLevel: null,
        flowLevel: null,
        colorLevel: null,
        note: null,
        source: null,
        isExplicit: false,
        isDetailRecorded: false,
      },
    };
  }

  return {
    moduleInstanceId: input.moduleInstanceId,
    profileId: input.profileId,
    dayRecord: {
      date: formatDate(record.date),
      isPeriod: record.isPeriod,
      painLevel: record.painLevel ?? null,
      flowLevel: record.flowLevel ?? null,
      colorLevel: record.colorLevel ?? null,
      note: record.note ?? null,
      source: lower(record.source),
      isExplicit: true,
      isDetailRecorded: isDetailRecorded(record),
    },
  };
}

export async function getModuleAccessState(input: AccessInput) {
  const moduleInstance = await requireAccess(input.moduleInstanceId, input.userId);

  const accesses = await prisma.moduleAccess.findMany({
    where: {
      moduleInstanceId: input.moduleInstanceId,
      accessStatus: 'ACTIVE',
    },
  });
  const activePartners = accesses
    .filter((access) => access.role === 'PARTNER' && access.accessStatus === 'ACTIVE')
    .map((access) => ({
      userId: access.userId,
      role: lower(access.role),
      accessStatus: lower(access.accessStatus),
    }));

  return {
    moduleInstanceId: moduleInstance.id,
    sharingStatus: activePartners.length ? 'shared' : 'private',
    ownerUserId: moduleInstance.ownerUserId,
    activePartners,
  };
}

export async function getModuleHomeView(input: AccessInput & { today?: string }) {
  const moduleInstance = await requireAccess(input.moduleInstanceId, input.userId);
  const cycles = await prisma.derivedCycle.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, profileId: moduleInstance.profileId },
    orderBy: { startDate: 'asc' },
  });
  const prediction = await prisma.prediction.findUnique({
    where: { moduleInstanceId: input.moduleInstanceId },
  });
  const usablePrediction = hasUsablePrediction(prediction) ? prediction : null;

  const latestSegment = cycles.length > 0 ? cycles[cycles.length - 1] : null;
  const previousSegmentRecord = cycles.length > 1 ? cycles[cycles.length - 2] : null;
  // Use provided 'today' from client if available, otherwise use server time
  const today = input.today ? toDateOnly(input.today) : getTodayDateOnly();
  const todayStr = formatDate(today);
  const currentSegment = formatSegment(latestSegment);
  const previousSegment = formatSegment(previousSegmentRecord);
  const currentStatus = isDateWithinSegment(today, latestSegment) ? 'in_period' : 'out_of_period';
  const statusCard = createStatusCard(currentStatus, currentSegment, today);
  const currentStatusSummary = {
    currentStatus,
    anchorDate: currentSegment?.startDate ?? null,
    currentSegment,
    statusCard,
    previousSegment,
  };

  const calendarMarks: Array<{ date: string; kind: string }> = [];
  if (latestSegment?.derivedFromDates) {
    try {
      const dates = JSON.parse(latestSegment.derivedFromDates) as string[];
      dates.forEach((date, index) => {
        calendarMarks.push({ date, kind: index === 0 ? 'period_start' : 'period' });
      });
    } catch {
      // ignore malformed derived dates
    }
  }
  calendarMarks.push({ date: todayStr, kind: 'today' });
  if (usablePrediction) {
    calendarMarks.push({
      date: formatDate(usablePrediction.predictedStartDate),
      kind: 'prediction_start',
    });
  }

  const visibleWindow = latestSegment
    ? {
        kind: 'cycle_window',
        startDate: formatDate(latestSegment.startDate),
        endDate: formatDate(latestSegment.endDate),
      }
    : usablePrediction
      ? {
          kind: 'cycle_window',
          startDate: formatDate(usablePrediction.predictionWindowStart),
          endDate: formatDate(usablePrediction.predictionWindowEnd),
        }
      : null;

  if (visibleWindow && usablePrediction) {
    const start = new Date(visibleWindow.startDate);
    const end = new Date(visibleWindow.endDate);
    const predStart = usablePrediction.predictionWindowStart;
    const predEnd = usablePrediction.predictionWindowEnd;
    const minStart = start < predStart ? start : predStart;
    const maxEnd = end > predEnd ? end : predEnd;
    visibleWindow.startDate = formatDate(minStart);
    visibleWindow.endDate = formatDate(maxEnd);
  }

  return {
    moduleInstanceId: moduleInstance.id,
    sharingStatus: lower(moduleInstance.sharingStatus),
    currentStatus,
    statusCard,
    currentSegment,
    previousSegment,
    currentStatusSummary,
    visibleWindow,
    calendarMarks,
    selectedDay: null,
    predictionSummary: usablePrediction
      ? {
          predictedStartDate: formatDate(usablePrediction.predictedStartDate),
          predictionWindowStart: formatDate(usablePrediction.predictionWindowStart),
          predictionWindowEnd: formatDate(usablePrediction.predictionWindowEnd),
          basedOnCycleCount: usablePrediction.basedOnCycleCount,
        }
      : null,
  };
}

export async function getModuleSettings(input: AccessInput) {
  await requireAccess(input.moduleInstanceId, input.userId);
  const settings = await getModuleSettingsRecord(input.moduleInstanceId);

  return {
    moduleInstanceId: settings.moduleInstanceId,
    moduleSettings: {
      defaultPeriodDurationDays: settings.defaultPeriodDurationDays,
      defaultPredictionTermDays: settings.defaultPredictionTermDays,
    },
  };
}

export async function getSingleDayPeriodAction(input: SingleDayPeriodActionInput) {
  const moduleInstance = await requireAccess(input.moduleInstanceId, input.userId);
  const settings = await getModuleSettingsRecord(input.moduleInstanceId);
  const periodRecords = await prisma.dayRecord.findMany({
    where: {
      moduleInstanceId: input.moduleInstanceId,
      profileId: moduleInstance.profileId,
      isPeriod: true,
    },
    orderBy: { date: 'asc' },
  });

  return resolveSingleDayPeriodAction({
    selectedDate: input.date,
    periodDates: periodRecords.map((record) => formatDate(record.date)),
    defaultPeriodDurationDays: settings.defaultPeriodDurationDays,
  });
}
