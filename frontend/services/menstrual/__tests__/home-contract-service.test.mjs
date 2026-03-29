import test from 'node:test';
import assert from 'node:assert/strict';

import {
	createCalendarQueryRange,
	loadMenstrualHomePageModel
} from '../home-contract-service.js';

function installUniRequestMock(handler) {
	globalThis.uni = {
		request(options) {
			handler(options);
		}
	};
}

test('createCalendarQueryRange returns a 3-week rolling window around the focus date', () => {
	assert.deepEqual(
		createCalendarQueryRange({
			focusDate: '2026-03-29',
			viewMode: 'three-week'
		}),
		{
			startDate: '2026-03-16',
			endDate: '2026-04-05'
		}
	);
});

test('createCalendarQueryRange returns a full calendar month grid window for month view', () => {
	assert.deepEqual(
		createCalendarQueryRange({
			focusDate: '2026-03-29',
			viewMode: 'month'
		}),
		{
			startDate: '2026-02-23',
			endDate: '2026-04-05'
		}
	);
});

test('loadMenstrualHomePageModel requests getCalendarWindow using the resolved focus date and view mode', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			method: options.method,
			data: options.data
		});

		if (options.url.endsWith('/queries/getModuleHomeView')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-home-module',
						sharingStatus: 'private',
						currentStatusSummary: {
							status: 'in_period',
							anchorDate: '2026-03-29',
							currentCycle: {
								startDate: '2026-03-26',
								endDate: '2026-03-31',
								durationDays: 6
							}
						},
						visibleWindow: null,
						calendarMarks: [],
						selectedDay: null,
						predictionSummary: {
							predictedStartDate: '2026-04-25',
							predictionWindowStart: '2026-04-23',
							predictionWindowEnd: '2026-04-27',
							basedOnCycleCount: 3
						}
					},
					error: null
				}
			});
			return;
		}

		if (options.url.endsWith('/queries/getCalendarWindow')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-home-module',
						window: {
							startDate: '2026-02-23',
							endDate: '2026-04-05'
						},
						days: [],
						marks: []
					},
					error: null
				}
			});
			return;
		}

		if (options.url.endsWith('/queries/getDayRecordDetail')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-home-module',
						profileId: 'seed-home-profile',
						dayRecord: {
							date: '2026-03-29',
							isPeriod: true,
							painLevel: 3,
							flowLevel: 3,
							colorLevel: 3,
							note: null,
							source: 'auto_filled',
							isExplicit: true,
							isDetailRecorded: true
						}
					},
					error: null
				}
			});
		}
	});

	await loadMenstrualHomePageModel({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'seed-home-openid',
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		today: '2026-03-29',
		activeDate: '2026-03-29',
		focusDate: '2026-03-29',
		viewMode: 'month'
	});

	assert.equal(requests[1].url, 'http://localhost:3000/api/queries/getCalendarWindow');
	assert.deepEqual(requests[1].data, {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		startDate: '2026-02-23',
		endDate: '2026-04-05'
	});
});
