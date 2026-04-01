import { Router } from 'express';
import {
  getDayRecordDetailHandler,
  getModuleAccessStateHandler,
  getModuleHomeViewHandler,
  getModuleSettingsHandler,
} from '../controllers/query.controller';
import { getCalendarWindowHandler, getPredictionSummaryHandler } from '../controllers/phase5.controller';
import { getMyModuleInstanceHandler } from '../controllers/moduleInstance.controller';

const router = Router();

router.get('/getMyModuleInstance', getMyModuleInstanceHandler);
router.get('/getModuleHomeView', getModuleHomeViewHandler);
router.get('/getDayRecordDetail', getDayRecordDetailHandler);
router.get('/getModuleAccessState', getModuleAccessStateHandler);
router.get('/getModuleSettings', getModuleSettingsHandler);
router.get('/getCalendarWindow', getCalendarWindowHandler);
router.get('/getPredictionSummary', getPredictionSummaryHandler);

export default router;
