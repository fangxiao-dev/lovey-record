import test from 'node:test';
import assert from 'node:assert/strict';

import {
	persistModuleSharingState,
	persistModulePredictionTerm,
	persistModuleSettings
} from '../module-shell-command-service.js';

const DEFAULT_PERIOD_DURATION_DAYS = 5;

function installUniRequestMock(handler) {
	globalThis.uni = {
		request(options) {
			handler(options);
		}
	};
}

test('persistModuleSharingState posts shareModuleInstance with the owner shell context and partner user id', async () => {
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
					partnerUserId: 'seed-shared-partner',
					accessStatus: 'active'
				},
				error: null
			}
		});
	});

	const result = await persistModuleSharingState({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module',
			partnerUserId: 'seed-shared-partner'
		},
		action: 'share'
	});

	assert.equal(result.sharingStatus, 'shared');
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, 'http://localhost:3004/api/commands/shareModuleInstance');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		partnerUserId: 'seed-shared-partner'
	});
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
});

test('persistModuleSharingState posts revokeModuleAccess with the owner shell context and partner user id', async () => {
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
					sharingStatus: 'private',
					partnerUserId: 'seed-shared-partner',
					accessStatus: 'revoked'
				},
				error: null
			}
		});
	});

	const result = await persistModuleSharingState({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module',
			partnerUserId: 'seed-shared-partner'
		},
		action: 'revoke'
	});

	assert.equal(result.sharingStatus, 'private');
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, 'http://localhost:3004/api/commands/revokeModuleAccess');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		partnerUserId: 'seed-shared-partner'
	});
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
});

test('persistModuleSettings posts updateDefaultPeriodDuration with the owner shell context and selected duration', async () => {
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
					defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
					settingsChanged: true
				},
				error: null
			}
		});
	});

	const result = await persistModuleSettings({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS
	});

	assert.equal(result.defaultPeriodDurationDays, DEFAULT_PERIOD_DURATION_DAYS);
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, 'http://localhost:3004/api/commands/updateDefaultPeriodDuration');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS
	});
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
});

test('persistModulePredictionTerm posts updateDefaultPredictionTerm with the owner shell context and selected term', async () => {
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
					defaultPredictionTermDays: 29,
					settingsChanged: true
				},
				error: null
			}
		});
	});

	const result = await persistModulePredictionTerm({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		defaultPredictionTermDays: 29
	});

	assert.equal(result.defaultPredictionTermDays, 29);
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, 'http://localhost:3004/api/commands/updateDefaultPredictionTerm');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		defaultPredictionTermDays: 29
	});
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
});
