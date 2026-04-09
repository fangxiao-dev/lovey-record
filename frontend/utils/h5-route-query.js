function mergeSearchParams(target, params) {
	for (const [key, value] of params.entries()) {
		if (target[key] === undefined || target[key] === null || target[key] === '') {
			target[key] = value;
		}
	}
}

export function mergeH5RouteQuery(options = {}, locationLike = null) {
	const merged = { ...options };
	const runtimeLocation = locationLike || (typeof window !== 'undefined' ? window.location : null);

	if (!runtimeLocation) {
		return merged;
	}

	if (runtimeLocation.search) {
		mergeSearchParams(merged, new URLSearchParams(runtimeLocation.search));
	}

	const hash = runtimeLocation.hash || '';
	const queryIndex = hash.indexOf('?');
	if (queryIndex !== -1) {
		mergeSearchParams(merged, new URLSearchParams(hash.slice(queryIndex + 1)));
	}

	return merged;
}
