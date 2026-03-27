import { Request, Response } from 'express';
import { clearPeriodDay, recordPeriodDay } from '../services/dayRecord.service';

export async function recordPeriodDayHandler(req: Request, res: Response) {
  const result = await recordPeriodDay({
    moduleInstanceId: req.body.moduleInstanceId,
    userId: req.user.id,
    date: req.body.date,
    painLevel: req.body.painLevel,
    flowLevel: req.body.flowLevel,
    colorLevel: req.body.colorLevel,
    note: req.body.note,
  });

  res.json({ ok: true, data: result, error: null });
}

export async function clearPeriodDayHandler(req: Request, res: Response) {
  const result = await clearPeriodDay({
    moduleInstanceId: req.body.moduleInstanceId,
    userId: req.user.id,
    date: req.body.date,
  });

  res.json({ ok: true, data: result, error: null });
}
