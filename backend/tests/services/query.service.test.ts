import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../../src/domain/menstrualDefaults';
import prisma from '../../src/db/prisma';
import { getDayRecordDetail, getModuleAccessState, getModuleHomeView, getModuleSettings } from '../../src/services/query.service';

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
    moduleSettings: {
      upsert: jest.fn(),
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
      isPeriod: true,
      source: 'MANUAL',
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
      isPeriod: true,
      painLevel: 3,
      flowLevel: 4,
      colorLevel: 2,
      note: 'note',
      source: 'manual',
      isExplicit: true,
      isDetailRecorded: true,
    });
  });

  it('does not treat note-only records as detail-recorded', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
    });
    (prisma.dayRecord.findUnique as jest.Mock).mockResolvedValue({
      date: new Date('2026-03-24T00:00:00.000Z'),
      isPeriod: false,
      source: 'MANUAL',
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
      note: 'late sleep',
    });

    const result = await getDayRecordDetail({
      moduleInstanceId: 'module-1',
      profileId: 'profile-1',
      date: '2026-03-24',
      userId: 'user-1',
    });

    expect(result.dayRecord).toEqual({
      date: '2026-03-24',
      isPeriod: false,
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
      note: 'late sleep',
      source: 'manual',
      isExplicit: true,
      isDetailRecorded: false,
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
      isPeriod: false,
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
      note: null,
      source: null,
      isExplicit: false,
      isDetailRecorded: false,
    });
  });

  it('returns module access state with active partners only', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      ownerUserId: 'user-owner',
      sharingStatus: 'PRIVATE',
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

  it('returns private access state when no active partner remains even if stored sharingStatus is stale shared', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      ownerUserId: 'user-owner',
      sharingStatus: 'SHARED',
    });
    (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-owner', role: 'OWNER', accessStatus: 'ACTIVE' },
      { userId: 'user-partner', role: 'PARTNER', accessStatus: 'REVOKED' },
    ]);

    const result = await getModuleAccessState({
      moduleInstanceId: 'module-1',
      userId: 'user-owner',
    });

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      sharingStatus: 'private',
      ownerUserId: 'user-owner',
      activePartners: [],
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
    expect(result.currentStatus).toBe('in_period');
    expect(result.statusCard).toEqual({
      label: '经期中',
    });
    expect(result.currentSegment).toEqual({
      startDate: '2026-03-20',
      endDate: '2026-03-24',
      durationDays: 5,
    });
    expect(result.previousSegment).toBeNull();
    expect(result.currentStatusSummary).toEqual({
      currentStatus: 'in_period',
      anchorDate: '2026-03-20',
      currentSegment: {
        startDate: '2026-03-20',
        endDate: '2026-03-24',
        durationDays: 5,
      },
      statusCard: {
        label: '经期中',
      },
      previousSegment: null,
    });
    expect(result.calendarMarks).toEqual(
      expect.arrayContaining([
        { date: '2026-03-20', kind: 'period_start' },
        { date: '2026-03-23', kind: 'today' },
        { date: '2026-04-12', kind: 'prediction_start' },
      ]),
    );
    jest.useRealTimers();
  });

  it('expands the visible window to include prediction range when present', async () => {
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

    expect(result.visibleWindow).toEqual({
      kind: 'cycle_window',
      startDate: '2026-03-20',
      endDate: '2026-04-14',
    });
    jest.useRealTimers();
  });

  it('keeps the end date inclusive when determining in-period status', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-24T12:30:00.000Z'));
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
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getModuleHomeView({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });

    expect(result.currentStatus).toBe('in_period');
    expect(result.statusCard?.label).toBe('经期中');
    jest.useRealTimers();
  });

  it('returns out-of-period while preserving the latest segment and previous segment references', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-03T00:00:00.000Z'));
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
      sharingStatus: 'PRIVATE',
    });
    (prisma.derivedCycle.findMany as jest.Mock).mockResolvedValue([
      {
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-03-05T00:00:00.000Z'),
        durationDays: 5,
        derivedFromDates: JSON.stringify([
          '2026-03-01',
          '2026-03-02',
          '2026-03-03',
          '2026-03-04',
          '2026-03-05',
        ]),
      },
      {
        startDate: new Date('2026-03-29T00:00:00.000Z'),
        endDate: new Date('2026-03-30T00:00:00.000Z'),
        durationDays: 2,
        derivedFromDates: JSON.stringify([
          '2026-03-29',
          '2026-03-30',
        ]),
      },
    ]);
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue({
      predictedStartDate: new Date('2026-04-24T00:00:00.000Z'),
      predictionWindowStart: new Date('2026-04-22T00:00:00.000Z'),
      predictionWindowEnd: new Date('2026-04-26T00:00:00.000Z'),
      basedOnCycleCount: 4,
    });

    const result = await getModuleHomeView({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });

    expect(result.currentStatus).toBe('out_of_period');
    expect(result.statusCard).toEqual({
      label: '不在经期中',
    });
    expect(result.currentSegment).toEqual({
      startDate: '2026-03-29',
      endDate: '2026-03-30',
      durationDays: 2,
    });
    expect(result.previousSegment).toEqual({
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      durationDays: 5,
    });
    expect(result.currentStatusSummary).toEqual({
      currentStatus: 'out_of_period',
      anchorDate: '2026-03-29',
      currentSegment: {
        startDate: '2026-03-29',
        endDate: '2026-03-30',
        durationDays: 2,
      },
      statusCard: {
        label: '不在经期中',
      },
      previousSegment: {
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        durationDays: 5,
      },
    });
    jest.useRealTimers();
  });

  it('returns out-of-period defaults when no segment exists', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-03T00:00:00.000Z'));
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
      sharingStatus: 'PRIVATE',
    });
    (prisma.derivedCycle.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.prediction.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getModuleHomeView({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });

    expect(result.currentStatus).toBe('out_of_period');
    expect(result.statusCard).toEqual({
      label: '不在经期中',
    });
    expect(result.currentSegment).toBeNull();
    expect(result.previousSegment).toBeNull();
    expect(result.currentStatusSummary).toEqual({
      currentStatus: 'out_of_period',
      anchorDate: null,
      currentSegment: null,
      statusCard: {
        label: '不在经期中',
      },
      previousSegment: null,
    });
    jest.useRealTimers();
  });

  it('suppresses sentinel prediction rows when no usable prediction exists', async () => {
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
      predictedStartDate: new Date('1970-01-01T00:00:00.000Z'),
      predictionWindowStart: new Date('1970-01-01T00:00:00.000Z'),
      predictionWindowEnd: new Date('1970-01-01T00:00:00.000Z'),
      basedOnCycleCount: 0,
    });

    const result = await getModuleHomeView({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });

    expect(result.visibleWindow).toEqual({
      kind: 'cycle_window',
      startDate: '2026-03-20',
      endDate: '2026-03-24',
    });
    expect(result.calendarMarks).not.toEqual(
      expect.arrayContaining([{ date: '1970-01-01', kind: 'prediction_start' }]),
    );
    expect(result.predictionSummary).toBeNull();
    jest.useRealTimers();
  });

  it('returns module settings for an accessible module instance', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      profileId: 'profile-1',
      ownerUserId: 'user-1',
      sharingStatus: 'PRIVATE',
    });
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
      defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
    });

    const result = await getModuleSettings({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      moduleSettings: {
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
    });
  });
});
