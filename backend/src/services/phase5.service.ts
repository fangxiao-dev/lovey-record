import prisma from '../db/prisma';

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lower(value: string | null | undefined) {
  return value ? value.toLowerCase() : value;
}

function hasRecordedNote(note: string | null | undefined) {
  return typeof note === 'string' && note.trim().length > 0;
}

function isDetailRecorded(record: { painLevel: number | null; flowLevel: number | null; colorLevel: number | null; note?: string | null }) {
  return [record.painLevel, record.flowLevel, record.colorLevel].some((value) => value !== null)
    || hasRecordedNote(record.note);
}

function hasUsablePrediction(prediction: {
  predictedStartDate: Date;
  predictionWindowStart: Date;
  predictionWindowEnd: Date;
  basedOnCycleCount: number;
} | null) {
  return Boolean(prediction && prediction.basedOnCycleCount > 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createAccessError() {
  return Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 });
}

function createNoteTooLongError() {
  return Object.assign(new Error('Note exceeds the allowed length.'), { code: 'NOTE_TOO_LONG', statusCode: 400 });
}

async function requireMaintenance(moduleInstanceId: string, userId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: {
      id: moduleInstanceId,
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
    throw createAccessError();
  }
  return moduleInstance;
}

async function requireOwner(moduleInstanceId: string, userId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: { id: moduleInstanceId, ownerUserId: userId },
  });

  if (!moduleInstance) {
    throw createAccessError();
  }

  return moduleInstance;
}

async function requireAccess(moduleInstanceId: string, userId: string, profileId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: {
      id: moduleInstanceId,
      profileId,
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
    throw createAccessError();
  }
  return moduleInstance;
}

export async function recordDayDetails(input: {
  moduleInstanceId: string;
  userId: string;
  date: string;
  painLevel: number | null;
  flowLevel: number | null;
  colorLevel: number | null;
}) {
  const moduleInstance = await requireMaintenance(input.moduleInstanceId, input.userId);
  const date = toDateOnly(input.date);
  const record = await prisma.dayRecord.findUnique({
    where: {
      moduleInstanceId_profileId_date: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: moduleInstance.profileId,
        date,
      },
    },
  });
  if (!record) {
    await prisma.dayRecord.upsert({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId: input.moduleInstanceId,
          profileId: moduleInstance.profileId,
          date,
        },
      },
      create: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: moduleInstance.profileId,
        date,
        isPeriod: false,
        painLevel: input.painLevel,
        flowLevel: input.flowLevel,
        colorLevel: input.colorLevel,
        note: null,
        source: 'MANUAL',
      },
      update: {
        painLevel: input.painLevel,
        flowLevel: input.flowLevel,
        colorLevel: input.colorLevel,
      },
    });
  } else {
    await prisma.dayRecord.update({
      where: { id: record.id },
      data: { painLevel: input.painLevel, flowLevel: input.flowLevel, colorLevel: input.colorLevel },
    });
  }
  return {
    detailChanged: true,
    isDetailRecorded: [input.painLevel, input.flowLevel, input.colorLevel].some((value) => value !== null),
  };
}

export async function recordDayNote(input: { moduleInstanceId: string; userId: string; date: string; note: string }) {
  const moduleInstance = await requireMaintenance(input.moduleInstanceId, input.userId);
  if (input.note.length > 500) {
    throw createNoteTooLongError();
  }
  const date = toDateOnly(input.date);
  const record = await prisma.dayRecord.findUnique({
    where: {
      moduleInstanceId_profileId_date: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: moduleInstance.profileId,
        date,
      },
    },
  });
  if (!record) {
    await prisma.dayRecord.upsert({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId: input.moduleInstanceId,
          profileId: moduleInstance.profileId,
          date,
        },
      },
      create: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: moduleInstance.profileId,
        date,
        isPeriod: false,
        painLevel: null,
        flowLevel: null,
        colorLevel: null,
        note: input.note,
        source: 'MANUAL',
      },
      update: {
        note: input.note,
      },
    });
  } else {
    await prisma.dayRecord.update({ where: { id: record.id }, data: { note: input.note } });
  }
  return { noteChanged: true };
}

export async function shareModuleInstance(input: { moduleInstanceId: string; userId: string; partnerUserId: string }) {
  const moduleInstance = await requireOwner(input.moduleInstanceId, input.userId);
  await prisma.moduleAccess.upsert({
    where: { moduleInstanceId_userId: { moduleInstanceId: input.moduleInstanceId, userId: input.partnerUserId } },
    create: { moduleInstanceId: input.moduleInstanceId, userId: input.partnerUserId, role: 'PARTNER', accessStatus: 'ACTIVE' },
    update: { accessStatus: 'ACTIVE', revokedAt: null, role: 'PARTNER' },
  });
  await prisma.moduleInstance.update({
    where: { id: moduleInstance.id },
    data: { sharingStatus: 'SHARED' },
  });
  return { moduleInstanceId: moduleInstance.id, sharingStatus: 'shared', partnerUserId: input.partnerUserId, accessStatus: 'active' };
}

export async function revokeModuleAccess(input: { moduleInstanceId: string; userId: string; partnerUserId: string }) {
  const moduleInstance = await requireOwner(input.moduleInstanceId, input.userId);
  await prisma.moduleAccess.update({
    where: { moduleInstanceId_userId: { moduleInstanceId: input.moduleInstanceId, userId: input.partnerUserId } },
    data: { accessStatus: 'REVOKED', revokedAt: new Date() },
  });
  await prisma.moduleInstance.update({
    where: { id: moduleInstance.id },
    data: { sharingStatus: 'PRIVATE' },
  });
  return { moduleInstanceId: moduleInstance.id, sharingStatus: 'private', partnerUserId: input.partnerUserId, accessStatus: 'revoked' };
}

export async function getCalendarWindow(input: {
  moduleInstanceId: string;
  userId: string;
  profileId: string;
  startDate: string;
  endDate: string;
}) {
  await requireAccess(input.moduleInstanceId, input.userId, input.profileId);
  const start = toDateOnly(input.startDate);
  const end = toDateOnly(input.endDate);
  const records = await prisma.dayRecord.findMany({
    where: {
      moduleInstanceId: input.moduleInstanceId,
      profileId: input.profileId,
      date: { gte: start, lte: end },
    },
    orderBy: { date: 'asc' },
  });
  const recordByDate = new Map(records.map((record) => [formatDate(record.date), record]));
  const days = [];
  for (let current = start; current <= end; current = addDays(current, 1)) {
    const date = formatDate(current);
    const record = recordByDate.get(date);
    if (record) {
      days.push({ date, isPeriod: record.isPeriod, source: lower(record.source), isExplicit: true, isDetailRecorded: isDetailRecorded(record) });
    } else {
      days.push({ date, isPeriod: false, source: null, isExplicit: false, isDetailRecorded: false });
    }
  }

  const marks: Array<{ date: string; kind: string }> = [];
  const cycles = await prisma.derivedCycle.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, profileId: input.profileId },
  });
  for (const cycle of cycles) {
    if (!cycle.derivedFromDates) continue;
    try {
      const dates = JSON.parse(cycle.derivedFromDates) as string[];
      for (const [index, date] of dates.entries()) {
        if (date >= input.startDate && date <= input.endDate) {
          marks.push({ date, kind: index === 0 ? 'period_start' : 'period' });
        }
      }
    } catch {
      // ignore malformed derived dates
    }
  }
  const prediction = await prisma.prediction.findUnique({ where: { moduleInstanceId: input.moduleInstanceId } });
  const usablePrediction = hasUsablePrediction(prediction) ? prediction : null;
  if (usablePrediction) {
    const predictionDate = formatDate(usablePrediction.predictedStartDate);
    if (predictionDate >= input.startDate && predictionDate <= input.endDate) {
      marks.push({ date: predictionDate, kind: 'prediction_start' });
    }
  }
  const today = formatDate(new Date());
  if (today >= input.startDate && today <= input.endDate) {
    marks.push({ date: today, kind: 'today' });
  }
  return {
    moduleInstanceId: input.moduleInstanceId,
    window: { startDate: input.startDate, endDate: input.endDate },
    days,
    marks,
  };
}

export async function getPredictionSummary(input: { moduleInstanceId: string; userId: string; profileId: string }) {
  await requireAccess(input.moduleInstanceId, input.userId, input.profileId);
  const prediction = await prisma.prediction.findUnique({ where: { moduleInstanceId: input.moduleInstanceId } });
  const usablePrediction = hasUsablePrediction(prediction) ? prediction : null;
  return {
    moduleInstanceId: input.moduleInstanceId,
    prediction: usablePrediction
      ? {
          predictedStartDate: formatDate(usablePrediction.predictedStartDate),
          predictionWindowStart: formatDate(usablePrediction.predictionWindowStart),
          predictionWindowEnd: formatDate(usablePrediction.predictionWindowEnd),
          basedOnCycleCount: usablePrediction.basedOnCycleCount,
        }
      : null,
  };
}

export async function recordDayDetailsBatch(input: {
  moduleInstanceId: string;
  userId: string;
  dates: string[];
  painLevel: number | null;
  flowLevel: number | null;
  colorLevel: number | null;
}) {
  if (!input.dates.length) {
    return { updatedCount: 0 };
  }

  const moduleInstance = await requireMaintenance(input.moduleInstanceId, input.userId);
  const profileId = moduleInstance.profileId;

  // Only update the non-null levels; null means "leave existing value unchanged"
  const detailUpdate: Record<string, number> = {};
  if (input.flowLevel !== null) detailUpdate.flowLevel = input.flowLevel;
  if (input.painLevel !== null) detailUpdate.painLevel = input.painLevel;
  if (input.colorLevel !== null) detailUpdate.colorLevel = input.colorLevel;

  let updatedCount = 0;
  for (const isoDate of input.dates) {
    const date = toDateOnly(isoDate);
    await prisma.dayRecord.upsert({
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
        isPeriod: false,
        painLevel: input.painLevel,
        flowLevel: input.flowLevel,
        colorLevel: input.colorLevel,
        note: null,
        source: 'MANUAL',
      },
      update: detailUpdate,
    });
    updatedCount += 1;
  }

  return { updatedCount };
}
