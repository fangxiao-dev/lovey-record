import test from 'node:test';
import assert from 'node:assert/strict';

import {
	DEV_OPENID_STORAGE_KEY,
	persistDevOpenid,
	readDevOpenid,
	resolveRuntimeOpenid
} from '../dev-openid.js';

function createStorageMock(initialValue = null) {
	let stored = initialValue;

	return {
		getStorageSync(key) {
			assert.equal(key, DEV_OPENID_STORAGE_KEY);
			return stored;
		},
		setStorageSync(key, value) {
			assert.equal(key, DEV_OPENID_STORAGE_KEY);
			stored = value;
		}
	};
}

test('resolveRuntimeOpenid prefers explicit route identity over persisted dev identity', () => {
	const storage = createStorageMock('seed-empty-openid');

	assert.equal(
		resolveRuntimeOpenid({
			explicitOpenid: 'seed-home-openid',
			fallbackOpenid: 'seed-shared-partner-openid',
			storageLike: storage
		}),
		'seed-home-openid'
	);
});

test('resolveRuntimeOpenid falls back to persisted dev identity before default fallback', () => {
	const storage = createStorageMock('seed-empty-openid');

	assert.equal(
		resolveRuntimeOpenid({
			fallbackOpenid: 'seed-home-openid',
			storageLike: storage
		}),
		'seed-empty-openid'
	);
});

test('persistDevOpenid stores a reusable local debugging identity', () => {
	const storage = createStorageMock();

	persistDevOpenid('seed-shared-partner-openid', storage);

	assert.equal(readDevOpenid(storage), 'seed-shared-partner-openid');
});
