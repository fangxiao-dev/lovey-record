import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const componentPath = path.resolve(repoRoot, 'components/management/ModuleSettingStrip.vue');

function loadModuleSettingStrip() {
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
		console
	});

	vm.runInContext(transformed, sandbox, { filename: componentPath });
	return module.exports;
}

function normalize(value) {
	return JSON.parse(JSON.stringify(value));
}

test('ModuleSettingStrip renders a native picker-view wheel shell', () => {
	const source = fs.readFileSync(componentPath, 'utf8');

	assert.match(source, /<picker-view/);
	assert.match(source, /<picker-view-column>/);
	assert.match(source, /indicator-style="height: 44rpx; border-radius: 22rpx; background: transparent; border: 2rpx solid rgba\(216, 154, 141, 0\.24\);"/);
	assert.match(source, /mask-style="background: linear-gradient\(180deg, rgba\(246, 243, 238, 0\.92\) 0%, rgba\(246, 243, 238, 0\.18\) 100%\); pointer-events: none;"/);
	assert.match(source, /height:\s*220rpx;/);
	assert.match(source, /module-setting-strip__picker-view/);
	assert.match(source, /color:\s*\$text-primary;/);
	assert.match(source, /font-weight:\s*\$font-weight-title;/);
	assert.doesNotMatch(source, /module-setting-strip__picker-focus/);
	assert.doesNotMatch(source, /resolvedPickerLabel\(\)/);
	assert.doesNotMatch(source, /visibleWheelOptions\(\)/);
	assert.doesNotMatch(source, /handleWheelOptionSelect\(option\)/);
});

test('ModuleSettingStrip picker-view emits custom-change with the selected option and index', () => {
	const ModuleSettingStrip = loadModuleSettingStrip();
	const emitted = [];
	const ctx = {
		customPickerOptions: [
			{ value: 5, label: '5 天' },
			{ value: 6, label: '6 天' },
			{ value: 7, label: '7 天' }
		],
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	ModuleSettingStrip.methods.handlePickerChange.call(ctx, {
		detail: {
			value: [2]
		}
	});

	assert.deepEqual(normalize(emitted), [['custom-change', { value: 7, index: 2 }]]);
});
