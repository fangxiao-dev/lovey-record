import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
	__resetMenstrualHomeMemoryCacheForTest,
	createCalendarQueryRange,
	getSingleDayPeriodAction,
	invalidateMenstrualBrowseCacheByScopes,
	loadMenstrualCalendarWindow,
	loadMenstrualDayDetail,
	loadMenstrualHomePageModel
} from '../home-contract-service.js';

function installUniRequestMock(handler) {
	globalThis.uni = {
		request(options) {
			if (options.url.includes('/queries/getModuleAccessState')) {
				options.success({
					statusCode: 200,
					data: {
						ok: true,
						data: {
							moduleInstanceId: options.data?.moduleInstanceId || 'seed-home-module',
							callerRole: 'owner'
						},
						error: null
					}
				});
				return;
			}
			handler(options);
		}
	};
}

beforeEach(() => {
	__resetMenstrualHomeMemoryCacheForTest();
});

test('createCalendarQueryRange returns a focused 14-day window anchored to the focus week', () => {
	assert.deepEqual(
		createCalendarQueryRange({
			focusDate: '2026-03-29',
			viewMode: 'three-week'
		}),
		{
			startDate: '2026-03-23',
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

		if (options.url.includes('/queries/getModuleSettings')) {
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'seed-home-module',
						moduleSettings: {
							defaultPeriodDurationDays: 6,
							defaultPredictionTermDays: 22
						}
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
	assert.match(requests[4].url, /\/queries\/getModuleSettings\?_ts=\d+$/);
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
	assert.deepEqual(requests[4].data, {
		moduleInstanceId: 'seed-home-module'
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

test('loadMenstrualHomePageModel starts calendar, detail, action, and settings queries in parallel after home view resolves', async () => {
	const startedPaths = [];
	let resolveCalendar;
	let resolveDetail;
	let resolveAction;
	let resolveSettings;
	const calendarResolved = new Promise((resolve) => {
		resolveCalendar = resolve;
	});
	const detailResolved = new Promise((resolve) => {
		resolveDetail = resolve;
	});
	const actionResolved = new Promise((resolve) => {
		resolveAction = resolve;
	});
	const settingsResolved = new Promise((resolve) => {
		resolveSettings = resolve;
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
								defaultPeriodDurationDays: 6,
								defaultPredictionTermDays: 22
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

	assert.equal(startedPaths.length, 4);
	assert.equal(startedPaths[0], 'calendar');
	assert.equal(startedPaths[1], 'detail');
	assert.equal(startedPaths[2], 'action');
	assert.equal(startedPaths[3], 'settings');

	resolveCalendar();
	resolveDetail();
	resolveAction();
	resolveSettings();
	await loading;
});

test('loadMenstrualHomePageModel uses module settings to expand the hero next frame into a predicted range', async () => {
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
							status: 'out_of_period',
							anchorDate: '2026-03-29',
							currentCycle: {
								startDate: '2026-03-24',
								endDate: '2026-03-29',
								durationDays: 6
							}
						},
						visibleWindow: null,
						calendarMarks: [{ date: '2026-04-20', kind: 'prediction_start' }],
						selectedDay: null,
						predictionSummary: {
							predictedStartDate: '2026-04-20',
							predictionWindowStart: '2026-04-18',
							predictionWindowEnd: '2026-04-24',
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
							startDate: '2026-03-16',
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
							isPeriod: false,
							painLevel: null,
							flowLevel: null,
							colorLevel: null,
							note: null,
							source: null,
							isExplicit: false,
							isDetailRecorded: false
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
						role: 'not-period',
						chip: {
							text: '月经',
							selected: false
						},
						resolvedAction: null
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
							defaultPeriodDurationDays: 6,
							defaultPredictionTermDays: 22
						}
					},
					error: null
				}
			});
		}
	});

	const result = await loadMenstrualHomePageModel({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'seed-home-openid',
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		today: '2026-03-29',
		activeDate: '2026-03-29',
		focusDate: '2026-03-29',
		viewMode: 'three-week'
	});

	assert.equal(result.page.heroCard.nextFrame.value, '04.20 - 04.25');
	assert.deepEqual(result.raw.moduleSettings, {
		defaultPeriodDurationDays: 6,
		defaultPredictionTermDays: 22
	});
});

test('loadMenstrualCalendarWindow only requests the calendar window query for the requested focus date and view mode', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: 'seed-home-module',
					window: {
						startDate: '2026-04-20',
						endDate: '2026-05-31'
					},
					days: [],
					marks: []
				},
				error: null
			}
		});
	});

	const result = await loadMenstrualCalendarWindow({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'seed-home-openid',
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		focusDate: '2026-05-10',
		viewMode: 'month'
	});

	assert.equal(requests.length, 1);
	assert.match(requests[0].url, /\/queries\/getCalendarWindow\?_ts=\d+$/);
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		startDate: '2026-04-27',
		endDate: '2026-05-31'
	});
	assert.equal(result.focusDate, '2026-05-10');
	assert.equal(result.viewMode, 'month');
});

test('loadMenstrualCalendarWindow reuses in-memory result for identical browse key', async () => {
	const requests = [];

	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: 'cache-module-calendar-hit',
					window: {
						startDate: '2026-04-27',
						endDate: '2026-05-31'
					},
					days: [{ date: '2026-05-10', isPeriod: false }],
					marks: []
				},
				error: null
			}
		});
	});

	const context = {
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-calendar-hit',
		moduleInstanceId: 'cache-module-calendar-hit',
		profileId: 'cache-profile-calendar-hit',
		focusDate: '2026-05-10',
		viewMode: 'month'
	};

	const first = await loadMenstrualCalendarWindow(context);
	const second = await loadMenstrualCalendarWindow(context);

	assert.deepEqual(second, first);
	assert.equal(requests.length, 1);
});

test('loadMenstrualCalendarWindow misses cache when view window key changes', async () => {
	const requests = [];

	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: options.data.moduleInstanceId,
					window: {
						startDate: options.data.startDate,
						endDate: options.data.endDate
					},
					days: [{ date: options.data.startDate, isPeriod: false }],
					marks: []
				},
				error: null
			}
		});
	});

	await loadMenstrualCalendarWindow({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-calendar-miss',
		moduleInstanceId: 'cache-module-calendar-miss',
		profileId: 'cache-profile-calendar-miss',
		focusDate: '2026-05-10',
		viewMode: 'month'
	});

	await loadMenstrualCalendarWindow({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-calendar-miss',
		moduleInstanceId: 'cache-module-calendar-miss',
		profileId: 'cache-profile-calendar-miss',
		focusDate: '2026-06-10',
		viewMode: 'month'
	});

	assert.equal(requests.length, 2);
	assert.notDeepEqual(requests[0].data, requests[1].data);
});

test('loadMenstrualDayDetail only requests the selected day detail query', async () => {
	const requests = [];
	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: 'seed-home-module',
					profileId: 'seed-home-profile',
					dayRecord: {
						date: '2026-04-25',
						isPeriod: false,
						painLevel: null,
						flowLevel: null,
						colorLevel: null,
						note: null,
						source: null,
						isExplicit: false,
						isDetailRecorded: false
					}
				},
				error: null
			}
		});
	});

	const dayDetail = await loadMenstrualDayDetail({
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'seed-home-openid',
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		activeDate: '2026-04-25'
	});

	assert.equal(requests.length, 1);
	assert.match(requests[0].url, /\/queries\/getDayRecordDetail\?_ts=\d+$/);
	assert.deepEqual(requests[0].data, {
		moduleInstanceId: 'seed-home-module',
		profileId: 'seed-home-profile',
		date: '2026-04-25'
	});
	assert.equal(dayDetail.dayRecord.date, '2026-04-25');
});

test('loadMenstrualDayDetail reuses cached result for identical day key', async () => {
	const requests = [];

	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: 'cache-module-detail-hit',
					profileId: 'cache-profile-detail-hit',
					dayRecord: {
						date: '2026-04-26',
						isPeriod: false,
						painLevel: 1,
						flowLevel: null,
						colorLevel: null,
						note: 'cached detail',
						source: 'manual',
						isExplicit: true,
						isDetailRecorded: true
					}
				},
				error: null
			}
		});
	});

	const context = {
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-detail-hit',
		moduleInstanceId: 'cache-module-detail-hit',
		profileId: 'cache-profile-detail-hit',
		activeDate: '2026-04-26'
	};

	const first = await loadMenstrualDayDetail(context);
	const second = await loadMenstrualDayDetail(context);

	assert.deepEqual(second, first);
	assert.equal(requests.length, 1);
});

test('getSingleDayPeriodAction reuses cached result for identical module-and-date key', async () => {
	const requests = [];

	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					selectedDate: '2026-04-27',
					role: 'start',
					chip: {
						text: '月经开始',
						selected: false
					},
					resolvedAction: {
						action: 'set-start',
						bridgeType: 'none',
						prompt: null,
						effect: {
							action: 'set-start',
							bridgeType: 'none',
							selectedDate: '2026-04-27',
							writeDates: ['2026-04-27'],
							clearDates: [],
							resultingSegment: {
								startDate: '2026-04-27',
								endDate: '2026-04-27'
							}
						}
					}
				},
				error: null
			}
		});
	});

	const context = {
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-action-hit',
		moduleInstanceId: 'cache-module-action-hit',
		date: '2026-04-27'
	};

	const first = await getSingleDayPeriodAction(context);
	const second = await getSingleDayPeriodAction(context);

	assert.deepEqual(second, first);
	assert.equal(requests.length, 1);
});

test('invalidateMenstrualBrowseCacheByScopes invalidates the current calendar window for calendar scope', async () => {
	const requests = [];

	installUniRequestMock((options) => {
		requests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					moduleInstanceId: 'cache-module-calendar-scope',
					window: {
						startDate: options.data.startDate,
						endDate: options.data.endDate
					},
					days: [],
					marks: []
				},
				error: null
			}
		});
	});

	const context = {
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-calendar-scope',
		moduleInstanceId: 'cache-module-calendar-scope',
		profileId: 'cache-profile-calendar-scope',
		focusDate: '2026-05-10',
		viewMode: 'month'
	};

	await loadMenstrualCalendarWindow(context);
	invalidateMenstrualBrowseCacheByScopes({
		affectedScopes: ['calendar'],
		moduleInstanceId: context.moduleInstanceId,
		profileId: context.profileId,
		activeDate: '2026-05-10',
		focusDate: context.focusDate,
		viewMode: context.viewMode
	});
	await loadMenstrualCalendarWindow(context);

	assert.equal(requests.length, 2);
});

test('invalidateMenstrualBrowseCacheByScopes invalidates the selected day detail and action for dayDetail scope', async () => {
	const detailRequests = [];
	const actionRequests = [];

	installUniRequestMock((options) => {
		if (options.url.includes('/queries/getDayRecordDetail')) {
			detailRequests.push({
				url: options.url,
				data: options.data
			});
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'cache-module-day-scope',
						profileId: 'cache-profile-day-scope',
						dayRecord: {
							date: '2026-04-28',
							isPeriod: false,
							painLevel: null,
							flowLevel: null,
							colorLevel: null,
							note: null,
							source: null,
							isExplicit: false,
							isDetailRecorded: false
						}
					},
					error: null
				}
			});
			return;
		}

		actionRequests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					selectedDate: '2026-04-28',
					role: 'not-period',
					chip: {
						text: '月经',
						selected: false
					},
					resolvedAction: null
				},
				error: null
			}
		});
	});

	const baseContext = {
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-day-scope',
		moduleInstanceId: 'cache-module-day-scope',
		profileId: 'cache-profile-day-scope'
	};

	await loadMenstrualDayDetail({
		...baseContext,
		activeDate: '2026-04-28'
	});
	await getSingleDayPeriodAction({
		apiBaseUrl: baseContext.apiBaseUrl,
		openid: baseContext.openid,
		moduleInstanceId: baseContext.moduleInstanceId,
		date: '2026-04-28'
	});

	invalidateMenstrualBrowseCacheByScopes({
		affectedScopes: ['dayDetail'],
		moduleInstanceId: baseContext.moduleInstanceId,
		profileId: baseContext.profileId,
		activeDate: '2026-04-28',
		focusDate: '2026-04-28',
		viewMode: 'three-week'
	});

	await loadMenstrualDayDetail({
		...baseContext,
		activeDate: '2026-04-28'
	});
	await getSingleDayPeriodAction({
		apiBaseUrl: baseContext.apiBaseUrl,
		openid: baseContext.openid,
		moduleInstanceId: baseContext.moduleInstanceId,
		date: '2026-04-28'
	});

	assert.equal(detailRequests.length, 2);
	assert.equal(actionRequests.length, 2);
});

test('invalidateMenstrualBrowseCacheByScopes invalidates related calendar and action entries for prediction scope', async () => {
	const calendarRequests = [];
	const actionRequests = [];

	installUniRequestMock((options) => {
		if (options.url.includes('/queries/getCalendarWindow')) {
			calendarRequests.push({
				url: options.url,
				data: options.data
			});
			options.success({
				statusCode: 200,
				data: {
					ok: true,
					data: {
						moduleInstanceId: 'cache-module-prediction-scope',
						window: {
							startDate: options.data.startDate,
							endDate: options.data.endDate
						},
						days: [],
						marks: []
					},
					error: null
				}
			});
			return;
		}

		actionRequests.push({
			url: options.url,
			data: options.data
		});
		options.success({
			statusCode: 200,
			data: {
				ok: true,
				data: {
					selectedDate: options.data.date,
					role: 'start',
					chip: {
						text: '月经开始',
						selected: false
					},
					resolvedAction: null
				},
				error: null
			}
		});
	});

	const baseContext = {
		apiBaseUrl: 'http://localhost:3000/api',
		openid: 'cache-openid-prediction-scope',
		moduleInstanceId: 'cache-module-prediction-scope',
		profileId: 'cache-profile-prediction-scope'
	};

	await loadMenstrualCalendarWindow({
		...baseContext,
		focusDate: '2026-05-10',
		viewMode: 'month'
	});
	await getSingleDayPeriodAction({
		apiBaseUrl: baseContext.apiBaseUrl,
		openid: baseContext.openid,
		moduleInstanceId: baseContext.moduleInstanceId,
		date: '2026-05-10'
	});

	invalidateMenstrualBrowseCacheByScopes({
		affectedScopes: ['prediction'],
		moduleInstanceId: baseContext.moduleInstanceId,
		profileId: baseContext.profileId,
		activeDate: '2026-05-10',
		focusDate: '2026-05-10',
		viewMode: 'month'
	});

	await loadMenstrualCalendarWindow({
		...baseContext,
		focusDate: '2026-05-10',
		viewMode: 'month'
	});
	await getSingleDayPeriodAction({
		apiBaseUrl: baseContext.apiBaseUrl,
		openid: baseContext.openid,
		moduleInstanceId: baseContext.moduleInstanceId,
		date: '2026-05-10'
	});

	assert.equal(calendarRequests.length, 2);
	assert.equal(actionRequests.length, 2);
});
