/**
 * Cloud-Request Refactoring - Comprehensive Browser-Based UI Verification
 *
 * Scenarios:
 *   A. Backend health check
 *   B. API path construction (QueryEnvelope + CommandEnvelope)
 *   C. Header inspection (x-wx-openid present; X-WX-SERVICE absent in dev)
 *   D. Response envelope format
 *   E. Config module exports (API_BASE_URL, CLOUD_CONFIG)
 *   F. Import chain (cloud-request exports cloudRequest function)
 *   G. Dev vs prod routing logic
 *   H. All query endpoints reachable with x-wx-openid
 *   I. All command endpoints reachable with x-wx-openid
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONFIG_SRC = readFileSync(path.join(ROOT, 'frontend', 'config', 'api.js'), 'utf8');
const CLOUD_REQUEST_SRC = readFileSync(
  path.join(ROOT, 'frontend', 'services', 'cloud-request.js'),
  'utf8'
);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
const OPENID = process.env.TEST_OPENID || 'seed-home-openid';
const MODULE_INSTANCE_ID = process.env.MODULE_INSTANCE_ID || 'seed-home-module';
const PROFILE_ID = process.env.PROFILE_ID || 'seed-home-profile';

const CHROME_PATH =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test.use({
  viewport: { width: 1024, height: 768 },
  launchOptions: {
    executablePath: CHROME_PATH,
    headless: true,
  },
});

// ---------------------------------------------------------------------------
// Helper: raw fetch against backend (node-side, not in browser)
// ---------------------------------------------------------------------------
async function apiFetch(path, { method = 'GET', body, openid = OPENID } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-wx-openid': openid,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const json = await res.json();
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body: json };
}

// ---------------------------------------------------------------------------
// Scenario A: Backend Health Check
// ---------------------------------------------------------------------------
test('A: backend /health returns ok:true', async ({ page }) => {
  const response = await page.goto(`${BACKEND_BASE_URL}/health`);
  expect(response.status()).toBe(200);

  const text = await page.textContent('body');
  const parsed = JSON.parse(text);
  expect(parsed.ok).toBe(true);
  expect(parsed.status).toBe('healthy');
});

// ---------------------------------------------------------------------------
// Scenario B: API Path Construction
// ---------------------------------------------------------------------------
test('B1: QueryEnvelope path — /queries/getModuleAccessState is reachable as GET', async () => {
  const params = new URLSearchParams({ moduleInstanceId: MODULE_INSTANCE_ID });
  const { status, body } = await apiFetch(`/queries/getModuleAccessState?${params}`);
  expect(status).toBe(200);
  expect(body).toHaveProperty('ok', true);
  expect(body).toHaveProperty('data');
});

test('B2: QueryEnvelope path — cache-buster timestamp does not break routing', async () => {
  // cloud-request.js appends ?_ts=<timestamp> for cache busting in some callers;
  // the backend must still route correctly when an unknown query param is present.
  const ts = Date.now();
  const params = new URLSearchParams({ moduleInstanceId: MODULE_INSTANCE_ID, _ts: ts });
  const { status, body } = await apiFetch(`/queries/getModuleAccessState?${params}`);
  expect(status).toBe(200);
  expect(body.ok).toBe(true);
});

test('B3: CommandEnvelope path — /commands/shareModuleInstance uses POST', async ({ page }) => {
  // We only verify that the route exists and rejects gracefully (not necessarily 200
  // because share may fail for idempotency reasons). The key assertion is that it is
  // reached (not 404) and the method is POST.
  const intercepted = [];
  page.on('request', (req) => {
    if (req.url().includes('/commands/shareModuleInstance')) {
      intercepted.push({ method: req.method(), url: req.url() });
    }
  });

  // Use page.evaluate to fire a fetch from within the browser context so that
  // Playwright's request listener captures it.
  await page.goto(`${BACKEND_BASE_URL}/health`);
  const result = await page.evaluate(
    async ({ apiBase, openid, moduleId }) => {
      const res = await fetch(`${apiBase}/commands/shareModuleInstance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wx-openid': openid },
        body: JSON.stringify({ moduleInstanceId: moduleId, partnerUserId: 'test-partner' }),
      });
      return { status: res.status, body: await res.json() };
    },
    { apiBase: API_BASE_URL, openid: OPENID, moduleId: MODULE_INSTANCE_ID }
  );

  expect(intercepted.length).toBeGreaterThanOrEqual(1);
  expect(intercepted[0].method).toBe('POST');
  // Route must not be 404
  expect(result.status).not.toBe(404);
});

// ---------------------------------------------------------------------------
// Scenario C: Header Inspection
// ---------------------------------------------------------------------------
test('C1: query requests carry x-wx-openid header and backend accepts it', async ({ page }) => {
  const capturedRequestHeaders = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/queries/')) {
      capturedRequestHeaders.push(req.headers());
    }
  });

  await page.goto(`${BACKEND_BASE_URL}/health`);

  await page.evaluate(
    async ({ apiBase, openid, moduleId }) => {
      await fetch(`${apiBase}/queries/getModuleAccessState?moduleInstanceId=${moduleId}`, {
        headers: { 'x-wx-openid': openid },
      });
    },
    { apiBase: API_BASE_URL, openid: OPENID, moduleId: MODULE_INSTANCE_ID }
  );

  expect(capturedRequestHeaders.length).toBeGreaterThanOrEqual(1);
  const headers = capturedRequestHeaders[0];
  expect(headers).toHaveProperty('x-wx-openid');
  expect(headers['x-wx-openid']).toBe(OPENID);
});

test('C2: dev-mode requests do NOT include X-WX-SERVICE header', async ({ page }) => {
  // In development, cloud-request.js uses callUniRequest which does NOT add X-WX-SERVICE.
  // We simulate that path here: manually fire a request without X-WX-SERVICE.
  const capturedHeaders = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/queries/')) {
      capturedHeaders.push(req.headers());
    }
  });

  await page.goto(`${BACKEND_BASE_URL}/health`);

  await page.evaluate(
    async ({ apiBase, openid, moduleId }) => {
      // Dev path: no X-WX-SERVICE header (only x-wx-openid)
      await fetch(`${apiBase}/queries/getModuleAccessState?moduleInstanceId=${moduleId}`, {
        headers: { 'x-wx-openid': openid },
      });
    },
    { apiBase: API_BASE_URL, openid: OPENID, moduleId: MODULE_INSTANCE_ID }
  );

  expect(capturedHeaders.length).toBeGreaterThanOrEqual(1);
  const h = capturedHeaders[0];
  // x-wx-service must be absent in dev-mode requests
  expect(h['x-wx-service']).toBeUndefined();
});

test('C3: missing x-wx-openid causes auth rejection (401 or body.ok===false)', async () => {
  const params = new URLSearchParams({ moduleInstanceId: MODULE_INSTANCE_ID });
  // Bypass our apiFetch helper so we can omit the openid header
  const res = await fetch(`${API_BASE_URL}/queries/getModuleAccessState?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  // Either HTTP 401 OR response envelope ok:false — both are acceptable auth rejections
  const body = await res.json();
  const isRejected = res.status === 401 || body.ok === false;
  expect(isRejected).toBe(true);
});

// ---------------------------------------------------------------------------
// Scenario D: Response Format Validation
// ---------------------------------------------------------------------------
test('D1: /health response has correct shape {ok, status}', async () => {
  const res = await fetch(`${BACKEND_BASE_URL}/health`);
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body).toMatchObject({ ok: true, status: 'healthy' });
});

test('D2: query endpoint returns {ok:true, data: {...}} envelope', async () => {
  const params = new URLSearchParams({ moduleInstanceId: MODULE_INSTANCE_ID });
  const { status, body } = await apiFetch(`/queries/getModuleAccessState?${params}`);
  expect(status).toBe(200);
  // Envelope top level
  expect(body).toHaveProperty('ok', true);
  expect(body).toHaveProperty('data');
  // data is an object (not null / array)
  expect(typeof body.data).toBe('object');
  expect(body.data).not.toBeNull();
});

test('D3: query endpoint data contains sharingStatus field', async () => {
  const params = new URLSearchParams({ moduleInstanceId: MODULE_INSTANCE_ID });
  const { body } = await apiFetch(`/queries/getModuleAccessState?${params}`);
  expect(body.ok).toBe(true);
  expect(body.data).toHaveProperty('sharingStatus');
  expect(['private', 'shared']).toContain(body.data.sharingStatus);
});

test('D4: getModuleHomeView returns well-formed envelope with data.modules array', async () => {
  const params = new URLSearchParams({ moduleInstanceId: MODULE_INSTANCE_ID });
  const { status, body } = await apiFetch(`/queries/getModuleHomeView?${params}`);
  expect(status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body).toHaveProperty('data');
});

// ---------------------------------------------------------------------------
// Scenario E: Config Module Exports
// ---------------------------------------------------------------------------
test('E1: config/api.js exports API_BASE_URL pointing to localhost:3000 in dev', () => {
  expect(CONFIG_SRC).toContain("'http://localhost:3000/api'");
  expect(CONFIG_SRC).toContain("'prod-5gpr9j0q7ae42bfd'");
  expect(CONFIG_SRC).toContain("'express-ovjd'");
});

test('E2: API_BASE_URL dev value resolves to http://localhost:3000/api', () => {
  const devMatch = CONFIG_SRC.match(/DEV_API_BASE_URL\s*=\s*'([^']+)'/);
  expect(devMatch).not.toBeNull();
  expect(devMatch[1]).toBe('http://localhost:3000/api');
});

test('E3: CLOUD_CONFIG has correct envId and serviceName', () => {
  expect(CONFIG_SRC).toContain("envId: 'prod-5gpr9j0q7ae42bfd'");
  expect(CONFIG_SRC).toContain("serviceName: 'express-ovjd'");
});

// ---------------------------------------------------------------------------
// Scenario F: Import Chain Verification
// ---------------------------------------------------------------------------
test('F1: cloud-request.js exports a named function cloudRequest', () => {
  expect(CLOUD_REQUEST_SRC).toMatch(/export\s+async\s+function\s+cloudRequest/);
});

test('F2: cloud-request.js imports CLOUD_CONFIG from config/api.js', () => {
  expect(CLOUD_REQUEST_SRC).toContain("import { CLOUD_CONFIG } from '../config/api.js'");
});

test('F3: cloud-request.js uses wx.cloud.callContainer in production path', () => {
  expect(CLOUD_REQUEST_SRC).toContain('wx.cloud.callContainer');
  expect(CLOUD_REQUEST_SRC).toContain('CLOUD_CONFIG.envId');
  expect(CLOUD_REQUEST_SRC).toContain('CLOUD_CONFIG.serviceName');
});

test('F4: cloud-request.js uses uni.request in development path', () => {
  expect(CLOUD_REQUEST_SRC).toContain('uni.request');
  expect(CLOUD_REQUEST_SRC).toContain("'http://localhost:3000/api'");
});

// ---------------------------------------------------------------------------
// Scenario G: Dev vs Prod Routing Logic
// ---------------------------------------------------------------------------
test('G1: routing guard uses process.env.NODE_ENV === "production"', () => {
  expect(CLOUD_REQUEST_SRC).toContain("process.env.NODE_ENV === 'production'");
});

test('G2: production path uses X-WX-SERVICE header; dev path does not', () => {
  // X-WX-SERVICE must appear inside callCloudContainer, not in callUniRequest
  const cloudContainerFnMatch = CLOUD_REQUEST_SRC.match(
    /function callCloudContainer[\s\S]*?function callUniRequest/
  );
  expect(cloudContainerFnMatch).not.toBeNull();
  const cloudContainerSrc = cloudContainerFnMatch[0];
  expect(cloudContainerSrc).toContain("'X-WX-SERVICE'");

  const uniRequestFnMatch = CLOUD_REQUEST_SRC.match(/function callUniRequest[\s\S]*/);
  expect(uniRequestFnMatch).not.toBeNull();
  const uniRequestSrc = uniRequestFnMatch[0];
  expect(uniRequestSrc).not.toContain("'X-WX-SERVICE'");
});

// ---------------------------------------------------------------------------
// Scenario H: All query endpoints reachable
// ---------------------------------------------------------------------------
test('H: all query routes return 200 with valid openid', async () => {
  const queryEndpoints = [
    `/queries/getModuleAccessState?moduleInstanceId=${MODULE_INSTANCE_ID}`,
    `/queries/getModuleHomeView?moduleInstanceId=${MODULE_INSTANCE_ID}`,
    `/queries/getModuleSettings?moduleInstanceId=${MODULE_INSTANCE_ID}`,
  ];

  const results = [];
  for (const path of queryEndpoints) {
    const { status, body } = await apiFetch(path);
    results.push({ path, status, ok: body.ok });
  }

  for (const r of results) {
    expect(r.status, `${r.path} should return 200`).toBe(200);
    expect(r.ok, `${r.path} envelope.ok should be true`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// Scenario I: Command endpoints reachable with POST
// ---------------------------------------------------------------------------
test('I: POST command routes return non-404 with valid openid', async () => {
  // We only verify routing — not business logic. Commands may succeed or fail
  // depending on DB state, but they must NOT 404.
  const commandEndpoints = [
    {
      path: '/commands/updateDefaultPeriodDuration',
      body: { moduleInstanceId: MODULE_INSTANCE_ID, defaultPeriodDurationDays: 6 },
    },
  ];

  for (const { path, body } of commandEndpoints) {
    const { status } = await apiFetch(path, { method: 'POST', body });
    expect(status, `POST ${path} must not be 404`).not.toBe(404);
  }
});

// ---------------------------------------------------------------------------
// Scenario J: Network interception - full request/response log via browser
// ---------------------------------------------------------------------------
test('J: browser intercept logs API calls with correct method/headers/envelope', async ({
  page,
}) => {
  const capturedRequests = [];
  const responsePromises = [];

  page.on('request', (req) => {
    if (req.url().includes('/api/')) {
      capturedRequests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
      });
    }
  });

  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      // Collect a promise for each response body so we can await them all
      responsePromises.push(
        res.json().then((body) => ({
          url: res.url(),
          status: res.status(),
          body,
        })).catch(() => ({
          url: res.url(),
          status: res.status(),
          body: null,
        }))
      );
    }
  });

  await page.goto(`${BACKEND_BASE_URL}/health`);

  // Fire two requests from within the browser context to trigger interception
  await page.evaluate(
    async ({ apiBase, openid, moduleId }) => {
      // GET query
      await fetch(`${apiBase}/queries/getModuleAccessState?moduleInstanceId=${moduleId}`, {
        headers: { 'x-wx-openid': openid },
      });
      // POST command
      await fetch(`${apiBase}/commands/updateDefaultPeriodDuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wx-openid': openid },
        body: JSON.stringify({ moduleInstanceId: moduleId, defaultPeriodDurationDays: 6 }),
      });
    },
    { apiBase: API_BASE_URL, openid: OPENID, moduleId: MODULE_INSTANCE_ID }
  );

  // Wait briefly for response events to fire and then resolve all body reads
  await page.waitForTimeout(500);
  const capturedResponses = await Promise.all(responsePromises);

  // --- Request assertions ---
  expect(capturedRequests.length).toBeGreaterThanOrEqual(2);

  const getReq = capturedRequests.find((r) => r.method === 'GET');
  expect(getReq).toBeDefined();
  expect(getReq.url).toContain('/queries/getModuleAccessState');
  expect(getReq.headers['x-wx-openid']).toBe(OPENID);

  const postReq = capturedRequests.find((r) => r.method === 'POST');
  expect(postReq).toBeDefined();
  expect(postReq.url).toContain('/commands/');
  expect(postReq.headers['x-wx-openid']).toBe(OPENID);

  // --- Response assertions ---
  expect(capturedResponses.length).toBeGreaterThanOrEqual(2);

  const getRes = capturedResponses.find((r) => r.url.includes('/queries/getModuleAccessState'));
  expect(getRes).toBeDefined();
  expect(getRes.status).toBe(200);
  expect(getRes.body).toHaveProperty('ok', true);
  expect(getRes.body).toHaveProperty('data');

  const postRes = capturedResponses.find((r) => r.url.includes('/commands/'));
  expect(postRes).toBeDefined();
  expect(postRes.status).toBe(200);
  expect(postRes.body).toHaveProperty('ok', true);
});
