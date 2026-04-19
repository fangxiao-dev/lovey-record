export function resolveBrowseNavLabels(viewMode) {
	if (viewMode === 'three-week') {
		return {
			leadingLabel: '上周',
			trailingLabel: '下周'
		};
	}

	return {
		leadingLabel: '上个月',
		trailingLabel: '下个月'
	};
}

export function resolveJumpBoundaryMessage(jumpKey) {
	return jumpKey === 'prev-period' ? '向前已无记录' : '向后已无记录';
}

export function isJumpBoundary(headerNav = {}, jumpKey) {
	if (jumpKey === 'prev-period') {
		return Boolean(
			headerNav?.isBackwardBoundary
			|| (headerNav?.focusedNodeType === 'real-period' && !headerNav?.previousPeriodStart)
		);
	}

	if (jumpKey === 'next-period') {
		return Boolean(
			headerNav?.isForwardBoundary
			|| (
				(headerNav?.focusedNodeType === 'real-period' || headerNav?.focusedNodeType === 'prediction')
				&& !headerNav?.nextPeriodStart
			)
		);
	}

	return false;
}

export function resolveJumpTabItems(items, headerNav = {}) {
	return items.map((item) => {
		if (item.key === 'prev-period') {
			return {
				...item,
				disabled: false,
				invalid: isJumpBoundary(headerNav, item.key)
			};
		}

		if (item.key === 'next-period') {
			return {
				...item,
				disabled: false,
				invalid: isJumpBoundary(headerNav, item.key)
			};
		}

		return {
			...item,
			invalid: false
		};
	});
}
