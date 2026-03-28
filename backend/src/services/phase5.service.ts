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
  painLevel: number;
  flowLevel: number;
  colorLevel: number;
}) {
  const moduleInstance = await requireMaintenance(input.moduleInstanceId, input.userId);
  const record = await prisma.dayRecord.findUnique({
    where: {
      moduleInstanceId_profileId_date: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: moduleInstance.profileId,
        date: toDateOnly(input.date),
      },
    },
  });
  if (!record) throw Object.assign(new Error('DAY_RECORD_NOT_FOUND'), { code: 'DAY_RECORD_NOT_FOUND', statusCode: 404 });
  await prisma.dayRecord.update({
    where: { id: record.id },
    data: { painLevel: input.painLevel, flowLevel: input.flowLevel, colorLevel: input.colorLevel },
  });
  return { detailChanged: true, hasDeviation: input.painLevel !== 3 || input.flowLevel !== 3 || input.colorLevel !== 3 };
}

export async function recordDayNote(input: { moduleInstanceId: string; userId: string; date: string; note: string }) {
  const moduleInstance = await requireMaintenance(input.moduleInstanceId, input.userId);
  if (input.note.length > 500) {
    throw createNoteTooLongError();
  }
  const record = await prisma.dayRecord.findUnique({
    where: {
      moduleInstanceId_profileId_date: {
        moduleInstanceId: input.moduleInstanceId,
        profileId: moduleInstance.profileId,
        date: toDateOnly(input.date),
      },
    },
  });
  if (!record) throw Object.assign(new Error('DAY_RECORD_NOT_FOUND'), { code: 'DAY_RECORD_NOT_FOUND', statusCode: 404 });
  await prisma.dayRecord.update({ where: { id: record.id }, data: { note: input.note } });
  return { noteChanged: true };
}

export async function shareModuleInstance(input: { moduleInstanceId: string; userId: string; partnerUserId: string }) {
  const moduleInstance = await requireOwner(input.moduleInstanceId, input.userId);
  await prisma.moduleAccess.upsert({
    where: { moduleInstanceId_userId: { moduleInstanceId: input.moduleInstanceId, userId: input.partnerUserId } },
    create: { moduleInstanceId: input.moduleInstanceId, userId: input.partnerUserId, role: 'PARTNER', accessStatus: 'ACTIVE' },
    update: { accessStatus: 'ACTIVE', revokedAt: null, role: 'PARTNER' },
  });
  return { moduleInstanceId: moduleInstance.id, sharingStatus: 'shared', partnerUserId: input.partnerUserId, accessStatus: 'active' };
}

export async function revokeModuleAccess(input: { moduleInstanceId: string; userId: string; partnerUserId: string }) {
  const moduleInstance = await requireOwner(input.moduleInstanceId, input.userId);
  await prisma.moduleAccess.update({
    where: { moduleInstanceId_userId: { moduleInstanceId: input.moduleInstanceId, userId: input.partnerUserId } },
    data: { accessStatus: 'REVOKED', revokedAt: new Date() },
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
      days.push({ date, isPeriod: record.isPeriod, source: lower(record.source), isExplicit: true, hasDeviation: [record.painLevel, record.flowLevel, record.colorLevel].some((value) => value !== null && value !== 3) });
    } else {
      days.push({ date, isPeriod: false, source: null, isExplicit: false, hasDeviation: false });
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
  if (prediction) {
    const predictionDate = formatDate(prediction.predictedStartDate);
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
  return {
    moduleInstanceId: input.moduleInstanceId,
    prediction: prediction
      ? {
          predictedStartDate: formatDate(prediction.predictedStartDate),
          predictionWindowStart: formatDate(prediction.predictionWindowStart),
          predictionWindowEnd: formatDate(prediction.predictionWindowEnd),
          basedOnCycleCount: prediction.basedOnCycleCount,
        }
      : null,
  };
}
