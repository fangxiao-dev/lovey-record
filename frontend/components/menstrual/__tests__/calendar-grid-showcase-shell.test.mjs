import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsRoot = path.resolve(__dirname, '..');
const showcasePagePath = path.resolve(componentsRoot, '..', '..', 'pages', 'menstrual', 'calendar-grid-showcase.vue');
const acceptanceDataPath = path.resolve(componentsRoot, 'calendar-grid-acceptance-page-data.js');
const headerNavPath = path.resolve(componentsRoot, 'HeaderNav.vue');
const jumpTabsPath = path.resolve(componentsRoot, 'JumpTabs.vue');
const segmentedControlPath = path.resolve(componentsRoot, 'SegmentedControl.vue');
const selectedDatePanelPath = path.resolve(componentsRoot, 'SelectedDatePanel.vue');

test('calendar grid showcase page uses HeaderNav for the three-week home demo shell', () => {
	assert.equal(fs.existsSync(headerNavPath), true);
	assert.equal(fs.existsSync(jumpTabsPath), true);
	assert.equal(fs.existsSync(segmentedControlPath), true);
	assert.equal(fs.existsSync(selectedDatePanelPath), true);

	const source = fs.readFileSync(showcasePagePath, 'utf8');
	const dataSource = fs.readFileSync(acceptanceDataPath, 'utf8');

	assert.match(source, /import HeaderNav from '..\/..\/components\/menstrual\/HeaderNav\.vue';/);
	assert.match(source, /import JumpTabs from '..\/..\/components\/menstrual\/JumpTabs\.vue';/);
	assert.match(source, /import SegmentedControl from '..\/..\/components\/menstrual\/SegmentedControl\.vue';/);
	assert.match(source, /import SelectedDatePanel from '..\/..\/components\/menstrual\/SelectedDatePanel\.vue';/);
	assert.match(source, /<HeaderNav\b/);
	assert.match(source, /<JumpTabs\b/);
	assert.match(source, /<SegmentedControl\b/);
	assert.match(source, /<SelectedDatePanel\b/);
	assert.match(source, /page\.topBar/);
	assert.match(source, /page\.heroCard/);
	assert.match(source, /page\.jumpTabs\.items/);
	assert.match(source, /page\.viewModeControl\.options/);
	assert.match(source, /page\.headerNav/);
	assert.match(source, /page\.selectedDatePanel/);
	assert.match(dataSource, /今天/);
	assert.match(dataSource, /本次/);
	assert.match(dataSource, /下次预测/);
	assert.match(dataSource, /3 周/);
	assert.match(dataSource, /月览/);
	assert.match(dataSource, /月经记录/);
	assert.match(dataSource, /经期第 2 天/);
});
