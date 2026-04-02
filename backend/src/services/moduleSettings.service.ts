import prisma from '../db/prisma';
import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../domain/menstrualDefaults';
import { recomputePredictionFromCycles } from './prediction.service';

function createAccessError() {
  return Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 });
}

export function getDefaultPeriodDurationDays() {
  return DEFAULT_PERIOD_DURATION_DAYS;
}

export function getDefaultPredictionTermDays() {
  return DEFAULT_PREDICTION_TERM_DAYS;
}

export async function ensureModuleSettings(moduleInstanceId: string) {
  return prisma.moduleSettings.upsert({
    where: { moduleInstanceId },
    create: {
      moduleInstanceId,
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
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
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
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

export async function updateDefaultPredictionTerm(moduleInstanceId: string, defaultPredictionTermDays: number, userId: string) {
  const moduleInstance = await requireOwner(moduleInstanceId, userId);
  const settings = await prisma.moduleSettings.upsert({
    where: { moduleInstanceId },
    create: {
      moduleInstanceId,
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays,
    },
    update: {
      defaultPredictionTermDays,
    },
  });

  const cycles = await prisma.derivedCycle.findMany({
    where: { moduleInstanceId, profileId: moduleInstance.profileId },
    orderBy: { startDate: 'asc' },
  });
  await recomputePredictionFromCycles(
    moduleInstanceId,
    moduleInstance.profileId,
    cycles.map((cycle) => ({ startDate: cycle.startDate })),
    settings.defaultPredictionTermDays,
  );

  return {
    moduleInstanceId: settings.moduleInstanceId,
    defaultPredictionTermDays: settings.defaultPredictionTermDays,
    settingsChanged: true,
  };
}
