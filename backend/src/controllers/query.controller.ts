import { Request, Response } from 'express';
import { getDayRecordDetail, getModuleAccessState, getModuleHomeView } from '../services/query.service';

function handleError(res: Response, error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
    const err = error as { code: string; statusCode: number; message?: string };
    return res.status(err.statusCode).json({
      ok: false,
      data: null,
      error: { code: err.code, message: err.message ?? 'Access denied' },
    });
  }

  return res.status(500).json({
    ok: false,
    data: null,
    error: {
      code: 'QUERY_ERROR',
      message: error instanceof Error ? error.message : 'Query failed',
    },
  });
}

export async function getModuleHomeViewHandler(req: Request, res: Response) {
  try {
    const moduleInstanceId = req.query.moduleInstanceId as string;
    const result = await getModuleHomeView({
      moduleInstanceId,
      userId: req.user.id,
    });
    return res.json({ ok: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDayRecordDetailHandler(req: Request, res: Response) {
  try {
    const moduleInstanceId = req.query.moduleInstanceId as string;
    const profileId = req.query.profileId as string;
    const date = req.query.date as string;
    const result = await getDayRecordDetail({
      moduleInstanceId,
      profileId,
      date,
      userId: req.user.id,
    });
    return res.json({ ok: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getModuleAccessStateHandler(req: Request, res: Response) {
  try {
    const moduleInstanceId = req.query.moduleInstanceId as string;
    const result = await getModuleAccessState({
      moduleInstanceId,
      userId: req.user.id,
    });
    return res.json({ ok: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
