import test from 'node:test';
import assert from 'node:assert/strict';

import {
	persistBatchPeriodRange,
	persistSelectedDateNote,
	persistSelectedDateDetails,
	persistSelectedDatePeriodState
} from '../home-command-service.js';
import { applyClearAttributesToPageModel, createMenstrualHomePageModel, createSeededHomeContracts } from '../../../components/menstrual/home-contract-adapter.js';

function installUniRequestMock(handler) {
	globalThis.uni = {
		request(options) {
			handler(options);
		}
	};
}

test('persistSelectedDateDetails posts selected attribute levels to recordDayDetails', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push(options);
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: { detailChanged: true, isDetailRecorded: true },
				error: null
			}
		});
	});

	const { homeView, dayDetail } = createSeededHomeContracts();
	const page = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	await persistSelectedDateDetails({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		activeDate: '2026-03-29',
		pageModel: page
	});

	assert.equal(requests.length, 1);
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/recordDayDetails');
	assert.equal(requests[0].header['x-wx-openid'], 'seed-home-openid');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		date: '2026-03-29',
		painLevel: 3,
		flowLevel: 3,
		colorLevel: 3
	});
});

test('persistSelectedDateDetails sends null levels when attributes are cleared', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push(options);
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: { detailChanged: true, isDetailRecorded: false },
				error: null
			}
		});
	});

	const { homeView, dayDetail } = createSeededHomeContracts();
	const page = applyClearAttributesToPageModel(createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	}));

	await persistSelectedDateDetails({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		activeDate: '2026-03-29',
		pageModel: page
	});

	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		date: '2026-03-29',
		painLevel: null,
		flowLevel: null,
		colorLevel: null
	});
});

test('persistSelectedDateNote posts note text to recordDayNote', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push(options);
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: { noteChanged: true },
				error: null
			}
		});
	});

	await persistSelectedDateNote({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		activeDate: '2026-03-29',
		note: 'late sleep'
	});

	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/recordDayNote');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		date: '2026-03-29',
		note: 'late sleep'
	});
});

test('persistBatchPeriodRange maps batch actions to explicit range commands', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push(options);
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {},
				error: null
			}
		});
	});

	await persistBatchPeriodRange({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		action: 'set-period',
		startDate: '2026-03-16',
		endDate: '2026-03-18'
	});
	await persistBatchPeriodRange({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		action: 'clear-record',
		startDate: '2026-03-16',
		endDate: '2026-03-18'
	});

	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/recordPeriodRange');
	assert.equal(requests[1].url, 'http://localhost:3000/api/commands/clearPeriodRange');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		startDate: '2026-03-16',
		endDate: '2026-03-18'
	});
	assert.deepEqual(requests[1].data, {
		moduleInstanceId: 'seed-home-module',
		startDate: '2026-03-16',
		endDate: '2026-03-18'
	});
});

test('persistSelectedDatePeriodState chooses period commands based on the toggled target state', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push(options);
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {},
				error: null
			}
		});
	});

	const { homeView, dayDetail } = createSeededHomeContracts();
	const page = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		today: '2026-03-29'
	});

	await persistSelectedDatePeriodState({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		activeDate: '2026-03-29',
		pageModel: page,
		isPeriodMarked: false
	});

	await persistSelectedDatePeriodState({
		context: {
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module'
		},
		activeDate: '2026-03-29',
		pageModel: page,
		isPeriodMarked: true
	});

	assert.equal(requests[0].url, 'http://localhost:3000/api/commands/clearPeriodDay');
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		date: '2026-03-29'
	});
	assert.equal(requests[1].url, 'http://localhost:3000/api/commands/recordPeriodDay');
	assert.deepEqual(requests[1].data, {
		moduleInstanceId: 'seed-home-module',
		date: '2026-03-29'
	});
});
