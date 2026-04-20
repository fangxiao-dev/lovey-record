import test from 'node:test';
import assert from 'node:assert/strict';

import { loadVueOptions } from './helpers/load-vue-options.mjs';

function loadModuleActionRow() {
	return loadVueOptions('frontend/components/management/ModuleActionRow.vue');
}

function createContext(overrides = {}) {
	const emitted = [];
	return {
		emitted,
		isMutating: false,
		secondaryLabel: '共享',
		$emit(eventName, payload) {
			emitted.push([eventName, payload]);
		},
		...overrides
	};
}

test('ModuleActionRow emits share when idle', () => {
	const ModuleActionRow = loadModuleActionRow();
	const ctx = createContext();

	ModuleActionRow.methods.handleShareTap.call(ctx);

	assert.deepEqual(ctx.emitted, [['share', undefined]]);
});

test('ModuleActionRow does not emit share while mutating and keeps the share label contract', () => {
	const ModuleActionRow = loadModuleActionRow();
	const ctx = createContext({ isMutating: true });

	ModuleActionRow.methods.handleShareTap.call(ctx);

	assert.deepEqual(ctx.emitted, []);
	assert.equal(ctx.secondaryLabel, '共享');
	assert.equal(ModuleActionRow.props.secondaryLabel.required, true);
});
