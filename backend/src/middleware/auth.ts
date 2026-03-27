import { Request, Response, NextFunction } from 'express';
import { findOrCreateUser } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const openid = req.headers['x-wx-openid'] as string;

    if (!openid || !openid.trim()) {
      return res.status(401).json({
        ok: false,
        data: null,
        error: { code: 'MISSING_OPENID', message: 'x-wx-openid header is required' },
      });
    }

    const user = await findOrCreateUser(openid);
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: 'AUTH_ERROR',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
    });
  }
}
