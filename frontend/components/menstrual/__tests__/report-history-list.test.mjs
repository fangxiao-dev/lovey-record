import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.resolve(__dirname, '..', 'ReportHistoryList.vue');

test('report history list renders a light table header and keeps the missing cycle fallback', () => {
	const source = fs.readFileSync(componentPath, 'utf8');

	assert.match(source, /name:\s*'ReportHistoryList'/);
	assert.match(source, /开始/);
	assert.match(source, /结束/);
	assert.match(source, /时长/);
	assert.match(source, /周期/);
	assert.match(source, /class="report-history-list__row"/);
	assert.match(source, /row\.startLabel/);
	assert.match(source, /row\.endLabel/);
	assert.match(source, /row\.durationLabel/);
	assert.match(source, /row\.cycleLabel \|\| '-'/);
});
