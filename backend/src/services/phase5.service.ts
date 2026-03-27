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

async function requireOwner(moduleInstanceId: string, userId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: { id: moduleInstanceId, ownerUserId: userId },
  });
  if (!moduleInstance) {
    throw Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 });
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
  const moduleInstance = await requireOwner(input.moduleInstanceId, input.userId);
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
  return { detailChanged: true };
}

export async function recordDayNote(input: { moduleInstanceId: string; userId: string; date: string; note: string }) {
  const moduleInstance = await requireOwner(input.moduleInstanceId, input.userId);
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
  await requireOwner(input.moduleInstanceId, input.userId);
  return {
    moduleInstanceId: input.moduleInstanceId,
    window: { startDate: input.startDate, endDate: input.endDate },
    days: [],
    marks: [],
  };
}

export async function getPredictionSummary(input: { moduleInstanceId: string; userId: string; profileId: string }) {
  await requireOwner(input.moduleInstanceId, input.userId);
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
