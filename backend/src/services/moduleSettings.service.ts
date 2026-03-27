import prisma from '../db/prisma';

const DEFAULT_PERIOD_DURATION_DAYS = 6;

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

export async function updateDefaultPeriodDuration(moduleInstanceId: string, defaultPeriodDurationDays: number) {
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
