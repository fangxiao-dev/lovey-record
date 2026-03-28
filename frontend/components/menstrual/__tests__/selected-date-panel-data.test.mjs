import test from 'node:test';
import assert from 'node:assert/strict';

import { createSelectedDatePanelData } from '../selected-date-panel-data.js';

test('selected date panel data exposes the approved home-panel content structure', () => {
	const panel = createSelectedDatePanelData();

	assert.equal(panel.title, '3 月 22 日');
	assert.equal(panel.badge, '今日');
	assert.deepEqual(panel.chips, ['经期', '特殊标记']);
	assert.equal(panel.summaryItems.length, 3);
	assert.equal(
		panel.summaryItems.every((item) => item.key && item.label && item.value),
		true
	);
	assert.equal(panel.actionLabel, '保存当天记录');
});
