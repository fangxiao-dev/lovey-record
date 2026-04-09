import { Router } from 'express';
import {
  getDayRecordDetailHandler,
  getModuleAccessStateHandler,
  getModuleHomeViewHandler,
  getModuleSettingsHandler,
  getSingleDayPeriodActionHandler,
} from '../controllers/query.controller';
import { getCalendarWindowHandler, getPredictionSummaryHandler } from '../controllers/phase5.controller';
import { getMyModuleInstanceHandler } from '../controllers/moduleInstance.controller';
import { validateInviteTokenHandler, getModuleMembersHandler } from '../controllers/sharing.controller';

const router = Router();

router.get('/getMyModuleInstance', getMyModuleInstanceHandler);
router.get('/getModuleHomeView', getModuleHomeViewHandler);
router.get('/getSingleDayPeriodAction', getSingleDayPeriodActionHandler);
router.get('/getDayRecordDetail', getDayRecordDetailHandler);
router.get('/getModuleAccessState', getModuleAccessStateHandler);
router.get('/getModuleSettings', getModuleSettingsHandler);
router.get('/getCalendarWindow', getCalendarWindowHandler);
router.get('/getPredictionSummary', getPredictionSummaryHandler);
router.get('/validateInviteToken', validateInviteTokenHandler);
router.get('/getModuleMembers', getModuleMembersHandler);

export default router;
