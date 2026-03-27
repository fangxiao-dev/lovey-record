import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middleware/auth';
import * as authService from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');

describe('AuthMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should attach user to request when x-wx-openid header is present', async () => {
    const mockUser = { id: 'user-1', openid: 'test-openid' };
    (authService.findOrCreateUser as jest.Mock).mockResolvedValue(mockUser);

    req.headers = { 'x-wx-openid': 'test-openid' };

    await authMiddleware(req as Request, res as Response, next);

    expect(authService.findOrCreateUser).toHaveBeenCalledWith('test-openid');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when x-wx-openid header is missing', async () => {
    req.headers = {};

    await authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      data: null,
      error: { code: 'MISSING_OPENID', message: 'x-wx-openid header is required' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when x-wx-openid header is empty', async () => {
    req.headers = { 'x-wx-openid': '' };

    await authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle auth service errors with 500', async () => {
    const error = new Error('Database error');
    (authService.findOrCreateUser as jest.Mock).mockRejectedValue(error);

    req.headers = { 'x-wx-openid': 'test-openid' };

    await authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      data: null,
      error: { code: 'AUTH_ERROR', message: expect.any(String) },
    });
  });
});
