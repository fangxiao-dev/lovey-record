import test from 'node:test';
import assert from 'node:assert/strict';

import { createCalendarLegendItems } from '../calendar-legend-data.js';

test('calendar legend uses the locked Chinese product copy in the approved order', () => {
	const items = createCalendarLegendItems();

	assert.deepEqual(
		items.map((item) => item.label),
		['本次经期', '经期预测', '特殊标记']
	);
});

test('calendar legend keeps marker semantics aligned to the date-state contract', () => {
	const items = createCalendarLegendItems();
	const [periodItem, predictionItem, specialItem] = items;

	assert.equal(periodItem.tone, 'period');
	assert.equal(periodItem.marker, 'fill');
	assert.equal(predictionItem.tone, 'prediction');
	assert.equal(predictionItem.marker, 'fill');
	assert.equal(specialItem.tone, 'special');
	assert.equal(specialItem.marker, 'eye');
});
