import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const homePagePath = path.join(repoRoot, 'frontend', 'pages', 'menstrual', 'home.vue');

function readHomePageSource() {
	return fs.readFileSync(homePagePath, 'utf8');
}

test('home page renders a dedicated phase status row with inline hint content', () => {
	const source = readHomePageSource();

	assert.match(source, /page\.heroCard\.statusFrame\.phaseStatus/);
	assert.match(source, /class="menstrual-home__hero-phase-row"/);
	assert.match(source, /class="menstrual-home__hero-phase-group"/);
	assert.match(source, /class="menstrual-home__hero-phase-name"/);
	assert.match(source, /class="menstrual-home__hero-hint-group"/);
	assert.match(source, /class="menstrual-home__hero-hint-text"/);
	assert.match(source, /page\.heroCard\.statusFrame\.phaseStatus\.hint/);
});

test('home page source includes amber emphasis classes and warm hero styling for ovulation and late luteal phases', () => {
	const source = readHomePageSource();

	assert.match(source, /menstrual-home__hero-status-frame--emphasis/);
	assert.match(source, /menstrual-home__hero-phase-group--emphasis/);
	assert.match(source, /menstrual-home__hero-phase-name--emphasis/);
	assert.match(source, /#FBF0D8/);
	assert.match(source, /#FFFDF8/);
	assert.match(source, /#E8D5A3/);
});

test('home page renders the reliability warning button inline with the phase name', () => {
	const source = readHomePageSource();

	assert.match(source, /page\.heroCard\.statusFrame\.phaseStatus\.showReliabilityWarning/);
	assert.match(source, /class="menstrual-home__hero-phase-warning-btn"/);
	assert.match(source, /@\s*tap="handlePhaseWarningTap"/);
});
