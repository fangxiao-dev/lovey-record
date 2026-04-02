import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../../src/domain/menstrualDefaults';
import prisma from '../../src/db/prisma';
import {
  applySingleDayPeriodAction,
  clearPeriodDay,
  clearPeriodRange,
  recordPeriodDay,
  recordPeriodRange,
} from '../../src/services/dayRecord.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    dayRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    moduleInstance: {
      findFirst: jest.fn(),
    },
    derivedCycle: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    prediction: {
      upsert: jest.fn(),
    },
    moduleSettings: {
      upsert: jest.fn(),
    },
  },
}));

describe('dayRecord.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records a period-only day without default detail levels', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'day-1',
      isPeriod: true,
      source: 'MANUAL',
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([{ date: new Date('2026-03-23'), isPeriod: true, source: 'MANUAL' }]);

    const result = await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
    });

    expect(result.dayRecord.painLevel).toBeNull();
    expect(prisma.dayRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          isPeriod: true,
          source: 'MANUAL',
          painLevel: null,
          flowLevel: null,
          colorLevel: null,
        }),
        update: expect.objectContaining({
          isPeriod: true,
          source: 'MANUAL',
        }),
      }),
    );
  });

  it('clears an explicit day record', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([]);

    const result = await clearPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
    });

    expect(result.removedDates).toEqual([]);
    expect(prisma.dayRecord.deleteMany).toHaveBeenCalled();
  });

  it('derives a single cycle even if period dates are unsorted', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'day-1',
      isPeriod: true,
      source: 'MANUAL',
      painLevel: 3,
      flowLevel: 3,
      colorLevel: 3,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-22'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-20'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-21'), isPeriod: true, source: 'MANUAL' },
    ]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-20',
    });

    expect(prisma.derivedCycle.createMany).toHaveBeenCalledWith({
      data: [
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-20'),
          endDate: new Date('2026-03-22'),
          durationDays: 3,
          derivedFromDates: JSON.stringify(['2026-03-20', '2026-03-21', '2026-03-22']),
        },
      ],
    });
  });

  it('splits cycles when there is a gap and merges when the gap is filled', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});

    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-20'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-21'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-23'), isPeriod: true, source: 'MANUAL' },
    ]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
    });

    expect(prisma.derivedCycle.createMany).toHaveBeenCalledWith({
      data: [
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-20'),
          endDate: new Date('2026-03-21'),
          durationDays: 2,
          derivedFromDates: JSON.stringify(['2026-03-20', '2026-03-21']),
        },
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-23'),
          endDate: new Date('2026-03-23'),
          durationDays: 1,
          derivedFromDates: JSON.stringify(['2026-03-23']),
        },
      ],
    });

    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-20'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-21'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-22'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-23'), isPeriod: true, source: 'MANUAL' },
    ]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-22',
    });

    expect(prisma.derivedCycle.createMany).toHaveBeenLastCalledWith({
      data: [
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-20'),
          endDate: new Date('2026-03-23'),
          durationDays: 4,
          derivedFromDates: JSON.stringify(['2026-03-20', '2026-03-21', '2026-03-22', '2026-03-23']),
        },
      ],
    });
  });

  it('predicts from the latest cycle start plus the configured fixed term', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-01'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-29'), isPeriod: true, source: 'MANUAL' },
    ]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-29',
    });

    expect(prisma.prediction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          predictedStartDate: new Date('2026-04-26T00:00:00.000Z'),
          predictionWindowStart: new Date('2026-04-24T00:00:00.000Z'),
          predictionWindowEnd: new Date('2026-04-28T00:00:00.000Z'),
          basedOnCycleCount: 2,
        }),
      }),
    );
  });

  it('ignores non-period days when deriving cycles', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-01'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-02'), isPeriod: false, source: 'MANUAL' },
      { date: new Date('2026-03-03'), isPeriod: true, source: 'MANUAL' },
    ]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-03',
    });

    expect(prisma.derivedCycle.createMany).toHaveBeenCalledWith({
      data: [
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-01'),
          durationDays: 1,
          derivedFromDates: JSON.stringify(['2026-03-01']),
        },
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-03'),
          endDate: new Date('2026-03-03'),
          durationDays: 1,
          derivedFromDates: JSON.stringify(['2026-03-03']),
        },
      ],
    });
  });

  it('stores empty prediction when no period segment start exists after recompute', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-01',
    });

    expect(prisma.prediction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          predictedStartDate: new Date('1970-01-01T00:00:00.000Z'),
          predictionWindowStart: new Date('1970-01-01T00:00:00.000Z'),
          predictionWindowEnd: new Date('1970-01-01T00:00:00.000Z'),
          basedOnCycleCount: 0,
        }),
      }),
    );
  });

  it('rebuilds the derived cycle list after clearing a middle day', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-20'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-22'), isPeriod: true, source: 'MANUAL' },
    ]);

    await clearPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-21',
    });

    expect(prisma.derivedCycle.createMany).toHaveBeenCalledWith({
      data: [
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-20'),
          endDate: new Date('2026-03-20'),
          durationDays: 1,
          derivedFromDates: JSON.stringify(['2026-03-20']),
        },
        {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          startDate: new Date('2026-03-22'),
          endDate: new Date('2026-03-22'),
          durationDays: 1,
          derivedFromDates: JSON.stringify(['2026-03-22']),
        },
      ],
    });
  });

  it('records a manual period range without adding attribute markers to newly created days', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { date: new Date('2026-03-18'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-19'), isPeriod: true, source: 'MANUAL' },
      ]);
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});

    const result = await recordPeriodRange({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      startDate: '2026-03-18',
      endDate: '2026-03-19',
    });

    expect(result.recordedDates).toEqual(['2026-03-18', '2026-03-19']);
    expect(prisma.dayRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          isPeriod: true,
          painLevel: null,
          flowLevel: null,
          colorLevel: null,
          note: null,
          source: 'MANUAL',
        }),
        update: expect.objectContaining({
          isPeriod: true,
          source: 'MANUAL',
        }),
      }),
    );
  });

  it('clears only period membership across a range and preserves explicit rows', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.findMany as jest.Mock).mockReset();
    (prisma.dayRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { date: new Date('2026-03-18'), isPeriod: true, source: 'MANUAL' },
      ])
      .mockResolvedValueOnce([]);
    (prisma.dayRecord.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await clearPeriodRange({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      startDate: '2026-03-18',
      endDate: '2026-03-20',
    });

    expect(result.clearedDates).toEqual(['2026-03-18']);
    expect(prisma.dayRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPeriod: false,
          source: 'MANUAL',
        }),
      }),
    );
  });

  it('applies revoke-start by clearing the full selected segment', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { date: new Date('2026-03-20T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-21T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-22T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      ])
      .mockResolvedValueOnce([]);
    (prisma.dayRecord.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

    const result = await applySingleDayPeriodAction({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      selectedDate: '2026-03-20',
      action: 'revoke-start',
    });

    expect(result.confirmationRequired).toBe(false);
    expect(result.appliedAction).toBe('revoke-start');
    expect(result.effect).toEqual({
      action: 'revoke-start',
      bridgeType: 'none',
      selectedDate: '2026-03-20',
      writeDates: [],
      clearDates: ['2026-03-20', '2026-03-21', '2026-03-22'],
      resultingSegment: null,
    });
    expect(prisma.dayRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          date: {
            in: [
              new Date('2026-03-20T00:00:00.000Z'),
              new Date('2026-03-21T00:00:00.000Z'),
              new Date('2026-03-22T00:00:00.000Z'),
            ],
          },
        }),
        data: expect.objectContaining({
          isPeriod: false,
          source: 'MANUAL',
        }),
      }),
    );
  });

  it('applies end-here by clearing only later dates in the same segment', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { date: new Date('2026-03-20T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-21T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-22T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-23T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-24T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      ])
      .mockResolvedValueOnce([
        { date: new Date('2026-03-20T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-21T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-22T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      ]);
    (prisma.dayRecord.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    const result = await applySingleDayPeriodAction({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      selectedDate: '2026-03-22',
      action: 'end-here',
    });

    expect(result.confirmationRequired).toBe(false);
    expect(result.appliedAction).toBe('end-here');
    expect(result.effect?.clearDates).toEqual(['2026-03-23', '2026-03-24']);
    expect(prisma.dayRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            in: [new Date('2026-03-23T00:00:00.000Z'), new Date('2026-03-24T00:00:00.000Z')],
          },
        }),
      }),
    );
  });

  it('returns confirmationRequired without mutating when a bridge action is not confirmed', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-24T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-25T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-26T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
    ]);

    const result = await applySingleDayPeriodAction({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      selectedDate: '2026-03-22',
      action: 'start',
    });

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      selectedDate: '2026-03-22',
      appliedAction: null,
      confirmationRequired: true,
      prompt: {
        required: true,
        type: 'backward',
        message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
        confirmLabel: '确认',
        cancelLabel: '取消',
      },
      effectPreview: {
        action: 'bridge-backward',
        bridgeType: 'backward',
        selectedDate: '2026-03-22',
        writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
        clearDates: [],
        resultingSegment: {
          startDate: '2026-03-22',
          endDate: '2026-03-26',
        },
      },
    });
    expect(prisma.dayRecord.upsert).not.toHaveBeenCalled();
    expect(prisma.dayRecord.updateMany).not.toHaveBeenCalled();
  });

  it('applies a confirmed bridge action and writes the resolved dates', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { date: new Date('2026-03-24T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-25T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-26T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      ])
      .mockResolvedValueOnce([
        { date: new Date('2026-03-22T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-23T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-24T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-25T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
        { date: new Date('2026-03-26T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      ]);
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});

    const result = await applySingleDayPeriodAction({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      selectedDate: '2026-03-22',
      action: 'start',
      confirmed: true,
    });

    expect(result.confirmationRequired).toBe(false);
    expect(result.appliedAction).toBe('bridge-backward');
    expect(prisma.dayRecord.upsert).toHaveBeenCalledTimes(3);
    expect(result.effect?.writeDates).toEqual(['2026-03-22', '2026-03-23', '2026-03-24']);
  });

  it('uses the start of the latest continuous period segment as the prediction anchor', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-25T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-26T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-27T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-31T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-04-01T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
    ]);

    await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-04-01',
    });

    expect(prisma.prediction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          predictedStartDate: new Date('2026-04-28T00:00:00.000Z'),
          basedOnCycleCount: 2,
        }),
      }),
    );
  });

  it('re-validates the current action before mutating and rejects stale decisions', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-20T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-21T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
      { date: new Date('2026-03-22T00:00:00.000Z'), isPeriod: true, source: 'MANUAL' },
    ]);

    await expect(
      applySingleDayPeriodAction({
        moduleInstanceId: 'module-1',
        userId: 'user-1',
        selectedDate: '2026-03-21',
        action: 'start',
      }),
    ).rejects.toMatchObject({
      code: 'SINGLE_DAY_ACTION_STALE',
      statusCode: 409,
    });
    expect(prisma.dayRecord.upsert).not.toHaveBeenCalled();
    expect(prisma.dayRecord.updateMany).not.toHaveBeenCalled();
  });
});
