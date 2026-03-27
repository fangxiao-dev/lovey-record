import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  code?: string;
  statusCode?: number;
}

export function errorHandler(err: CustomError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    ok: false,
    data: null,
    error: { code, message },
  });
}
