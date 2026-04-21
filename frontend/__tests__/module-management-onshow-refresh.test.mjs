import test from 'node:test';
import assert from 'node:assert/strict';
import { loadVueOptions } from './helpers/load-vue-options.mjs';

function loadManagementAliasPage(relativePath) {
	return loadVueOptions(relativePath, {
		ModuleManagementPage: {}
	});
}

function loadModuleManagementPage() {
	return loadVueOptions('frontend/components/management/ModuleManagementPage.vue', {
		SharedLegendChip: {},
		ModuleTileCompact: {},
		ModuleActionRow: {},
		ModuleSettingStrip: {},
		LoadingScreen: {},
		ChangelogEntryRow: {},
		ChangelogSheet: {},
		PageNavBar: {},
		DEFAULT_MODULE_SHELL_CONTEXT: {},
		createShareableJoinLink() {},
		createDemoMenstrualModuleShellPageModel() {},
		loadMenstrualModuleShellPageModel() {},
		resolveModuleContext() {},
		persistModuleSettings() {},
		persistModulePredictionTerm() {},
		buildCenteredQuickOptions() { return []; },
		changelogEntries: [],
		readLastViewedVersion() { return 'v0.0.0'; },
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

test('management alias page skips the first onShow refresh and refreshes on later shows', () => {
	const page = loadManagementAliasPage('frontend/pages/management/index.vue');
	const calls = [];
	const ctx = {
		_loadOptions: { moduleInstanceId: 'module-1' },
		_skipNextShowRefresh: true,
		$refs: {
			managementPage: {
				initialize(options) {
					calls.push(['initialize', options]);
				},
				refreshOnShow() {
					calls.push(['refreshOnShow']);
				}
			}
		}
	};

	page.mounted.call(ctx);
	page.onShow.call(ctx);
	page.onShow.call(ctx);

	assert.deepEqual(calls, [
		['initialize', { moduleInstanceId: 'module-1' }],
		['refreshOnShow']
	]);
	assert.equal(ctx._skipNextShowRefresh, false);
});

test('index shell page skips the first onShow refresh and refreshes on later shows', () => {
	const page = loadManagementAliasPage('frontend/pages/index/index.vue');
	const calls = [];
	const ctx = {
		_loadOptions: { moduleInstanceId: 'module-1' },
		_skipNextShowRefresh: true,
		$nextTick(callback) {
			callback();
		},
		$refs: {
			managementPage: {
				initialize(options) {
					calls.push(['initialize', options]);
				},
				refreshOnShow() {
					calls.push(['refreshOnShow']);
				}
			}
		}
	};

	page.onLoad.call(ctx, { moduleInstanceId: 'module-1' });
	page.onShow.call(ctx);
	page.onShow.call(ctx);

	assert.deepEqual(calls, [
		['initialize', { moduleInstanceId: 'module-1' }],
		['refreshOnShow']
	]);
	assert.equal(ctx._skipNextShowRefresh, false);
});

test('ModuleManagementPage refreshOnShow reloads live data after the page returns to foreground', async () => {
	const ModuleManagementPage = loadModuleManagementPage();
	let retryCalls = 0;
	const ctx = {
		isDemoMode: false,
		isMutating: false,
		context: { moduleInstanceId: 'module-1' },
		async retryInitialLoad() {
			retryCalls += 1;
		}
	};

	await ModuleManagementPage.methods.refreshOnShow.call(ctx);

	assert.equal(retryCalls, 1);
});

test('ModuleManagementPage refreshOnShow skips reload when the page is in demo mode or still mutating', async () => {
	const ModuleManagementPage = loadModuleManagementPage();
	let retryCalls = 0;

	await ModuleManagementPage.methods.refreshOnShow.call({
		isDemoMode: true,
		isMutating: false,
		context: { moduleInstanceId: 'module-1' },
		async retryInitialLoad() {
			retryCalls += 1;
		}
	});

	await ModuleManagementPage.methods.refreshOnShow.call({
		isDemoMode: false,
		isMutating: true,
		context: { moduleInstanceId: 'module-1' },
		async retryInitialLoad() {
			retryCalls += 1;
		}
	});

	assert.equal(retryCalls, 0);
});
