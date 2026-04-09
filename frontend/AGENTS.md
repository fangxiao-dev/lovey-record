# Frontend AGENTS

## Purpose
- Scope: `frontend/` only
- Runtime: uni-app Vue 3, WeChat Mini Program first, H5 aware where practical
- Goal: build the active menstrual-module MVP frontend on top of the approved token, component, and page contracts

## Read First
1. Read [../project-context.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/project-context.md).
2. Read the latest relevant plan under [../docs/plans](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans).
3. Read the relevant long-lived contract under [../docs/contracts](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts) when the task affects product rules or frontend-backend boundaries.
4. Read [../docs/design/2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-23-ui-visual-language-guide.md) before changing visual tone, component styling, or semantic color usage.
5. Read [../docs/design/2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-22-tokenize-collaboration-rule.md) before changing tokens, component-library visuals, or page composition.
6. Read [../docs/design/pencil/README.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/README.md) before editing `.pen` files or using Pencil MCP tools.
7. When a task is already approved to skip a fresh Pencil pass and go from structure sketch directly into coded prototype, read [../docs/design/frontend-prototype-harness.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/frontend-prototype-harness.md) and follow it as the execution harness.

## Frontend Boundaries
- Treat `frontend/` as a uni-app app, not a standard Vue Router SPA.
- Use uni-app navigation, components, and APIs where applicable.
- Register every new page in [pages.json](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/pages.json).
- Avoid browser-only APIs and direct DOM access unless clearly limited to H5.
- Prefer reusable shared components over page-local duplication.
- Keep the one-way visual pipeline:
  1. token definitions
  2. shared components
  3. page composition
- Do not copy legacy WXML/WXSS/page glue directly into uni-app files.

## Styling Structure
- [uni.scss](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/uni.scss) bridges project tokens into uni compatibility variables.
- [styles/tokens/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/styles/tokens) defines primitive and semantic tokens.
- [styles/foundation/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/styles/foundation) defines base, mixin, pattern, and utility layers.
- Prefer semantic tokens over hard-coded values.
- Prefer `rpx` for page-level mobile UI when it fits uni-app conventions.
- Do not hardcode raw board dimensions from Pencil nodes into runtime code. Canvas sizes such as `45x45` are visual calibration references unless a contract explicitly promotes them into frontend tokens or layout rules.
- When a Pencil board defines geometry rhythm, preserve the semantic relationship in code through tokens, responsive constraints, and state styling instead of copying the board pixel box verbatim.

## Skill Guidance
- When designing or implementing frontend components, pages, or visual states, actively use the `frontend-design` skill to keep the output intentional and non-generic.
- Use `frontend-design` together with the approved design contracts; the skill should sharpen execution, not override the repo's token-first design pipeline.

## Implementation Expectations
- Prefer uni-app-compatible Vue 3 SFCs.
- Keep presentational components as dumb as practical.
- Separate business logic, mock state, and pure UI where practical.
- Component state surfaces should map through props or small pure helpers instead of page-local style forks.
- Repeated UI patterns should be extracted or intentionally prepared for extraction.

## Environment Routing — Verify Before Every Release

`frontend/services/cloud-request.js` 的路由逻辑由 `wx.getAccountInfoSync().miniProgram.envVersion` 决定，**每次改动 cloud-request.js 或 config/api.js 后必须对照此表验证**：

| 场景 | NODE_ENV | envVersion | useCloudApi | url 构造 | 期望结果 |
|------|----------|------------|-------------|---------|---------|
| WeChat DevTools 运行/联调 | development | develop | false | `localhost:3004/api/...` | ✓ 本地 |
| WeChat DevTools 上传/构建 | production | develop | false | `localhost:3004/api/...` | ✓ 不再用 prod URL |
| 线上正式版 | production | release | true | `callContainer` path | ✓ 云端 |
| H5 / Playwright | development | wx throws | false | `localhost:3004/api/...` | ✓ 本地 |

**关键约束**：
- `callUniRequest` 永远用 `DEV_API_BASE_URL`（localhost），不依赖 `NODE_ENV`
- `callCloudContainer` 不构造完整 URL，只传 `path`，微信网关注入真实 openid
- `envVersion` 是判断依据，`NODE_ENV` 只用于 `API_BASE_URL` 的选择（仅影响非本地 dev 路径）
- `callContainer` timeout 最大 15 秒；若云服务冷启动超时，需在控制台将实例副本数最小值设为 1

## Verification Expectations
- Verify every new frontend page is registered in [pages.json](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/pages.json).
- Verify shared frontend code does not rely on obvious browser-only APIs.
- State what was verified and what remains unverified.
- Treat manual runtime verification as required for navigation, layout, and platform-specific behavior.
- For H5 browser validation or Playwright live regression, use [../docs/checklists/frontend-h5-live-regression.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/checklists/frontend-h5-live-regression.md) as the authoritative command and port reference.
- Call out H5 versus WeChat Mini Program caveats explicitly when still unverified.
- For Pencil-derived UI work, read [../docs/design/2026-03-28-ui-collaboration-lessons.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-28-ui-collaboration-lessons.md) and use the named Pencil node as the source of truth before touching code.
- For Pencil-driven pages, verify that the current runtime page is still the correct acceptance surface before changing code. If the latest named Pencil nodes imply a different page structure or demo baseline, re-read those nodes first and treat the old runtime output as stale until revalidated.
- When writing closing statements for frontend work, follow the root `AGENTS.md` rule: `Current mainline progress` must stay at the higher-level delivery-line stage, while `Next-step recommendation` should carry the next concrete frontend action.
