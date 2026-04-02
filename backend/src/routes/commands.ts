import { Router } from 'express';
import { createModuleInstanceHandler } from '../controllers/moduleInstance.controller';
import {
  applySingleDayPeriodActionHandler,
  clearPeriodDayHandler,
  clearPeriodRangeHandler,
  recordPeriodDayHandler,
  recordPeriodRangeHandler,
} from '../controllers/dayRecord.controller';
import {
  recordDayDetailsHandler,
  recordDayDetailsBatchHandler,
  recordDayNoteHandler,
  revokeModuleAccessHandler,
  shareModuleInstanceHandler,
  updateDefaultPeriodDurationHandler,
  updateDefaultPredictionTermHandler,
} from '../controllers/phase5.controller';

const router = Router();

router.post('/createModuleInstance', createModuleInstanceHandler);
router.post('/recordPeriodDay', recordPeriodDayHandler);
router.post('/applySingleDayPeriodAction', applySingleDayPeriodActionHandler);
router.post('/clearPeriodDay', clearPeriodDayHandler);
router.post('/recordPeriodRange', recordPeriodRangeHandler);
router.post('/clearPeriodRange', clearPeriodRangeHandler);
router.post('/recordDayDetails', recordDayDetailsHandler);
router.post('/recordDayDetailsBatch', recordDayDetailsBatchHandler);
router.post('/recordDayNote', recordDayNoteHandler);
router.post('/updateDefaultPeriodDuration', updateDefaultPeriodDurationHandler);
router.post('/updateDefaultPredictionTerm', updateDefaultPredictionTermHandler);
router.post('/shareModuleInstance', shareModuleInstanceHandler);
router.post('/revokeModuleAccess', revokeModuleAccessHandler);

export default router;
