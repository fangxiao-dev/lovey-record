# WeChat Cloud Run Deployment Prep

> **Status:** COMPLETED

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare the codebase for production deployment on WeChat Cloud Run + managed MySQL, addressing all code-level gaps identified in the deployment checklist.

**Architecture:** Backend runs as a Docker container on WeChat Cloud Run with public network access disabled (WeChat private protocol only). WeChat's gateway injects `X-WX-OPENID` on every request, so the existing auth middleware works without changes. Frontend switches `apiBaseUrl` to the private protocol format at production build time.

**Tech Stack:** Node.js/TypeScript, Express, Prisma/MySQL, uni-app (Vue 3), HBuilderX conditional compilation via `process.env.NODE_ENV`.

---

## Important: What's Out of Scope

This plan covers **infrastructure/config hardening only**. The following is a known gap that needs a separate feature plan before real users can onboard:

> **No user onboarding flow exists.** Pages receive `moduleInstanceId`, `profileId`, etc. as URL query params that currently default to seed values (`seed-home-module`, `seed-home-profile`). In production, the database won't have these rows unless the app runs a login flow (`wx.login()` → code exchange → auto-provision user/profile/module). That is a separate task. This plan does not block on it.

---

## Manual Steps (Cloud Console — no code)

Do these in the WeChat Cloud Run console **before or after** the code changes; order doesn't matter.

| Action | Where | Value |
|--------|-------|-------|
| Disable public access | Service → Access Control | Keep only "WeChat private protocol" |
| Set env vars | Service → Version Config → Env Vars | `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGIN` |
| Min instances | Service → Version Config | `0` (cold start OK for MVP) or `1` (if latency matters) |
| Max instances | Service → Version Config | `5` |
| Concurrency | Service → Version Config | `20` |
| MySQL spec | MySQL instance | Basic tier |

---

## Task 1: Prisma Connection Pool — `backend/.env.example`

**Why:** Cloud Run auto-scales horizontally. Each container opens its own Prisma connection pool. With the default pool size (~10 per instance), 5 instances = 50 connections, which saturates a basic-tier MySQL instance (max ~100). Capping at 2 per instance leaves headroom.

**Files:**
- Modify: `backend/.env.example`
- Modify: `backend/.env` (local)

**Step 1: Update `.env.example`**

Replace the current `DATABASE_URL` line:

```
DATABASE_URL="mysql://root:password@localhost:3306/lovey_record?connection_limit=2&pool_timeout=10"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

The two new query params:
- `connection_limit=2` — max connections per Prisma client instance
- `pool_timeout=10` — seconds to wait for a connection before throwing (instead of hanging)

**Step 2: Update your local `.env` with the same `connection_limit` params**

Edit `backend/.env`:
```
DATABASE_URL="mysql://root:password@localhost:3306/lovey_record?connection_limit=2&pool_timeout=10"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Step 3: Run existing backend tests to confirm nothing broke**

```bash
cd backend
npm test
```

Expected: all tests pass (connection pool params are transparent to Prisma test behaviour).

**Step 4: Commit**

```bash
git add backend/.env.example backend/.env
git commit -m "config: cap prisma connection pool for cloud run scaling"
```

---

## Task 2: CORS Origin as Environment Variable — `backend/src/app.ts`

**Why:** The current hardcoded `http://localhost:5173` will silently block all H5 requests in production. Making it env-driven means zero code changes per environment.

**Files:**
- Modify: `backend/src/app.ts:10`

**Step 1: Read the current CORS block**

Current code at line 10:
```typescript
const allowedOrigins = new Set(['http://localhost:5173']);
```

**Step 2: Replace with env-driven origins**

```typescript
const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = new Set(rawOrigins.split(',').map(s => s.trim()));
```

This handles both single (`http://localhost:5173`) and comma-separated values (`https://example.com,https://www.example.com`) from the env var.

**Step 3: Run backend tests**

```bash
cd backend
npm test
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add backend/src/app.ts
git commit -m "config: drive CORS allowed origins from CORS_ORIGIN env var"
```

---

## Task 3: Frontend API Base URL Config — `frontend/config/api.js`

**Why:** `DEFAULT_MODULE_SHELL_CONTEXT.apiBaseUrl` is hardcoded to `http://localhost:3000/api`. In production WeChat Cloud Run with private protocol, the URL must use the `//` scheme (e.g. `//your-service-name/api`). HBuilderX compiles with `process.env.NODE_ENV` available, so a single config file can switch at build time.

**Files:**
- Create: `frontend/config/api.js`
- Modify: `frontend/services/menstrual/module-shell-service.js:2`

**Step 1: Create `frontend/config/api.js`**

```js
// Replace [YOUR_SERVICE_NAME] with the service ID shown in WeChat Cloud Run console
// e.g. if your console shows "prod-xxx", use "//prod-xxx/api"
const PROD_API_BASE_URL = '//[YOUR_SERVICE_NAME]/api';
const DEV_API_BASE_URL = 'http://localhost:3000/api';

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? PROD_API_BASE_URL
    : DEV_API_BASE_URL;
```

**Step 2: Use it in `module-shell-service.js`**

Replace line 2 in `frontend/services/menstrual/module-shell-service.js`:

```js
// Before
apiBaseUrl: 'http://localhost:3000/api',

// After
import { API_BASE_URL } from '../../config/api.js';
// ...
apiBaseUrl: API_BASE_URL,
```

Full replacement in context — the `DEFAULT_MODULE_SHELL_CONTEXT` block becomes:

```js
import { API_BASE_URL } from '../../config/api.js';

export const DEFAULT_MODULE_SHELL_CONTEXT = Object.freeze({
  apiBaseUrl: API_BASE_URL,
  openid: 'seed-home-openid',
  moduleInstanceId: 'seed-home-module',
  profileId: 'seed-home-profile',
  partnerUserId: 'seed-shared-partner',
  today: '2026-03-29'
});
```

**Step 3: Run frontend tests to confirm no regressions**

```bash
cd frontend
node --test services/menstrual/__tests__/*.test.mjs
```

Expected: all tests pass (tests mock `uni.request`, not the URL value itself — confirm by checking test output).

**Step 4: Commit**

```bash
git add frontend/config/api.js frontend/services/menstrual/module-shell-service.js
git commit -m "config: drive frontend API base URL from build-time NODE_ENV"
```

---

## Task 4: Dockerfile — Add `EXPOSE`

**Why:** WeChat Cloud Run's build system uses the `EXPOSE` instruction to know which port to route traffic to. Without it, port routing may require manual override in the console.

**Files:**
- Modify: `backend/Dockerfile`

**Step 1: Add `EXPOSE 3000` before `CMD`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "config: expose port 3000 for cloud run port detection"
```

---

## Task 5: Verify — Local Smoke Test

Confirm all changes work together locally before pushing.

**Step 1: Restart backend**

```bash
cd backend
npm run dev
```

Expected: server starts, connects to local MySQL, no errors.

**Step 2: Hit health endpoint**

```bash
curl http://localhost:3000/health
```

Expected: `{"ok":true,"status":"healthy"}`

**Step 3: Confirm CORS header with the new env var**

```bash
curl -H "Origin: http://localhost:5173" -I http://localhost:3000/health
```

Expected: response includes `Access-Control-Allow-Origin: http://localhost:5173`.

**Step 4: Run full test suite**

```bash
cd backend && npm test
```

Expected: all pass.

---

## Post-Deploy Checklist (Cloud Console)

After deploying the new image to WeChat Cloud Run:

- [ ] Set `DATABASE_URL` in env vars to the **internal VPC address** of managed MySQL (format: `mysql://user:pass@sh-cdb-xxxx.sql.tencentcdb.com:3306/lovey_record?connection_limit=2&pool_timeout=10`)
- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN` to your production H5 domain (or leave blank if mini program only)
- [ ] Disable public access → WeChat private protocol only
- [ ] Hit `//[service-name]/health` from a test mini program page to confirm the service responds
- [ ] Run `npm run migrate:prod` against the managed MySQL via a one-off container run or the cloud console terminal before first real traffic
