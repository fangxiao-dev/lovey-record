import { Request, Response } from 'express';
import {
  getCalendarWindow,
  getPredictionSummary,
  recordDayDetails,
  recordDayNote,
  revokeModuleAccess,
  shareModuleInstance,
} from '../services/phase5.service';

export async function recordDayDetailsHandler(req: Request, res: Response) {
  const result = await recordDayDetails({ ...req.body, userId: req.user.id });
  res.json({ ok: true, data: result, error: null });
}

export async function recordDayNoteHandler(req: Request, res: Response) {
  const result = await recordDayNote({ ...req.body, userId: req.user.id });
  res.json({ ok: true, data: result, error: null });
}

export async function shareModuleInstanceHandler(req: Request, res: Response) {
  const result = await shareModuleInstance({ ...req.body, userId: req.user.id });
  res.json({ ok: true, data: result, error: null });
}

export async function revokeModuleAccessHandler(req: Request, res: Response) {
  const result = await revokeModuleAccess({ ...req.body, userId: req.user.id });
  res.json({ ok: true, data: result, error: null });
}

export async function getCalendarWindowHandler(req: Request, res: Response) {
  const result = await getCalendarWindow({ ...req.query, userId: req.user.id } as any);
  res.json({ ok: true, data: result, error: null });
}

export async function getPredictionSummaryHandler(req: Request, res: Response) {
  const result = await getPredictionSummary({ ...req.query, userId: req.user.id } as any);
  res.json({ ok: true, data: result, error: null });
}
