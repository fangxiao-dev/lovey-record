import { cloudRequest } from '../cloud-request.js';
import { API_BASE_URL } from '../../config/api.js';

export const DEFAULT_MODULE_SHELL_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	partnerUserId: 'seed-shared-partner',
	today: new Date().toISOString().slice(0, 10)
});

async function queryEnvelope({ apiBaseUrl, openid, path, data }) {
	// Cache busting with timestamp
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

export async function loadModuleAccessState(context = {}) {
	const resolved = { ...DEFAULT_MODULE_SHELL_CONTEXT, ...context };
	return queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getModuleAccessState',
		data: {
			moduleInstanceId: resolved.moduleInstanceId
		}
	});
}

function getSharingLabel(sharingStatus) {
	return sharingStatus === 'shared' ? '共享中' : '未共享';
}

function buildNumericOptions(from, to) {
	const options = [];

	for (let value = from; value <= to; value += 1) {
		options.push({
			value,
			label: `${value}`
		});
	}

	return options;
}

function getModuleTile({
	moduleInstanceId,
	sharingStatus,
	activePartners,
	defaultPeriodDurationDays,
	defaultPredictionTermDays,
	entryUrl
}) {
	const partnerCount = activePartners.length;
	const isShared = sharingStatus === 'shared';

	return {
		id: moduleInstanceId,
		moduleName: '经期小记',
		entryUrl,
		statusText: isShared ? `已共享 · ${partnerCount} 位伙伴` : '仅自己可见',
		summaryText: `默认经期 ${defaultPeriodDurationDays} 天 · 预测 ${defaultPredictionTermDays} 天`,
		ownershipTone: isShared ? 'shared' : 'private',
		ownershipLabel: isShared ? '共享模块' : '私人模块',
		iconSrc: '/static/management/menstruation.svg',
		selected: true
	};
}

export function createMenstrualHomeEntryUrl(context = {}) {
	const resolved = { ...DEFAULT_MODULE_SHELL_CONTEXT, ...context };
	const query = 'apiBaseUrl=' + encodeURIComponent(resolved.apiBaseUrl || '')
		+ '&openid=' + encodeURIComponent(resolved.openid || '')
		+ '&moduleInstanceId=' + encodeURIComponent(resolved.moduleInstanceId || '')
		+ '&profileId=' + encodeURIComponent(resolved.profileId || '')
		+ '&today=' + encodeURIComponent(resolved.today || '');

	return `/pages/menstrual/home?${query}`;
}

export function createJoinPageUrl(context = {}) {
	const resolved = { ...DEFAULT_MODULE_SHELL_CONTEXT, ...context };
	const hasExplicitOpenid = Object.prototype.hasOwnProperty.call(context, 'openid');
	const queryParts = [
		'token=' + encodeURIComponent(resolved.token || ''),
		'apiBaseUrl=' + encodeURIComponent(resolved.apiBaseUrl || '')
	];

	if (hasExplicitOpenid && resolved.openid) {
		queryParts.push('openid=' + encodeURIComponent(resolved.openid));
	}

	const query = queryParts.join('&');

	return `/pages/join/index?${query}`;
}

export function createShareableJoinLink(context = {}) {
	const path = createJoinPageUrl(context);

	if (typeof window !== 'undefined' && window.location?.origin) {
		return `${window.location.origin}${window.location.pathname}#${path}`;
	}

	return path;
}

export function createModuleShellPageModel({
	context,
	accessState,
	settings
}) {
	const sharingStatus = accessState?.sharingStatus || 'private';
	const activePartners = accessState?.activePartners || [];
	const defaultPeriodDurationDays = settings?.moduleSettings?.defaultPeriodDurationDays ?? 0;
	const defaultPredictionTermDays = settings?.moduleSettings?.defaultPredictionTermDays ?? 28;
	const entryUrl = createMenstrualHomeEntryUrl(context);
	const moduleCard = getModuleTile({
		moduleInstanceId: accessState.moduleInstanceId,
		sharingStatus,
		activePartners,
		defaultPeriodDurationDays,
		defaultPredictionTermDays,
		entryUrl
	});

	return {
		title: '模块空间',
		helperText: '点击卡片查看下方摘要和操作。',
		moduleBoard: {
			title: '工具箱',
			legendItems: [
				{ key: 'shared', label: '共享模块', tone: 'shared' }
			],
			modules: [moduleCard],
			continuationText: '更多功能陆续上线中'
		},
		managementCard: {
			title: '周期设置',
			moduleName: moduleCard.moduleName,
			sharingStatus: {
				label: '共享状态',
				value: getSharingLabel(sharingStatus),
				tone: sharingStatus === 'shared' ? 'shared' : 'private'
			},
			defaultPeriodDuration: {
				label: '经期时长',
				value: `${defaultPeriodDurationDays} 天`
			},
			defaultPredictionTerm: {
				label: '月经周期',
				value: `${defaultPredictionTermDays} 天`
			},
			settingsControl: {
				label: '经期天数',
				value: defaultPeriodDurationDays,
				options: [5, 6, 7].map((days) => ({
					value: days,
					label: `${days}`,
					selected: days === defaultPeriodDurationDays
				})),
				customLabel: '自选',
				customPickerOptions: buildNumericOptions(1, 15)
			},
			predictionSettingsControl: {
				label: '周期天数',
				value: defaultPredictionTermDays,
				options: [27, 28, 29].map((days) => ({
					value: days,
					label: `${days}`,
					selected: days === defaultPredictionTermDays
				})),
				customLabel: '自选',
				customPickerOptions: buildNumericOptions(20, 45)
			},
			secondaryAction: {
				label: '邀请 TA',
				helperText: activePartners.length
					? `当前目标：${activePartners[0].userId}`
					: `当前目标：${context.partnerUserId}`,
				action: 'open-join',
				url: null
			},
			primaryAction: {
				label: '进入',
				url: entryUrl
			},
			destructiveAction: {
				label: '删除',
				disabled: true,
				helperText: '删除能力将在后续模块管理阶段接入。'
			}
		}
	};
}

export function createDemoMenstrualModuleShellPageModel(context = {}) {
	const resolved = { ...DEFAULT_MODULE_SHELL_CONTEXT, ...context };

	return {
		page: createModuleShellPageModel({
			context: resolved,
			accessState: {
				moduleInstanceId: resolved.moduleInstanceId,
				sharingStatus: 'private',
				ownerUserId: 'seed-home-owner',
				activePartners: []
			},
			settings: {
				moduleInstanceId: resolved.moduleInstanceId,
				moduleSettings: {
					defaultPeriodDurationDays: 5,
					defaultPredictionTermDays: 28
				}
			}
		}),
		raw: {
			accessState: {
				moduleInstanceId: resolved.moduleInstanceId,
				sharingStatus: 'private',
				ownerUserId: 'seed-home-owner',
				activePartners: []
			},
			settings: {
				moduleInstanceId: resolved.moduleInstanceId,
				moduleSettings: {
					defaultPeriodDurationDays: 5,
					defaultPredictionTermDays: 28
				}
			}
		},
		context: resolved,
		source: 'demo'
	};
}

export async function resolveModuleContext(openid) {
	const response = await cloudRequest({
		path: '/api/queries/getMyModuleInstance',
		method: 'GET',
		data: {},
		headers: { 'x-wx-openid': openid }
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		throw new Error(response.data?.error?.message || 'Failed to resolve module context');
	}

	return response.data.data;
}

export async function loadMenstrualModuleShellPageModel(context = {}) {
	const resolved = { ...DEFAULT_MODULE_SHELL_CONTEXT, ...context };
	const [accessState, settings] = await Promise.all([
		loadModuleAccessState(resolved),
		queryEnvelope({
			apiBaseUrl: resolved.apiBaseUrl,
			openid: resolved.openid,
			path: '/api/queries/getModuleSettings',
			data: {
				moduleInstanceId: resolved.moduleInstanceId
			}
		})
	]);

	return {
		page: createModuleShellPageModel({
			context: resolved,
			accessState,
			settings
		}),
		raw: {
			accessState,
			settings
		},
		context: resolved,
		source: 'live'
	};
}
