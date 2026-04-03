import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRefreshTarget } from '../home-refresh-scope.js';

test('resolveRefreshTarget falls back to full snapshot when scopes are missing', () => {
	assert.equal(resolveRefreshTarget(null), 'fullSnapshot');
	assert.equal(resolveRefreshTarget(undefined), 'fullSnapshot');
});

test('resolveRefreshTarget keeps prediction and moduleOverview writes on the full snapshot path', () => {
	assert.equal(resolveRefreshTarget(['prediction']), 'fullSnapshot');
	assert.equal(resolveRefreshTarget(['moduleOverview', 'prediction']), 'fullSnapshot');
	assert.equal(resolveRefreshTarget(['calendar', 'dayDetail', 'prediction']), 'fullSnapshot');
});

test('resolveRefreshTarget refreshes only the selected day when day detail is the only affected scope', () => {
	assert.equal(resolveRefreshTarget(['dayDetail']), 'dayDetail');
});

test('resolveRefreshTarget refreshes only the calendar when calendar is affected without prediction', () => {
	assert.equal(resolveRefreshTarget(['calendar']), 'calendar');
});

test('resolveRefreshTarget skips refresh when the command explicitly reports no affected scopes', () => {
	assert.equal(resolveRefreshTarget([]), 'skip');
});
