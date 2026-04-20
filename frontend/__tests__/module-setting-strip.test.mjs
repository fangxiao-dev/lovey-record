import test from 'node:test';
import assert from 'node:assert/strict';

import { loadVueOptions } from './helpers/load-vue-options.mjs';

function loadModuleSettingStrip() {
	return loadVueOptions('frontend/components/management/ModuleSettingStrip.vue');
}

function normalize(value) {
	return JSON.parse(JSON.stringify(value));
}

test('ModuleSettingStrip emits custom-preview-change when picker-view returns an array index', () => {
	const ModuleSettingStrip = loadModuleSettingStrip();
	const emitted = [];
	const ctx = {
		customPickerOptions: [
			{ value: 5, label: '5' },
			{ value: 6, label: '6' },
			{ value: 7, label: '7' }
		],
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	ModuleSettingStrip.methods.handlePickerChange.call(ctx, {
		detail: {
			value: [1]
		}
	});

	assert.deepEqual(normalize(emitted), [['custom-preview-change', { value: 6, index: 1 }]]);
});

test('ModuleSettingStrip emits custom-preview-change when picker-view returns a scalar index', () => {
	const ModuleSettingStrip = loadModuleSettingStrip();
	const emitted = [];
	const ctx = {
		customPickerOptions: [
			{ value: 5, label: '5' },
			{ value: 6, label: '6' },
			{ value: 7, label: '7' }
		],
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		}
	};

	ModuleSettingStrip.methods.handlePickerChange.call(ctx, {
		detail: {
			value: 1
		}
	});

	assert.deepEqual(normalize(emitted), [['custom-preview-change', { value: 6, index: 1 }]]);
});
