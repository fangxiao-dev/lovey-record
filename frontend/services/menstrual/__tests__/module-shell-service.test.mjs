import test from 'node:test';
import assert from 'node:assert/strict';

import {
	DEFAULT_MODULE_SHELL_CONTEXT,
	createDemoMenstrualModuleShellPageModel,
	createJoinPageUrl,
	createMenstrualHomeEntryUrl,
	loadModuleAccessState,
	loadMenstrualModuleShellPageModel
} from '../module-shell-service.js';

const DEFAULT_PERIOD_DURATION_DAYS = 5;
const DEFAULT_PREDICTION_TERM_DAYS = 28;
const PERIOD_DURATION_OPTIONS = [5, 6, 7];
const PREDICTION_TERM_OPTIONS = [27, 28, 29];

function installUniRequestMock(handler) {
	globalThis.uni = {
		request(options) {
			handler(options);
		}
	};
}

test('loadMenstrualModuleShellPageModel maps a private module into the private zone and keeps shared zone empty', async () => {
	installUniRequestMock((options) => {
		if (options.url.includes('/queries/getModuleAccessState')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-home-module',
						sharingStatus: 'private',
						ownerUserId: 'seed-home-owner',
						activePartners: []
					},
					error: null
				}
			});
			return;
		}

		if (options.url.includes('/queries/getModuleSettings')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-home-module',
						moduleSettings: {
							defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
							defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS
						}
					},
					error: null
				}
			});
		}
	});

	const result = await loadMenstrualModuleShellPageModel({
		...DEFAULT_MODULE_SHELL_CONTEXT,
		moduleInstanceId: 'seed-home-module'
	});

	assert.equal(result.page.title, '模块空间');
	assert.match(result.page.helperText, /点击卡片查看下方摘要和操作/);
	assert.equal(result.page.moduleBoard.title, '工具箱');
	assert.deepEqual(result.page.moduleBoard.legendItems, [
		{ key: 'shared', label: '共享模块', tone: 'shared' }
	]);
	assert.equal(result.page.moduleBoard.modules.length, 1);
	assert.equal(result.page.moduleBoard.modules[0].ownershipTone, 'private');
	assert.equal(result.page.moduleBoard.modules[0].selected, true);
	assert.equal(result.page.managementCard.title, '周期设置');
	assert.equal(result.page.managementCard.moduleName, '经期小记');
	assert.equal(result.page.managementCard.sharingStatus.value, '未共享');
	assert.equal(result.page.managementCard.sharingStatus.tone, 'private');
	assert.equal(result.page.managementCard.defaultPeriodDuration.label, '经期时长');
	assert.equal(result.page.managementCard.defaultPeriodDuration.value, `${DEFAULT_PERIOD_DURATION_DAYS} 天`);
	assert.equal(result.page.managementCard.defaultPredictionTerm.label, '月经周期');
	assert.equal(result.page.managementCard.defaultPredictionTerm.value, `${DEFAULT_PREDICTION_TERM_DAYS} 天`);
	assert.equal(result.page.managementCard.settingsControl.label, '经期天数');
	assert.deepEqual(
		result.page.managementCard.settingsControl.options.map((option) => option.value),
		PERIOD_DURATION_OPTIONS
	);
	assert.deepEqual(
		result.page.managementCard.settingsControl.options.map((option) => option.label),
		['5', '6', '7']
	);
	assert.deepEqual(
		result.page.managementCard.settingsControl.customPickerOptions.slice(0, 3).map((option) => option.value),
		[1, 2, 3]
	);
	assert.deepEqual(
		result.page.managementCard.settingsControl.customPickerOptions.slice(0, 3).map((option) => option.label),
		['1', '2', '3']
	);
	assert.deepEqual(
		result.page.managementCard.settingsControl.customPickerOptions.slice(-3).map((option) => option.value),
		[13, 14, 15]
	);
	assert.equal(result.page.managementCard.predictionSettingsControl.label, '周期天数');
	assert.deepEqual(
		result.page.managementCard.predictionSettingsControl.options.map((option) => option.value),
		PREDICTION_TERM_OPTIONS
	);
	assert.deepEqual(
		result.page.managementCard.predictionSettingsControl.options.map((option) => option.label),
		['27', '28', '29']
	);
	assert.deepEqual(
		result.page.managementCard.predictionSettingsControl.customPickerOptions.slice(0, 3).map((option) => option.value),
		[20, 21, 22]
	);
	assert.deepEqual(
		result.page.managementCard.predictionSettingsControl.customPickerOptions.slice(-3).map((option) => option.value),
		[43, 44, 45]
	);
	assert.equal(result.page.managementCard.primaryAction.label, '进入');
	assert.equal(result.page.managementCard.primaryAction.url, createMenstrualHomeEntryUrl({
		...DEFAULT_MODULE_SHELL_CONTEXT,
		moduleInstanceId: 'seed-home-module'
	}));
	assert.equal(result.page.managementCard.secondaryAction.label, '共享');
	assert.equal(result.page.managementCard.secondaryAction.action, 'open-join');
	assert.equal(result.page.managementCard.secondaryAction.url, null);
	assert.equal(result.page.managementCard.destructiveAction.label, '删除');
});

test('loadMenstrualModuleShellPageModel maps a shared module into the shared zone and does not duplicate it in private zone', async () => {
	installUniRequestMock((options) => {
		if (options.url.includes('/queries/getModuleAccessState')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-shared-module',
						sharingStatus: 'shared',
						ownerUserId: 'seed-shared-owner',
						activePartners: [
							{
								userId: 'seed-shared-partner',
								role: 'partner',
								accessStatus: 'active'
							}
						]
					},
					error: null
				}
			});
			return;
		}

		if (options.url.includes('/queries/getModuleSettings')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-shared-module',
						moduleSettings: {
							defaultPeriodDurationDays: 7,
							defaultPredictionTermDays: 29
						}
					},
					error: null
				}
			});
		}
	});

	const result = await loadMenstrualModuleShellPageModel({
		...DEFAULT_MODULE_SHELL_CONTEXT,
		openid: 'seed-shared-openid',
		moduleInstanceId: 'seed-shared-module',
		profileId: 'seed-shared-profile'
	});

	assert.equal(result.page.moduleBoard.modules.length, 1);
	assert.deepEqual(result.page.moduleBoard.legendItems, [
		{ key: 'shared', label: '共享模块', tone: 'shared' }
	]);
	assert.equal(result.page.moduleBoard.modules[0].ownershipTone, 'shared');
	assert.equal(result.page.moduleBoard.modules[0].statusText, '已共享 · 1 位伙伴');
	assert.equal(result.page.managementCard.sharingStatus.value, '共享中');
	assert.equal(result.page.managementCard.sharingStatus.tone, 'shared');
	assert.equal(result.page.managementCard.defaultPeriodDuration.value, '7 天');
	assert.equal(result.page.managementCard.defaultPredictionTerm.value, '29 天');
	assert.equal(result.page.managementCard.secondaryAction.label, '共享');
	assert.equal(result.page.managementCard.secondaryAction.action, 'open-join');
	assert.equal(result.page.managementCard.secondaryAction.url, null);
});

test('loadMenstrualModuleShellPageModel requests live access and settings queries with shell context auth', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			method: options.method,
			data: options.data,
			header: options.header
		});

		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: options.url.includes('/queries/getModuleAccessState')
					? {
						moduleInstanceId: 'seed-home-module',
						sharingStatus: 'private',
						ownerUserId: 'seed-home-owner',
						activePartners: []
					}
					: {
						moduleInstanceId: 'seed-home-module',
						moduleSettings: {
							defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
							defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS
						}
					},
				error: null
			}
		});
	});

	await loadMenstrualModuleShellPageModel({
		...DEFAULT_MODULE_SHELL_CONTEXT
	});

	assert.match(requests[0].url, /\/queries\/getModuleAccessState\?_ts=\d+$/);
	assert.match(requests[1].url, /\/queries\/getModuleSettings\?_ts=\d+$/);
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module'
	});
	assert.deepEqual(requests[1].data, {
		moduleInstanceId: 'seed-home-module'
	});
	assert.equal(requests[0].method, 'GET');
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
});

test('createMenstrualHomeEntryUrl preserves the shell live context for navigation into menstrual home', () => {
	assert.equal(
		createMenstrualHomeEntryUrl({
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-shared-openid',
			moduleInstanceId: 'seed-shared-module',
			profileId: 'seed-shared-profile',
			today: '2026-03-29'
		}),
		'/pages/menstrual/home?apiBaseUrl=http%3A%2F%2Flocalhost%3A3000%2Fapi&openid=seed-shared-openid&moduleInstanceId=seed-shared-module&profileId=seed-shared-profile&today=2026-03-29'
	);
});

test('createJoinPageUrl builds a recipient-facing join path without leaking the owner openid by default', () => {
	assert.equal(
		createJoinPageUrl({
			apiBaseUrl: 'http://localhost:3000/api',
			token: 'token-123'
		}),
		'/pages/join/index?token=token-123&apiBaseUrl=http%3A%2F%2Flocalhost%3A3000%2Fapi'
	);
});

test('createJoinPageUrl can include an explicit recipient openid override for local debugging only', () => {
	assert.equal(
		createJoinPageUrl({
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-recipient-openid',
			token: 'token-123'
		}),
		'/pages/join/index?token=token-123&apiBaseUrl=http%3A%2F%2Flocalhost%3A3000%2Fapi&openid=seed-recipient-openid'
	);
});

test('createDemoMenstrualModuleShellPageModel exposes a local seed page for H5 visual verification', () => {
	const result = createDemoMenstrualModuleShellPageModel({
		moduleInstanceId: 'demo-module',
		profileId: 'demo-profile'
	});

	assert.equal(result.source, 'demo');
	assert.equal(result.page.moduleBoard.modules[0].id, 'demo-module');
	assert.equal(result.page.managementCard.defaultPeriodDuration.value, '5 天');
	assert.equal(result.page.managementCard.defaultPredictionTerm.value, '28 天');
	assert.equal(result.page.managementCard.settingsControl.customLabel, '自选');
	assert.equal(result.page.managementCard.predictionSettingsControl.customLabel, '自选');
	assert.deepEqual(
		result.page.managementCard.settingsControl.options.map((option) => option.label),
		['5', '6', '7']
	);
	assert.deepEqual(
		result.page.managementCard.predictionSettingsControl.options.map((option) => option.label),
		['27', '28', '29']
	);
});

test('loadMenstrualModuleShellPageModel starts access and settings queries in parallel', async () => {
	const startedPaths = [];
	let resolveAccess;
	let resolveSettings;
	const accessResolved = new Promise((resolve) => {
		resolveAccess = resolve;
	});
	const settingsResolved = new Promise((resolve) => {
		resolveSettings = resolve;
	});

	installUniRequestMock((options) => {
		if (options.url.includes('/queries/getModuleAccessState')) {
			startedPaths.push('access');
			accessResolved.then(() => {
				options.success({
					statusCode: 200,
					data: {
						ok: true,
						data: {
							moduleInstanceId: 'seed-home-module',
							sharingStatus: 'private',
							ownerUserId: 'seed-home-owner',
							activePartners: []
						},
						error: null
					}
				});
			});
			return;
		}

		if (options.url.includes('/queries/getModuleSettings')) {
			startedPaths.push('settings');
			settingsResolved.then(() => {
				options.success({
					statusCode: 200,
					data: {
						ok: true,
						data: {
						moduleInstanceId: 'seed-home-module',
						moduleSettings: {
							defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
							defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS
						}
					},
						error: null
					}
				});
			});
		}
	});

	const loading = loadMenstrualModuleShellPageModel({
		...DEFAULT_MODULE_SHELL_CONTEXT
	});

	await Promise.resolve();

	assert.deepEqual(startedPaths, ['access', 'settings']);

	resolveAccess();
	resolveSettings();
	await loading;
});

test('loadModuleAccessState queries the live access endpoint and returns caller role context', async () => {
	const requests = [];

	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			method: options.method,
			data: options.data,
			header: options.header
		});

		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: 'seed-home-module',
					sharingStatus: 'shared',
					ownerUserId: 'seed-home-owner',
					activePartners: [],
					callerRole: 'viewer'
				},
				error: null
			}
		});
	});

	const result = await loadModuleAccessState({
		...DEFAULT_MODULE_SHELL_CONTEXT,
		moduleInstanceId: 'seed-home-module'
	});

	assert.equal(requests.length, 1);
	assert.match(requests[0].url, /\/queries\/getModuleAccessState\?_ts=\d+$/);
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module'
	});
	assert.equal(result.callerRole, 'viewer');
});
