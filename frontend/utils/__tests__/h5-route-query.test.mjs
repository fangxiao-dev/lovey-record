import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeH5RouteQuery } from '../h5-route-query.js';

test('mergeH5RouteQuery merges hash query params into missing runtime options', () => {
	const result = mergeH5RouteQuery(
		{ openid: '', moduleInstanceId: undefined },
		{
			href: 'http://localhost:5173/#/pages/menstrual/home?openid=seed-home-openid&moduleInstanceId=seed-home-module&today=2026-03-29',
			hash: '#/pages/menstrual/home?openid=seed-home-openid&moduleInstanceId=seed-home-module&today=2026-03-29',
			search: ''
		}
	);

	assert.equal(result.openid, 'seed-home-openid');
	assert.equal(result.moduleInstanceId, 'seed-home-module');
	assert.equal(result.today, '2026-03-29');
});

test('mergeH5RouteQuery preserves explicit runtime options over hash values', () => {
	const result = mergeH5RouteQuery(
		{ openid: 'explicit-openid', today: '2026-04-09' },
		{
			href: 'http://localhost:5173/#/pages/menstrual/home?openid=seed-home-openid&today=2026-03-29',
			hash: '#/pages/menstrual/home?openid=seed-home-openid&today=2026-03-29',
			search: ''
		}
	);

	assert.equal(result.openid, 'explicit-openid');
	assert.equal(result.today, '2026-04-09');
});
