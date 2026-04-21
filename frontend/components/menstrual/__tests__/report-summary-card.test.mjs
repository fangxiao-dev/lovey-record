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
	assert.match(source, /footer:\s*\{/);
	assert.match(source, /class="report-summary-card__footer"/);
	assert.match(source, /report-summary-card__footer-main/);
	assert.match(source, /footerCopySegments/);
	assert.match(source, /this\.footer\?\.currentSettingsText/);
	assert.ok(source.includes('.split(/(\\d+|-)/g)'));
	assert.match(source, /report-summary-card__footer-copy-segment--primary/);
	assert.match(source, /report-summary-card__footer-copy-segment--muted/);
	assert.match(source, /footer\.portalMode/);
	assert.match(source, /report-summary-card__footer-actions/);
	assert.match(source, /report-summary-card__footer-trigger/);
	assert.match(source, /report-summary-card__footer-action/);
	assert.match(source, /手动调整/);
	assert.match(source, /一键对齐/);
	assert.match(source, /report-summary-card__footer-icon/);
	assert.match(source, /\/static\/icons\/wrench\.png/);
	assert.match(source, /\/static\/icons\/refresh\.png/);
	assert.match(
		source,
		/@tap="\$emit\('footer-tap',\s*\{\s*footer,\s*action:\s*'settings'\s*\}\)"/
	);
	assert.match(
		source,
		/@tap="\$emit\('footer-tap',\s*\{\s*footer,\s*action:\s*'align'\s*\}\)"/
	);
});
