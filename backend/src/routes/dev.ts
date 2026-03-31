import { Router } from 'express';
import { resetToSeed } from '../testing/resetToSeed';

const router = Router();

router.post('/reset', async (_req, res, next) => {
  try {
    const seeded = await resetToSeed();
    res.json({ ok: true, data: { seeded } });
  } catch (err) {
    next(err);
  }
});

export default router;
