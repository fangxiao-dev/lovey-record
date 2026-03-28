import prisma from '../db/prisma';

const DEFAULT_PERIOD_DURATION_DAYS = 6;

function createAccessError() {
  return Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 });
}

export function getDefaultPeriodDurationDays() {
  return DEFAULT_PERIOD_DURATION_DAYS;
}

export async function ensureModuleSettings(moduleInstanceId: string) {
  return prisma.moduleSettings.upsert({
    where: { moduleInstanceId },
    create: {
      moduleInstanceId,
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    },
    update: {},
  });
}

export async function getModuleSettings(moduleInstanceId: string) {
  return ensureModuleSettings(moduleInstanceId);
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

export async function updateDefaultPeriodDuration(moduleInstanceId: string, defaultPeriodDurationDays: number, userId: string) {
  await requireOwner(moduleInstanceId, userId);
  const settings = await prisma.moduleSettings.upsert({
    where: { moduleInstanceId },
    create: {
      moduleInstanceId,
      defaultPeriodDurationDays,
    },
    update: {
      defaultPeriodDurationDays,
    },
  });

  return {
    moduleInstanceId: settings.moduleInstanceId,
    defaultPeriodDurationDays: settings.defaultPeriodDurationDays,
    settingsChanged: true,
  };
}
