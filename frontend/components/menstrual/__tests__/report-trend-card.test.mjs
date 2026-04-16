import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.resolve(__dirname, '..', 'ReportTrendCard.vue');

test('report trend card exposes cycle and duration tab switching with the approved empty state', () => {
	const source = fs.readFileSync(componentPath, 'utf8');

	assert.match(source, /name:\s*'ReportTrendCard'/);
	assert.match(source, /import SegmentedControl from '\.\/SegmentedControl\.vue';/);
	assert.match(source, /周期/);
	assert.match(source, /时长/);
	assert.match(source, /@change="\$emit\('change', \$event\)"/);
	assert.match(source, /记录 3 次后开始有图/);
	assert.match(source, /report-trend-card__chart-wrapper/);
	assert.match(source, /report-trend-card__empty/);
	assert.match(source, /this\.activeKey === 'duration'[\s\S]*min:\s*0/);
	assert.doesNotMatch(source, /report-trend-card__bar/);
	assert.match(source, /report-trend-card__point-dot/);
	assert.match(source, /report-trend-card__average-line/);
});
