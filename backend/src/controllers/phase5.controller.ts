import { Request, Response } from 'express';
import {
  getCalendarWindow,
  getPredictionSummary,
  recordDayDetails,
  recordDayDetailsBatch,
  recordDayNote,
  revokeModuleAccess,
  shareModuleInstance,
} from '../services/phase5.service';
import { updateDefaultPeriodDuration as updateDefaultPeriodDurationSetting } from '../services/moduleSettings.service';

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
      code: 'PHASE5_ERROR',
      message: error instanceof Error ? error.message : 'Operation failed',
    },
  });
}

export async function recordDayDetailsHandler(req: Request, res: Response) {
  try {
    const result = await recordDayDetails({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function recordDayNoteHandler(req: Request, res: Response) {
  try {
    const result = await recordDayNote({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function shareModuleInstanceHandler(req: Request, res: Response) {
  try {
    const result = await shareModuleInstance({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function revokeModuleAccessHandler(req: Request, res: Response) {
  try {
    const result = await revokeModuleAccess({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getCalendarWindowHandler(req: Request, res: Response) {
  try {
    const result = await getCalendarWindow({ ...req.query, userId: req.user.id } as any);
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getPredictionSummaryHandler(req: Request, res: Response) {
  try {
    const result = await getPredictionSummary({ ...req.query, userId: req.user.id } as any);
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateDefaultPeriodDurationHandler(req: Request, res: Response) {
  try {
    const result = await updateDefaultPeriodDurationSetting(req.body.moduleInstanceId, req.body.defaultPeriodDurationDays, req.user.id);
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function recordDayDetailsBatchHandler(req: Request, res: Response) {
  try {
    const result = await recordDayDetailsBatch({
      moduleInstanceId: req.body.moduleInstanceId,
      userId: req.user.id,
      dates: req.body.dates,
      flowLevel: req.body.flowLevel ?? null,
      painLevel: req.body.painLevel ?? null,
      colorLevel: req.body.colorLevel ?? null,
    });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}
