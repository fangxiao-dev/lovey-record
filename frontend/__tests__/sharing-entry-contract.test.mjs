import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const homePagePath = path.resolve(repoRoot, 'pages/menstrual/home.vue');

function readHomePage() {
	return fs.readFileSync(homePagePath, 'utf8');
}

test('menstrual home routes invite and link entry points through the join page instead of using platform-only share semantics', () => {
	const source = readHomePage();

	assert.match(source, /createJoinPageUrl/);
	assert.match(source, /handleOpenJoinPage/);
	assert.match(source, /@tap="handleOpenJoinPage"/);
	assert.match(source, /uni\.navigateTo\(\{\s*url\s*\}\)/);
	assert.doesNotMatch(source, /<button[^>]+open-type="share"/);
});
