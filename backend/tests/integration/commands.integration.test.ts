import request from 'supertest';
import app from '../../src/app';
import { createModuleInstance } from '../../src/services/moduleInstance.service';
import { findOrCreateUser } from '../../src/services/auth.service';
import { updateDefaultPeriodDuration } from '../../src/services/moduleSettings.service';
import { recordDayNote } from '../../src/services/phase5.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/moduleInstance.service');
jest.mock('../../src/services/moduleSettings.service');
jest.mock('../../src/services/phase5.service');

describe('Commands Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a module instance through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (createModuleInstance as jest.Mock).mockResolvedValue({
      moduleInstance: {
        id: 'module-1',
        moduleType: 'menstrual',
        ownerUserId: 'user-1',
        profileId: 'profile-1',
        sharingStatus: 'PRIVATE',
      },
      profile: { id: 'profile-1', ownerUserId: 'user-1' },
    });

    const response = await request(app)
      .post('/api/commands/createModuleInstance')
      .set('x-wx-openid', 'openid-1')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstance: {
          id: 'module-1',
          moduleType: 'menstrual',
          ownerUserId: 'user-1',
          profileId: 'profile-1',
          sharingStatus: 'PRIVATE',
        },
      },
      error: null,
    });
  });

  it('updates the default period duration through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (updateDefaultPeriodDuration as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 7,
      settingsChanged: true,
    });

    const response = await request(app)
      .post('/api/commands/updateDefaultPeriodDuration')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', defaultPeriodDurationDays: 7 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        defaultPeriodDurationDays: 7,
        settingsChanged: true,
      },
      error: null,
    });
  });

  it('returns NOTE_TOO_LONG when recording an overlong note', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordDayNote as jest.Mock).mockRejectedValue(Object.assign(new Error('Note exceeds the allowed length.'), { code: 'NOTE_TOO_LONG', statusCode: 400 }));

    const response = await request(app)
      .post('/api/commands/recordDayNote')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', date: '2026-03-23', note: 'a'.repeat(501) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'NOTE_TOO_LONG',
        message: 'Note exceeds the allowed length.',
      },
    });
  });

  it('returns MODULE_ACCESS_DENIED when a non-owner updates default period duration', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (updateDefaultPeriodDuration as jest.Mock).mockRejectedValue(Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 }));

    const response = await request(app)
      .post('/api/commands/updateDefaultPeriodDuration')
      .set('x-wx-openid', 'openid-2')
      .send({ moduleInstanceId: 'module-1', defaultPeriodDurationDays: 7 });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'MODULE_ACCESS_DENIED',
        message: 'MODULE_ACCESS_DENIED',
      },
    });
  });
});
