import {
	createMenstrualHomePageModel,
	createSeededHomeContracts
} from '../../components/menstrual/home-contract-adapter.js';

export const DEFAULT_MENSTRUAL_HOME_CONTEXT = Object.freeze({
	apiBaseUrl: 'http://localhost:3000/api',
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	today: '2026-03-29'
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
		|| homeView.currentStatusSummary?.currentCycle?.startDate
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

function requestJson({ url, data, headers }) {
	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method: 'GET',
			data,
			header: headers,
			success: (response) => resolve(response),
			fail: (error) => reject(error)
		});
	});
}

async function queryEnvelope({ apiBaseUrl, openid, path, data }) {
	const response = await requestJson({
		url: `${apiBaseUrl}${path}`,
		data,
		headers: {
			'x-wx-openid': openid
		}
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		throw new Error(response.data?.error?.message || `Query failed: ${path}`);
	}

	return response.data.data;
}

export async function loadMenstrualHomePageModel(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_HOME_CONTEXT, ...context };
	const fallbackOnError = resolved.fallbackOnError !== false;
	const viewMode = resolved.viewMode || 'three-week';

	try {
		const homeView = await queryEnvelope({
			apiBaseUrl: resolved.apiBaseUrl,
			openid: resolved.openid,
			path: '/queries/getModuleHomeView',
			data: {
				moduleInstanceId: resolved.moduleInstanceId
			}
		});

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
		const calendarRange = createCalendarQueryRange({
			focusDate,
			viewMode
		});

		const calendarWindow = await queryEnvelope({
			apiBaseUrl: resolved.apiBaseUrl,
			openid: resolved.openid,
			path: '/queries/getCalendarWindow',
			data: {
				moduleInstanceId: resolved.moduleInstanceId,
				profileId: resolved.profileId,
				startDate: calendarRange.startDate,
				endDate: calendarRange.endDate
			}
		});

		const dayDetail = await queryEnvelope({
			apiBaseUrl: resolved.apiBaseUrl,
			openid: resolved.openid,
			path: '/queries/getDayRecordDetail',
			data: {
				moduleInstanceId: resolved.moduleInstanceId,
				profileId: resolved.profileId,
				date: activeDate
			}
		});

		return {
			page: createMenstrualHomePageModel({
				homeView,
				calendarWindow,
				dayDetail,
				today: resolved.today,
				viewMode,
				focusDate
			}),
			raw: {
				homeView,
				dayDetail,
				calendarWindow,
				focusDate,
				viewMode
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
				dayDetail,
				today: resolved.today,
				viewMode,
				focusDate: resolved.focusDate || resolved.activeDate || resolved.today
			}),
			raw: {
				homeView: fallback.homeView,
				dayDetail,
				calendarWindow: null,
				focusDate: resolved.focusDate || resolved.activeDate || resolved.today,
				viewMode
			},
			source: 'fallback',
			context: resolved,
			error: error instanceof Error ? error.message : 'Query failed'
		};
	}
}
