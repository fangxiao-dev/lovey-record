import request from 'supertest';
import app from '../../src/app';
import { findOrCreateUser } from '../../src/services/auth.service';
import {
  createInviteToken,
  validateInviteToken,
  acceptInvite,
  leaveModule,
  getModuleMembers,
} from '../../src/services/sharing.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/sharing.service');

describe('Sharing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/commands/createInviteToken returns token', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (createInviteToken as jest.Mock).mockResolvedValue({
      token: 'abc',
      expiresAt: '2026-04-10T00:00:00.000Z',
    });

    const res = await request(app)
      .post('/api/commands/createInviteToken')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'mod-1' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      data: { token: 'abc', expiresAt: '2026-04-10T00:00:00.000Z' },
      error: null,
    });
  });

  it('GET /api/queries/validateInviteToken returns module info', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (validateInviteToken as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'mod-1',
      moduleType: 'menstrual',
      accessRole: 'VIEWER',
      expiresAt: '2026-04-10T00:00:00.000Z',
    });

    const res = await request(app)
      .get('/api/queries/validateInviteToken?token=abc')
      .set('x-wx-openid', 'openid-2');

    expect(res.status).toBe(200);
    expect(res.body.data.accessRole).toBe('VIEWER');
  });

  it('GET /api/queries/validateInviteToken returns 404 for invalid token', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (validateInviteToken as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Invite token not found'), {
        code: 'INVALID_TOKEN',
        statusCode: 404,
      }),
    );

    const res = await request(app)
      .get('/api/queries/validateInviteToken?token=bad')
      .set('x-wx-openid', 'openid-2');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('POST /api/commands/acceptInvite returns VIEWER role', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (acceptInvite as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'mod-1',
      accessRole: 'VIEWER',
    });

    const res = await request(app)
      .post('/api/commands/acceptInvite')
      .set('x-wx-openid', 'openid-2')
      .send({ token: 'abc' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessRole).toBe('VIEWER');
  });

  it('POST /api/commands/leaveModule returns moduleInstanceId', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (leaveModule as jest.Mock).mockResolvedValue({ moduleInstanceId: 'mod-1' });

    const res = await request(app)
      .post('/api/commands/leaveModule')
      .set('x-wx-openid', 'openid-2')
      .send({ moduleInstanceId: 'mod-1' });

    expect(res.status).toBe(200);
    expect(res.body.data.moduleInstanceId).toBe('mod-1');
  });

  it('GET /api/queries/getModuleMembers returns members list', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (getModuleMembers as jest.Mock).mockResolvedValue({
      members: [
        { userId: 'user-1', role: 'owner', accessStatus: 'active', grantedAt: null },
        {
          userId: 'user-2',
          role: 'viewer',
          accessStatus: 'active',
          grantedAt: '2026-04-09T00:00:00.000Z',
        },
      ],
    });

    const res = await request(app)
      .get('/api/queries/getModuleMembers?moduleInstanceId=mod-1')
      .set('x-wx-openid', 'openid-1');

    expect(res.status).toBe(200);
    expect(res.body.data.members).toHaveLength(2);
  });
});
