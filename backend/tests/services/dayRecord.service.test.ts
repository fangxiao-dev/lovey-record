import prisma from '../../src/db/prisma';
import { clearDayRecord, recordDayState, recordDateRangeAsPeriod } from '../../src/services/dayRecord.service';

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
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'day-1',
      bleedingState: 'PERIOD',
      painLevel: 3,
      flowLevel: 3,
      colorLevel: 3,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([{ date: new Date('2026-03-23'), bleedingState: 'PERIOD' }]);

    const result = await recordDayState({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
      bleedingState: 'PERIOD',
    });

    expect(result.dayRecord.painLevel).toBe(3);
    expect(prisma.dayRecord.upsert).toHaveBeenCalled();
  });

  it('clears an explicit day record', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([]);

    const result = await clearDayRecord({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
    });

    expect(result.dayRecordRemoved).toBe(true);
    expect(prisma.dayRecord.deleteMany).toHaveBeenCalled();
  });

  it('records a continuous period range', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([]);

    const result = await recordDateRangeAsPeriod({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      startDate: '2026-03-20',
      endDate: '2026-03-22',
    });

    expect(result.updatedDayCount).toBe(3);
    expect(prisma.dayRecord.upsert).toHaveBeenCalledTimes(3);
  });

  it('derives a single cycle even if period dates are unsorted', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'day-1',
      bleedingState: 'PERIOD',
      painLevel: 3,
      flowLevel: 3,
      colorLevel: 3,
    });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-22'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-20'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-21'), bleedingState: 'PERIOD' },
    ]);

    await recordDayState({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-20',
      bleedingState: 'PERIOD',
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
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});

    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-20'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-21'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-23'), bleedingState: 'PERIOD' },
    ]);

    await recordDayState({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
      bleedingState: 'PERIOD',
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
      { date: new Date('2026-03-20'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-21'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-22'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-23'), bleedingState: 'PERIOD' },
    ]);

    await recordDayState({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-22',
      bleedingState: 'PERIOD',
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
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-01'), bleedingState: 'PERIOD' },
      { date: new Date('2026-03-29'), bleedingState: 'PERIOD' },
    ]);

    await recordDayState({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-29',
      bleedingState: 'PERIOD',
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

  it('stores empty prediction when fewer than two cycles exist', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({});
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      { date: new Date('2026-03-01'), bleedingState: 'PERIOD' },
    ]);

    await recordDayState({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-01',
      bleedingState: 'PERIOD',
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
});
