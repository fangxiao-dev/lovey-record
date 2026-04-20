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
	assert.match(source, /shouldShowPhaseHintIcon\(page\.heroCard\.statusFrame\.phaseStatus\)/);
	assert.match(source, /黄体期_前7天/);
});

test('home page source includes amber emphasis classes and warm hero styling for ovulation and late luteal phases', () => {
	const source = readHomePageSource();

	assert.match(source, /menstrual-home__hero--emphasis/);
	assert.match(source, /menstrual-home__hero-phase-group--emphasis/);
	assert.match(source, /menstrual-home__hero-phase-name--emphasis/);
	assert.match(source, /#FCF4E6/);
	assert.match(source, /#FFFCF6/);
	assert.match(source, /#EAD9B3/);
});

test('home page renders the reliability warning button inline with the phase name', () => {
	const source = readHomePageSource();

	assert.match(source, /page\.heroCard\.statusFrame\.phaseStatus\.showReliabilityWarning/);
	assert.match(source, /class="menstrual-home__hero-phase-warning-btn"/);
	assert.match(source, /@\s*tap="handlePhaseWarningTap"/);
	assert.match(source, /uni\.showModal\(/);
	assert.match(source, /当前预测基于较少记录，随着记录次数增加会更准确/);
});

test('home page source includes a dedicated no-record hero branch and empty-state copy container', () => {
	const source = readHomePageSource();

	assert.match(source, /page\.heroCard\.statusFrame\.state === 'no_record'/);
	assert.match(source, /menstrual-home__hero-empty-state/);
	assert.match(source, /menstrual-home__hero-empty-icon/);
	assert.match(source, /menstrual-home__hero-status-text--empty/);
	assert.match(source, /menstrual-home__hero-empty-copy/);
	assert.match(source, /\/static\/menstrual\/start\.png/);
});
