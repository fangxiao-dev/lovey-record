/**
 * Build a 3-item quick option window centered on the anchor value.
 *
 * @param {number} anchor
 * @param {number} selectedValue
 * @param {Array<{value: number, label: string}>} allOptions
 * @returns {Array<{value: number, label: string, selected: boolean}>}
 */
export function buildCenteredQuickOptions(anchor, selectedValue, allOptions) {
	if (!allOptions.length) return [];

	const min = allOptions[0].value;
	const max = allOptions[allOptions.length - 1].value;

	if (max - min < 2) {
		return allOptions.slice(0, 3).map((option) => ({
			...option,
			selected: option.value === selectedValue
		}));
	}

	const center = Math.max(min + 1, Math.min(max - 1, anchor));

	return [center - 1, center, center + 1].map((value) => ({
		value,
		label: `${value}`,
		selected: value === selectedValue
	}));
}
