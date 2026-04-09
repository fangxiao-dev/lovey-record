import {
	createMenstrualHomePageModel,
	createSeededHomeContracts
} from '../../components/menstrual/home-contract-adapter.js';
import { API_BASE_URL } from '../../config/api.js';
import { cloudRequest } from '../cloud-request.js';

export const DEFAULT_MENSTRUAL_HOME_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	today: new Date().toLocaleDateString('en-CA')
});

function toDateOnly(value) {
	return new Date(`${value}T00:00:00.000Z`);
}

function formatYMD(date) {
	return date.toISOString().slice(0, 10);
}

function startOfWeek(dateString) {
	const date = toDateOnly(dateString);
	const day = date.getUTCDay();
	const offset = day === 0 ? -6 : 1 - day;
	date.setUTCDate(date.getUTCDate() + offset);
	return formatYMD(date);
}

function addDays(dateString, amount) {
	const date = toDateOnly(dateString);
	date.setUTCDate(date.getUTCDate() + amount);
	return formatYMD(date);
}

function startOfMonth(dateString) {
	const date = toDateOnly(dateString);
	date.setUTCDate(1);
	return formatYMD(date);
}

function endOfMonth(dateString) {
	const date = toDateOnly(dateString);
	date.setUTCMonth(date.getUTCMonth() + 1, 0);
	return formatYMD(date);
}

function getResolvedFocusDate({ homeView, activeDate, focusDate, today }) {
	return focusDate
		|| activeDate
		|| homeView.selectedDay?.date
		|| homeView.currentStatusSummary?.currentSegment?.startDate
		|| homeView.currentStatusSummary?.anchorDate
		|| homeView.predictionSummary?.predictedStartDate
		|| today;
}

export function createCalendarQueryRange({ focusDate, viewMode }) {
	if (viewMode === 'month') {
		const monthStart = startOfMonth(focusDate);
		const monthEnd = endOfMonth(focusDate);
		const startDate = startOfWeek(monthStart);
		const endDate = addDays(startOfWeek(monthEnd), 6);
		return { startDate, endDate };
	}

	const startDate = addDays(startOfWeek(focusDate), -7);
	return {
		startDate,
		endDate: addDays(startDate, 20)
	};
}

async function queryEnvelope({ apiBaseUrl, openid, path, data }) {
	const cacheBustedPath = path + (path.includes('?') ? '&' : '?') + '_ts=' + Date.now();

	const response = await cloudRequest({
		path: cacheBustedPath,
		method: 'GET',
		data,
		headers: {
			'x-wx-openid': openid,
		}
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		throw new Error(response.data?.error?.message || `Query failed: ${path}`);
	}

	return response.data.data;
}

export async function loadMenstrualHomeView(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_HOME_CONTEXT, ...context };
	return queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getModuleHomeView',
		data: {
			moduleInstanceId: resolved.moduleInstanceId,
			today: resolved.today
		}
	});
}

export async function getSingleDayPeriodAction({ apiBaseUrl, openid, moduleInstanceId, date }) {
	return queryEnvelope({
		apiBaseUrl,
		openid,
		path: '/api/queries/getSingleDayPeriodAction',
		data: {
			moduleInstanceId,
			date
		}
	});
}

export async function loadMenstrualModuleSettings(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_HOME_CONTEXT, ...context };
	const result = await queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getModuleSettings',
		data: {
			moduleInstanceId: resolved.moduleInstanceId
		}
	});
	return result.moduleSettings;
}

export async function loadMenstrualCalendarWindow(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_HOME_CONTEXT, ...context };
	const viewMode = resolved.viewMode || 'three-week';
	const calendarRange = createCalendarQueryRange({
		focusDate: resolved.focusDate || resolved.today,
		viewMode
	});

	const calendarWindow = await queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getCalendarWindow',
		data: {
			moduleInstanceId: resolved.moduleInstanceId,
			profileId: resolved.profileId,
			startDate: calendarRange.startDate,
			endDate: calendarRange.endDate
		}
	});

	return {
		calendarWindow,
		focusDate: resolved.focusDate || resolved.today,
		viewMode,
		calendarRange
	};
}

export async function loadMenstrualDayDetail(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_HOME_CONTEXT, ...context };
	return queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getDayRecordDetail',
		data: {
			moduleInstanceId: resolved.moduleInstanceId,
			profileId: resolved.profileId,
			date: resolved.activeDate || resolved.today
		}
	});
}

export async function loadMenstrualHomePageModel(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_HOME_CONTEXT, ...context };
	const fallbackOnError = resolved.fallbackOnError === true;
	const viewMode = resolved.viewMode || 'three-week';

	try {
		const homeView = await loadMenstrualHomeView(resolved);

		const activeDate = resolved.activeDate
			|| homeView.selectedDay?.date
			|| homeView.currentStatusSummary?.anchorDate
			|| resolved.today;
		const focusDate = getResolvedFocusDate({
			homeView,
			activeDate,
			focusDate: resolved.focusDate,
			today: resolved.today
		});

		const [{ calendarWindow }, dayDetail, singleDayPeriodAction, moduleSettings, accessState] = await Promise.all([
			loadMenstrualCalendarWindow({
				...resolved,
				focusDate,
				viewMode
			}),
			loadMenstrualDayDetail({
				...resolved,
				activeDate
			}),
			getSingleDayPeriodAction({
				apiBaseUrl: resolved.apiBaseUrl,
				openid: resolved.openid,
				moduleInstanceId: resolved.moduleInstanceId,
				date: activeDate
			}),
			loadMenstrualModuleSettings(resolved),
			queryEnvelope({
				apiBaseUrl: resolved.apiBaseUrl,
				openid: resolved.openid,
				path: '/api/queries/getModuleAccessState',
				data: { moduleInstanceId: resolved.moduleInstanceId }
			})
		]);

		return {
			page: createMenstrualHomePageModel({
				homeView,
				moduleSettings,
				calendarWindow,
				dayDetail,
				singleDayPeriodAction,
				today: resolved.today,
				viewMode,
				focusDate
			}),
			raw: {
				homeView,
				moduleSettings,
				dayDetail,
				calendarWindow,
				singleDayPeriodAction,
				focusDate,
				viewMode,
				callerRole: accessState?.callerRole || 'owner'
			},
			source: 'live',
			context: resolved
		};
	} catch (error) {
		if (!fallbackOnError) {
			throw error;
		}
		const fallback = createSeededHomeContracts();
		const dayDetail = resolved.activeDate && resolved.activeDate !== fallback.dayDetail.dayRecord.date
			? {
				moduleInstanceId: resolved.moduleInstanceId,
				profileId: resolved.profileId,
				dayRecord: {
					date: resolved.activeDate,
					isPeriod: false,
					painLevel: null,
					flowLevel: null,
					colorLevel: null,
					note: null,
					source: null,
					isExplicit: false,
					isDetailRecorded: false
				}
			}
			: fallback.dayDetail;

		return {
			page: createMenstrualHomePageModel({
				homeView: fallback.homeView,
				moduleSettings: fallback.moduleSettings,
				dayDetail,
				singleDayPeriodAction: null,
				today: resolved.today,
				viewMode,
				focusDate: resolved.focusDate || resolved.activeDate || resolved.today
			}),
			raw: {
				homeView: fallback.homeView,
				moduleSettings: fallback.moduleSettings,
				dayDetail,
				calendarWindow: null,
				singleDayPeriodAction: null,
				focusDate: resolved.focusDate || resolved.activeDate || resolved.today,
				viewMode
			},
			source: 'fallback',
			context: resolved,
			error: error instanceof Error ? error.message : 'Query failed'
		};
	}
}
