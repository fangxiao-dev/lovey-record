import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const DEFAULT_VUE_TEST_STUBS = Object.freeze({
	PageNavBar: {},
	LoadingScreen: {}
});

export function loadVueOptions(relativePath, injected = {}, baseContext = {}) {
	const filePath = path.resolve(process.cwd(), relativePath);
	const source = fs.readFileSync(filePath, 'utf8');
	const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
	if (!scriptMatch) {
		throw new Error(`No <script> block found in ${filePath}`);
	}

	const transformed = scriptMatch[1]
		.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
		.replace(/export default/, 'module.exports =');

	const module = { exports: {} };
	const sandbox = vm.createContext({
		module,
		exports: module.exports,
		console,
		setTimeout,
		clearTimeout,
		// Page-level Vue VM tests often need a small shared stub surface.
		...baseContext,
		...DEFAULT_VUE_TEST_STUBS,
		...injected
	});

	vm.runInContext(transformed, sandbox, { filename: filePath });
	return module.exports;
}
