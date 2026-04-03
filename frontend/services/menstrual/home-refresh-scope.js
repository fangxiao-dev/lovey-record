export function resolveRefreshPlan(scopes) {
	if (scopes == null) {
		return {
			immediate: 'fullSnapshot',
			deferredHero: false
		};
	}

	if (!Array.isArray(scopes) || scopes.length === 0) {
		return {
			immediate: 'skip',
			deferredHero: false
		};
	}

	if (scopes.includes('moduleOverview')) {
		return {
			immediate: 'fullSnapshot',
			deferredHero: false
		};
	}

	const hasPrediction = scopes.includes('prediction');
	const hasCalendar = scopes.includes('calendar');
	const hasDayDetail = scopes.includes('dayDetail');

	if (hasPrediction && hasCalendar && hasDayDetail) {
		return {
			immediate: 'calendar+dayDetail',
			deferredHero: true
		};
	}

	if (hasPrediction && hasCalendar) {
		return {
			immediate: 'calendar',
			deferredHero: true
		};
	}

	if (hasPrediction && hasDayDetail) {
		return {
			immediate: 'dayDetail',
			deferredHero: true
		};
	}

	if (hasPrediction) {
		return {
			immediate: 'skip',
			deferredHero: true
		};
	}

	if (hasCalendar && hasDayDetail) {
		return {
			immediate: 'calendar+dayDetail',
			deferredHero: false
		};
	}

	if (hasDayDetail) {
		return {
			immediate: 'dayDetail',
			deferredHero: false
		};
	}

	if (hasCalendar) {
		return {
			immediate: 'calendar',
			deferredHero: false
		};
	}

	return {
		immediate: 'fullSnapshot',
		deferredHero: false
	};
}
