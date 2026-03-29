import test from 'node:test';
import assert from 'node:assert/strict';

import {
	persistModuleSharingState,
	persistModuleSettings
} from '../module-shell-command-service.js';

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
	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/shareModuleInstance');
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
	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/revokeModuleAccess');
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
					defaultPeriodDurationDays: 5,
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
		defaultPeriodDurationDays: 5
	});

	assert.equal(result.defaultPeriodDurationDays, 5);
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/updateDefaultPeriodDuration');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		defaultPeriodDurationDays: 5
	});
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
});
