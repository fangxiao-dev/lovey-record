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
	assert.match(source, /Cycle/);
	assert.match(source, /Duration/);
	assert.match(source, /@change="\$emit\('change', \$event\)"/);
	assert.match(source, /记录 3 次后开始有图/);
	assert.match(source, /report-trend-card__chart/);
	assert.match(source, /report-trend-card__empty/);
});
