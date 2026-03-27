import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/db/prisma';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow requests to /health without auth', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      status: 'healthy',
    });
  });

  it('should return 401 for protected routes without x-wx-openid header', async () => {
    const response = await request(app).get('/api/some-route');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'MISSING_OPENID',
        message: 'x-wx-openid header is required',
      },
    });
  });

  it('should attach user to request when x-wx-openid is present', async () => {
    const mockUser = { id: 'user-123', openid: 'test-openid' };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    // Create a simple test route
    app.get('/api/test-user', (req, res) => {
      res.json({ ok: true, data: { user: req.user } });
    });

    const response = await request(app)
      .get('/api/test-user')
      .set('x-wx-openid', 'test-openid');

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(mockUser);
  });
});
