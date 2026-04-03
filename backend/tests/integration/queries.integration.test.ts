import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../../src/domain/menstrualDefaults';
import request from 'supertest';
import app from '../../src/app';
import { findOrCreateUser } from '../../src/services/auth.service';
import { getDayRecordDetail, getModuleAccessState, getModuleHomeView, getModuleSettings } from '../../src/services/query.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/query.service');

describe('Queries Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns module home view', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (getModuleHomeView as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      sharingStatus: 'private',
      currentStatus: 'out_of_period',
      statusCard: {
        status: 'out_of_period',
        label: '非经期',
        rangeText: null,
      },
      currentSegment: null,
      previousSegment: null,
      currentStatusSummary: {
        status: 'out_of_period',
        anchorDate: null,
        currentSegment: null,
        statusCard: {
          status: 'out_of_period',
          label: '非经期',
          rangeText: null,
        },
        previousSegment: null,
      },
      visibleWindow: null,
      calendarMarks: [],
      selectedDay: null,
      predictionSummary: null,
    });

    const response = await request(app)
      .get('/api/queries/getModuleHomeView')
      .set('x-wx-openid', 'openid-1')
      .query({ moduleInstanceId: 'module-1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        sharingStatus: 'private',
        currentStatus: 'out_of_period',
        statusCard: {
          status: 'out_of_period',
          label: '非经期',
          rangeText: null,
        },
        currentSegment: null,
        previousSegment: null,
        currentStatusSummary: {
          status: 'out_of_period',
          anchorDate: null,
          currentSegment: null,
          statusCard: {
            status: 'out_of_period',
            label: '非经期',
            rangeText: null,
          },
          previousSegment: null,
        },
        visibleWindow: null,
        calendarMarks: [],
        selectedDay: null,
        predictionSummary: null,
      },
      error: null,
    });
  });

  it('returns day record detail', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (getDayRecordDetail as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      profileId: 'profile-1',
      dayRecord: {
        date: '2026-03-23',
        isPeriod: true,
        painLevel: 3,
        flowLevel: 3,
        colorLevel: 3,
        note: null,
        source: 'manual',
        isExplicit: true,
        hasDeviation: false,
      },
    });

    const response = await request(app)
      .get('/api/queries/getDayRecordDetail')
      .set('x-wx-openid', 'openid-1')
      .query({ moduleInstanceId: 'module-1', profileId: 'profile-1', date: '2026-03-23' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        profileId: 'profile-1',
        dayRecord: {
          date: '2026-03-23',
          isPeriod: true,
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
          source: 'manual',
          isExplicit: true,
          hasDeviation: false,
        },
      },
      error: null,
    });
  });

  it('returns module access state', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (getModuleAccessState as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      sharingStatus: 'shared',
      ownerUserId: 'user-1',
      activePartners: [{ userId: 'user-2', role: 'partner', accessStatus: 'active' }],
    });

    const response = await request(app)
      .get('/api/queries/getModuleAccessState')
      .set('x-wx-openid', 'openid-1')
      .query({ moduleInstanceId: 'module-1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        sharingStatus: 'shared',
        ownerUserId: 'user-1',
        activePartners: [{ userId: 'user-2', role: 'partner', accessStatus: 'active' }],
      },
      error: null,
    });
  });

  it('returns module settings', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (getModuleSettings as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      moduleSettings: {
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
    });

    const response = await request(app)
      .get('/api/queries/getModuleSettings')
      .set('x-wx-openid', 'openid-1')
      .query({ moduleInstanceId: 'module-1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        moduleSettings: {
          defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
          defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
        },
      },
      error: null,
    });
  });

  it('returns the resolved single-day period action for a bridge candidate', async () => {
    const queryService = jest.requireMock('../../src/services/query.service') as Record<string, jest.Mock>;

    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    queryService.getSingleDayPeriodAction = jest.fn().mockResolvedValue({
      selectedDate: '2026-03-22',
      role: 'not-period',
      chip: {
        text: '月经',
        selected: false,
      },
      resolvedAction: {
        action: 'start',
        bridgeType: 'backward',
        prompt: {
          required: true,
          type: 'backward',
          message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
          confirmLabel: '确认',
          cancelLabel: '取消',
        },
        effect: {
          action: 'bridge-backward',
          bridgeType: 'backward',
          selectedDate: '2026-03-22',
          writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
          clearDates: [],
          resultingSegment: {
            startDate: '2026-03-22',
            endDate: '2026-03-28',
          },
        },
      },
    });

    const response = await request(app)
      .get('/api/queries/getSingleDayPeriodAction')
      .set('x-wx-openid', 'openid-1')
      .query({ moduleInstanceId: 'module-1', date: '2026-03-22' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        selectedDate: '2026-03-22',
        role: 'not-period',
        chip: {
          text: '月经',
          selected: false,
        },
        resolvedAction: {
          action: 'start',
          bridgeType: 'backward',
          prompt: {
            required: true,
            type: 'backward',
            message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
            confirmLabel: '确认',
            cancelLabel: '取消',
          },
          effect: {
            action: 'bridge-backward',
            bridgeType: 'backward',
            selectedDate: '2026-03-22',
            writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
            clearDates: [],
            resultingSegment: {
              startDate: '2026-03-22',
              endDate: '2026-03-28',
            },
          },
        },
      },
      error: null,
    });
  });
});
