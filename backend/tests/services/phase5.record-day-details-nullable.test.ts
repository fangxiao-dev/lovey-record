import prisma from '../../src/db/prisma';
import { recordDayDetails } from '../../src/services/phase5.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: { findFirst: jest.fn() },
    dayRecord: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  },
}));

describe('recordDayDetails nullable detail fields', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows clearing all daily detail levels with null values', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', profileId: 'profile-1', ownerUserId: 'user-1' });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue({ id: 'day-1' });
    (prisma.dayRecord.update as jest.Mock).mockResolvedValue({ id: 'day-1', painLevel: null, flowLevel: null, colorLevel: null });

    const result = await recordDayDetails({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-23',
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
    });

    expect(result).toEqual({
      detailChanged: true,
      isDetailRecorded: false,
    });
    expect(prisma.dayRecord.update).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        painLevel: null,
        flowLevel: null,
        colorLevel: null,
      },
    }));
  });

  it('creates an explicit non-period day record when details are recorded on an empty day', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'module-1', profileId: 'profile-1', ownerUserId: 'user-1' });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'day-16',
      isPeriod: false,
      painLevel: 2,
      flowLevel: null,
      colorLevel: null,
      source: 'MANUAL',
    });

    const result = await recordDayDetails({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      date: '2026-03-16',
      painLevel: 2,
      flowLevel: null,
      colorLevel: null,
    });

    expect(result).toEqual({
      detailChanged: true,
      isDetailRecorded: true,
    });
    expect(prisma.dayRecord.upsert).toHaveBeenCalledWith({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId: 'module-1',
          profileId: 'profile-1',
          date: new Date('2026-03-16T00:00:00.000Z'),
        },
      },
      create: {
        moduleInstanceId: 'module-1',
        profileId: 'profile-1',
        date: new Date('2026-03-16T00:00:00.000Z'),
        isPeriod: false,
        painLevel: 2,
        flowLevel: null,
        colorLevel: null,
        note: null,
        source: 'MANUAL',
      },
      update: {
        painLevel: 2,
        flowLevel: null,
        colorLevel: null,
      },
    });
  });
});
