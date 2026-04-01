# 调试记录：WeChat Cloud Run + 本地联调问题链 (2026-04-01)

## 背景

本次调试从 **MODULE_ACCESS_DENIED** 出发，涉及环境路由、冷启动、数据库连接等多个层面，以下按问题出现顺序记录。

---

## 问题一：MODULE_ACCESS_DENIED（初始）

**现象**：体验版小程序进入首页后报 MODULE_ACCESS_DENIED。

**根因**：前端 `index.vue` 在 `onLoad` 里用 hardcode 的 `seed-home-module` 作为 fallback moduleInstanceId，这个 ID 只在本地 seed 数据里存在，云端数据库没有对应记录，后端鉴权失败。

**修复**：
- 后端新增 `GET /api/queries/getMyModuleInstance` 接口（`getOrCreateModuleInstance`），根据 openid 自动 get-or-create 用户的 moduleInstance。
- 前端 `index.vue` onLoad 中调用 `resolveModuleContext(openid)` 获取真实 moduleInstanceId 和 profileId，不再依赖 hardcode fallback。

**相关文件**：
- `backend/src/services/moduleInstance.service.ts` — `getOrCreateModuleInstance`
- `backend/src/controllers/moduleInstance.controller.ts` — `getMyModuleInstanceHandler`
- `backend/src/routes/queries.ts` — 路由注册
- `frontend/services/menstrual/module-shell-service.js` — `resolveModuleContext`
- `frontend/pages/index/index.vue` — onLoad 恢复初始化流程

---

## 问题二：环境检测逻辑混乱 → 双重 `/api/api/` URL

**现象**：上传到开发者工具后出现 `GET http://localhost:3004/api/api/queries/getMyModuleInstance 404`（路径里有两个 `/api`）。

**根因**：两套环境检测机制相互干扰：
1. `config/api.js` 用 `NODE_ENV` 决定 `API_BASE_URL`（development → localhost:3004/api）
2. `cloud-request.js` 用 `wx.getAccountInfoSync().envVersion` 决定走哪条路

用户用 HBuilderX「运行」再「上传」的构建，`NODE_ENV` 始终是 `development`，所以即使是上传到微信，`API_BASE_URL` 也是 `localhost:3004/api`。路径拼接时 `/api` + `/api/queries/...` = 双重前缀。

**修复**：
- `callUniRequest` 永远使用 `DEV_API_BASE_URL`（`http://localhost:3004`，不带 `/api`），与 `NODE_ENV` 无关。
- path 参数统一以 `/api/...` 开头，只拼一次。
- 最终规则：**envVersion 决定走哪条路，DEV_API_BASE_URL 永远是 localhost:3004**。

**关键约束总结**（已写入 `frontend/AGENTS.md`）：

| 场景 | envVersion | useCloudApi | URL 构造 |
|------|------------|-------------|---------|
| WeChat DevTools 联调 | develop | false | `localhost:3004/api/...` |
| WeChat DevTools 上传构建 | develop | false | `localhost:3004/api/...` |
| 线上正式版 | release | true | callContainer path |
| 体验版 | trial | true | callContainer path |
| H5 / Playwright | wx throws | false | `localhost:3004/api/...` |

**相关文件**：
- `frontend/services/cloud-request.js`
- `frontend/config/api.js`
- `frontend/AGENTS.md` — 环境路由验证表

---

## 问题三：cloud.callContainer:fail errCode 102002（冷启动超时）

**现象**：体验版调用 callContainer 报 `errCode 102002`，超时失败。

**根因**：WeChat Cloud Run 容器闲置 30 分钟后缩容到 0，冷启动需要拉起容器 + 启动 Node + Prisma 连接数据库，总时间超过 callContainer 最大超时 15 秒。

**修复**：在微信云开发控制台将该服务的**最小实例数设为 1**，保持常驻，消除冷启动延迟。

---

## 问题四：Can't reach database server（间歇性）

**现象**：日志偶发 `Can't reach database server at 10.8.108.220:3306`。

**根因排查**：
- MySQL 服务正常运行（进程存在，端口监听）
- max_connections = 8500，Threads_connected = 3，连接数正常
- 推断为 CynosDB Serverless 在容器重启期间短暂不可达，或旧容器残留连接超时

**结论**：不是持续性故障，冷启动问题（问题三）解决后连接恢复正常。Prisma 连接池 connection_limit=2 配置合理。

---

## 问题五：本地 404（getMyModuleInstance 接口不生效）

**现象**：后端新增接口后本地 `GET /api/queries/getMyModuleInstance` 返回 404。

**根因**：`npm run dev` 使用 ts-node 直接运行，**没有 nodemon 热重载**，修改 TypeScript 文件后需要手动重启后端服务才能加载新路由。

**操作**：Ctrl+C 停止，重新 `npm run dev`。

---

## 问题六：体验版仍是旧代码（MODULE_ACCESS_DENIED 复现）

**现象**：以上后端修复通过 git push 自动 CI/CD 部署，但体验版小程序仍报 MODULE_ACCESS_DENIED。

**根因**：**微信小程序前端不走 CI/CD**。体验版对应的是上次手动上传的版本，不包含 resolveModuleContext 等修复。

**操作**：
1. HBuilderX → 运行 → 微信开发者工具（重新编译）
2. 微信开发者工具 → 上传新版本
3. 微信公众平台 → 版本管理 → 设为体验版

---

## 经验总结

1. **NODE_ENV 不可信用于小程序环境检测**：HBuilderX 「运行→上传」流程中 NODE_ENV 始终是 development，即使代码已到生产环境。唯一可信的是 `wx.getAccountInfoSync().miniProgram.envVersion`。

2. **callUniRequest 永远走本地**：不要用 NODE_ENV 或任何条件来切换 callUniRequest 的 base URL，它只服务于本地联调。

3. **小程序前端需手动上传**：后端改了推了不够，小程序客户端每次都要重新上传版本并切换体验版。

4. **Cloud Run 冷启动**：开发/测试阶段建议最小实例数=1，避免 15s 超时干扰调试。

5. **本地 ts-node 无热重载**：改了后端路由必须手动重启。
