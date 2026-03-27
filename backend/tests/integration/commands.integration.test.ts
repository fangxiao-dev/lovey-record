import request from 'supertest';
import app from '../../src/app';
import { createModuleInstance } from '../../src/services/moduleInstance.service';
import { findOrCreateUser } from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/moduleInstance.service');

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
});
