import { Request, Response } from 'express';
import { clearDayRecord, recordDateRangeAsPeriod, recordDayState } from '../services/dayRecord.service';

export async function recordDayStateHandler(req: Request, res: Response) {
  const result = await recordDayState({
    moduleInstanceId: req.body.moduleInstanceId,
    userId: req.user.id,
    date: req.body.date,
    bleedingState: req.body.bleedingState,
    painLevel: req.body.painLevel,
    flowLevel: req.body.flowLevel,
    colorLevel: req.body.colorLevel,
    note: req.body.note,
  });

  res.json({ ok: true, data: { dayRecord: result.dayRecord }, error: null });
}

export async function recordDateRangeAsPeriodHandler(req: Request, res: Response) {
  const result = await recordDateRangeAsPeriod({
    moduleInstanceId: req.body.moduleInstanceId,
    userId: req.user.id,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  });

  res.json({ ok: true, data: { updatedDayCount: result.updatedDayCount }, error: null });
}

export async function clearDayRecordHandler(req: Request, res: Response) {
  const result = await clearDayRecord({
    moduleInstanceId: req.body.moduleInstanceId,
    userId: req.user.id,
    date: req.body.date,
  });

  res.json({ ok: true, data: result, error: null });
}
