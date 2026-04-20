import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');

const sassEntryFiles = [
	'App.vue',
	'uni.scss',
	'styles/foundation/index.scss',
	'styles/foundation/base.scss',
	'styles/foundation/mixins.scss',
	'styles/foundation/patterns.scss',
	'styles/foundation/utilities.scss',
	'styles/tokens/semantic.scss'
];

function read(relativePath) {
	return fs.readFileSync(path.resolve(repoRoot, relativePath), 'utf8');
}

test('foundation Sass entry chain avoids deprecated @import usage', () => {
	for (const relativePath of sassEntryFiles) {
		assert.equal(
			read(relativePath).includes('@import'),
			false,
			`${relativePath} should avoid deprecated @import`
		);
	}
});
