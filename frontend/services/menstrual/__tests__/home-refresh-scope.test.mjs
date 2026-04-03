import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRefreshPlan } from '../home-refresh-scope.js';

test('resolveRefreshPlan falls back to full snapshot when scopes are missing', () => {
	assert.deepEqual(resolveRefreshPlan(null), { immediate: 'fullSnapshot', deferredHero: false });
	assert.deepEqual(resolveRefreshPlan(undefined), { immediate: 'fullSnapshot', deferredHero: false });
});

test('resolveRefreshPlan routes prediction-only writes to deferred hero reconciliation', () => {
	assert.deepEqual(resolveRefreshPlan(['prediction']), {
		immediate: 'skip',
		deferredHero: true
	});
});

test('resolveRefreshPlan keeps moduleOverview writes on the full snapshot path', () => {
	assert.deepEqual(resolveRefreshPlan(['moduleOverview', 'prediction']), {
		immediate: 'fullSnapshot',
		deferredHero: false
	});
});

test('resolveRefreshPlan performs calendar and day-detail reconciliation first for period writes', () => {
	assert.deepEqual(resolveRefreshPlan(['calendar', 'dayDetail', 'prediction']), {
		immediate: 'calendar+dayDetail',
		deferredHero: true
	});
});

test('resolveRefreshPlan refreshes only the selected day when day detail is the only affected scope', () => {
	assert.deepEqual(resolveRefreshPlan(['dayDetail']), {
		immediate: 'dayDetail',
		deferredHero: false
	});
});

test('resolveRefreshPlan refreshes only the calendar when calendar is affected without prediction', () => {
	assert.deepEqual(resolveRefreshPlan(['calendar']), {
		immediate: 'calendar',
		deferredHero: false
	});
});

test('resolveRefreshPlan skips refresh when the command explicitly reports no affected scopes', () => {
	assert.deepEqual(resolveRefreshPlan([]), {
		immediate: 'skip',
		deferredHero: false
	});
});
