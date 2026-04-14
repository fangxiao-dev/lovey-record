import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const homePagePath = path.resolve(repoRoot, 'pages/menstrual/home.vue');
const managementPagePath = path.resolve(repoRoot, 'components/management/ModuleManagementPage.vue');
const joinPagePath = path.resolve(repoRoot, 'pages/join/index.vue');
const reportPagePath = path.resolve(repoRoot, 'pages/menstrual/report.vue');

function readHomePage() {
	return fs.readFileSync(homePagePath, 'utf8');
}

function readManagementPage() {
	return fs.readFileSync(managementPagePath, 'utf8');
}

function readJoinPage() {
	return fs.readFileSync(joinPagePath, 'utf8');
}

function readReportPage() {
	return fs.readFileSync(reportPagePath, 'utf8');
}

test('menstrual home share payload targets the join page without embedding the owner openid', () => {
	const source = readHomePage();

	assert.match(source, /createJoinPageUrl/);
	assert.doesNotMatch(source, /&openid=\$\{encodeURIComponent\(this\.contractContext\.openid\)\}/);
});

test('module management share action opens a confirmation modal instead of copying to clipboard', () => {
	const source = readManagementPage();

	assert.match(source, /showShareModal/);
	assert.doesNotMatch(source, /uni\.setClipboardData\(/);
});

test('management alias page defines onShareAppMessage for native WeChat forward', () => {
	const aliasSource = fs.readFileSync(
		path.resolve(repoRoot, 'pages/management/index.vue'),
		'utf8'
	);

	assert.match(aliasSource, /onShareAppMessage/);
	assert.match(aliasSource, /createInviteToken/);
	// reads context from the child component ref (via $refs.managementPage or a local alias)
	assert.match(aliasSource, /\$refs\.managementPage/);
	assert.match(aliasSource, /\.context/);
});

test('join page exposes a dev-only recipient identity bootstrap instead of silently reusing the owner identity', () => {
	const source = readJoinPage();

	assert.match(source, /DEV_OPENID_OPTIONS/);
	assert.match(source, /identity-required/);
	assert.match(source, /handleDevIdentitySelect/);
	assert.match(source, /MISSING_OPENID/);
});

test('management, home, and report pages share the same runtime openid resolution contract', () => {
	const homeSource = readHomePage();
	const managementSource = readManagementPage();
	const reportSource = readReportPage();

	assert.match(homeSource, /resolveRuntimeOpenid/);
	assert.match(managementSource, /resolveRuntimeOpenid/);
	assert.match(reportSource, /resolveRuntimeOpenid/);

	assert.doesNotMatch(homeSource, /openid:\s*d\(runtimeOptions\.openid\)\s*\|\|\s*DEFAULT_MENSTRUAL_HOME_CONTEXT\.openid/);
	assert.doesNotMatch(managementSource, /const openid = runtimeOptions\.openid \|\| DEFAULT_MODULE_SHELL_CONTEXT\.openid/);
	assert.doesNotMatch(reportSource, /openid:\s*decode\(runtimeOptions\.openid\)\s*\|\|\s*DEFAULT_MENSTRUAL_REPORT_CONTEXT\.openid/);
});
