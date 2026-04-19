import { test, expect } from '@playwright/test';

const FRONTEND_BASE_URL = process.env.MENSTRUAL_FRONTEND_BASE_URL || 'http://localhost:5173';
const API_BASE_URL = process.env.MENSTRUAL_API_BASE_URL || 'http://localhost:3004/api';
const OPENID = process.env.MENSTRUAL_OPENID || 'seed-home-openid';
const MODULE_INSTANCE_ID = process.env.MENSTRUAL_MODULE_INSTANCE_ID || 'seed-home-module';
const PROFILE_ID = process.env.MENSTRUAL_PROFILE_ID || 'seed-home-profile';
const HOME_ROUTE = '/pages/menstrual/home';
const REPORT_ROUTE = '/pages/menstrual/report';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function buildFrontendUrl(route, params = {}) {
	const query = new URLSearchParams(params);
	const queryString = query.toString();
	return `${FRONTEND_BASE_URL}#${route}${queryString ? `?${queryString}` : ''}`;
}

async function resetDevFixtures() {
	const resetUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/api/dev/reset`;
	const response = await fetch(resetUrl, {
		method: 'POST'
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
}

async function getModuleReportView() {
	const response = await fetch(`${API_BASE_URL}/queries/getModuleReportView?moduleInstanceId=${MODULE_INSTANCE_ID}`, {
		headers: {
			'x-wx-openid': OPENID
		}
	});
	const envelope = await response.json();
	expect(response.ok).toBeTruthy();
	expect(envelope.ok).toBeTruthy();
	return envelope.data;
}

function formatHistoryDate(dateString) {
	const date = new Date(`${dateString}T00:00:00.000Z`);
	const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()];
	return `${month} ${String(date.getUTCDate()).padStart(2, '0')}`;
}

test.use({
	viewport: { width: 900, height: 900 },
	launchOptions: {
		executablePath: CHROME_PATH
	}
});

test.beforeEach(async () => {
	await resetDevFixtures();
});

test('menstrual report page live regression', async ({ page }) => {
	const reportData = await getModuleReportView();
	const latestRecord = reportData.records[reportData.records.length - 1];
	const expectedHistoryText = `${formatHistoryDate(latestRecord.startDate)}${formatHistoryDate(latestRecord.endDate)}${latestRecord.durationDays}d-`;

	await page.goto(buildFrontendUrl(HOME_ROUTE, {
		apiBaseUrl: API_BASE_URL,
		openid: OPENID,
		moduleInstanceId: MODULE_INSTANCE_ID,
		profileId: PROFILE_ID,
		today: '2026-03-29'
	}));
	await page.waitForTimeout(1200);

	await expect(page.locator('.menstrual-home__report-entry')).toHaveCount(1);
	await page.locator('.menstrual-home__report-entry').click();
	await page.waitForURL((url) => url.hash.includes(REPORT_ROUTE));
	await page.waitForTimeout(800);

	await expect(page.locator('.page-nav-bar__title')).toHaveText('周期小结');
	await expect(page.locator('.report-summary-card')).toContainText('周期');
	await expect(page.locator('.report-summary-card')).toContainText('时长5.0 天');
	await expect(page.locator('.report-summary-card')).toContainText('波动 -');
	await expect(page.locator('.report-trend-card')).toContainText('记录 3 次后开始有图');

	await page.locator('.segmented-control__option').filter({ hasText: 'Duration' }).click();
	await expect(page.locator('.report-trend-card')).toContainText('记录 3 次后开始有图');

	await expect(page.locator('.report-history-list__row').first()).toContainText(expectedHistoryText);

	await page.goBack();
	await page.waitForURL((url) => url.hash.includes(HOME_ROUTE));
	await expect(page.locator('.menstrual-home__report-entry')).toHaveCount(1);
});
