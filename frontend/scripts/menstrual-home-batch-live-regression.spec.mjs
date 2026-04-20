import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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
const CHANGELOG_DATA_PATH = path.resolve(process.cwd(), 'frontend/utils/changelog-data.js');

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

async function dismissChangelogSheetIfPresent(page) {
	const overlay = page.locator('.changelog-sheet__overlay');
	if (await overlay.count()) {
		await overlay.first().click({ force: true });
		await page.waitForTimeout(300);
	}
}

async function seedChangelogAsSeen(page) {
	const source = fs.readFileSync(CHANGELOG_DATA_PATH, 'utf8');
	const latestVersion = source.match(/"version":\s*"(v[^"]+)"/)?.[1] || 'v0.0.0';
	await page.addInitScript((version) => {
		localStorage.setItem('changelog_lastViewedVersion', version);
	}, latestVersion);
}

test.use({
	viewport: { width: 900, height: 900 },
	launchOptions: {
		executablePath: CHROME_PATH
	}
});

test('module shell live entry renders the private module and opens menstrual home with the same live context', async ({ page }) => {
	await seedChangelogAsSeen(page);
	await page.goto(buildFrontendUrl(SHELL_ROUTE, {
		apiBaseUrl: API_BASE_URL,
		openid: OPENID,
		moduleInstanceId: MODULE_INSTANCE_ID,
		profileId: PROFILE_ID,
		today: '2026-03-29'
	}));
	await page.waitForTimeout(1200);
	await dismissChangelogSheetIfPresent(page);

	await expect(page.locator('.management-board .module-tile')).toHaveCount(1);
	await expect(page.locator('.management-board .module-tile__status-dot--shared')).toHaveCount(0);
	await expect(page.locator('.management-card__module-name')).toContainText('经期小记');
	await expect(page.locator('.management-card__summary-item').filter({ hasText: '经期时长' })).toContainText('5 天');

	await page.locator('.management-action--main').filter({ hasText: '进入' }).click();
	await page.waitForURL((url) => url.hash.includes('/pages/menstrual/home?'));
	await expect(page.locator('.menstrual-home__hero')).toHaveCount(1);
});

test('module shell renders a shared module in the shared zone without duplicating it in private zone', async ({ page }) => {
	await seedChangelogAsSeen(page);
	await page.goto(buildFrontendUrl(SHELL_ROUTE, {
		apiBaseUrl: API_BASE_URL,
		openid: 'seed-shared-openid',
		moduleInstanceId: 'seed-shared-module',
		profileId: 'seed-shared-profile',
		today: '2026-03-29'
	}));
	await page.waitForTimeout(1200);
	await dismissChangelogSheetIfPresent(page);

	await expect(page.locator('.management-board .module-tile')).toHaveCount(1);
	await expect(page.locator('.management-board .module-tile__status-dot--shared')).toHaveCount(1);
	await expect(page.locator('.management-card__module-name')).toContainText('经期小记');
	await expect(page.locator('.management-action--share')).toContainText('共享');
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

async function resetDevFixtures() {
	const resetUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/api/dev/reset`;
	const response = await fetch(resetUrl, {
		method: 'POST'
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

test.beforeEach(async () => {
	await resetDevFixtures();
});

async function getModuleHomeView(openid = OPENID) {
	const params = new URLSearchParams({
		moduleInstanceId: MODULE_INSTANCE_ID,
		today: '2026-03-29'
	});
	const response = await fetch(`${API_BASE_URL}/queries/getModuleHomeView?${params}`, {
		headers: { 'x-wx-openid': openid }
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data;
}

async function getModuleSettings(openid = OPENID) {
	const response = await fetch(`${API_BASE_URL}/queries/getModuleSettings?moduleInstanceId=${MODULE_INSTANCE_ID}`, {
		headers: { 'x-wx-openid': openid }
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data.moduleSettings;
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

async function recordDayDetails(date, { flowLevel = null, painLevel = null, colorLevel = null } = {}) {
	await postJson('/commands/recordDayDetails', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		date,
		flowLevel,
		painLevel,
		colorLevel
	});
}

async function recordDayNote(date, note) {
	await postJson('/commands/recordDayNote', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		date,
		note
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
		node.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
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

async function selectAdjacentQuickSettingChip(page, rowLabel, currentValue) {
	const nextLowerValue = String(currentValue - 1);
	const nextHigherValue = String(currentValue + 1);
	const row = page.locator('.module-setting-strip').filter({ hasText: rowLabel });
	const lowerChip = row.locator('.module-setting-strip__chip').filter({ hasText: nextLowerValue });

	if (await lowerChip.count()) {
		await lowerChip.first().click();
		return currentValue - 1;
	}

	const higherChip = row.locator('.module-setting-strip__chip').filter({ hasText: nextHigherValue });
	if (await higherChip.count()) {
		await higherChip.first().click();
		return currentValue + 1;
	}

	throw new Error(`No adjacent quick chip found for ${rowLabel} current value ${currentValue}`);
}

function getSettingRow(page, rowLabel) {
	return page.locator('.module-setting-strip').filter({ hasText: rowLabel });
}

async function openCustomPicker(page, rowLabel) {
	const row = getSettingRow(page, rowLabel);
	await row.locator('.module-setting-strip__chip--custom').evaluate((node) => {
		node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	});
	await expect(row.locator('.module-setting-strip__picker-card')).toBeVisible();
	return row;
}

function getSelectedNumericQuickChip(row) {
	return row
		.locator('.module-setting-strip__chip--selected')
		.filter({ hasNotText: '自选' });
}

async function previewCustomPickerValue(page, rowLabel, targetLabel) {
	const optionTexts = await getSettingRow(page, rowLabel).locator('.module-setting-strip__picker-text').allTextContents();
	const targetIndex = optionTexts.findIndex((text) => text.trim() === String(targetLabel));

	if (targetIndex < 0) {
		throw new Error(`No picker option "${targetLabel}" found for ${rowLabel}`);
	}

	await page.evaluate(async ({ resolvedRowLabel, nextIndex, nextValue }) => {
		const nodes = [...document.querySelectorAll('.module-setting-strip')];
		const node = nodes.find((item) => item.textContent.includes(resolvedRowLabel));
		if (!node) {
			throw new Error(`No module-setting-strip found for ${resolvedRowLabel}`);
		}

		let current = node.__vueParentComponent;
		while (current && (current.type?.name || current.type?.__name) !== 'ModuleManagementPage') {
			current = current.parent;
		}
		if (!current?.proxy) {
			throw new Error('ModuleManagementPage instance not found');
		}

		const vm = current.proxy;
		await vm.handleCustomPickerPreviewChange(
			resolvedRowLabel === '周期天数' ? 'prediction' : 'duration',
			{ value: nextValue, index: nextIndex }
		);
		await vm.$nextTick();
	}, {
		resolvedRowLabel: rowLabel,
		nextIndex: targetIndex,
		nextValue: Number(targetLabel)
	});
}

async function getCellLabelClasses(page, days) {
	return await page.evaluate((labels) => labels.map((label) => {
		const node = [...document.querySelectorAll('.date-cell__label')]
			.find((el) => el.textContent.trim() === label);
		return { day: label, className: node?.className || null };
	}), days);
}

function addIsoDays(dateString, amount) {
	const date = new Date(`${dateString}T00:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + amount);
	return date.toISOString().slice(0, 10);
}

function formatMonthDayDot(dateString) {
	const date = new Date(`${dateString}T00:00:00.000Z`);
	return `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatHumanDate(dateString) {
	const date = new Date(`${dateString}T00:00:00.000Z`);
	return `${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
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
		await waitForSelectionState(page, { '23': true, '24': true, '25': false });
		await page.mouse.move(p23.x, p23.y, { steps: 3 });
		await waitForSelectionState(page, { '23': true, '24': false, '25': false });
		await page.mouse.up();

		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' })).toHaveCount(1);
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' }).click();
		await page.waitForTimeout(120);
		const immediateClasses = await getCellClasses(page, ['23', '24', '25']);
		expect(immediateClasses[0].className.includes('date-cell--bg-period')).toBeTruthy();
		expect(immediateClasses[1].className.includes('date-cell--bg-period')).toBeFalsy();
		expect(immediateClasses[2].className.includes('date-cell--bg-period')).toBeFalsy();
		await page.waitForTimeout(1600);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');

		await page.goto(buildFrontendUrl(HOME_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: PROFILE_ID,
			today: '2026-04-03'
		}));
		await page.waitForTimeout(1200);
		const classes = await getCellClasses(page, ['23', '24', '25']);
		expect(classes[0].className.includes('date-cell--bg-period')).toBeTruthy();
		expect(classes[1].className.includes('date-cell--bg-period')).toBeFalsy();
		expect(classes[2].className.includes('date-cell--bg-period')).toBeFalsy();
	} finally {
		await resetRange();
	}
});

test('explicit batch toggle enters empty batch mode and saves after the first tapped date', async ({ page }) => {
	await resetRange();

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '批量选择' })).toHaveCount(1);
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '批量选择' }).click();

		const saveButton = page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' });
		await expect(saveButton).toHaveCount(1);
		await expect(saveButton).toHaveClass(/menstrual-home__batch-btn--disabled/);

		await page.locator('.date-cell__label').filter({ hasText: '23' }).first().click();
		await waitForSelectionState(page, { '23': true, '24': false });

		await expect(saveButton).not.toHaveClass(/menstrual-home__batch-btn--disabled/);
		await saveButton.click();
		await page.waitForTimeout(120);

		const immediateClasses = await getCellClasses(page, ['23', '24']);
		expect(immediateClasses[0].className.includes('date-cell--bg-period')).toBeTruthy();
		expect(immediateClasses[1].className.includes('date-cell--bg-period')).toBeFalsy();
		await page.waitForTimeout(1600);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');
	} finally {
		await resetRange();
	}
});

test('batch drag still hits the correct cells after page scroll invalidates cached rects', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-24'
	});

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		const firstP23 = await getCellCenter(page, '23');
		expect(firstP23).toBeTruthy();

		await page.mouse.move(firstP23.x, firstP23.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await expect(page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' })).toHaveCount(1);
		await page.mouse.up();
		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '取消' }).click();
		await page.waitForTimeout(250);

		await page.evaluate(() => {
			window.scrollTo({ top: 120, behavior: 'instant' });
		});
		await page.waitForTimeout(250);
		await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

		const p23 = await getCellCenter(page, '23');
		const p24 = await getCellCenter(page, '24');
		expect(p23).toBeTruthy();
		expect(p24).toBeTruthy();

		await page.mouse.move(p23.x, p23.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await page.mouse.move(p24.x, p24.y, { steps: 3 });
		await waitForSelectionState(page, { '23': true, '24': true });
		await page.mouse.up();

		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' }).click();
		await page.waitForTimeout(1600);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 24 日');
		await waitForPeriodDates('2026-03-23', '2026-03-24', [
			'2026-03-23', '2026-03-24'
		]);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-24'
		});
	}
});

test('batch save keeps the optimistic period result visible before backend reconciliation finishes', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-24'
	});

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		const p23 = await getCellCenter(page, '23');
		const p24 = await getCellCenter(page, '24');
		expect(p23).toBeTruthy();
		expect(p24).toBeTruthy();

		await page.mouse.move(p23.x, p23.y);
		await page.mouse.down();
		await page.waitForTimeout(550);
		await page.mouse.move(p24.x, p24.y, { steps: 3 });
		await waitForSelectionState(page, { '23': true, '24': true });
		await page.mouse.up();

		await page.locator('.menstrual-home__batch-btn').filter({ hasText: '保存' }).click();
		await page.waitForTimeout(120);

		const immediateClasses = await getCellClasses(page, ['23', '24']);
		expect(immediateClasses[0].className.includes('date-cell--bg-period')).toBeTruthy();
		expect(immediateClasses[1].className.includes('date-cell--bg-period')).toBeTruthy();
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 24 日');

		await page.waitForTimeout(1600);
		await waitForPeriodDates('2026-03-23', '2026-03-24', [
			'2026-03-23', '2026-03-24'
		]);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-24'
		});
	}
});

test('owner shell can share and revoke the same module instance while partner reads the same home data', async ({ page }) => {
	await ensurePrivateModuleState();
	await seedChangelogAsSeen(page);

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
		await dismissChangelogSheetIfPresent(page);

		await expect(page.locator('.management-board .module-tile__status-dot--shared')).toHaveCount(0);
		await page.locator('.management-action--share').click();
		await expect(page.locator('.share-modal__title')).toContainText('共享模块');
		await expect(page.locator('.share-modal__badge')).toContainText('只读权限');
		await page.locator('.share-modal__perm-option-label').filter({ hasText: '可编辑' }).click();
		await expect(page.locator('.share-modal__badge')).toContainText('可编辑权限');
		await page.locator('.share-modal__btn--secondary').click();

		await postJson('/commands/shareModuleInstance', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			partnerUserId: PARTNER_USER_ID
		});
		await page.reload();
		await page.waitForTimeout(1200);
		await expect(page.locator('.management-board .module-tile__status-dot--shared')).toHaveCount(1);

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
		await dismissChangelogSheetIfPresent(page);
		await expect(page.locator('.menstrual-home__hero')).toHaveCount(1);
		await expect(page.locator('.menstrual-home__hero-sharing-chip-label')).toContainText('共享');

		await postJson('/commands/revokeModuleAccess', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			partnerUserId: PARTNER_USER_ID
		});
		await page.goto(buildFrontendUrl(SHELL_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: 'seed-home-profile',
			partnerUserId: PARTNER_USER_ID,
			today: '2026-03-29'
		}));
		await page.waitForTimeout(1200);
	await expect(page.locator('.management-card__module-name')).toContainText('经期小记');
		await expect(page.locator('.management-action--share')).toContainText('共享');
		const finalOwnerState = await getAccessState();
		expect(finalOwnerState.sharingStatus).toBe('private');
		expect(finalOwnerState.activePartners).toEqual([]);
	} finally {
		await ensurePrivateModuleState();
	}
});

test('owner shell can update the default period duration from the live settings strip', async ({ page }) => {
	await ensureDefaultPeriodDuration(6);
	await seedChangelogAsSeen(page);

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

		await expect(page.locator('.management-card__summary-item').filter({ hasText: '经期时长' })).toContainText('6 天');
		const updatedDuration = await selectAdjacentQuickSettingChip(page, '经期天数', 6);
		await page.waitForTimeout(1200);
		await expect(page.locator('.management-card__summary-item').filter({ hasText: '经期时长' })).toContainText(`${updatedDuration} 天`);
		await expect(page.locator('.module-setting-strip').filter({ hasText: '经期天数' }).locator('.module-setting-strip__chip--selected')).toContainText(`${updatedDuration}`);
	} finally {
		await ensureDefaultPeriodDuration(6);
	}
});

test('owner shell keeps custom-picker preview and confirmed selection aligned for default period duration', async ({ page }) => {
	await ensureDefaultPeriodDuration(5);
	await seedChangelogAsSeen(page);

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
		await dismissChangelogSheetIfPresent(page);

		const row = await openCustomPicker(page, '经期天数');
		await previewCustomPickerValue(page, '经期天数', '6');
		await expect(getSelectedNumericQuickChip(row)).toContainText('6');

		await page.locator('.management-page__picker-backdrop').click({ force: true });
		await page.waitForTimeout(1200);

		await expect(page.locator('.management-card__summary-item').filter({ hasText: '经期时长' })).toContainText('6 天');
		await expect(getSelectedNumericQuickChip(getSettingRow(page, '经期天数'))).toContainText('6');
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
		await waitForSelectionState(page, { '23': false, '24': false });

		await openDay(page, '23');
		await waitForSelectionState(page, { '23': true, '24': false });
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 23 日');
		await expect(getPeriodChip(page, '月经')).not.toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经').click();
		await page.waitForTimeout(120);
		await expect(getPeriodChip(page, '月经开始')).toHaveClass(/selected-date-panel__chip--accent/);
		const immediateClasses = await getCellClasses(page, ['23', '24', '25', '26', '27']);
		expect(immediateClasses.find((c) => c.day === '23').className).toContain('date-cell--bg-period');
		expect(immediateClasses.find((c) => c.day === '24').className).toContain('date-cell--bg-period');
		expect(immediateClasses.find((c) => c.day === '25').className).toContain('date-cell--bg-period');
		expect(immediateClasses.find((c) => c.day === '26').className).toContain('date-cell--bg-period');
		expect(immediateClasses.find((c) => c.day === '27').className).not.toContain('date-cell--bg-period');
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

test('single-day period tap stays immediate even when deferred hero refresh is slow', async ({ page }) => {
	const TEST_FIRST_DAY = '2026-03-23';
	const TEST_WINDOW_END = '2026-03-27';

	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: TEST_FIRST_DAY,
		endDate: '2026-03-30'
	});

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);

		await openDay(page, '23');
		await expect(getPeriodChip(page, '月经')).not.toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经').click();
		await page.waitForTimeout(120);

		await expect(getPeriodChip(page, '月经开始')).toHaveClass(/selected-date-panel__chip--accent/);
		const immediateClasses = await getCellClasses(page, ['23', '24', '25', '26']);
		expect(immediateClasses.every((item) => item.className.includes('date-cell--bg-period'))).toBeTruthy();

		await page.waitForTimeout(1400);
		const calendarWindow = await getCalendarWindow('2026-03-23', '2026-03-27');
		const periodDates = calendarWindow.days
			.filter((day) => day.date >= '2026-03-23' && day.date <= '2026-03-27' && day.isPeriod)
			.map((day) => day.date);
		expect(periodDates[0]).toBe('2026-03-23');
		expect(periodDates.includes('2026-03-23')).toBeTruthy();
		expect(periodDates.includes('2026-03-24')).toBeTruthy();
		expect(periodDates.includes('2026-03-25')).toBeTruthy();
		expect(periodDates.includes('2026-03-26')).toBeTruthy();
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: TEST_FIRST_DAY,
			endDate: '2026-03-30'
		});
	}
});

test('future auto-filled period days stay read-only while hero next shows the predicted range', async ({ page }) => {
	const TEST_FIRST_DAY = '2026-03-29';
	const TEST_WINDOW_END = '2026-04-02';
	const TEST_DURATION = 6;

	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-01',
		endDate: '2026-04-06'
	});
	await postJson('/commands/recordPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-01',
		endDate: '2026-03-05'
	});
	await ensureDefaultPeriodDuration(TEST_DURATION);

	try {
		const [homeView, moduleSettings] = await Promise.all([
			getModuleHomeView(),
			getModuleSettings()
		]);
		const predictedStartDate = homeView.predictionSummary?.predictedStartDate;
		expect(predictedStartDate).toBeTruthy();
		const expectedHeroRange = `${formatMonthDayDot(predictedStartDate)} - ${formatMonthDayDot(addIsoDays(predictedStartDate, moduleSettings.defaultPeriodDurationDays - 1))}`;

		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(expectedHeroRange);

		await openDay(page, '29');
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 29 日');
		await getPeriodChip(page, '月经').click();
		const confirmButton = page.getByText('确认');
		if (await confirmButton.isVisible().catch(() => false)) {
			await confirmButton.click();
		}
		await page.waitForTimeout(120);

		const immediateClasses = await getCellClasses(page, ['29', '30', '31', '01']);
		expect(immediateClasses.every((item) => item.className.includes('date-cell--bg-period'))).toBeTruthy();
		const labelClasses = await getCellLabelClasses(page, ['30', '31', '01']);
		expect(labelClasses.every((item) => item.className.includes('date-cell__label--period-contrast'))).toBeTruthy();
		expect(labelClasses.every((item) => !item.className.includes('date-cell__label--muted'))).toBeTruthy();

		await page.locator('.date-cell__label').filter({ hasText: '30' }).first().click();
		await page.waitForTimeout(200);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('3 月 29 日');

		const updatedHomeView = await getModuleHomeView();
		const updatedPredictedStartDate = updatedHomeView.predictionSummary?.predictedStartDate;
		expect(updatedPredictedStartDate).toBeTruthy();
		await page.locator('.jump-tabs__item').filter({ hasText: '下次预测' }).click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.selected-date-panel__title')).toHaveText(formatHumanDate(updatedPredictedStartDate));
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-01',
			endDate: '2026-04-06'
		});
		await ensureDefaultPeriodDuration(6);
	}
});

test('deferred hero refresh picks up the updated default period duration before recomputing the next range chip', async ({ page }) => {
	await ensureDefaultPeriodDuration(4);
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-01',
		endDate: '2026-04-06'
	});
	await postJson('/commands/recordPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-01',
		endDate: '2026-03-05'
	});

	try {
		const [initialHomeView, initialModuleSettings] = await Promise.all([
			getModuleHomeView(),
			getModuleSettings()
		]);
		expect(initialModuleSettings.defaultPeriodDurationDays).toBe(4);
		const initialPredictedStartDate = initialHomeView.predictionSummary?.predictedStartDate;
		expect(initialPredictedStartDate).toBeTruthy();
		const initialHeroRange = `${formatMonthDayDot(initialPredictedStartDate)} - ${formatMonthDayDot(addIsoDays(initialPredictedStartDate, initialModuleSettings.defaultPeriodDurationDays - 1))}`;

		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(initialHeroRange);

		await ensureDefaultPeriodDuration(6);
		await openDay(page, '29');
		await expect(getPeriodChip(page, '月经')).not.toHaveClass(/selected-date-panel__chip--accent/);
		await getPeriodChip(page, '月经').click();
		await page.waitForTimeout(1600);

		const [homeView, moduleSettings] = await Promise.all([
			getModuleHomeView(),
			getModuleSettings()
		]);
		expect(moduleSettings.defaultPeriodDurationDays).toBe(6);
		const predictedStartDate = homeView.predictionSummary?.predictedStartDate;
		expect(predictedStartDate).toBeTruthy();
		const expectedHeroRange = `${formatMonthDayDot(predictedStartDate)} - ${formatMonthDayDot(addIsoDays(predictedStartDate, moduleSettings.defaultPeriodDurationDays - 1))}`;
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(expectedHeroRange);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-01',
			endDate: '2026-04-06'
		});
		await ensureDefaultPeriodDuration(6);
	}
});

test('calendar prediction visually covers the same range that hero next displays while jump still lands on prediction start', async ({ page }) => {
	const [homeView, moduleSettings] = await Promise.all([
		getModuleHomeView(),
		getModuleSettings()
	]);
	const predictedStartDate = homeView.predictionSummary?.predictedStartDate;
	expect(predictedStartDate).toBeTruthy();
	const predictedRangeDates = Array.from(
		{ length: moduleSettings.defaultPeriodDurationDays },
		(_, index) => addIsoDays(predictedStartDate, index)
	);
	const expectedHeroRange = `${formatMonthDayDot(predictedRangeDates[0])} - ${formatMonthDayDot(predictedRangeDates[predictedRangeDates.length - 1])}`;
	const expectedDayLabels = predictedRangeDates.map((date) => date.slice(8, 10));

	await page.goto(FRONTEND_URL);
	await page.waitForTimeout(1200);

	await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(expectedHeroRange);
	await page.locator('.jump-tabs__item').filter({ hasText: '下次预测' }).click();
	await page.waitForTimeout(1200);
	const predictionClasses = await getCellClasses(page, expectedDayLabels);
	expect(predictionClasses.every((item) => item.className.includes('date-cell--bg-period-soft'))).toBeTruthy();

	await expect(page.locator('.selected-date-panel__title')).toHaveText(formatHumanDate(predictedStartDate));
});

test('prediction jump and hero next follow the latest recorded period start, then revert after revoke', async ({ page }) => {
	const EARLIER_START = '2026-03-29';
	const LATER_START = '2026-04-03';

	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-29',
		endDate: '2026-04-06'
	});

	try {
		await recordRange(EARLIER_START, '2026-03-31');
		const initialHomeView = await getModuleHomeView();
		const initialModuleSettings = await getModuleSettings();
		const initialPredictedStartDate = initialHomeView.predictionSummary?.predictedStartDate;
		expect(initialPredictedStartDate).toBeTruthy();
		const initialHeroRange = `${formatMonthDayDot(initialPredictedStartDate)} - ${formatMonthDayDot(addIsoDays(initialPredictedStartDate, initialModuleSettings.defaultPeriodDurationDays - 1))}`;

		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(initialHeroRange);
		await page.locator('.jump-tabs__item').filter({ hasText: '下次预测' }).click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.selected-date-panel__title')).toHaveText(formatHumanDate(initialPredictedStartDate));

		await recordRange(LATER_START, '2026-04-04');
		await page.reload();
		await page.waitForTimeout(1200);

		const movedHomeView = await getModuleHomeView();
		const movedPredictedStartDate = movedHomeView.predictionSummary?.predictedStartDate;
		expect(movedPredictedStartDate).toBeTruthy();
		expect(movedPredictedStartDate).not.toBe(initialPredictedStartDate);
		const movedHeroRange = `${formatMonthDayDot(movedPredictedStartDate)} - ${formatMonthDayDot(addIsoDays(movedPredictedStartDate, initialModuleSettings.defaultPeriodDurationDays - 1))}`;
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(movedHeroRange);
		await page.locator('.jump-tabs__item').filter({ hasText: '下次预测' }).click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.selected-date-panel__title')).toHaveText(formatHumanDate(movedPredictedStartDate));

		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: LATER_START,
			endDate: '2026-04-04'
		});
		await page.reload();
		await page.waitForTimeout(1200);

		const revertedHomeView = await getModuleHomeView();
		const revertedPredictedStartDate = revertedHomeView.predictionSummary?.predictedStartDate;
		expect(revertedPredictedStartDate).toBe(initialPredictedStartDate);
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(initialHeroRange);
		await page.locator('.jump-tabs__item').filter({ hasText: '下次预测' }).click();
		await page.waitForTimeout(1200);
		await expect(page.locator('.selected-date-panel__title')).toHaveText(formatHumanDate(initialPredictedStartDate));
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-29',
			endDate: '2026-04-06'
		});
	}
});

test('revoking the latest period segment restores prediction highlights without requiring calendar navigation', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-15',
		endDate: '2026-04-06'
	});

	try {
		await recordRange('2026-03-15', '2026-03-18');
		await recordRange('2026-04-03', '2026-04-06');

		await page.goto(buildFrontendUrl(HOME_ROUTE, {
			apiBaseUrl: API_BASE_URL,
			openid: OPENID,
			moduleInstanceId: MODULE_INSTANCE_ID,
			profileId: PROFILE_ID,
			today: '2026-04-03'
		}));
		await page.waitForTimeout(1200);
		await page.locator('.calendar-grid__cell').filter({ hasText: '03' }).first().click();
		await page.waitForTimeout(400);
		await expect(page.locator('.selected-date-panel__title')).toHaveText('4 月 3 日');
		await expect(getPeriodChip(page, '月经开始')).toHaveClass(/selected-date-panel__chip--accent/);

		await getPeriodChip(page, '月经开始').click();
		await page.waitForTimeout(1600);

		const revertedHomeView = await getModuleHomeView();
		const revertedSettings = await getModuleSettings();
		const revertedPredictedStartDate = revertedHomeView.predictionSummary?.predictedStartDate;
		expect(revertedPredictedStartDate).toBeTruthy();
		const visiblePredictionCount = await page.evaluate(() => {
			return [...document.querySelectorAll('.date-cell')]
				.filter((node) => node.className.includes('date-cell--bg-period-soft'))
				.length;
		});
		expect(visiblePredictionCount).toBeGreaterThan(0);
		await expect(page.locator('.menstrual-home__hero-info-frame--next .menstrual-home__hero-info-value')).toHaveText(
			`${formatMonthDayDot(revertedPredictedStartDate)} - ${formatMonthDayDot(addIsoDays(revertedPredictedStartDate, revertedSettings.defaultPeriodDurationDays - 1))}`
		);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-15',
			endDate: '2026-04-06'
		});
	}
});

test('attribute and note edits use selective day-detail refresh instead of reloading home view or calendar window', async ({ page }) => {
	const TEST_DATE = '2026-03-23';
	const seenRequests = [];
	const trackRequest = (request) => {
		const url = request.url();
		if (url.includes('/api/')) {
			seenRequests.push(url);
		}
	};

	await recordDayDetails(TEST_DATE, { flowLevel: null, painLevel: null, colorLevel: null });
	await recordDayNote(TEST_DATE, '');
	page.on('request', trackRequest);

	try {
		await page.goto(FRONTEND_URL);
		await page.waitForTimeout(1200);
		await openDay(page, '23');
		await page.locator('.selected-date-panel__chip').filter({ hasText: '+ 记录详情' }).click();
		await page.waitForTimeout(250);

		seenRequests.length = 0;
		await page
			.locator('.selected-date-panel__editor-row')
			.filter({ hasText: '疼痛' })
			.locator('.selected-date-panel__editor-option')
			.filter({ hasText: '轻' })
			.click();
		await page.waitForTimeout(1400);

		expect(seenRequests.some((url) => url.includes('/api/commands/recordDayDetails'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getDayRecordDetail'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getSingleDayPeriodAction'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getModuleHomeView'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getCalendarWindow'))).toBeTruthy();

		seenRequests.length = 0;
		const noteInput = page.getByRole('textbox');
		await noteInput.fill('selective refresh note');
		await noteInput.blur();
		await page.waitForTimeout(1400);

		expect(seenRequests.some((url) => url.includes('/api/commands/recordDayNote'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getDayRecordDetail'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getSingleDayPeriodAction'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getModuleHomeView'))).toBeTruthy();
		expect(seenRequests.some((url) => url.includes('/api/queries/getCalendarWindow'))).toBeTruthy();
	} finally {
		page.off('request', trackRequest);
		await recordDayDetails(TEST_DATE, { flowLevel: null, painLevel: null, colorLevel: null });
		await recordDayNote(TEST_DATE, '');
	}
});

test('selected start day shows selected 月经开始 and tap revokes the whole segment', async ({ page }) => {
	await postJson('/commands/clearPeriodRange', {
		moduleInstanceId: MODULE_INSTANCE_ID,
		startDate: '2026-03-23',
		endDate: '2026-03-30'
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

		await expect(getPeriodChip(page, '月经')).not.toHaveClass(/selected-date-panel__chip--accent/);
		await waitForPeriodDates('2026-03-23', '2026-03-27', []);
	} finally {
		await postJson('/commands/clearPeriodRange', {
			moduleInstanceId: MODULE_INSTANCE_ID,
			startDate: '2026-03-23',
			endDate: '2026-03-30'
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
