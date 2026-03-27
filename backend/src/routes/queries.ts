import { Router } from 'express';
import {
  getDayRecordDetailHandler,
  getModuleAccessStateHandler,
  getModuleHomeViewHandler,
} from '../controllers/query.controller';
import { getCalendarWindowHandler, getPredictionSummaryHandler } from '../controllers/phase5.controller';

const router = Router();

router.get('/getModuleHomeView', getModuleHomeViewHandler);
router.get('/getDayRecordDetail', getDayRecordDetailHandler);
router.get('/getModuleAccessState', getModuleAccessStateHandler);
router.get('/getCalendarWindow', getCalendarWindowHandler);
router.get('/getPredictionSummary', getPredictionSummaryHandler);

export default router;
