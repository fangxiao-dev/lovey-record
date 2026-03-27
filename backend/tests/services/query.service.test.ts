import prisma from '../../src/db/prisma';
import { getDayRecordDetail, getModuleAccessState, getModuleHomeView } from '../../src/services/query.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    dayRecord: {
      findUnique: jest.fn(),
    },
    derivedCycle: {
      findMany: jest.fn(),
    },
    prediction: {
      findUnique: jest.fn(),
    },
    moduleAccess: {
      findMany: jest.fn(),
    },
  },
}));

describe('query.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns explicit day record detail when record exists', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue({
      date: new Date('2026-03-23T00:00:00.000Z'),
      bleedingState: 'PERIOD',
      painLevel: 3,
      flowLevel: 4,
      colorLevel: 2,
      note: 'note',
    });

    const result = await getDayRecordDetail({
      moduleInstanceId: 'module-1',
      profileId: 'profile-1',
      date: '2026-03-23',
      userId: 'user-1',
    });

    expect(result.dayRecord).toEqual({
      date: '2026-03-23',
      bleedingState: 'period',
      painLevel: 3,
      flowLevel: 4,
      colorLevel: 2,
      note: 'note',
      isExplicit: true,
    });
  });

  it('returns implicit none when no day record exists', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getDayRecordDetail({
      moduleInstanceId: 'module-1',
      profileId: 'profile-1',
      date: '2026-03-23',
      userId: 'user-1',
    });

    expect(result.dayRecord).toEqual({
      date: '2026-03-23',
      bleedingState: 'none',
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
      note: null,
      isExplicit: false,
    });
  });

  it('returns module access state with active partners only', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      ownerUserId: 'user-owner',
      sharingStatus: 'SHARED',
    });
    (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-partner', role: 'PARTNER', accessStatus: 'ACTIVE' },
      { userId: 'user-owner', role: 'OWNER', accessStatus: 'ACTIVE' },
    ]);

    const result = await getModuleAccessState({
      moduleInstanceId: 'module-1',
      userId: 'user-owner',
    });

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      sharingStatus: 'shared',
      ownerUserId: 'user-owner',
      activePartners: [
        { userId: 'user-partner', role: 'partner', accessStatus: 'active' },
      ],
    });
  });

  it('returns module home view using derived cycles and prediction', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-23T00:00:00.000Z'));
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
      sharingStatus: 'PRIVATE',
    });
    (prisma.derivedCycle.findMany as jest.Mock).mockResolvedValue([
      {
        startDate: new Date('2026-03-20T00:00:00.000Z'),
        endDate: new Date('2026-03-24T00:00:00.000Z'),
        durationDays: 5,
        derivedFromDates: JSON.stringify([
          '2026-03-20',
          '2026-03-21',
          '2026-03-22',
          '2026-03-23',
          '2026-03-24',
        ]),
      },
    ]);
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue({
      predictedStartDate: new Date('2026-04-12T00:00:00.000Z'),
      predictionWindowStart: new Date('2026-04-10T00:00:00.000Z'),
      predictionWindowEnd: new Date('2026-04-14T00:00:00.000Z'),
      basedOnCycleCount: 4,
    });

    const result = await getModuleHomeView({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });

    expect(result.moduleInstanceId).toBe('module-1');
    expect(result.sharingStatus).toBe('private');
    expect(result.currentStatusSummary?.status).toBe('in_period');
    expect(result.calendarMarks).toEqual(
      expect.arrayContaining([
        { date: '2026-03-20', kind: 'period' },
        { date: '2026-03-23', kind: 'today' },
        { date: '2026-04-12', kind: 'prediction_start' },
      ]),
    );
    jest.useRealTimers();
  });
});
