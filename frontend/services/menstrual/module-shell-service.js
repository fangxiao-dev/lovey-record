import { cloudRequest } from '../cloud-request.js';
import { API_BASE_URL } from '../../config/api.js';

export const DEFAULT_MODULE_SHELL_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	partnerUserId: 'seed-shared-partner',
	today: '2026-03-29'
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

function getSharingLabel(sharingStatus) {
	return sharingStatus === 'shared' ? '共享中' : '未共享';
}

function getZoneModule({
	moduleInstanceId,
	sharingStatus,
	activePartners,
	defaultPeriodDurationDays,
	entryUrl
}) {
	const partnerCount = activePartners.length;
	const isShared = sharingStatus === 'shared';

	return {
		id: moduleInstanceId,
		moduleName: '月经记录',
		entryLabel: '进入月经记录',
		entryUrl,
		statusText: isShared ? `已共享 · ${partnerCount} 位伙伴` : '仅自己可见',
		durationText: `默认经期 ${defaultPeriodDurationDays} 天`,
		badgeText: isShared ? '共享' : '私人',
		zoneTone: isShared ? 'shared' : 'private'
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

export function createModuleShellPageModel({
	context,
	accessState,
	settings
}) {
	const sharingStatus = accessState?.sharingStatus || 'private';
	const activePartners = accessState?.activePartners || [];
	const defaultPeriodDurationDays = settings?.moduleSettings?.defaultPeriodDurationDays ?? 0;
	const entryUrl = createMenstrualHomeEntryUrl(context);
	const moduleCard = getZoneModule({
		moduleInstanceId: accessState.moduleInstanceId,
		sharingStatus,
		activePartners,
		defaultPeriodDurationDays,
		entryUrl
	});

	return {
		hero: {
			title: '记录空间',
			subtitle: '真实模块入口已经接到联调数据，先从当前唯一的月经模块进入。',
			statusTag: 'MVP'
		},
		privateZone: {
			title: '私人',
			caption: 'owner 视角',
			modules: sharingStatus === 'private' ? [moduleCard] : [],
			emptyText: '当前没有仅自己可见的月经模块。'
		},
		sharedZone: {
			title: '共享',
			caption: 'same-instance shared',
			modules: sharingStatus === 'shared' ? [moduleCard] : [],
			emptyText: '当前还没有共享中的月经模块。'
		},
		summaryCard: {
			title: '模块摘要',
			description: 'private/shared 只改变访问范围，不生成第二份数据。',
			sharingStatus: {
				label: '共享状态',
				value: getSharingLabel(sharingStatus)
			},
			activePartners: {
				label: '当前伙伴',
				value: `${activePartners.length} 人`
			},
			defaultPeriodDuration: {
				label: '默认经期时长',
				value: `${defaultPeriodDurationDays} 天`
			},
			settingsControl: {
				label: '默认经期时长',
				value: defaultPeriodDurationDays,
				options: [4, 5, 6, 7].map((days) => ({
					value: days,
					label: `${days} 天`,
					selected: days === defaultPeriodDurationDays
				}))
			},
			shareAction: {
				label: activePartners.length ? '撤回共享' : '共享给伙伴',
				helperText: activePartners.length
					? `当前目标：${activePartners[0].userId}`
					: `当前目标：${context.partnerUserId}`,
				action: activePartners.length ? 'revoke' : 'share'
			}
		},
		primaryEntry: {
			label: '进入月经记录',
			url: entryUrl
		}
	};
}

export async function loadMenstrualModuleShellPageModel(context = {}) {
	const resolved = { ...DEFAULT_MODULE_SHELL_CONTEXT, ...context };
	const accessState = await queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getModuleAccessState',
		data: {
			moduleInstanceId: resolved.moduleInstanceId
		}
	});
	const settings = await queryEnvelope({
		apiBaseUrl: resolved.apiBaseUrl,
		openid: resolved.openid,
		path: '/api/queries/getModuleSettings',
		data: {
			moduleInstanceId: resolved.moduleInstanceId
		}
	});

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
