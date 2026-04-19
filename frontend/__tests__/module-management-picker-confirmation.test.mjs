import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const componentPath = path.resolve(repoRoot, 'components/management/ModuleManagementPage.vue');

function loadModuleManagementPage() {
	const source = fs.readFileSync(componentPath, 'utf8');
	const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
	if (!scriptMatch) {
		throw new Error(`No <script> block found in ${componentPath}`);
	}

	const transformed = scriptMatch[1]
		.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
		.replace(/export default/, 'module.exports =');

	const module = { exports: {} };
	const sandbox = vm.createContext({
		module,
		exports: module.exports,
		console,
		SharedLegendChip: {},
		ModuleTileCompact: {},
		ModuleActionRow: {},
		ModuleSettingStrip: {},
		LoadingScreen: {},
		ChangelogEntryRow: {},
		ChangelogSheet: {},
		DEFAULT_MODULE_SHELL_CONTEXT: {},
		createShareableJoinLink() {},
		createDemoMenstrualModuleShellPageModel() {},
		loadMenstrualModuleShellPageModel() {},
		resolveModuleContext() {},
		persistModuleSettings() {},
		persistModulePredictionTerm() {},
		changelogEntries: [],
		readLastViewedVersion() {},
		writeLastViewedVersion() {},
		mergeH5RouteQuery(value) { return value; },
		resolveRuntimeOpenid() { return null; },
		uni: {
			request() {},
			showToast() {}
		},
		process: { env: { NODE_ENV: 'development' } }
	});

	vm.runInContext(transformed, sandbox, { filename: componentPath });
	return module.exports;
}

function createPageContext() {
	return {
		page: {
			managementCard: {
				settingsControl: {
					value: 11,
					customPickerOptions: [
						{ value: 10, label: '10 天' },
						{ value: 11, label: '11 天' },
						{ value: 12, label: '12 天' }
					]
				}
			}
		},
		activeCustomPickerKey: '',
		customPickerDraftIndices: {},
		quickWindowAnchors: {},
		isMutating: false,
		isDemoMode: false,
		context: { apiBaseUrl: 'http://localhost:3004', openid: 'seed-openid', moduleInstanceId: 'module-1' },
		persistCalls: [],
		retryCalls: 0,
		async persistSettingByKey(key, days) {
			this.persistCalls.push([key, days]);
		},
		async retryInitialLoad() {
			this.retryCalls += 1;
			this.page.managementCard.settingsControl.value = 12;
		},
		applyDemoSettingUpdate() {
			throw new Error('demo path should not be used');
		},
		getSettingControlByKey(key) {
			return key === 'duration' ? this.page.managementCard.settingsControl : null;
		}
	};
}

test('ModuleManagementPage keeps picker changes in draft until backdrop tap confirms them', async () => {
	const ModuleManagementPage = loadModuleManagementPage();
	const ctx = createPageContext();
	ctx.commitCustomPickerSelection = ModuleManagementPage.methods.commitCustomPickerSelection;

	ModuleManagementPage.methods.toggleCustomPicker.call(ctx, 'duration');
	assert.equal(ctx.activeCustomPickerKey, 'duration');
	assert.equal(ctx.customPickerDraftIndices.duration, 1);
	assert.equal(ctx.quickWindowAnchors.duration, 11);

	await ModuleManagementPage.methods.handleCustomPickerPreviewChange.call(ctx, 'duration', {
		index: 2,
		value: 12
	});
	assert.equal(ctx.page.managementCard.settingsControl.value, 11);
	assert.equal(ctx.customPickerDraftIndices.duration, 2);
	assert.equal(ctx.quickWindowAnchors.duration, 12);
	assert.deepEqual(ctx.persistCalls, []);

	await ModuleManagementPage.methods.handleCustomPickerBackdropTap.call(ctx);
	assert.equal(ctx.activeCustomPickerKey, '');
	assert.equal(Object.keys(ctx.customPickerDraftIndices).length, 0);
	assert.deepEqual(ctx.persistCalls, [['duration', 12]]);
	assert.equal(ctx.retryCalls, 1);
	assert.equal(ctx.page.managementCard.settingsControl.value, 12);
});
