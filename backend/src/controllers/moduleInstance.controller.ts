import { Request, Response } from 'express';
import { createModuleInstance, getOrCreateModuleInstance, ModuleInstanceError } from '../services/moduleInstance.service';

export async function getMyModuleInstanceHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        data: null,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    const result = await getOrCreateModuleInstance(req.user);

    return res.json({
      ok: true,
      data: result,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: 'MODULE_INSTANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get module instance',
      },
    });
  }
}

export async function createModuleInstanceHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        data: null,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    const result = await createModuleInstance(req.user);

    return res.json({
      ok: true,
      data: {
        moduleInstance: result.moduleInstance,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof ModuleInstanceError) {
      return res.status(409).json({
        ok: false,
        data: null,
        error: { code: error.code, message: error.message },
      });
    }

    return res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: 'MODULE_INSTANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create module instance',
      },
    });
  }
}
