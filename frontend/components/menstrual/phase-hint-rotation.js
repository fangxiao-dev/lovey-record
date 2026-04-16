const SESSION_STORAGE_KEY = 'menstrual_hint_session';

const PHASE_HINTS = Object.freeze({
	经期: Object.freeze(['注意休息']),
	卵泡期: Object.freeze(['状态逐渐恢复']),
	排卵期: Object.freeze(['精力可能较好']),
	黄体期_早段: Object.freeze(['注意身体变化']),
	黄体期_前7天: Object.freeze(['月经可能临近', '还有 {n} 天经期'])
});

const ROTATING_PHASE_KEYS = Object.freeze(Object.keys(PHASE_HINTS));

let runtimeSessionToken = null;

function createRuntimeSessionToken() {
	return `menstrual-hint-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStorageApi() {
	const uniApi = globalThis.uni;
	if (
		uniApi
		&& typeof uniApi.getStorageSync === 'function'
		&& typeof uniApi.setStorageSync === 'function'
	) {
		return uniApi;
	}

	return {
		getStorageSync() {
			return undefined;
		},
		setStorageSync() {}
	};
}

function resolveHintGroupKey(phase, isLutealLate) {
	if (phase === '黄体期') {
		return isLutealLate ? '黄体期_前7天' : '黄体期_早段';
	}

	return phase;
}

function getHintIndexStorageKey(phaseKey) {
	return `menstrual_hint_idx_${phaseKey}`;
}

function normalizeHintIndex(value, size) {
	if (!Number.isInteger(value) || size <= 0) {
		return 0;
	}

	return ((value % size) + size) % size;
}

function advanceHintRotationIndex(storageApi, phaseKey) {
	const hints = PHASE_HINTS[phaseKey] || [];
	if (hints.length <= 1) {
		storageApi.setStorageSync(getHintIndexStorageKey(phaseKey), 0);
		return;
	}

	const currentIndex = normalizeHintIndex(storageApi.getStorageSync(getHintIndexStorageKey(phaseKey)), hints.length);
	const nextIndex = (currentIndex + 1) % hints.length;
	storageApi.setStorageSync(getHintIndexStorageKey(phaseKey), nextIndex);
}

function ensureRuntimeSession(storageApi) {
	if (!runtimeSessionToken) {
		runtimeSessionToken = createRuntimeSessionToken();
	}

	const persistedSessionToken = storageApi.getStorageSync(SESSION_STORAGE_KEY);
	if (!persistedSessionToken) {
		storageApi.setStorageSync(SESSION_STORAGE_KEY, runtimeSessionToken);
		return;
	}

	if (persistedSessionToken !== runtimeSessionToken) {
		ROTATING_PHASE_KEYS.forEach((phaseKey) => {
			advanceHintRotationIndex(storageApi, phaseKey);
		});
		storageApi.setStorageSync(SESSION_STORAGE_KEY, runtimeSessionToken);
	}
}

function formatHint(template, daysUntilNextPeriod) {
	if (!template.includes('{n}')) {
		return template;
	}

	if (Number.isInteger(daysUntilNextPeriod) && daysUntilNextPeriod >= 0) {
		return template.replaceAll('{n}', String(daysUntilNextPeriod));
	}

	return '月经可能临近';
}

export function resolveHint(phase, isLutealLate, daysUntilNextPeriod) {
	const phaseKey = resolveHintGroupKey(phase, isLutealLate);
	const hints = PHASE_HINTS[phaseKey] || PHASE_HINTS.卵泡期;
	const storageApi = getStorageApi();

	ensureRuntimeSession(storageApi);

	const hintIndex = normalizeHintIndex(
		storageApi.getStorageSync(getHintIndexStorageKey(phaseKey)),
		hints.length
	);
	const hintTemplate = hints[hintIndex] || hints[0] || '';
	return formatHint(hintTemplate, daysUntilNextPeriod);
}

export function __resetPhaseHintRotationForTests() {
	runtimeSessionToken = null;
}
