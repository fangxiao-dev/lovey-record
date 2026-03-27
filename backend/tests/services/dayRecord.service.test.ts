import prisma from '../../src/db/prisma';
import { clearPeriodDay, recordPeriodDay } from '../../src/services/dayRecord.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    dayRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
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

  it('records a period day with default detail levels', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'day-1',
      isPeriod: true,
      source: 'MANUAL',
      painLevel: 3,
      flowLevel: 3,
      colorLevel: 3,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([{ date: new Date('2026-03-23'), isPeriod: true, source: 'MANUAL' }]);

    const result = await recordPeriodDay({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
    });

    expect(result.dayRecord.painLevel).toBe(3);
    expect(prisma.dayRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
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
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
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
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
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
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
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

  it('uses a +/-2 day prediction window when at least two cycles exist', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
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
          predictedStartDate: new Date('2026-04-26'),
          predictionWindowStart: new Date('2026-04-24'),
          predictionWindowEnd: new Date('2026-04-28'),
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
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
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

  it('stores empty prediction when fewer than two cycles exist', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-01'), isPeriod: true, source: 'MANUAL' },
    ]);

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
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({ defaultPeriodDurationDays: 6 });
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
});
