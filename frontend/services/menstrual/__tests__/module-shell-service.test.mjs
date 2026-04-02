import test from 'node:test';
import assert from 'node:assert/strict';

import {
	DEFAULT_MODULE_SHELL_CONTEXT,
	createMenstrualHomeEntryUrl,
	loadMenstrualModuleShellPageModel
} from '../module-shell-service.js';

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
							defaultPeriodDurationDays: 6
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

	assert.equal(result.page.privateZone.modules.length, 1);
	assert.equal(result.page.sharedZone.modules.length, 0);
	assert.equal(result.page.summaryCard.sharingStatus.value, '未共享');
	assert.equal(result.page.summaryCard.activePartners.value, '0 人');
	assert.equal(result.page.summaryCard.defaultPeriodDuration.value, '6 天');
	assert.equal(result.page.primaryEntry.url, createMenstrualHomeEntryUrl({
		...DEFAULT_MODULE_SHELL_CONTEXT,
		moduleInstanceId: 'seed-home-module'
	}));
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
							defaultPeriodDurationDays: 7
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

	assert.equal(result.page.privateZone.modules.length, 0);
	assert.equal(result.page.sharedZone.modules.length, 1);
	assert.equal(result.page.sharedZone.modules[0].statusText, '已共享 · 1 位伙伴');
	assert.equal(result.page.summaryCard.sharingStatus.value, '共享中');
	assert.equal(result.page.summaryCard.activePartners.value, '1 人');
	assert.equal(result.page.summaryCard.defaultPeriodDuration.value, '7 天');
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
							defaultPeriodDurationDays: 6
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
								defaultPeriodDurationDays: 6
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
