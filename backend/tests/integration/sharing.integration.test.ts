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

  it('POST /api/commands/createInviteToken returns 200 with token', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      id: 'user-1',
      openid: 'openid-1',
    });
    (createInviteToken as jest.Mock).mockResolvedValue({
      token: 'token-abc123xyz',
      expiresAt: '2026-04-10T12:00:00.000Z',
    });

    const response = await request(app)
      .post('/api/commands/createInviteToken')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        token: 'token-abc123xyz',
        expiresAt: '2026-04-10T12:00:00.000Z',
      },
      error: null,
    });
    expect(createInviteToken).toHaveBeenCalledWith({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });
  });

  it('GET /api/queries/validateInviteToken returns 200 with accessRole', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      id: 'user-2',
      openid: 'openid-2',
    });
    (validateInviteToken as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      moduleType: 'menstrual',
      accessRole: 'VIEWER',
      expiresAt: '2026-04-10T12:00:00.000Z',
    });

    const response = await request(app)
      .get('/api/queries/validateInviteToken?token=token-abc123xyz')
      .set('x-wx-openid', 'openid-2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        moduleType: 'menstrual',
        accessRole: 'VIEWER',
        expiresAt: '2026-04-10T12:00:00.000Z',
      },
      error: null,
    });
    expect(validateInviteToken).toHaveBeenCalledWith({
      token: 'token-abc123xyz',
      userId: 'user-2',
    });
  });

  it('GET /api/queries/validateInviteToken returns 404 with INVALID_TOKEN error code', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      id: 'user-3',
      openid: 'openid-3',
    });
    const error = Object.assign(new Error('Invite token not found'), {
      code: 'INVALID_TOKEN',
      statusCode: 404,
    });
    (validateInviteToken as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .get('/api/queries/validateInviteToken?token=invalid-token')
      .set('x-wx-openid', 'openid-3');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invite token not found',
      },
    });
  });

  it('POST /api/commands/acceptInvite returns 200 with VIEWER accessRole', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      id: 'user-2',
      openid: 'openid-2',
    });
    (acceptInvite as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      accessRole: 'VIEWER',
    });

    const response = await request(app)
      .post('/api/commands/acceptInvite')
      .set('x-wx-openid', 'openid-2')
      .send({ token: 'token-abc123xyz' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        accessRole: 'VIEWER',
      },
      error: null,
    });
    expect(acceptInvite).toHaveBeenCalledWith({
      token: 'token-abc123xyz',
      userId: 'user-2',
    });
  });

  it('POST /api/commands/leaveModule returns 200 with moduleInstanceId', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      id: 'user-2',
      openid: 'openid-2',
    });
    (leaveModule as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
    });

    const response = await request(app)
      .post('/api/commands/leaveModule')
      .set('x-wx-openid', 'openid-2')
      .send({ moduleInstanceId: 'module-1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
      },
      error: null,
    });
    expect(leaveModule).toHaveBeenCalledWith({
      moduleInstanceId: 'module-1',
      userId: 'user-2',
    });
  });

  it('GET /api/queries/getModuleMembers returns 200 with 2-member array', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      id: 'user-1',
      openid: 'openid-1',
    });
    (getModuleMembers as jest.Mock).mockResolvedValue({
      members: [
        {
          userId: 'user-1',
          role: 'owner',
          accessStatus: 'active',
          grantedAt: null,
        },
        {
          userId: 'user-2',
          role: 'viewer',
          accessStatus: 'active',
          grantedAt: '2026-04-09T10:00:00.000Z',
        },
      ],
    });

    const response = await request(app)
      .get('/api/queries/getModuleMembers?moduleInstanceId=module-1')
      .set('x-wx-openid', 'openid-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        members: [
          {
            userId: 'user-1',
            role: 'owner',
            accessStatus: 'active',
            grantedAt: null,
          },
          {
            userId: 'user-2',
            role: 'viewer',
            accessStatus: 'active',
            grantedAt: '2026-04-09T10:00:00.000Z',
          },
        ],
      },
      error: null,
    });
    expect(getModuleMembers).toHaveBeenCalledWith({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
    });
  });
});
