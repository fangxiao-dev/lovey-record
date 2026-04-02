import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../../src/domain/menstrualDefaults';
import prisma from '../../src/db/prisma';
import {
  ensureModuleSettings,
  getDefaultPeriodDurationDays,
  getDefaultPredictionTermDays,
  updateDefaultPeriodDuration,
  updateDefaultPredictionTerm,
} from '../../src/services/moduleSettings.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: {
      findFirst: jest.fn(),
    },
    moduleSettings: {
      upsert: jest.fn(),
    },
    derivedCycle: {
      findMany: jest.fn(),
    },
    prediction: {
      upsert: jest.fn(),
    },
  },
}));

describe('moduleSettings.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the default period duration constant', () => {
    expect(getDefaultPeriodDurationDays()).toBe(DEFAULT_PERIOD_DURATION_DAYS);
  });

  it('returns the default prediction term constant', () => {
    expect(getDefaultPredictionTermDays()).toBe(DEFAULT_PREDICTION_TERM_DAYS);
  });

  it('creates default settings when missing', async () => {
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });

    await ensureModuleSettings('module-1');

    expect(prisma.moduleSettings.upsert).toHaveBeenCalledWith({
      where: { moduleInstanceId: 'module-1' },
      create: {
        moduleInstanceId: 'module-1',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      update: {},
    });
  });

  it('updates the default period duration', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 7,
    });

    const result = await updateDefaultPeriodDuration('module-1', 7, 'user-1');

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 7,
      settingsChanged: true,
    });
    expect(prisma.moduleSettings.upsert).toHaveBeenCalledWith({
      where: { moduleInstanceId: 'module-1' },
      create: {
        moduleInstanceId: 'module-1',
        defaultPeriodDurationDays: 7,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      update: { defaultPeriodDurationDays: 7 },
    });
  });

  it('rejects non-owners when updating the default period duration', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(updateDefaultPeriodDuration('module-1', 7, 'user-2')).rejects.toMatchObject({
      code: 'MODULE_ACCESS_DENIED',
      statusCode: 403,
    });
  });

  it('updates the default prediction term', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPredictionTermDays: 29,
    });
    (prisma.derivedCycle.findMany as jest.Mock).mockResolvedValue([
      { startDate: new Date('2026-03-01') },
      { startDate: new Date('2026-03-29') },
    ]);

    const result = await updateDefaultPredictionTerm('module-1', 29, 'user-1');

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      defaultPredictionTermDays: 29,
      settingsChanged: true,
    });
    expect(prisma.moduleSettings.upsert).toHaveBeenCalledWith({
      where: { moduleInstanceId: 'module-1' },
      create: {
        moduleInstanceId: 'module-1',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: 29,
      },
      update: { defaultPredictionTermDays: 29 },
    });
    expect(prisma.derivedCycle.findMany).toHaveBeenCalledWith({
      where: { moduleInstanceId: 'module-1', profileId: 'profile-1' },
      orderBy: { startDate: 'asc' },
    });
    expect(prisma.prediction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          predictedStartDate: new Date('2026-04-27T00:00:00.000Z'),
          predictionWindowStart: new Date('2026-04-25T00:00:00.000Z'),
          predictionWindowEnd: new Date('2026-04-29T00:00:00.000Z'),
          basedOnCycleCount: 2,
        }),
      }),
    );
  });
});
