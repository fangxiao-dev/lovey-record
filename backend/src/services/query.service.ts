import prisma from '../db/prisma';

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

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lower(value: string | null | undefined) {
  return value ? value.toLowerCase() : value;
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
        bleedingState: 'none',
        painLevel: null,
        flowLevel: null,
        colorLevel: null,
        note: null,
        isExplicit: false,
      },
    };
  }

  return {
    moduleInstanceId: input.moduleInstanceId,
    profileId: input.profileId,
    dayRecord: {
      date: formatDate(record.date),
      bleedingState: lower(record.bleedingState),
      painLevel: record.painLevel ?? null,
      flowLevel: record.flowLevel ?? null,
      colorLevel: record.colorLevel ?? null,
      note: record.note ?? null,
      isExplicit: true,
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

  return {
    moduleInstanceId: moduleInstance.id,
    sharingStatus: lower(moduleInstance.sharingStatus),
    ownerUserId: moduleInstance.ownerUserId,
    activePartners: accesses
      .filter((access) => access.role === 'PARTNER')
      .map((access) => ({
        userId: access.userId,
        role: lower(access.role),
        accessStatus: lower(access.accessStatus),
      })),
  };
}

export async function getModuleHomeView(input: AccessInput) {
  const moduleInstance = await requireAccess(input.moduleInstanceId, input.userId);
  const cycles = await prisma.derivedCycle.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, profileId: moduleInstance.profileId },
    orderBy: { startDate: 'asc' },
  });
  const prediction = await prisma.prediction.findUnique({
    where: { moduleInstanceId: input.moduleInstanceId },
  });

  const lastCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null;
  const today = new Date();
  const todayStr = formatDate(today);
  const currentStatusSummary = lastCycle
    ? {
        status: today >= lastCycle.startDate && today <= lastCycle.endDate ? 'in_period' : 'out_of_period',
        anchorDate: todayStr,
        currentCycle: {
          startDate: formatDate(lastCycle.startDate),
          endDate: formatDate(lastCycle.endDate),
          durationDays: lastCycle.durationDays,
        },
      }
    : null;

  const calendarMarks: Array<{ date: string; kind: string }> = [];
  if (lastCycle?.derivedFromDates) {
    try {
      const dates = JSON.parse(lastCycle.derivedFromDates) as string[];
      dates.forEach((date) => {
        calendarMarks.push({ date, kind: 'period' });
      });
    } catch {
      // ignore malformed derived dates
    }
  }
  calendarMarks.push({ date: todayStr, kind: 'today' });
  if (prediction) {
    calendarMarks.push({
      date: formatDate(prediction.predictedStartDate),
      kind: 'prediction_start',
    });
  }

  const visibleWindow = lastCycle
    ? {
        kind: 'cycle_window',
        startDate: formatDate(lastCycle.startDate),
        endDate: formatDate(lastCycle.endDate),
      }
    : prediction
      ? {
          kind: 'cycle_window',
          startDate: formatDate(prediction.predictionWindowStart),
          endDate: formatDate(prediction.predictionWindowEnd),
        }
      : null;

  if (visibleWindow && prediction) {
    const start = new Date(visibleWindow.startDate);
    const end = new Date(visibleWindow.endDate);
    const predStart = prediction.predictionWindowStart;
    const predEnd = prediction.predictionWindowEnd;
    const minStart = start < predStart ? start : predStart;
    const maxEnd = end > predEnd ? end : predEnd;
    visibleWindow.startDate = formatDate(minStart);
    visibleWindow.endDate = formatDate(maxEnd);
  }

  return {
    moduleInstanceId: moduleInstance.id,
    sharingStatus: lower(moduleInstance.sharingStatus),
    currentStatusSummary,
    visibleWindow,
    calendarMarks,
    selectedDay: null,
    predictionSummary: prediction
      ? {
          predictedStartDate: formatDate(prediction.predictedStartDate),
          predictionWindowStart: formatDate(prediction.predictionWindowStart),
          predictionWindowEnd: formatDate(prediction.predictionWindowEnd),
          basedOnCycleCount: prediction.basedOnCycleCount,
        }
      : null,
  };
}
