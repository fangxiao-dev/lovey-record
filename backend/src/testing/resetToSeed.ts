import { PrismaClient } from '@prisma/client';
import { buildFrontendIntegrationSeedScenarios, type SeedScenario } from './seedScenarios';

const prisma = new PrismaClient();

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function seedScenario(scenario: SeedScenario) {
  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { openid: scenario.ownerUser.openid },
      create: { id: scenario.ownerUser.id, openid: scenario.ownerUser.openid },
      update: {},
    });

    for (const partner of scenario.partnerUsers) {
      await tx.user.upsert({
        where: { openid: partner.openid },
        create: { id: partner.id, openid: partner.openid },
        update: {},
      });
    }

    await tx.profile.upsert({
      where: { ownerUserId: scenario.profile.ownerUserId },
      create: {
        id: scenario.profile.id,
        ownerUserId: scenario.profile.ownerUserId,
        displayName: scenario.profile.displayName,
      },
      update: { displayName: scenario.profile.displayName },
    });

    await tx.moduleInstance.upsert({
      where: { id: scenario.moduleInstance.id },
      create: {
        id: scenario.moduleInstance.id,
        moduleType: scenario.moduleInstance.moduleType,
        ownerUserId: scenario.moduleInstance.ownerUserId,
        profileId: scenario.moduleInstance.profileId,
        sharingStatus: scenario.moduleInstance.sharingStatus,
      },
      update: {
        moduleType: scenario.moduleInstance.moduleType,
        ownerUserId: scenario.moduleInstance.ownerUserId,
        profileId: scenario.moduleInstance.profileId,
        sharingStatus: scenario.moduleInstance.sharingStatus,
      },
    });

    await tx.moduleAccess.deleteMany({ where: { moduleInstanceId: scenario.moduleInstance.id } });
    await tx.dayRecord.deleteMany({ where: { moduleInstanceId: scenario.moduleInstance.id } });
    await tx.derivedCycle.deleteMany({ where: { moduleInstanceId: scenario.moduleInstance.id } });
    await tx.prediction.deleteMany({ where: { moduleInstanceId: scenario.moduleInstance.id } });
    await tx.moduleSettings.deleteMany({ where: { moduleInstanceId: scenario.moduleInstance.id } });

    await tx.moduleSettings.upsert({
      where: { moduleInstanceId: scenario.moduleSettings.moduleInstanceId },
      create: {
        moduleInstanceId: scenario.moduleSettings.moduleInstanceId,
        defaultPeriodDurationDays: scenario.moduleSettings.defaultPeriodDurationDays,
      },
      update: { defaultPeriodDurationDays: scenario.moduleSettings.defaultPeriodDurationDays },
    });

    for (const access of scenario.moduleAccesses) {
      await tx.moduleAccess.upsert({
        where: { moduleInstanceId_userId: { moduleInstanceId: access.moduleInstanceId, userId: access.userId } },
        create: {
          moduleInstanceId: access.moduleInstanceId,
          userId: access.userId,
          role: access.role,
          accessStatus: access.accessStatus,
        },
        update: {
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

export async function resetToSeed() {
  const scenarios = buildFrontendIntegrationSeedScenarios();
  const results: string[] = [];
  for (const scenario of scenarios) {
    await seedScenario(scenario);
    results.push(scenario.name);
  }
  return results;
}
