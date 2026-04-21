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
	assert.match(reportPageSource, /<PageNavBar\b/);
	assert.match(reportPageSource, /class="report-page__summary-card\b/);
	assert.match(reportPageSource, /class="report-page__trend-card\b/);
	assert.match(reportPageSource, /class="report-page__history-list\b/);
	assert.match(reportPageSource, /class="report-page__bridge\b/);
	assert.match(reportPageSource, /class="report-page__align-mask\b/);
	assert.match(reportPageSource, /class="report-page__align-dialog\b/);
	assert.match(reportPageSource, /class="report-page__align-dialog-intro\b/);
	assert.match(reportPageSource, /class="report-page__align-dialog-copy-block\b/);
	assert.match(reportPageSource, /class="report-page__align-dialog-diffs\b/);
	assert.match(reportPageSource, /src="\/static\/icons\/happy\.png"/);
});

test('menstrual report page composes the report service, adapter, and three report components', () => {
	const reportPageSource = fs.readFileSync(reportPagePath, 'utf8');

	assert.match(reportPageSource, /import ReportSummaryCard from '..\/..\/components\/menstrual\/ReportSummaryCard\.vue';/);
	assert.match(reportPageSource, /import ReportTrendCard from '..\/..\/components\/menstrual\/ReportTrendCard\.vue';/);
	assert.match(reportPageSource, /import ReportHistoryList from '..\/..\/components\/menstrual\/ReportHistoryList\.vue';/);
	assert.match(reportPageSource, /import \{ createReportPageViewModel \} from '..\/..\/components\/menstrual\/report-contract-adapter\.js';/);
	assert.match(reportPageSource, /loadMenstrualReportView[\s\S]*report-contract-service\.js';/);
	assert.match(reportPageSource, /persistModulePredictionTerm,\s*[\r\n\t ]*persistModuleSettings[\s\S]*module-shell-command-service\.js';/);
	assert.match(reportPageSource, /activeTrendKey:\s*'cycle'/);
	assert.match(reportPageSource, /<ReportSummaryCard\b/);
	assert.match(reportPageSource, /<ReportTrendCard\b/);
	assert.match(reportPageSource, /<ReportHistoryList\b/);
	assert.match(reportPageSource, /@change="handleTrendChange"/);
	assert.match(reportPageSource, /@footer-tap="handleSummaryFooterTap"/);
	assert.match(reportPageSource, /this\.reportView = createReportPageViewModel/);
	assert.match(reportPageSource, /loadMenstrualReportView/);
	assert.match(reportPageSource, /loadMenstrualModuleSettings/);
	assert.match(reportPageSource, /loadModuleAccessState/);
	assert.match(reportPageSource, /Promise\.all/);
	assert.match(reportPageSource, /createAlignDialogState/);
	assert.match(reportPageSource, /showReadonlyWarning\(\)/);
	assert.match(reportPageSource, /openAlignDialog\(footer\)/);
	assert.match(reportPageSource, /if \(action === 'align'\)/);
	assert.match(reportPageSource, /if \(action !== 'settings'\) return;/);
	assert.match(reportPageSource, /当前只有只读权限，不能修改周期和时长设置/);
	assert.match(reportPageSource, /pages\/management\/index/);
});

test('menstrual report page keeps align modal scenarios and optimistic persistence flow in source', () => {
	const reportPageSource = fs.readFileSync(reportPagePath, 'utf8');

	assert.match(reportPageSource, /alignDialog:\s*createAlignDialogState\(\)/);
	assert.match(reportPageSource, /scenario:\s*'empty'/);
	assert.match(reportPageSource, /alignDialog\.scenario === 'empty'/);
	assert.match(reportPageSource, /alignDialog\.scenario === 'duration-only'/);
	assert.match(reportPageSource, /alignDialog\.scenario === 'full'/);
	assert.match(reportPageSource, /还没有统计到数据噢，先记一笔吧/);
	assert.match(reportPageSource, /自动按均值对齐以下设置/);
	assert.match(reportPageSource, /class="report-page__align-dialog-copy-strong"[\s\S]*>周期<\/text>/);
	assert.match(reportPageSource, /统计至少需要两次记录，本次只会更改/);
	assert.match(reportPageSource, /class="report-page__align-dialog-copy-strong"[\s\S]*>时长<\/text>/);
	assert.match(reportPageSource, /report-page__align-dialog-diff-label">周期/);
	assert.match(reportPageSource, /report-page__align-dialog-diff-label">时长/);
	assert.doesNotMatch(reportPageSource, /report-page__align-dialog-diff-bullet/);
	assert.match(reportPageSource, /applyOptimisticFooterAlign\(align\)/);
	assert.match(reportPageSource, /const previousFooter = this\.applyOptimisticFooterAlign\(align\);/);
	assert.match(reportPageSource, /await this\.persistAlignChanges\(align\);/);
	assert.match(reportPageSource, /await persistModuleSettings\(\{/);
	assert.match(reportPageSource, /await persistModulePredictionTerm\(\{/);
	assert.match(reportPageSource, /restoreSummaryFooter\(previousFooter\)/);
	assert.match(reportPageSource, /uni\.showToast\(\{/);
	assert.match(reportPageSource, /await this\.loadReport\(\);/);
});
