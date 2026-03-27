import request from 'supertest';
import app from '../../src/app';
import { createModuleInstance } from '../../src/services/moduleInstance.service';
import { findOrCreateUser } from '../../src/services/auth.service';
import { updateDefaultPeriodDuration } from '../../src/services/moduleSettings.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/moduleInstance.service');
jest.mock('../../src/services/moduleSettings.service');

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
});
