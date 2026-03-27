import { Router } from 'express';
import { createModuleInstanceHandler } from '../controllers/moduleInstance.controller';
import { clearDayRecordHandler, recordDateRangeAsPeriodHandler, recordDayStateHandler } from '../controllers/dayRecord.controller';
import { recordDayDetailsHandler, recordDayNoteHandler, revokeModuleAccessHandler, shareModuleInstanceHandler } from '../controllers/phase5.controller';

const router = Router();

router.post('/createModuleInstance', createModuleInstanceHandler);
router.post('/recordDayState', recordDayStateHandler);
router.post('/recordDateRangeAsPeriod', recordDateRangeAsPeriodHandler);
router.post('/clearDayRecord', clearDayRecordHandler);
router.post('/recordDayDetails', recordDayDetailsHandler);
router.post('/recordDayNote', recordDayNoteHandler);
router.post('/shareModuleInstance', shareModuleInstanceHandler);
router.post('/revokeModuleAccess', revokeModuleAccessHandler);

export default router;
