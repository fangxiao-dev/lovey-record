import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');

function read(relativePath) {
	return fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8');
}

test('foundation exposes the shared pressable hover utility class', () => {
	const source = read('styles/foundation/patterns.scss');

	assert.match(source, /\.ui-pressable-hover/);
	assert.doesNotMatch(source, /\.ui-pressable--busy/);
});

test('menstrual and shell hotspots wire hover-class feedback on tappable view controls', () => {
	const menstrualHome = read('pages/menstrual/home.vue');
	const shellHome = read('pages/index/index.vue');
	const segmentedControl = read('components/menstrual/SegmentedControl.vue');
	const jumpTabs = read('components/menstrual/JumpTabs.vue');
	const headerNav = read('components/menstrual/HeaderNav.vue');
	const selectedDatePanel = read('components/menstrual/SelectedDatePanel.vue');
	const calendarGrid = read('components/menstrual/CalendarGrid.vue');

	assert.match(menstrualHome, /hover-class="ui-pressable-hover"/);
	assert.match(shellHome, /hover-class="ui-pressable-hover"/);
	assert.match(segmentedControl, /hover-class="ui-pressable-hover"/);
	assert.match(jumpTabs, /hover-class="ui-pressable-hover"/);
	assert.match(headerNav, /hover-class="ui-pressable-hover"/);
	assert.match(selectedDatePanel, /hover-class="ui-pressable-hover"/);
	assert.match(calendarGrid, /ui-pressable-hover/);
});
