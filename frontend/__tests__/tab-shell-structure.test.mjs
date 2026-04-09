import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');

function read(relativePath) {
	return fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8');
}

test('app keeps module management as the single home entry without the temporary bottom tab shell', () => {
	const pagesConfig = JSON.parse(read('pages.json').replace(/\/\/.*$/gm, ''));
	const homePagePath = path.resolve(repoRoot, 'pages/index/index.vue');
	const managementPagePath = path.resolve(repoRoot, 'pages/management/index.vue');
	const managementComponentPath = path.resolve(repoRoot, 'components/management/ModuleManagementPage.vue');
	const tabBarPath = path.resolve(repoRoot, 'components/navigation/BottomTabBar.vue');

	assert.equal(pagesConfig.pages[0].path, 'pages/index/index');
	assert.equal(pagesConfig.pages.some((page) => page.path === 'pages/management/index'), true);
	assert.equal(fs.existsSync(homePagePath), true);
	assert.equal(fs.existsSync(managementPagePath), true);
	assert.equal(fs.existsSync(managementComponentPath), true);
	assert.equal(fs.existsSync(tabBarPath), false);

	const homeSource = fs.readFileSync(homePagePath, 'utf8');
	const managementSource = fs.readFileSync(managementPagePath, 'utf8');
	const managementComponentSource = fs.readFileSync(managementComponentPath, 'utf8');

	assert.match(homeSource, /import ModuleManagementPage from '..\/..\/components\/management\/ModuleManagementPage\.vue';/);
	assert.match(managementSource, /import ModuleManagementPage from '..\/..\/components\/management\/ModuleManagementPage\.vue';/);
	assert.match(homeSource, /onLoad\(options\)/);
	assert.match(homeSource, /\$refs\.managementPage\?\.initialize\(options \|\| \{\}\)/);
	assert.match(managementSource, /onLoad\(options\)/);
	assert.match(managementSource, /\$refs\.managementPage\?\.initialize\(options \|\| \{\}\)/);
	assert.match(managementComponentSource, /management-page__title/);
	assert.match(managementComponentSource, /async initialize\(options = \{\}\)/);
	assert.match(managementComponentSource, /moduleTiles/);
	assert.match(managementComponentSource, /page\.managementCard/);
	assert.match(managementComponentSource, /handleModuleSelect/);
	assert.doesNotMatch(homeSource, /首页占位/);
	assert.doesNotMatch(managementSource, /BottomTabBar/);
	assert.doesNotMatch(managementComponentSource, /BottomTabBar/);
});
