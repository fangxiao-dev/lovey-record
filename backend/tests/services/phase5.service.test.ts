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
    dayRecord: { findUnique: jest.fn(), update: jest.fn() },
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

  it('returns calendar window and prediction summary', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', ownerUserId: 'user-1', profileId: 'profile-1', sharingStatus: 'PRIVATE' });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue({ id: 'day-1' });
    (prisma.derivedCycle.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue({
      predictedStartDate: new Date('2026-04-12T00:00:00.000Z'),
      predictionWindowStart: new Date('2026-04-10T00:00:00.000Z'),
      predictionWindowEnd: new Date('2026-04-14T00:00:00.000Z'),
      basedOnCycleCount: 4,
    });

    const windowResult = await getCalendarWindow({ moduleInstanceId: 'module-1', userId: 'user-1', profileId: 'profile-1', startDate: '2026-03-01', endDate: '2026-03-31' });
    const prediction = await getPredictionSummary({ moduleInstanceId: 'module-1', userId: 'user-1', profileId: 'profile-1' });

    expect(windowResult.window).toEqual({ startDate: '2026-03-01', endDate: '2026-03-31' });
    expect(prediction.prediction?.predictedStartDate).toBe('2026-04-12');
  });
});
