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

const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000;
const calendarWindowMemoryCache = new Map();
const dayDetailMemoryCache = new Map();
const singleDayActionMemoryCache = new Map();

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

function buildCalendarWindowCacheKey({
	moduleInstanceId,
	profileId,
	viewMode,
	startDate,
	endDate
}) {
	return [
		moduleInstanceId,
		profileId,
		viewMode,
		startDate,
		endDate
	].join('::');
}

function buildDayDetailCacheKey({
	moduleInstanceId,
	profileId,
	date
}) {
	return [
		moduleInstanceId,
		profileId,
		date
	].join('::');
}

function buildSingleDayActionCacheKey({
	moduleInstanceId,
	date
}) {
	return [
		moduleInstanceId,
		date
	].join('::');
}

function isFreshCacheEntry(entry, now = Date.now()) {
	return Boolean(entry) && now - entry.cachedAt < MEMORY_CACHE_TTL_MS;
}

async function loadWithMemoryCache({ store, key, meta, loader }) {
	const entry = store.get(key);
	if (isFreshCacheEntry(entry)) {
		return entry.value;
	}

	const value = await loader();
	store.set(key, {
		value,
		meta: meta || null,
		cachedAt: Date.now()
	});
	return value;
}

function deleteCacheEntries(store, predicate) {
	for (const [key, entry] of store.entries()) {
		if (predicate(entry)) {
			store.delete(key);
		}
	}
}

function rangesOverlap(startA, endA, startB, endB) {
	return startA <= endB && startB <= endA;
}

export function invalidateMenstrualCalendarCacheForRange({
	moduleInstanceId,
	profileId,
	focusDate,
	viewMode
}) {
	if (!moduleInstanceId || !profileId || !focusDate) {
		return;
	}

	const range = createCalendarQueryRange({
		focusDate,
		viewMode: viewMode || 'three-week'
	});

	deleteCacheEntries(calendarWindowMemoryCache, (entry) => {
		const meta = entry?.meta;
		if (!meta) return false;
		if (meta.moduleInstanceId !== moduleInstanceId) return false;
		if (meta.profileId !== profileId) return false;
		return rangesOverlap(meta.startDate, meta.endDate, range.startDate, range.endDate);
	});
}

export function invalidateMenstrualDayCachesForDate({
	moduleInstanceId,
	profileId,
	date
}) {
	if (!moduleInstanceId || !date) {
		return;
	}

	deleteCacheEntries(dayDetailMemoryCache, (entry) => {
		const meta = entry?.meta;
		if (!meta) return false;
		return meta.moduleInstanceId === moduleInstanceId
			&& meta.profileId === profileId
			&& meta.date === date;
	});

	deleteCacheEntries(singleDayActionMemoryCache, (entry) => {
		const meta = entry?.meta;
		if (!meta) return false;
		return meta.moduleInstanceId === moduleInstanceId
			&& meta.date === date;
	});
}

export function invalidateMenstrualBrowseCacheByScopes({
	affectedScopes,
	moduleInstanceId,
	profileId,
	activeDate,
	focusDate,
	viewMode
} = {}) {
	if (!Array.isArray(affectedScopes) || affectedScopes.length === 0) {
		return;
	}

	if (affectedScopes.includes('calendar')) {
		invalidateMenstrualCalendarCacheForRange({
			moduleInstanceId,
			profileId,
			focusDate: focusDate || activeDate,
			viewMode
		});
	}

	if (affectedScopes.includes('dayDetail')) {
		invalidateMenstrualDayCachesForDate({
			moduleInstanceId,
			profileId,
			date: activeDate
		});
	}

	if (affectedScopes.includes('prediction')) {
		deleteCacheEntries(calendarWindowMemoryCache, (entry) => entry?.meta?.moduleInstanceId === moduleInstanceId);
		deleteCacheEntries(singleDayActionMemoryCache, (entry) => entry?.meta?.moduleInstanceId === moduleInstanceId);
	}
}

export function createCalendarQueryRange({ focusDate, viewMode }) {
	if (viewMode === 'month') {
		const monthStart = startOfMonth(focusDate);
		const monthEnd = endOfMonth(focusDate);
		const startDate = startOfWeek(monthStart);
		const endDate = addDays(startOfWeek(monthEnd), 6);
		return { startDate, endDate };
	}

	const startDate = startOfWeek(focusDate);
	return {
		startDate,
		endDate: addDays(startDate, 13)
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
	const key = buildSingleDayActionCacheKey({
		moduleInstanceId,
		date
	});
	return loadWithMemoryCache({
		store: singleDayActionMemoryCache,
		key,
		meta: {
			moduleInstanceId,
			date
		},
		loader: () => queryEnvelope({
			apiBaseUrl,
			openid,
			path: '/api/queries/getSingleDayPeriodAction',
			data: {
				moduleInstanceId,
				date
			}
		})
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
	const cacheKey = buildCalendarWindowCacheKey({
		moduleInstanceId: resolved.moduleInstanceId,
		profileId: resolved.profileId,
		viewMode,
		startDate: calendarRange.startDate,
		endDate: calendarRange.endDate
	});

	const calendarWindow = await loadWithMemoryCache({
		store: calendarWindowMemoryCache,
		key: cacheKey,
		meta: {
			moduleInstanceId: resolved.moduleInstanceId,
			profileId: resolved.profileId,
			viewMode,
			startDate: calendarRange.startDate,
			endDate: calendarRange.endDate
		},
		loader: () => queryEnvelope({
			apiBaseUrl: resolved.apiBaseUrl,
			openid: resolved.openid,
			path: '/api/queries/getCalendarWindow',
			data: {
				moduleInstanceId: resolved.moduleInstanceId,
				profileId: resolved.profileId,
				startDate: calendarRange.startDate,
				endDate: calendarRange.endDate
			}
		})
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
	const date = resolved.activeDate || resolved.today;
	const cacheKey = buildDayDetailCacheKey({
		moduleInstanceId: resolved.moduleInstanceId,
		profileId: resolved.profileId,
		date
	});
	return loadWithMemoryCache({
		store: dayDetailMemoryCache,
		key: cacheKey,
		meta: {
			moduleInstanceId: resolved.moduleInstanceId,
			profileId: resolved.profileId,
			date
		},
		loader: () => queryEnvelope({
			apiBaseUrl: resolved.apiBaseUrl,
			openid: resolved.openid,
			path: '/api/queries/getDayRecordDetail',
			data: {
				moduleInstanceId: resolved.moduleInstanceId,
				profileId: resolved.profileId,
				date
			}
		})
	});
}

export function __resetMenstrualHomeMemoryCacheForTest() {
	calendarWindowMemoryCache.clear();
	dayDetailMemoryCache.clear();
	singleDayActionMemoryCache.clear();
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
				focusDate,
				selectedDateKey: resolved.selectedDateKey || null
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
				focusDate: resolved.focusDate || resolved.activeDate || resolved.today,
				selectedDateKey: resolved.selectedDateKey || null
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
