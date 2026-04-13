# Sharing Entry Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the frontend share entry so every visible `共享` / `邀请` / `链接` trigger creates a real invite token for the same recipient-facing join flow, and only show the module shared dot after real sharing is established.

**Architecture:** Keep `pages/join/index` as the single recipient acceptance surface. Owner-side entry points generate invite tokens, expose a shareable join link without leaking the owner `openid` by default, and never navigate the current owner session into the acceptance page. In local H5 debugging, add a dev-only recipient identity bootstrap so acceptance can still be exercised without WeChat gateway identity injection. Derive module-card shared state only from `sharingStatus === 'shared'`.

**Tech Stack:** uni-app Vue 3 SFCs, frontend page-model services, node:test contract tests

---

### Task 1: Freeze the navigation contract in tests

**Files:**
- Modify: `frontend/services/menstrual/__tests__/module-shell-service.test.mjs`
- Modify: `frontend/__tests__/module-management-layout-contract.test.mjs`
- Create: `frontend/__tests__/sharing-entry-contract.test.mjs`

**Step 1: Write the failing tests**

- Assert module-management secondary action becomes `open-join` instead of `share` / `revoke`.
- Assert join-page URL generation preserves `token` and `apiBaseUrl`, and only includes `openid` when explicitly provided as a debug override.
- Assert management-page source uses token generation + clipboard/share artifact creation instead of `uni.navigateTo`.
- Assert menstrual-home share payload targets the recipient join page without embedding the owner `openid`.
- Assert module tile only renders the green dot when `ownershipTone === 'shared'`.

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/services/menstrual/__tests__/module-shell-service.test.mjs
node --test frontend/__tests__/module-management-layout-contract.test.mjs
node --test frontend/__tests__/sharing-entry-contract.test.mjs
```

Expected: failures showing missing `createJoinPageUrl`, still-present demo share toggle, visible private-state dot, and `open-type="share"` in the home page.

### Task 2: Implement one shared recipient invite path

**Files:**
- Modify: `frontend/services/menstrual/module-shell-service.js`
- Modify: `frontend/components/management/ModuleManagementPage.vue`
- Modify: `frontend/pages/menstrual/home.vue`

**Step 1: Add minimal implementation**

- Export `createJoinPageUrl` from `module-shell-service.js` and keep owner `openid` out of the default recipient path.
- Change module-management secondary action metadata to `open-join`.
- In `ModuleManagementPage.vue`, remove the fake share toggle path and generate an invite token before exposing a shareable invite link.
- In `pages/menstrual/home.vue`, make native share payloads target the same recipient join path without carrying the owner identity.

**Step 2: Keep implementation minimal**

- Do not add share-management state machines.
- Do not add new permission logic.
- Do not change backend contracts.

### Task 3: Make the shared dot reflect real shared state only

**Files:**
- Modify: `frontend/components/management/ModuleTileCompact.vue`

**Step 1: Implement the minimal UI rule**

- Add a computed gate so the status dot renders only when `ownershipTone === 'shared'`.
- Keep the selected-card styling and existing shared green token unchanged.

**Step 2: Avoid regressions**

- Do not reintroduce `私人` text badges into module tiles.
- Do not add alternate fake private dot styling.

### Task 4: Update durable docs and verify

**Files:**
- Modify: `docs/design/management/function-module-management-page.md`
- Modify: `docs/design/management/frontend-module-management-page.md`

**Step 1: Update docs**

- Clarify that module-management `共享` generates a shareable invite artifact for the same recipient join flow instead of navigating the owner into the acceptance page.
- Clarify that the green module-tile dot is shown only after real shared state is established.

**Step 2: Run verification**

Run:

```bash
node --test frontend/services/menstrual/__tests__/module-shell-service.test.mjs
node --test frontend/__tests__/module-management-layout-contract.test.mjs
node --test frontend/__tests__/sharing-entry-contract.test.mjs
```

Expected: PASS
