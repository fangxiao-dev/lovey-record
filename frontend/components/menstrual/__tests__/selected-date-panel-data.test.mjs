import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadVueOptions } from '../../../__tests__/helpers/load-vue-options.mjs';

import { createSelectedDatePanelData } from '../selected-date-panel-data.js';

test('selected date panel data exposes the approved home-panel content structure', () => {
	const panel = createSelectedDatePanelData();

	assert.equal(panel.title, '3 月 22 日');
	assert.equal(panel.badge, '今日');
	assert.equal('chips' in panel, false);
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
	assert.equal(panel.initialPeriodMarked, true);
	assert.equal(panel.periodChipText, '月经结束');
	assert.equal(panel.periodChipSelected, true);
	assert.equal(panel.initialEditorOpen, false);
	assert.equal('actionLabel' in panel, false);
});

test('SelectedDatePanel renders the period chip label from props instead of hardcoding 经期', () => {
	const source = fs.readFileSync(
		path.resolve(process.cwd(), 'frontend/components/menstrual/SelectedDatePanel.vue'),
		'utf8'
	);

	assert.match(source, /\{\{\s*periodChipText\s*\}\}/);
	assert.equal(source.includes('>经期<'), false);
});

test('SelectedDatePanel keeps contextual periodChipSelected as the source of truth over legacy initialPeriodMarked fallback', () => {
	const panel = loadVueOptions('frontend/components/menstrual/SelectedDatePanel.vue', {
		flowIcon: 'flow.svg',
		painIcon: 'pain.svg',
		colorIcon: 'color.svg'
	});
	const ctx = { isPeriodChipSelected: false };

	panel.watch.periodChipSelected.call(ctx, true);
	panel.watch.initialPeriodMarked.call(ctx, false);

	assert.equal(ctx.isPeriodChipSelected, true);
});

test('SelectedDatePanel period chip emits the next intent without mutating local selected state eagerly', () => {
	const panel = loadVueOptions('frontend/components/menstrual/SelectedDatePanel.vue', {
		flowIcon: 'flow.svg',
		painIcon: 'pain.svg',
		colorIcon: 'color.svg'
	});
	const emitted = [];
	const ctx = {
		busy: false,
		isPeriodChipSelected: true,
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	panel.methods.togglePeriod.call(ctx);

	assert.equal(ctx.isPeriodChipSelected, true);
	assert.deepEqual(emitted, [['toggle-period', false]]);
});
