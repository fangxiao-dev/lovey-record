import prisma from '../../src/db/prisma';
import {
  recordDayDetails,
  recordDayNote,
  shareModuleInstance,
  revokeModuleAccess,
  getCalendarWindow,
  getPredictionSummary,
} from '../../src/services/phase5.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: { findFirst: jest.fn() },
    dayRecord: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    moduleAccess: { findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    derivedCycle: { findMany: jest.fn() },
    prediction: { findUnique: jest.fn() },
  },
}));

describe('phase5.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates details on an existing day record', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', profileId: 'profile-1', ownerUserId: 'user-1' });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue({ id: 'day-1' });
    (prisma.dayRecord.update as jest.Mock).mockResolvedValue({ id: 'day-1', painLevel: 4, flowLevel: 2, colorLevel: 5 });

    const result = await recordDayDetails({ moduleInstanceId: 'module-1', userId: 'user-1', date: '2026-03-23', painLevel: 4, flowLevel: 2, colorLevel: 5 });

    expect(result.detailChanged).toBe(true);
    expect(prisma.dayRecord.update).toHaveBeenCalledWith(expect.objectContaining({ data: { painLevel: 4, flowLevel: 2, colorLevel: 5 } }));
  });

  it('writes a note to an existing day record', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', profileId: 'profile-1', ownerUserId: 'user-1' });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue({ id: 'day-1' });
    (prisma.dayRecord.update as jest.Mock).mockResolvedValue({ id: 'day-1' });

    const result = await recordDayNote({ moduleInstanceId: 'module-1', userId: 'user-1', date: '2026-03-23', note: 'short note' });

    expect(result.noteChanged).toBe(true);
    expect(prisma.dayRecord.update).toHaveBeenCalledWith(expect.objectContaining({ data: { note: 'short note' } }));
  });

  it('shares and revokes module access', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', ownerUserId: 'user-1', profileId: 'profile-1', sharingStatus: 'PRIVATE' });
    (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.moduleAccess.upsert as jest.Mock).mockResolvedValue({});
    (prisma.moduleAccess.update as jest.Mock).mockResolvedValue({});

    const shared = await shareModuleInstance({ moduleInstanceId: 'module-1', userId: 'user-1', partnerUserId: 'user-2' });
    const revoked = await revokeModuleAccess({ moduleInstanceId: 'module-1', userId: 'user-1', partnerUserId: 'user-2' });

    expect(shared.sharingStatus).toBe('shared');
    expect(revoked.sharingStatus).toBe('private');
  });

  it('returns calendar window days with implicit none and marks', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-21T00:00:00.000Z'));
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', ownerUserId: 'user-1', profileId: 'profile-1', sharingStatus: 'PRIVATE' });
    (prisma.dayRecord.findMany as jest.Mock).mockResolvedValue([
      {
        date: new Date('2026-03-20T00:00:00.000Z'),
        bleedingState: 'PERIOD',
      },
      {
        date: new Date('2026-03-22T00:00:00.000Z'),
        bleedingState: 'SPOTTING',
      },
    ]);
    (prisma.derivedCycle.findMany as jest.Mock).mockResolvedValue([
      {
        derivedFromDates: JSON.stringify(['2026-03-20']),
      },
    ]);
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue({
      predictedStartDate: new Date('2026-03-22T00:00:00.000Z'),
      predictionWindowStart: new Date('2026-03-20T00:00:00.000Z'),
      predictionWindowEnd: new Date('2026-03-24T00:00:00.000Z'),
      basedOnCycleCount: 2,
    });

    const windowResult = await getCalendarWindow({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      profileId: 'profile-1',
      startDate: '2026-03-20',
      endDate: '2026-03-22',
    });

    expect(windowResult.window).toEqual({ startDate: '2026-03-20', endDate: '2026-03-22' });
    expect(windowResult.days).toEqual([
      { date: '2026-03-20', bleedingState: 'period', isExplicit: true },
      { date: '2026-03-21', bleedingState: 'none', isExplicit: false },
      { date: '2026-03-22', bleedingState: 'spotting', isExplicit: true },
    ]);
    expect(windowResult.marks).toEqual(
      expect.arrayContaining([
        { date: '2026-03-20', kind: 'period' },
        { date: '2026-03-21', kind: 'today' },
        { date: '2026-03-22', kind: 'prediction_start' },
      ]),
    );
    jest.useRealTimers();
  });

  it('returns prediction summary shape', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', ownerUserId: 'user-1', profileId: 'profile-1', sharingStatus: 'PRIVATE' });
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue({
      predictedStartDate: new Date('2026-04-12T00:00:00.000Z'),
      predictionWindowStart: new Date('2026-04-10T00:00:00.000Z'),
      predictionWindowEnd: new Date('2026-04-14T00:00:00.000Z'),
      basedOnCycleCount: 4,
    });

    const prediction = await getPredictionSummary({ moduleInstanceId: 'module-1', userId: 'user-1', profileId: 'profile-1' });

    expect(prediction).toEqual({
      moduleInstanceId: 'module-1',
      prediction: {
        predictedStartDate: '2026-04-12',
        predictionWindowStart: '2026-04-10',
        predictionWindowEnd: '2026-04-14',
        basedOnCycleCount: 4,
      },
    });
  });
});
