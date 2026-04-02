import prisma from '../db/prisma';

type PredictionCycle = {
  startDate: Date;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function derivePrediction(cycles: PredictionCycle[], predictionTermDays: number) {
  if (cycles.length < 1) {
    return null;
  }

  const latestCycle = cycles[cycles.length - 1];
  const predicted = addDays(latestCycle.startDate, predictionTermDays);
  return {
    predictedStartDate: predicted,
    predictionWindowStart: addDays(predicted, -2),
    predictionWindowEnd: addDays(predicted, 2),
    basedOnCycleCount: cycles.length,
  };
}

export async function recomputePredictionFromCycles(
  moduleInstanceId: string,
  profileId: string,
  cycles: PredictionCycle[],
  predictionTermDays: number,
) {
  const prediction = derivePrediction(cycles, predictionTermDays);

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
