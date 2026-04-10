import test from 'node:test';
import assert from 'node:assert/strict';

import { loadMenstrualReportView } from '../report-contract-service.js';

function installUniRequestMock(handler) {
	globalThis.uni = {
		request(options) {
			handler(options);
		}
	};
}

test('loadMenstrualReportView requests the dedicated report query and returns normalized records', async () => {
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
					records: [
						{ startDate: '2026-01-10', endDate: '2026-01-14', durationDays: 5 },
						{ startDate: '2026-02-08', endDate: '2026-02-11', durationDays: 4 }
					]
				},
				error: null
			}
		});
	});

	const result = await loadMenstrualReportView({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'seed-home-openid',
		moduleInstanceId: 'seed-home-module'
	});

	assert.equal(requests.length, 1);
	assert.match(requests[0].url, /\/queries\/getModuleReportView\?_ts=\d+$/);
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module'
	});
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
	assert.deepEqual(result, {
		moduleInstanceId: 'seed-home-module',
		records: [
			{ startDate: '2026-01-10', endDate: '2026-01-14', durationDays: 5 },
			{ startDate: '2026-02-08', endDate: '2026-02-11', durationDays: 4 }
		]
	});
});

test('loadMenstrualReportView throws when the report query fails', async () => {
	installUniRequestMock((options) => {
		options.success({
			statusCode: 500,
			data: {
				ok: false,
				data: null,
				error: {
					message: 'boom'
				}
			}
		});
	});

	await assert.rejects(
		loadMenstrualReportView({
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		}),
		/boom/
	);
});
