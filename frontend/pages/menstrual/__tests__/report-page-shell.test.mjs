import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const pagesJsonPath = path.join(repoRoot, 'frontend', 'pages.json');
const reportPagePath = path.join(repoRoot, 'frontend', 'pages', 'menstrual', 'report.vue');

test('menstrual report page shell is registered and exposes the required layout anchors', () => {
	const pagesJson = fs.readFileSync(pagesJsonPath, 'utf8');

	assert.match(pagesJson, /"path"\s*:\s*"pages\/menstrual\/report"/);

	assert.equal(fs.existsSync(reportPagePath), true, 'report page should exist');

	const reportPageSource = fs.readFileSync(reportPagePath, 'utf8');

	assert.match(reportPageSource, /class="report-page\b/);
	assert.match(reportPageSource, /class="report-page__header\b/);
	assert.match(reportPageSource, /class="report-page__summary-card\b/);
	assert.match(reportPageSource, /class="report-page__trend-card\b/);
	assert.match(reportPageSource, /class="report-page__history-list\b/);
});

test('menstrual report page composes the report service, adapter, and three report components', () => {
	const reportPageSource = fs.readFileSync(reportPagePath, 'utf8');

	assert.match(reportPageSource, /import ReportSummaryCard from '..\/..\/components\/menstrual\/ReportSummaryCard\.vue';/);
	assert.match(reportPageSource, /import ReportTrendCard from '..\/..\/components\/menstrual\/ReportTrendCard\.vue';/);
	assert.match(reportPageSource, /import ReportHistoryList from '..\/..\/components\/menstrual\/ReportHistoryList\.vue';/);
	assert.match(reportPageSource, /import \{ createReportPageViewModel \} from '..\/..\/components\/menstrual\/report-contract-adapter\.js';/);
	assert.match(reportPageSource, /loadMenstrualReportView[\s\S]*report-contract-service\.js';/);
	assert.match(reportPageSource, /activeTrendKey:\s*'cycle'/);
	assert.match(reportPageSource, /<ReportSummaryCard\b/);
	assert.match(reportPageSource, /<ReportTrendCard\b/);
	assert.match(reportPageSource, /<ReportHistoryList\b/);
	assert.match(reportPageSource, /@change="handleTrendChange"/);
	assert.match(reportPageSource, /this\.reportView = createReportPageViewModel/);
	assert.match(reportPageSource, /loadMenstrualReportView/);
});
