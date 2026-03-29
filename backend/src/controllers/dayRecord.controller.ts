import { Request, Response } from 'express';
import { clearPeriodDay, clearPeriodRange, recordPeriodDay, recordPeriodRange } from '../services/dayRecord.service';

function handleError(res: Response, error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
    const err = error as { code: string; statusCode: number; message?: string };
    return res.status(err.statusCode).json({
      ok: false,
      data: null,
      error: { code: err.code, message: err.message ?? 'Operation failed' },
    });
  }

  return res.status(500).json({
    ok: false,
    data: null,
    error: {
      code: 'DAY_RECORD_ERROR',
      message: error instanceof Error ? error.message : 'Operation failed',
    },
  });
}

export async function recordPeriodDayHandler(req: Request, res: Response) {
  try {
    const result = await recordPeriodDay({
      moduleInstanceId: req.body.moduleInstanceId,
      userId: req.user.id,
      date: req.body.date,
    });

    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function clearPeriodDayHandler(req: Request, res: Response) {
  try {
    const result = await clearPeriodDay({
      moduleInstanceId: req.body.moduleInstanceId,
      userId: req.user.id,
      date: req.body.date,
    });

    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function recordPeriodRangeHandler(req: Request, res: Response) {
  try {
    const result = await recordPeriodRange({
      moduleInstanceId: req.body.moduleInstanceId,
      userId: req.user.id,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });

    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function clearPeriodRangeHandler(req: Request, res: Response) {
  try {
    const result = await clearPeriodRange({
      moduleInstanceId: req.body.moduleInstanceId,
      userId: req.user.id,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });

    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}
