import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.MENSTRUAL_FRONTEND_BASE_URL || 'http://localhost:5173';
const HOME_ROUTE = '/pages/menstrual/home';
const SHELL_ROUTE = '/pages/index/index';
const FRONTEND_URL = process.env.MENSTRUAL_HOME_URL || `${FRONTEND_BASE_URL}#${HOME_ROUTE}`;
const API_BASE_URL = process.env.MENSTRUAL_API_BASE_URL || 'http://localhost:3000/api';
const OPENID = process.env.MENSTRUAL_OPENID || 'seed-home-openid';
const MODULE_INSTANCE_ID = process.env.MENSTRUAL_MODULE_INSTANCE_ID || 'seed-home-module';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PARTNER_USER_ID = process.env.MENSTRUAL_PARTNER_USER_ID || 'seed-shared-partner';
const PARTNER_OPENID = process.env.MENSTRUAL_PARTNER_OPENID || 'seed-shared-partner-openid';
const PROFILE_ID = process.env.MENSTRUAL_PROFILE_ID || 'seed-home-profile';

function buildFrontendUrl(route, params = {}) {
	const query = new URLSearchParams(params);
	const queryString = query.toString();
	return `${FRONTEND_BASE_URL}#${route}${queryString ? `?${queryString}` : ''}`;
}

test.use({
	viewport: { width: 900, height: 900 },
	launchOptions: {
		executablePath: CHROME_PATH
	}
});

test('module shell live entry renders the private module and opens menstrual home with the same live context', async ({ page }) => {
	await page.goto(buildFrontendUrl(SHELL_ROUTE));
	await page.waitForTimeout(1200);

	await expect(page.locator('.zone-card').filter({ hasText: '私人' }).locator('.module-tile')).toHaveCount(1);
	await expect(page.locator('.zone-card').filter({ hasText: '共享' }).locator('.module-tile')).toHaveCount(0);
	await expect(page.locator('.summary-item').filter({ hasText: '共享状态' })).toContainText('未共享');
	await expect(page.locator('.summary-item').filter({ hasText: '默认经期时长' })).toContainText('6 天');

	await page.locator('.showcase-entry').click();
	await page.waitForURL((url) => url.hash.includes(HOME_ROUTE));
	await expect(page.locator('.menstrual-home__topbar-title')).toHaveText('月经记录');
});

test('module shell renders a shared module in the shared zone without duplicating it in private zone', async ({ page }) => {
	await page.goto(buildFrontendUrl(SHELL_ROUTE, {
		apiBaseUrl: API_BASE_URL,
		openid: 'seed-shared-openid',
		moduleInstanceId: 'seed-shared-module',
		profileId: 'seed-shared-profile',
		today: '2026-03-29'
	}));
	await page.waitForTimeout(1200);

	await expect(page.locator('.zone-card').filter({ hasText: '私人' }).locator('.module-tile')).toHaveCount(0);
	await expect(page.locator('.zone-card').filter({ hasText: '共享' }).locator('.module-tile')).toHaveCount(1);
	await expect(page.locator('.zone-card').filter({ hasText: '共享' })).toContainText('已共享 · 1 位伙伴');
	await expect(page.locator('.summary-item').filter({ hasText: '共享状态' })).toContainText('共享中');
});

async function postJson(path, body, openid = OPENID) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-wx-openid': openid
		},
		body: JSON.stringify(body)
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data;
}

async function getAccessState(openid = OPENID) {
	const response = await fetch(`${API_BASE_URL}/queries/getModuleAccessState?moduleInstanceId=${MODULE_INSTANCE_ID}`, {
		headers: {
			'x-wx-openid': openid
		}
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data;
}

async function getCalendarWindow(startDate, endDate, openid = OPENID) {
	const params = new URLSearchParams({
		moduleInstanceId: MODULE_INSTANCE_ID,
		profileId: PROFILE_ID,
		startDate,
		endDate
	});
	const response = await fetch(`${API_BASE_URL}/queries/getCalendarWindow?${params}`, {
		headers: { 'x-wx-openid': openid }
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data;
}

async function ensurePrivateModuleState() {
	try {
		await postJson('/commands/revokeModuleAccess', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			partnerUserId: PARTNER_USER_ID
		});
	} catch (_error) {
		// Ignore cleanup failures when the partner access does not yet exist.
	}
}

async function ensureDefaultPeriodDuration(days = 6) {
	await postJson('/commands/updateDefaultPeriodDuration', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		defaultPeriodDurationDays: days
	});
}

async function resetRange() {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-16',
		endDate: '2026-03-18'
	});
}

async function getCellCenter(page, day) {
	return await page.evaluate((label) => {
		const node = [...document.querySelectorAll('.date-cell__label')]
			.find((el) => el.textContent.trim() === label)
			?.closest('.date-cell');
		if (!node) return null;
		const rect = node.getBoundingClientRect();
		return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
	}, day);
}

async function getCellClasses(page, days) {
	return await page.evaluate((labels) => labels.map((label) => {
		const node = [...document.querySelectorAll('.date-cell__label')]
			.find((el) => el.textContent.trim() === label)
			?.closest('.date-cell');
		return { day: label, className: node?.className || null };
	}), days);
}

async function waitForSelectionState(page, expected) {
	await expect.poll(async () => {
		const classes = await getCellClasses(page, Object.keys(expected));
		return Object.fromEntries(classes.map((item) => [
			item.day,
			Boolean(item.className?.includes('date-cell--selected'))
		]));
	}).toEqual(expected);
}

test('menstrual home batch live regression', async ({ page }) => {
	await resetRange();

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		const p16 = await getCellCenter(page, '16');
		expect(p16).toBeTruthy();

		await page.mouse.move(p16.x, p16.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' })).toHaveCount(1);
		await page.mouse.up();
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '取消' }).click();
		await page.waitForTimeout(200);

		const p17 = await getCellCenter(page, '17');
		const p18 = await getCellCenter(page, '18');
		expect(p17).toBeTruthy();
		expect(p18).toBeTruthy();

		await page.mouse.move(p16.x, p16.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await page.mouse.move(p17.x, p17.y, { steps: 3 });
		await waitForSelectionState(page, { '16': true, '17': true, '18': false });
		await page.mouse.move(p18.x, p18.y, { steps: 3 });
		await waitForSelectionState(page, { '16': true, '17': true, '18': true });
		await page.mouse.move(p17.x, p17.y, { steps: 3 });
		await waitForSelectionState(page, { '16': true, '17': false, '18': true });
		await page.mouse.move(p16.x, p16.y, { steps: 3 });
		await waitForSelectionState(page, { '16': false, '17': false, '18': true });
		await page.mouse.up();

		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' })).toHaveCount(1);
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' }).click();
		await page.waitForTimeout(1600);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 16 日');

		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);
		const classes = await getCellClasses(page, ['16', '17', '18']);
		expect(classes[0].className.includes('date-cell--bg-period')).toBeFalsy();
		expect(classes[1].className.includes('date-cell--bg-period')).toBeFalsy();
		expect(classes[2].className.includes('date-cell--bg-period')).toBeTruthy();
	} finally {
		await resetRange();
	}
});

test('owner shell can share and revoke the same module instance while partner reads the same home data', async ({ page }) => {
	await ensurePrivateModuleState();

	try {
		await page.goto(buildFrontendUrl(SHELL_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: 'seed-home-profile',
			partnerUserId: PARTNER_USER_ID,
			today: '2026-03-29'
		}));
		await page.waitForTimeout(1200);

		await expect(page.locator('.summary-item').filter({ hasText: '共享状态' })).toContainText('未共享');
		await expect(page.locator('.summary-action')).toContainText('共享给伙伴');
		await page.locator('.summary-action').click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.summary-item').filter({ hasText: '共享状态' })).toContainText('共享中');
		await expect(page.locator('.zone-card').filter({ hasText: '共享' }).locator('.module-tile')).toHaveCount(1);

		const ownerState = await getAccessState();
		expect(ownerState.sharingStatus).toBe('shared');
		expect(ownerState.activePartners).toEqual([
			{
				userId: PARTNER_USER_ID,
				role: 'partner',
				accessStatus: 'active'
			}
		]);

		await page.goto(buildFrontendUrl(HOME_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: PARTNER_OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: 'seed-home-profile',
			today: '2026-03-29'
		}));
		await page.waitForTimeout(1200);
		await expect(page.locator('.menstrual-home__topbar-title')).toHaveText('月经记录');
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 29 日');

		await page.goto(buildFrontendUrl(SHELL_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: 'seed-home-profile',
			partnerUserId: PARTNER_USER_ID,
			today: '2026-03-29'
		}));
		await page.waitForTimeout(1200);
		await expect(page.locator('.summary-action')).toContainText('撤回共享');
		await page.locator('.summary-action').click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.summary-item').filter({ hasText: '共享状态' })).toContainText('未共享');
		const finalOwnerState = await getAccessState();
		expect(finalOwnerState.sharingStatus).toBe('private');
		expect(finalOwnerState.activePartners).toEqual([]);
	} finally {
		await ensurePrivateModuleState();
	}
});

test('owner shell can update the default period duration from the live settings strip', async ({ page }) => {
	await ensureDefaultPeriodDuration(6);

	try {
		await page.goto(buildFrontendUrl(SHELL_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: 'seed-home-profile',
			partnerUserId: PARTNER_USER_ID,
			today: '2026-03-29'
		}));
		await page.waitForTimeout(1200);

		await expect(page.locator('.summary-item').filter({ hasText: '默认经期时长' })).toContainText('6 天');
		await page.locator('.settings-chip').filter({ hasText: '5 天' }).click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.summary-item').filter({ hasText: '默认经期时长' })).toContainText('5 天');
		await expect(page.locator('.settings-chip--selected')).toContainText('5 天');
	} finally {
		await ensureDefaultPeriodDuration(6);
	}
});

test('changing defaultPeriodDurationDays is reflected in the next first-day single-tap period auto-fill length', async ({ page }) => {
	// Use March 20 as the fresh first day: it is within the default 3-week window (March 16 – April 5),
	// is selectable (< today = '2026-03-29'), and has no seeded period record (seeded period is March 26-31).
	// With defaultPeriodDurationDays = 4 the backend should fill March 20-23 and leave March 24 clear.
	const TEST_FIRST_DAY = '2026-03-20';
	const TEST_WINDOW_END = '2026-03-25';
	const TEST_DURATION = 4;
	const EXPECTED_LAST_DAY = '2026-03-23';
	const EXPECTED_CLEAR_DAY = '2026-03-24';

	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: TEST_FIRST_DAY,
		endDate: TEST_WINDOW_END
	});
	await ensureDefaultPeriodDuration(TEST_DURATION);

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		// Click March 20 to open its panel.
		await page.locator('.date-cell__label').filter({ hasText: '20' }).first().click();
		await page.waitForTimeout(800);

		// Panel must show March 20 with no period yet.
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 20 日');
		await expect(
			page.locator('.selected-date-panel__chip').filter({ hasText: '经期' })
		).not.toHaveClass(/selected-date-panel__chip--accent/);

		// Toggle period on — this calls recordPeriodDay for March 20.
		await page.locator('.selected-date-panel__chip').filter({ hasText: '经期' }).click();
		await page.waitForTimeout(1600);

		// Chip must be marked accent after optimistic update + live refresh.
		await expect(
			page.locator('.selected-date-panel__chip').filter({ hasText: '经期' })
		).toHaveClass(/selected-date-panel__chip--accent/);

		// Verify via API: exactly TEST_DURATION consecutive period days, no more.
		const calWindow = await getCalendarWindow('2026-03-19', '2026-03-25');
		const windowDays = calWindow.days.filter((d) => d.date >= TEST_FIRST_DAY && d.date <= TEST_WINDOW_END);
		const periodDays = windowDays.filter((d) => d.isPeriod);
		expect(periodDays.length).toBe(TEST_DURATION);
		expect(periodDays.map((d) => d.date)).toEqual([
			'2026-03-20', '2026-03-21', '2026-03-22', EXPECTED_LAST_DAY
		]);
		const clearDay = calWindow.days.find((d) => d.date === EXPECTED_CLEAR_DAY);
		expect(clearDay.isPeriod).toBe(false);

		// Verify calendar cells: 21-23 carry bg-period, 24 does not.
		const classes = await getCellClasses(page, ['21', '22', '23', '24']);
		expect(classes.find((c) => c.day === '21').className).toContain('date-cell--bg-period');
		expect(classes.find((c) => c.day === '22').className).toContain('date-cell--bg-period');
		expect(classes.find((c) => c.day === '23').className).toContain('date-cell--bg-period');
		expect(classes.find((c) => c.day === '24').className).not.toContain('date-cell--bg-period');
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: TEST_FIRST_DAY,
			endDate: TEST_WINDOW_END
		});
		await ensureDefaultPeriodDuration(6);
	}
});

test('previous single-day selection does not override the latest batch path day', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-24'
	});

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await page.locator('.date-cell__label').filter({ hasText: '25' }).first().click();
		await page.waitForTimeout(200);

		const p23 = await getCellCenter(page, '23');
		const p24 = await getCellCenter(page, '24');
		expect(p23).toBeTruthy();
		expect(p24).toBeTruthy();

		await page.mouse.move(p23.x, p23.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await page.mouse.move(p24.x, p24.y, { steps: 3 });
		await page.waitForTimeout(120);
		await page.mouse.up();

		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' }).click();
		await page.waitForTimeout(1600);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 24 日');
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-24'
		});
	}
});
