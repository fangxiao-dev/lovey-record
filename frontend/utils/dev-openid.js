export const DEV_OPENID_STORAGE_KEY = 'lovey-dev-openid';

export const DEV_OPENID_OPTIONS = Object.freeze([
	{ label: '主页所有者', openid: 'seed-home-openid' },
	{ label: '空白接收方', openid: 'seed-empty-openid' },
	{ label: '共享模块伙伴', openid: 'seed-shared-partner-openid' }
]);

function getStorageAdapter(storageLike = null) {
	if (storageLike) {
		return storageLike;
	}

	if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
		return uni;
	}

	return null;
}

export function readDevOpenid(storageLike = null) {
	const storage = getStorageAdapter(storageLike);

	if (!storage || typeof storage.getStorageSync !== 'function') {
		return null;
	}

	const value = storage.getStorageSync(DEV_OPENID_STORAGE_KEY);
	return typeof value === 'string' && value.trim() ? value : null;
}

export function persistDevOpenid(openid, storageLike = null) {
	const storage = getStorageAdapter(storageLike);

	if (!storage || typeof storage.setStorageSync !== 'function' || !openid) {
		return;
	}

	storage.setStorageSync(DEV_OPENID_STORAGE_KEY, openid);
}

export function resolveRuntimeOpenid({ explicitOpenid = null, fallbackOpenid = null, storageLike = null } = {}) {
	if (explicitOpenid) {
		return explicitOpenid;
	}

	const persisted = readDevOpenid(storageLike);
	if (persisted) {
		return persisted;
	}

	return fallbackOpenid || null;
}
