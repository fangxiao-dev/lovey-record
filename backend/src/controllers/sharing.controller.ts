import { Request, Response } from 'express';
import {
  createInviteToken,
  validateInviteToken,
  acceptInvite,
  leaveModule,
  getModuleMembers,
} from '../services/sharing.service';

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
      code: 'SHARING_ERROR',
      message: error instanceof Error ? error.message : 'Operation failed',
    },
  });
}

const VALID_ACCESS_ROLES = new Set(['VIEWER', 'PARTNER']);

export async function createInviteTokenHandler(req: Request, res: Response) {
  try {
    const { moduleInstanceId, accessRole } = req.body;
    const resolvedRole = VALID_ACCESS_ROLES.has(accessRole) ? accessRole : 'VIEWER';
    const result = await createInviteToken({ moduleInstanceId, accessRole: resolvedRole, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function validateInviteTokenHandler(req: Request, res: Response) {
  try {
    const result = await validateInviteToken({ token: req.query.token as string, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function acceptInviteHandler(req: Request, res: Response) {
  try {
    const result = await acceptInvite({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function leaveModuleHandler(req: Request, res: Response) {
  try {
    const result = await leaveModule({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getModuleMembersHandler(req: Request, res: Response) {
  try {
    const result = await getModuleMembers({
      moduleInstanceId: req.query.moduleInstanceId as string,
      userId: req.user.id,
    });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}
