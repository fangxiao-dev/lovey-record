import { PrismaClient } from '@prisma/client';
import {
  buildFrontendIntegrationSeedScenarios,
  type SeedScenario,
} from '../src/testing/seedScenarios';

const prisma = new PrismaClient();

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function ensureUserId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  user: SeedScenario['ownerUser'],
) {
  const existing = await tx.user.findUnique({
    where: { openid: user.openid },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await tx.user.create({
    data: {
      id: user.id,
      openid: user.openid,
    },
    select: { id: true },
  });

  return created.id;
}

async function seedScenario(scenario: SeedScenario) {
  await prisma.$transaction(async (tx) => {
    const ownerUserId = await ensureUserId(tx, scenario.ownerUser);
    const partnerUserIds = new Map<string, string>();

    for (const partner of scenario.partnerUsers) {
      partnerUserIds.set(partner.id, await ensureUserId(tx, partner));
    }

    await tx.moduleAccess.deleteMany({
      where: { moduleInstanceId: scenario.moduleInstance.id },
    });
    await tx.dayRecord.deleteMany({
      where: { moduleInstanceId: scenario.moduleInstance.id },
    });
    await tx.derivedCycle.deleteMany({
      where: { moduleInstanceId: scenario.moduleInstance.id },
    });
    await tx.prediction.deleteMany({
      where: { moduleInstanceId: scenario.moduleInstance.id },
    });
    await tx.moduleSettings.deleteMany({
      where: { moduleInstanceId: scenario.moduleInstance.id },
    });
    await tx.moduleInstance.deleteMany({
      where: { id: scenario.moduleInstance.id },
    });
    await tx.profile.deleteMany({
      where: {
        OR: [
          { id: scenario.profile.id },
          { ownerUserId },
        ],
      },
    });

    await tx.profile.create({
      data: {
        id: scenario.profile.id,
        ownerUserId,
        displayName: scenario.profile.displayName,
      },
    });

    await tx.moduleInstance.create({
      data: {
        id: scenario.moduleInstance.id,
        moduleType: scenario.moduleInstance.moduleType,
        ownerUserId,
        profileId: scenario.moduleInstance.profileId,
        sharingStatus: scenario.moduleInstance.sharingStatus,
      },
    });

    await tx.moduleSettings.create({
      data: {
        moduleInstanceId: scenario.moduleSettings.moduleInstanceId,
        defaultPeriodDurationDays: scenario.moduleSettings.defaultPeriodDurationDays,
        defaultPredictionTermDays: scenario.moduleSettings.defaultPredictionTermDays,
      },
    });

    for (const access of scenario.moduleAccesses) {
      const resolvedUserId = access.role === 'OWNER'
        ? ownerUserId
        : partnerUserIds.get(access.userId);

      if (!resolvedUserId) {
        throw new Error(`Missing seeded partner user for ${access.userId}`);
      }

      await tx.moduleAccess.create({
        data: {
          moduleInstanceId: access.moduleInstanceId,
          userId: resolvedUserId,
          role: access.role,
          accessStatus: access.accessStatus,
          revokedAt: access.accessStatus === 'REVOKED' ? new Date() : null,
        },
      });
    }

    for (const dayRecord of scenario.dayRecords) {
      await tx.dayRecord.upsert({
        where: {
          moduleInstanceId_profileId_date: {
            moduleInstanceId: dayRecord.moduleInstanceId,
            profileId: dayRecord.profileId,
            date: toDateOnly(dayRecord.date),
          },
        },
        create: {
          id: dayRecord.id,
          moduleInstanceId: dayRecord.moduleInstanceId,
          profileId: dayRecord.profileId,
          date: toDateOnly(dayRecord.date),
          isPeriod: dayRecord.isPeriod,
          source: dayRecord.source,
          painLevel: dayRecord.painLevel,
          flowLevel: dayRecord.flowLevel,
          colorLevel: dayRecord.colorLevel,
          note: dayRecord.note,
        },
        update: {
          isPeriod: dayRecord.isPeriod,
          source: dayRecord.source,
          painLevel: dayRecord.painLevel,
          flowLevel: dayRecord.flowLevel,
          colorLevel: dayRecord.colorLevel,
          note: dayRecord.note,
        },
      });
    }

    for (const cycle of scenario.derivedCycles) {
      await tx.derivedCycle.upsert({
        where: { id: cycle.id },
        create: {
          id: cycle.id,
          moduleInstanceId: cycle.moduleInstanceId,
          profileId: cycle.profileId,
          startDate: toDateOnly(cycle.startDate),
          endDate: toDateOnly(cycle.endDate),
          durationDays: cycle.durationDays,
          derivedFromDates: JSON.stringify(cycle.derivedFromDates),
        },
        update: {
          moduleInstanceId: cycle.moduleInstanceId,
          profileId: cycle.profileId,
          startDate: toDateOnly(cycle.startDate),
          endDate: toDateOnly(cycle.endDate),
          durationDays: cycle.durationDays,
          derivedFromDates: JSON.stringify(cycle.derivedFromDates),
        },
      });
    }

    if (scenario.prediction) {
      await tx.prediction.upsert({
        where: { moduleInstanceId: scenario.prediction.moduleInstanceId },
        create: {
          id: scenario.prediction.id,
          moduleInstanceId: scenario.prediction.moduleInstanceId,
          profileId: scenario.prediction.profileId,
          predictedStartDate: toDateOnly(scenario.prediction.predictedStartDate),
          predictionWindowStart: toDateOnly(scenario.prediction.predictionWindowStart),
          predictionWindowEnd: toDateOnly(scenario.prediction.predictionWindowEnd),
          basedOnCycleCount: scenario.prediction.basedOnCycleCount,
        },
        update: {
          profileId: scenario.prediction.profileId,
          predictedStartDate: toDateOnly(scenario.prediction.predictedStartDate),
          predictionWindowStart: toDateOnly(scenario.prediction.predictionWindowStart),
          predictionWindowEnd: toDateOnly(scenario.prediction.predictionWindowEnd),
          basedOnCycleCount: scenario.prediction.basedOnCycleCount,
        },
      });
    }
  });
}

async function main() {
  const scenarios = buildFrontendIntegrationSeedScenarios();

  for (const scenario of scenarios) {
    await seedScenario(scenario);
    console.log(`Seeded ${scenario.name}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
