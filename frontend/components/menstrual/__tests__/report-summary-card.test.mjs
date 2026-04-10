import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.resolve(__dirname, '..', 'ReportSummaryCard.vue');

test('report summary card renders two flattened rows with average and fluctuation on one line', () => {
	const source = fs.readFileSync(componentPath, 'utf8');

	assert.match(source, /name:\s*'ReportSummaryCard'/);
	assert.match(source, /rows:\s*\{/);
	assert.match(source, /class="report-summary-card__row"/);
	assert.match(source, /row\.label/);
	assert.match(source, /row\.averageText/);
	assert.match(source, /row\.fluctuationText/);
	assert.match(source, /report-summary-card__metric/);
	assert.match(source, /report-summary-card__fluctuation/);
});
