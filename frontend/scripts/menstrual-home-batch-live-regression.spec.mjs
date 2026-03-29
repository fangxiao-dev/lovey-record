import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.MENSTRUAL_HOME_URL || 'http://localhost:5173/#/pages/menstrual/home';
const API_BASE_URL = process.env.MENSTRUAL_API_BASE_URL || 'http://localhost:3000/api';
const OPENID = process.env.MENSTRUAL_OPENID || 'seed-home-openid';
const MODULE_INSTANCE_ID = process.env.MENSTRUAL_MODULE_INSTANCE_ID || 'seed-home-module';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test.use({
	viewport: { width: 900, height: 900 },
	launchOptions: {
		executablePath: CHROME_PATH
	}
});

async function postJson(path, body) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-wx-openid': OPENID
		},
		body: JSON.stringify(body)
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data;
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
