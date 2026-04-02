import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.MENSTRUAL_FRONTEND_BASE_URL || 'http://localhost:5173';
const HOME_ROUTE = '/pages/menstrual/home';
const SHELL_ROUTE = '/pages/index/index';
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

const FRONTEND_URL = process.env.MENSTRUAL_HOME_URL || buildFrontendUrl(HOME_ROUTE, {
	apiBaseUrl: API_BASE_URL,
	openid: OPENID,
	moduleInstanceId: MODULE_INSTANCE_ID,
	profileId: PROFILE_ID,
	today: '2026-03-29'
});

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
	await expect(page.locator('.info-panel__state')).toContainText('未共享');
	await expect(page.locator('.summary-item').filter({ hasText: '经期时长' })).toContainText('6 天');

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
	await expect(page.locator('.info-panel__state')).toContainText('共享中');
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

async function recordRange(startDate, endDate) {
	await postJson('/commands/recordPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate,
		endDate
	});
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
		startDate: '2026-03-23',
		endDate: '2026-03-25'
	});
}

async function openDay(page, dayLabel) {
	await page.locator('.date-cell__label').filter({ hasText: dayLabel }).first().click();
	await page.waitForTimeout(800);
}

function getPeriodChip(page, label) {
	return page.locator('.selected-date-panel__chip').filter({ hasText: label }).first();
}

async function waitForPeriodDates(startDate, endDate, expectedPeriodDates) {
	await expect.poll(async () => {
		const calendarWindow = await getCalendarWindow(startDate, endDate);
		return calendarWindow.days
			.filter((day) => day.date >= startDate && day.date <= endDate && day.isPeriod)
			.map((day) => day.date);
	}).toEqual(expectedPeriodDates);
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

		const p23 = await getCellCenter(page, '23');
		expect(p23).toBeTruthy();

		await page.mouse.move(p23.x, p23.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' })).toHaveCount(1);
		await page.mouse.up();
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '取消' }).click();
		await page.waitForTimeout(200);

		const p24 = await getCellCenter(page, '24');
		const p25 = await getCellCenter(page, '25');
		expect(p24).toBeTruthy();
		expect(p25).toBeTruthy();

		await page.mouse.move(p23.x, p23.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await page.mouse.move(p24.x, p24.y, { steps: 3 });
		await waitForSelectionState(page, { '23': true, '24': true, '25': false });
		await page.mouse.move(p25.x, p25.y, { steps: 3 });
		await waitForSelectionState(page, { '23': true, '24': true, '25': true });
		await page.mouse.move(p24.x, p24.y, { steps: 3 });
		await waitForSelectionState(page, { '23': true, '24': false, '25': true });
		await page.mouse.move(p23.x, p23.y, { steps: 3 });
		await waitForSelectionState(page, { '23': false, '24': false, '25': true });
		await page.mouse.up();

		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' })).toHaveCount(1);
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' }).click();
		await page.waitForTimeout(1600);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');

		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);
		const classes = await getCellClasses(page, ['23', '24', '25']);
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

		await expect(page.locator('.info-panel__state')).toContainText('未共享');
		await expect(page.locator('.summary-action')).toContainText('共享给伙伴');
		await page.locator('.summary-action').click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.info-panel__state')).toContainText('共享中');
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
		await expect(page.locator('.selected-date-panel__title')).toHaveText('4 月 2 日');

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
		await expect(page.locator('.info-panel__state')).toContainText('未共享');
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

		await expect(page.locator('.summary-item').filter({ hasText: '经期时长' })).toContainText('6 天');
		await page.locator('.settings-chip').filter({ hasText: '5 天' }).click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.summary-item').filter({ hasText: '经期时长' })).toContainText('5 天');
		await expect(page.locator('.settings-chip--selected')).toContainText('5 天');
	} finally {
		await ensureDefaultPeriodDuration(6);
	}
});

test('fresh not-period day shows 月经 and single tap applies the default forward fill length', async ({ page }) => {
	const TEST_FIRST_DAY = '2026-03-23';
	const TEST_WINDOW_END = '2026-03-28';
	const TEST_DURATION = 4;
	const EXPECTED_LAST_DAY = '2026-03-26';
	const EXPECTED_CLEAR_DAY = '2026-03-27';

	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: TEST_FIRST_DAY,
		endDate: TEST_WINDOW_END
	});
	await ensureDefaultPeriodDuration(TEST_DURATION);

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await openDay(page, '23');
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');
		await expect(getPeriodChip(page, '月经')).not.toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经').click();
		await page.waitForTimeout(1600);

		await expect(getPeriodChip(page, '月经开始')).toHaveClass(/selected-date-panel__chip--accent/);
		await waitForPeriodDates('2026-03-23', '2026-03-28', [
			'2026-03-23', '2026-03-24', '2026-03-25', EXPECTED_LAST_DAY
		]);

		const calWindow = await getCalendarWindow('2026-03-23', '2026-03-28');
		const windowDays = calWindow.days.filter((d) => d.date >= TEST_FIRST_DAY && d.date <= TEST_WINDOW_END);
		const periodDays = windowDays.filter((d) => d.isPeriod);
		expect(periodDays.length).toBe(TEST_DURATION);
		expect(periodDays.map((d) => d.date)).toEqual([
			'2026-03-23', '2026-03-24', '2026-03-25', EXPECTED_LAST_DAY
		]);
		const clearDay = calWindow.days.find((d) => d.date === EXPECTED_CLEAR_DAY);
		expect(clearDay.isPeriod).toBe(false);

		const classes = await getCellClasses(page, ['24', '25', '26', '27']);
		expect(classes.find((c) => c.day === '24').className).toContain('date-cell--bg-period');
		expect(classes.find((c) => c.day === '25').className).toContain('date-cell--bg-period');
		expect(classes.find((c) => c.day === '26').className).toContain('date-cell--bg-period');
		expect(classes.find((c) => c.day === '27').className).not.toContain('date-cell--bg-period');
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: TEST_FIRST_DAY,
			endDate: TEST_WINDOW_END
		});
		await ensureDefaultPeriodDuration(6);
	}
});

test('selected start day shows selected 月经开始 and tap revokes the whole segment', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-27'
	});
	await recordRange('2026-03-23', '2026-03-26');

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await openDay(page, '23');
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');
		await expect(getPeriodChip(page, '月经开始')).toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经开始').click();
		await page.waitForTimeout(1600);

		await expect(getPeriodChip(page, '月经开始')).not.toHaveClass(/selected-date-panel__chip--accent/);
		await waitForPeriodDates('2026-03-23', '2026-03-27', []);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-27'
		});
	}
});

test('selected middle day shows 月经结束 and tap truncates later dates', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-28'
	});
	await recordRange('2026-03-23', '2026-03-27');

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await openDay(page, '25');
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 25 日');
		await expect(getPeriodChip(page, '月经结束')).toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经结束').click();
		await page.waitForTimeout(1600);

		await expect(getPeriodChip(page, '月经结束')).toHaveClass(/selected-date-panel__chip--accent/);
		await waitForPeriodDates('2026-03-23', '2026-03-28', [
			'2026-03-23', '2026-03-24', '2026-03-25'
		]);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-28'
		});
	}
});

test('bridge candidate shows frozen prompt copy and only confirms the merge after user approval', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-29'
	});
	await recordRange('2026-03-25', '2026-03-29');

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await openDay(page, '23');
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');
		await expect(getPeriodChip(page, '月经')).not.toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经').click();
		await expect(page.getByText('已在 03/25 标记了经期开始，要提前到 03/23 吗？')).toBeVisible();
		await page.getByText('取消').click();
		await page.waitForTimeout(400);
		await waitForPeriodDates('2026-03-23', '2026-03-29', [
			'2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29'
		]);

		await getPeriodChip(page, '月经').click();
		await expect(page.getByText('已在 03/25 标记了经期开始，要提前到 03/23 吗？')).toBeVisible();
		await page.getByText('确认').click();
		await page.waitForTimeout(1600);
		await waitForPeriodDates('2026-03-23', '2026-03-29', [
			'2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29'
		]);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-29'
		});
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
