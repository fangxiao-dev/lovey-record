import prisma from '../db/prisma';

type RecordDayStateInput = {
  moduleInstanceId: string;
  userId: string;
  date: string;
  bleedingState: 'PERIOD' | 'SPOTTING';
  painLevel?: number;
  flowLevel?: number;
  colorLevel?: number;
  note?: string | null;
};

type ClearDayRecordInput = {
  moduleInstanceId: string;
  userId: string;
  date: string;
};

type RangeInput = {
  moduleInstanceId: string;
  userId: string;
  startDate: string;
  endDate: string;
};

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function deriveCycles(periodDates: Date[]) {
  const orderedDates = [...periodDates].sort((a, b) => a.getTime() - b.getTime());
  const cycles: Array<{ startDate: Date; endDate: Date; durationDays: number; derivedFromDates: string }> = [];
  let currentStart: Date | null = null;
  let currentEnd: Date | null = null;
  let currentDates: string[] = [];

  for (const date of orderedDates) {
    const dateStr = formatDate(date);
    if (!currentStart) {
      currentStart = date;
      currentEnd = date;
      currentDates = [dateStr];
      continue;
    }

    const expected = addDays(currentEnd!, 1);
    if (formatDate(expected) === dateStr) {
      currentEnd = date;
      currentDates.push(dateStr);
      continue;
    }

    cycles.push({
      startDate: currentStart,
      endDate: currentEnd!,
      durationDays: currentDates.length,
      derivedFromDates: JSON.stringify(currentDates),
    });
    currentStart = date;
    currentEnd = date;
    currentDates = [dateStr];
  }

  if (currentStart) {
    cycles.push({
      startDate: currentStart,
      endDate: currentEnd!,
      durationDays: currentDates.length,
      derivedFromDates: JSON.stringify(currentDates),
    });
  }

  return cycles;
}

function derivePrediction(cycleStarts: Date[]) {
  if (cycleStarts.length < 2) {
    return null;
  }

  const intervals = [];
  for (let i = 1; i < cycleStarts.length; i++) {
    const prev = cycleStarts[i - 1].getTime();
    const curr = cycleStarts[i].getTime();
    intervals.push(Math.round((curr - prev) / 86400000));
  }

  const average = Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length) || 28;
  const last = cycleStarts[cycleStarts.length - 1];
  const predicted = addDays(last, average);
  return {
    predictedStartDate: predicted,
    predictionWindowStart: addDays(predicted, -2),
    predictionWindowEnd: addDays(predicted, 2),
    basedOnCycleCount: cycleStarts.length,
  };
}

async function assertAccess(moduleInstanceId: string, userId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: { id: moduleInstanceId, ownerUserId: userId },
  });

  if (!moduleInstance) {
    throw new Error('MODULE_ACCESS_DENIED');
  }

  return moduleInstance;
}

async function recompute(moduleInstanceId: string, profileId: string) {
  const periodRecords = await prisma.dayRecord.findMany({
    where: { moduleInstanceId, profileId, bleedingState: 'PERIOD' },
    orderBy: { date: 'asc' },
  });

  const cycles = deriveCycles(periodRecords.map((record) => record.date));

  await prisma.derivedCycle.deleteMany({
    where: { moduleInstanceId, profileId },
  });
  if (cycles.length > 0) {
    await prisma.derivedCycle.createMany({
      data: cycles.map((cycle) => ({
        moduleInstanceId,
        profileId,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        durationDays: cycle.durationDays,
        derivedFromDates: cycle.derivedFromDates,
      })),
    });
  }

  const prediction = derivePrediction(cycles.map((cycle) => cycle.startDate));
  await prisma.prediction.upsert({
    where: { moduleInstanceId },
    create: prediction
      ? {
          moduleInstanceId,
          profileId,
          predictedStartDate: prediction.predictedStartDate,
          predictionWindowStart: prediction.predictionWindowStart,
          predictionWindowEnd: prediction.predictionWindowEnd,
          basedOnCycleCount: prediction.basedOnCycleCount,
        }
      : {
          moduleInstanceId,
          profileId,
          predictedStartDate: new Date('1970-01-01T00:00:00.000Z'),
          predictionWindowStart: new Date('1970-01-01T00:00:00.000Z'),
          predictionWindowEnd: new Date('1970-01-01T00:00:00.000Z'),
          basedOnCycleCount: 0,
        },
    update: prediction
      ? {
          profileId,
          predictedStartDate: prediction.predictedStartDate,
          predictionWindowStart: prediction.predictionWindowStart,
          predictionWindowEnd: prediction.predictionWindowEnd,
          basedOnCycleCount: prediction.basedOnCycleCount,
        }
      : {
          profileId,
          predictedStartDate: new Date('1970-01-01T00:00:00.000Z'),
          predictionWindowStart: new Date('1970-01-01T00:00:00.000Z'),
          predictionWindowEnd: new Date('1970-01-01T00:00:00.000Z'),
          basedOnCycleCount: 0,
        },
  });
}

export async function recordDayState(input: RecordDayStateInput) {
  const moduleInstance = await assertAccess(input.moduleInstanceId, input.userId);
  const profileId = moduleInstance.profileId;
  const painLevel = input.painLevel ?? 3;
  const flowLevel = input.flowLevel ?? 3;
  const colorLevel = input.colorLevel ?? 3;
  const date = toDateOnly(input.date);

  const dayRecord = await prisma.dayRecord.upsert({
    where: {
      moduleInstanceId_profileId_date: {
        moduleInstanceId: input.moduleInstanceId,
        profileId,
        date,
      },
    },
    create: {
      moduleInstanceId: input.moduleInstanceId,
      profileId,
      date,
      bleedingState: input.bleedingState,
      painLevel,
      flowLevel,
      colorLevel,
      note: input.note ?? null,
    },
    update: {
      bleedingState: input.bleedingState,
      painLevel,
      flowLevel,
      colorLevel,
      note: input.note ?? null,
    },
  });

  await recompute(input.moduleInstanceId, profileId);

  return { dayRecord };
}

export async function clearDayRecord(input: ClearDayRecordInput) {
  const moduleInstance = await assertAccess(input.moduleInstanceId, input.userId);
  const profileId = moduleInstance.profileId;
  const date = toDateOnly(input.date);

  await prisma.dayRecord.deleteMany({
    where: {
      moduleInstanceId: input.moduleInstanceId,
      profileId,
      date,
    },
  });

  await recompute(input.moduleInstanceId, profileId);

  return { dayRecordRemoved: true };
}

export async function recordDateRangeAsPeriod(input: RangeInput) {
  const moduleInstance = await assertAccess(input.moduleInstanceId, input.userId);
  const profileId = moduleInstance.profileId;
  const start = toDateOnly(input.startDate);
  const end = toDateOnly(input.endDate);

  let current = start;
  let updatedDayCount = 0;
  while (current <= end) {
    await prisma.dayRecord.upsert({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId: input.moduleInstanceId,
          profileId,
          date: current,
        },
      },
      create: {
        moduleInstanceId: input.moduleInstanceId,
        profileId,
        date: current,
        bleedingState: 'PERIOD',
        painLevel: 3,
        flowLevel: 3,
        colorLevel: 3,
      },
      update: {
        bleedingState: 'PERIOD',
        painLevel: 3,
        flowLevel: 3,
        colorLevel: 3,
      },
    });
    updatedDayCount += 1;
    current = addDays(current, 1);
  }

  await recompute(input.moduleInstanceId, profileId);

  return { updatedDayCount };
}
