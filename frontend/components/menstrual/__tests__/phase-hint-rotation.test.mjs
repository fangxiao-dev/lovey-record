import test from 'node:test';
import assert from 'node:assert/strict';

import {
	__resetPhaseHintRotationForTests,
	resolveHint
} from '../phase-hint-rotation.js';

function createUniStorageMock() {
	const store = new Map();

	return {
		store,
		getStorageSync(key) {
			return store.get(key);
		},
		setStorageSync(key, value) {
			store.set(key, value);
		}
	};
}

function installUniStorageMock() {
	const uniMock = createUniStorageMock();
	globalThis.uni = uniMock;
	return uniMock;
}

test.beforeEach(() => {
	installUniStorageMock();
	__resetPhaseHintRotationForTests();
});

test.afterEach(() => {
	delete globalThis.uni;
	__resetPhaseHintRotationForTests();
});

test('resolveHint returns a valid hint for each phase', () => {
	assert.equal(resolveHint('经期', false, null), '注意休息');
	assert.equal(resolveHint('卵泡期', false, null), '状态逐渐恢复');
	assert.equal(resolveHint('排卵期', false, null), '精力可能较好');
	assert.equal(resolveHint('黄体期', false, 9), '注意身体变化');
	assert.match(resolveHint('黄体期', true, 5), /月经可能临近|还有 5 天经期/);
});

test('resolveHint replaces {n} with daysUntilNextPeriod when the rotating hint uses countdown copy', () => {
	const uniMock = installUniStorageMock();

	resolveHint('黄体期', true, 5);
	__resetPhaseHintRotationForTests();
	const hint = resolveHint('黄体期', true, 5);

	assert.equal(hint, '还有 5 天经期');
	assert.equal(uniMock.store.get('menstrual_hint_idx_黄体期_前7天'), 1);
});

test('resolveHint is session-stable within the same runtime session', () => {
	const firstHint = resolveHint('黄体期', true, 5);
	const secondHint = resolveHint('黄体期', true, 5);

	assert.equal(secondHint, firstHint);
});

test('resolveHint advances to the next hint after a new session boundary', () => {
	const uniMock = installUniStorageMock();
	const firstHint = resolveHint('黄体期', true, 5);

	__resetPhaseHintRotationForTests();
	const secondHint = resolveHint('黄体期', true, 5);

	assert.notEqual(secondHint, firstHint);
	assert.equal(secondHint, '还有 5 天经期');
	assert.equal(uniMock.store.get('menstrual_hint_idx_黄体期_前7天'), 1);
});
