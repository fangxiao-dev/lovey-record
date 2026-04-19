import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
	createMenstrualHomePageModel,
	createSeededHomeContracts
} from '../home-contract-adapter.js';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const homePagePath = path.join(repoRoot, 'frontend', 'pages', 'menstrual', 'home.vue');
const reportIconPath = path.join(repoRoot, 'frontend', 'static', 'menstrual', 'report.svg');

test('menstrual home exposes the secondary report entry card directly under the hero', () => {
	const { homeView, dayDetail, moduleSettings } = createSeededHomeContracts();
	const page = createMenstrualHomePageModel({
		homeView,
		dayDetail,
		moduleSettings,
		today: homeView.currentStatusSummary.anchorDate
	});

	assert.deepEqual(page.reportEntryCard, {
		title: '周期小结',
		description: '看看周期节奏和过往记录',
		iconUrl: '/static/menstrual/report.svg',
		targetUrl: '/pages/menstrual/report'
	});

	assert.equal(fs.existsSync(reportIconPath), true, 'report icon asset should exist');

	const homeSource = fs.readFileSync(homePagePath, 'utf8');

	assert.match(homeSource, /class="menstrual-home__report-entry\b/);
	assert.match(homeSource, /page\.reportEntryCard\.iconUrl/);
	assert.match(homeSource, /handleReportEntryTap/);
	assert.match(homeSource, /url:\s*`\$\{this\.page\.reportEntryCard\.targetUrl\}\?/);
	assert.match(homeSource, /apiBaseUrl=/);
	assert.match(homeSource, /moduleInstanceId=/);

	const heroIndex = homeSource.indexOf('menstrual-home__hero');
	const reportEntryIndex = homeSource.indexOf('menstrual-home__report-entry');
	const selectedPanelIndex = homeSource.indexOf('<SelectedDatePanel');

	assert.equal(reportEntryIndex > heroIndex, true, 'report entry should render after the hero');
	assert.equal(reportEntryIndex < selectedPanelIndex, true, 'report entry should render before the selected-date panel');
});
