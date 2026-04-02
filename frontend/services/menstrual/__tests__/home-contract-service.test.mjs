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
			data: options.data,
			header: options.header
		});

		if (options.url.includes('/queries/getModuleHomeView')) {
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

		if (options.url.includes('/queries/getCalendarWindow')) {
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

		if (options.url.includes('/queries/getDayRecordDetail')) {
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
			return;
		}

		if (options.url.includes('/queries/getSingleDayPeriodAction')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						selectedDate: '2026-03-29',
						role: 'in-progress',
						chip: {
							text: '月经结束',
							selected: true
						},
						resolvedAction: {
							action: 'end-here',
							bridgeType: 'none',
							prompt: null,
							effect: {
								action: 'end-here',
								bridgeType: 'none',
								selectedDate: '2026-03-29',
								writeDates: ['2026-03-29'],
								clearDates: ['2026-03-30', '2026-03-31'],
								resultingSegment: {
									startDate: '2026-03-26',
									endDate: '2026-03-29'
								}
							}
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

	assert.match(requests[0].url, /\/queries\/getModuleHomeView\?_ts=\d+$/);
	assert.match(requests[1].url, /\/queries\/getCalendarWindow\?_ts=\d+$/);
	assert.match(requests[2].url, /\/queries\/getDayRecordDetail\?_ts=\d+$/);
	assert.match(requests[3].url, /\/queries\/getSingleDayPeriodAction\?_ts=\d+$/);
	assert.deepEqual(requests[1].data, {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		startDate: '2026-02-23',
		endDate: '2026-04-05'
	});
	assert.deepEqual(requests[3].data, {
		moduleInstanceId: 'seed-home-module',
		date: '2026-03-29'
	});
	assert.equal(requests[1].header['x-wx-openid'], 'seed-home-openid');
});

test('loadMenstrualHomePageModel throws by default when live queries fail', async () => {
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
		loadMenstrualHomePageModel({
			apiBaseUrl: 'http://localhost:3000/api',
			openid: 'seed-home-openid',
			moduleInstanceId: 'seed-home-module',
			profileId: 'seed-home-profile',
			today: '2026-03-29'
		}),
		/boom/
	);
});

test('loadMenstrualHomePageModel starts calendar and detail queries in parallel after home view resolves', async () => {
	const startedPaths = [];
	let resolveCalendar;
	let resolveDetail;
	let resolveAction;
	const calendarResolved = new Promise((resolve) => {
		resolveCalendar = resolve;
	});
	const detailResolved = new Promise((resolve) => {
		resolveDetail = resolve;
	});
	const actionResolved = new Promise((resolve) => {
		resolveAction = resolve;
	});

	installUniRequestMock((options) => {
		if (options.url.includes('/queries/getModuleHomeView')) {
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
						predictionSummary: null
					},
					error: null
				}
			});
			return;
		}

		if (options.url.includes('/queries/getCalendarWindow')) {
			startedPaths.push('calendar');
			calendarResolved.then(() => {
				options.success({
					statusCode: 200,
					data: {
						ok: true,
						data: {
							moduleInstanceId: 'seed-home-module',
							window: {
								startDate: '2026-03-16',
								endDate: '2026-04-05'
							},
							days: [],
							marks: []
						},
						error: null
					}
				});
			});
			return;
		}

		if (options.url.includes('/queries/getDayRecordDetail')) {
			startedPaths.push('detail');
			detailResolved.then(() => {
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
								painLevel: null,
								flowLevel: null,
								colorLevel: null,
								note: null,
								source: 'manual',
								isExplicit: true,
								isDetailRecorded: false
							}
						},
						error: null
					}
				});
			});
			return;
		}

		if (options.url.includes('/queries/getSingleDayPeriodAction')) {
			startedPaths.push('action');
			actionResolved.then(() => {
				options.success({
					statusCode: 200,
					data: {
						ok: true,
						data: {
							selectedDate: '2026-03-29',
							role: 'start',
							chip: {
								text: '月经开始',
								selected: true
							},
							resolvedAction: {
								action: 'revoke-start',
								bridgeType: 'none',
								prompt: null,
								effect: {
									action: 'revoke-start',
									bridgeType: 'none',
									selectedDate: '2026-03-29',
									writeDates: [],
									clearDates: ['2026-03-29'],
									resultingSegment: null
								}
							}
						},
						error: null
					}
				});
			});
		}
	});

	const loading = loadMenstrualHomePageModel({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'seed-home-openid',
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		today: '2026-03-29',
		activeDate: '2026-03-29',
		focusDate: '2026-03-29',
		viewMode: 'three-week'
	});

	await new Promise((resolve) => setTimeout(resolve, 0));

	assert.equal(startedPaths.length, 3);
	assert.equal(startedPaths[0], 'calendar');
	assert.equal(startedPaths[1], 'detail');
	assert.equal(startedPaths[2], 'action');

	resolveCalendar();
	resolveDetail();
	resolveAction();
	await loading;
});
