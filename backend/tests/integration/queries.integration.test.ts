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
      currentStatusSummary: null,
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
        currentStatusSummary: null,
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
        defaultPeriodDurationDays: 6,
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
          defaultPeriodDurationDays: 6,
        },
      },
      error: null,
    });
  });
});
