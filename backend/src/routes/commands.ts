import { Router } from 'express';
import { createModuleInstanceHandler } from '../controllers/moduleInstance.controller';
import { clearPeriodDayHandler, recordPeriodDayHandler } from '../controllers/dayRecord.controller';
import { recordDayDetailsHandler, recordDayNoteHandler, revokeModuleAccessHandler, shareModuleInstanceHandler, updateDefaultPeriodDurationHandler } from '../controllers/phase5.controller';

const router = Router();

router.post('/createModuleInstance', createModuleInstanceHandler);
router.post('/recordPeriodDay', recordPeriodDayHandler);
router.post('/clearPeriodDay', clearPeriodDayHandler);
router.post('/recordDayDetails', recordDayDetailsHandler);
router.post('/recordDayNote', recordDayNoteHandler);
router.post('/updateDefaultPeriodDuration', updateDefaultPeriodDurationHandler);
router.post('/shareModuleInstance', shareModuleInstanceHandler);
router.post('/revokeModuleAccess', revokeModuleAccessHandler);

export default router;
