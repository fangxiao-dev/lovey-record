import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const managementPagePath = path.resolve(repoRoot, 'components/management/ModuleManagementPage.vue');
const sharedLegendChipPath = path.resolve(repoRoot, 'components/management/SharedLegendChip.vue');
const moduleTileCompactPath = path.resolve(repoRoot, 'components/management/ModuleTileCompact.vue');
const moduleActionRowPath = path.resolve(repoRoot, 'components/management/ModuleActionRow.vue');
const moduleSettingStripPath = path.resolve(repoRoot, 'components/management/ModuleSettingStrip.vue');
const moduleShellServicePath = path.resolve(repoRoot, 'services/menstrual/module-shell-service.js');

function readManagementPage() {
	return fs.readFileSync(managementPagePath, 'utf8');
}

function readSharedLegendChip() {
	return fs.readFileSync(sharedLegendChipPath, 'utf8');
}

function readModuleTileCompact() {
	return fs.readFileSync(moduleTileCompactPath, 'utf8');
}

function readModuleActionRow() {
	return fs.readFileSync(moduleActionRowPath, 'utf8');
}

function readModuleSettingStrip() {
	return fs.readFileSync(moduleSettingStripPath, 'utf8');
}

function readModuleShellService() {
	return fs.readFileSync(moduleShellServicePath, 'utf8');
}

test('module management page uses compact module tiles, split action layout, and inline custom pickers', () => {
	const pageSource = readManagementPage();
	const tileSource = readModuleTileCompact();
	const actionRowSource = readModuleActionRow();
	const settingStripSource = readModuleSettingStrip();

	assert.match(pageSource, /<ModuleTileCompact/);
	assert.match(pageSource, /<ModuleActionRow/);
	assert.match(pageSource, /<ModuleSettingStrip/);
	assert.match(pageSource, /:picker-align="setting\.pickerAlign"/);
	assert.match(actionRowSource, /management-card__actions-main/);
	assert.match(actionRowSource, /management-card__actions-destructive/);
	assert.match(actionRowSource, /<view class="management-card__actions-main">/);
	assert.match(actionRowSource, /<view class="management-card__actions-destructive">/);
	assert.match(tileSource, /width:\s*200rpx;/);
	assert.match(tileSource, /min-height:\s*136rpx;/);
	assert.match(actionRowSource, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
	assert.doesNotMatch(actionRowSource, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
	assert.match(settingStripSource, /picker-view/);
	assert.match(settingStripSource, /picker-view-column/);
	assert.match(settingStripSource, /handlePickerChange/);
	assert.match(settingStripSource, /mask-style=/);
	assert.match(settingStripSource, /module-setting-strip__picker-card/);
	assert.match(settingStripSource, /pickerAlign:\s*\{\s*type:\s*String,/);
	assert.match(settingStripSource, /resolvedPickerAlign\(\)/);
	assert.match(pageSource, /quickWindowAnchors/);
	assert.match(pageSource, /buildCenteredQuickOptions/);
	assert.match(settingStripSource, /module-setting-strip__control-group--start/);
	assert.match(settingStripSource, /module-setting-strip__control-group--end/);
	assert.match(settingStripSource, /module-setting-strip__wheel-shell/);
	assert.match(settingStripSource, /@tap="\$emit\('custom'\)"/);
	assert.match(settingStripSource, /flex-wrap:\s*nowrap;/);
	assert.match(settingStripSource, /width:\s*fit-content;/);
	assert.match(settingStripSource, /width:\s*188rpx;/);
	assert.match(settingStripSource, /height:\s*220rpx;/);
	assert.match(settingStripSource, /border-radius:\s*24rpx;/);
	assert.match(settingStripSource, /border:\s*2rpx solid \$text-muted;/);
	assert.match(settingStripSource, /background:\s*transparent;/);
	assert.match(settingStripSource, /height:\s*44rpx;/);
	assert.match(settingStripSource, /color:\s*\$text-primary;/);
	assert.match(settingStripSource, /font-weight:\s*\$font-weight-title;/);
	assert.match(settingStripSource, /module-setting-strip__control-group--start\s*\{\s*align-self:\s*flex-start;/);
	assert.match(settingStripSource, /module-setting-strip__control-group--end\s*\{\s*align-self:\s*flex-end;/);
	assert.match(settingStripSource, /module-setting-strip__picker-card\s*\{[\s\S]*align-self:\s*center;/);
});

test('module management page keeps only the shared-module legend while preserving shared-state styling hooks', () => {
	const pageSource = readManagementPage();
	const legendSource = readSharedLegendChip();
	const tileSource = readModuleTileCompact();
	const actionRowSource = readModuleActionRow();
	const settingStripSource = readModuleSettingStrip();
	const serviceSource = readModuleShellService();
	const aliasSource = fs.readFileSync(
		path.resolve(repoRoot, 'pages/management/index.vue'),
		'utf8'
	);

	assert.match(legendSource, /\$management-shared-green:\s*#6bb98e;/i);
	assert.match(actionRowSource, /\$management-shared-green:\s*#6bb98e;/i);
	assert.match(actionRowSource, /\$management-shared-soft:\s*#eaf7f0;/i);
	assert.match(legendSource, /management-legend-chip__dot--shared/);
	assert.match(tileSource, /module-tile__status-dot--shared/);
	assert.match(tileSource, /module-tile__status-dot--shared\s*\{\s*background:\s*\$management-shared-green;/);
	assert.match(legendSource, /management-legend-chip__dot--shared\s*\{\s*background:\s*\$management-shared-green;/);
	assert.match(actionRowSource, /management-action--share/);
	assert.match(actionRowSource, /management-action__text--share/);
	assert.match(actionRowSource, /management-action--share\s*\{\s*background:\s*\$management-shared-soft;/i);
	assert.match(actionRowSource, /management-action__text--share\s*\{\s*color:\s*\$management-shared-green;/i);
	assert.match(tileSource, /v-if="showSharedDot"/);
	assert.match(tileSource, /showSharedDot\(\)\s*\{\s*return this\.ownershipTone === 'shared';\s*\}/);
	assert.match(tileSource, /width:\s*24rpx;\s*height:\s*24rpx;\s*border-radius:\s*999rpx;/);
	assert.doesNotMatch(legendSource, /management-legend-chip__dot--private/);
	assert.doesNotMatch(pageSource, /私人模块/);
	assert.match(settingStripSource, /customLabel:\s*\{\s*type:\s*String,/);
	assert.match(settingStripSource, /customPickerVisible:\s*\{\s*type:\s*Boolean,/);
	assert.match(serviceSource, /customLabel:\s*'自定义'/);
	assert.match(serviceSource, /customPickerOptions:\s*buildNumericOptions\(1,\s*15\)/);
	assert.match(serviceSource, /customPickerOptions:\s*buildNumericOptions\(20,\s*45\)/);
	assert.match(pageSource, /showShareModal/);
	assert.doesNotMatch(pageSource, /createInviteToken/);
	assert.doesNotMatch(pageSource, /uni\.navigateTo\(\{\s*url\s*\}\)/);
	assert.match(aliasSource, /onShareAppMessage/);
	assert.match(aliasSource, /createInviteToken/);
	assert.match(aliasSource, /createJoinPageUrl/);
	assert.match(aliasSource, /\$refs\.managementPage/);
	assert.match(aliasSource, /\.context/);
	assert.doesNotMatch(pageSource, /persistModuleSharingState/);
	assert.match(actionRowSource, /@tap="\$emit\('share'\)"/);
});

test('module management page composes extracted management primitives and removes inline sharing-state text', () => {
	const source = readManagementPage();

	assert.match(source, /import SharedLegendChip from '\.\/SharedLegendChip\.vue';/);
	assert.match(source, /import ModuleTileCompact from '\.\/ModuleTileCompact\.vue';/);
	assert.match(source, /import ModuleActionRow from '\.\/ModuleActionRow\.vue';/);
	assert.match(source, /<SharedLegendChip/);
	assert.match(source, /<ModuleTileCompact/);
	assert.match(source, /<ModuleActionRow/);
	assert.match(source, /<ModuleSettingStrip/);
	assert.doesNotMatch(source, /management-card__state ui-badge__text/);
	assert.doesNotMatch(source, /management-card__state--shared/);
	assert.doesNotMatch(source, /management-card__state--private/);
});
