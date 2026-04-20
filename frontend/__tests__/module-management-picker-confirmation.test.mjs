import test from 'node:test';
import assert from 'node:assert/strict';
import { loadVueOptions } from './helpers/load-vue-options.mjs';
import { buildCenteredQuickOptions } from '../utils/picker-quick-options.js';

function loadModuleManagementPage() {
	return loadVueOptions('frontend/components/management/ModuleManagementPage.vue', {
		SharedLegendChip: {},
		ModuleTileCompact: {},
		ModuleActionRow: {},
		ModuleSettingStrip: {},
		ChangelogEntryRow: {},
		ChangelogSheet: {},
		DEFAULT_MODULE_SHELL_CONTEXT: {},
		createShareableJoinLink() {},
		createDemoMenstrualModuleShellPageModel() {},
		loadMenstrualModuleShellPageModel() {},
		resolveModuleContext() {},
		persistModuleSettings() {},
		persistModulePredictionTerm() {},
		buildCenteredQuickOptions,
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
}

function withComponentMethods(component, overrides = {}) {
	return {
		...component.methods,
		...overrides
	};
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
		customPickerPreviewValues: {},
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
	const ctx = withComponentMethods(ModuleManagementPage, createPageContext());
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
	assert.equal(ctx.quickWindowAnchors.duration, 11);
	assert.equal(ctx.customPickerPreviewValues.duration, 12);
	assert.deepEqual(ctx.persistCalls, []);

	await ModuleManagementPage.methods.handleCustomPickerBackdropTap.call(ctx);
	assert.equal(ctx.activeCustomPickerKey, '');
	assert.equal(Object.keys(ctx.customPickerDraftIndices).length, 0);
	assert.equal(Object.keys(ctx.customPickerPreviewValues).length, 0);
	assert.deepEqual(ctx.persistCalls, [['duration', 12]]);
	assert.equal(ctx.retryCalls, 1);
	assert.equal(ctx.page.managementCard.settingsControl.value, 12);
});

test('ModuleManagementPage recenters the quick window on the selected value even when it was already inside the window', async () => {
	const ModuleManagementPage = loadModuleManagementPage();
	const ctx = withComponentMethods(ModuleManagementPage, createPageContext());
	ctx.quickWindowAnchors = { duration: 11 };
	ctx.page.managementCard.settingsControl.value = 9;
	ctx.page.managementCard.settingsControl.customPickerOptions = [
		{ value: 8, label: '8 天' },
		{ value: 9, label: '9 天' },
		{ value: 10, label: '10 天' },
		{ value: 11, label: '11 天' },
		{ value: 12, label: '12 天' }
	];
	ctx.commitCustomPickerSelection = ModuleManagementPage.methods.commitCustomPickerSelection;

	ModuleManagementPage.methods.toggleCustomPicker.call(ctx, 'duration');
	await ModuleManagementPage.methods.handleCustomPickerPreviewChange.call(ctx, 'duration', {
		index: 2,
		value: 10
	});
	await ModuleManagementPage.methods.handleCustomPickerBackdropTap.call(ctx);

	assert.equal(ctx.quickWindowAnchors.duration, 10);
	assert.deepEqual(ctx.persistCalls, [['duration', 10]]);
});

test('ModuleManagementPage recenters the quick window on the selected value when a quick chip is tapped', async () => {
	const ModuleManagementPage = loadModuleManagementPage();
	const ctx = withComponentMethods(ModuleManagementPage, createPageContext());
	ctx.quickWindowAnchors = { duration: 11 };
	ctx.page.managementCard.settingsControl.value = 11;
	ctx.page.managementCard.settingsControl.customPickerOptions = [
		{ value: 7, label: '7 天' },
		{ value: 8, label: '8 天' },
		{ value: 9, label: '9 天' },
		{ value: 10, label: '10 天' },
		{ value: 11, label: '11 天' },
		{ value: 12, label: '12 天' }
	];

	await ModuleManagementPage.methods.handleSettingOptionSelect.call(ctx, 'duration', 9);

	assert.equal(ctx.quickWindowAnchors.duration, 9);
	assert.deepEqual(ctx.persistCalls, [['duration', 9]]);
});

test('ModuleManagementPage recenters the quick window anchor when a custom selection moves outside it', async () => {
	const ModuleManagementPage = loadModuleManagementPage();
	const ctx = withComponentMethods(ModuleManagementPage, createPageContext());
	ctx.quickWindowAnchors = { duration: 9 };
	ctx.page.managementCard.settingsControl.value = 8;
	ctx.page.managementCard.settingsControl.customPickerOptions = [
		{ value: 8, label: '8 天' },
		{ value: 9, label: '9 天' },
		{ value: 10, label: '10 天' },
		{ value: 11, label: '11 天' },
		{ value: 12, label: '12 天' }
	];
	ctx.commitCustomPickerSelection = ModuleManagementPage.methods.commitCustomPickerSelection;

	ModuleManagementPage.methods.toggleCustomPicker.call(ctx, 'duration');
	await ModuleManagementPage.methods.handleCustomPickerPreviewChange.call(ctx, 'duration', {
		index: 3,
		value: 11
	});
	await ModuleManagementPage.methods.handleCustomPickerBackdropTap.call(ctx);

	assert.equal(ctx.quickWindowAnchors.duration, 11);
	assert.deepEqual(ctx.persistCalls, [['duration', 11]]);
});
