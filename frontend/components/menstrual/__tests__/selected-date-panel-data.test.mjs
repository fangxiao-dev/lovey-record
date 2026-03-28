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
		panel.summaryItems.every((item) => item.key && item.label && item.value && item.icon && item.tone),
		true
	);
	assert.deepEqual(
		panel.summaryItems.map((item) => [item.key, item.label, item.value, item.icon, item.tone]),
		[
			['flow', '流量', '中', 'water_drop', 'flow'],
			['pain', '疼痛', '轻微', 'favorite', 'pain'],
			['color', '颜色', '标准', 'palette', 'color']
		]
	);
	assert.equal(panel.attributeRows.length, 3);
	assert.deepEqual(
		panel.attributeRows.map((row) => [row.key, row.label, row.icon, row.options.length]),
		[
			['flow', '流量', 'water_drop', 5],
			['pain', '疼痛', 'favorite', 5],
			['color', '颜色', 'palette', 5]
		]
	);
	assert.deepEqual(
		panel.attributeRows.map((row) => row.options.find((option) => option.selected)?.label),
		['正常', '轻', '深']
	);
	assert.equal(panel.actionLabel, '保存当天记录');
});
