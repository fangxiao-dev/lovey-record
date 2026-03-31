# 微信小程序平台兼容性问题

记录在微信小程序运行环境下发现的平台限制与修复方式，供后续开发参考。

---

## 1. `URLSearchParams` 不可用

**发现时间：** 2026-03-30
**影响文件：** `frontend/services/menstrual/module-shell-service.js`

### 现象

`createMenstrualHomeEntryUrl()` 使用 `new URLSearchParams({...})` 构建导航 URL，运行时报：

```
URLSearchParams is not defined
```

### 原因

`URLSearchParams` 是浏览器 Web API，微信小程序 JS 引擎（基于 V8/JSCore）不提供该全局对象。

### 修复

用手动字符串拼接替代：

```js
// ❌ 不可用
const query = new URLSearchParams({ apiBaseUrl, openid, ... });
return `/pages/menstrual/home?${query.toString()}`;

// ✅ 替代方案
const query = 'apiBaseUrl=' + encodeURIComponent(resolved.apiBaseUrl || '')
    + '&openid=' + encodeURIComponent(resolved.openid || '')
    + '&moduleInstanceId=' + encodeURIComponent(resolved.moduleInstanceId || '')
    + '&profileId=' + encodeURIComponent(resolved.profileId || '')
    + '&today=' + encodeURIComponent(resolved.today || '');
return `/pages/menstrual/home?${query}`;
```

---

## 2. `Object.entries` 被编译为缺失的 Babel helper

**发现时间：** 2026-03-30
**影响文件：** `frontend/services/menstrual/module-shell-service.js`

### 现象

HBuilderX 将 `Object.entries(...)` 编译为：

```js
require('../../@babel/runtime/helpers/Objectentries')
```

该模块不存在于小程序包中，运行时报：

```
module '@babel/runtime/helpers/Objectentries.js' is not defined
```

### 原因

Babel 的 `@babel/plugin-transform-object-entries`（或类似插件）将 `Object.entries` 替换为 helper 引用，但该 helper 未被打包进 vendor bundle。

### 修复

避免使用 `Object.entries`，改用上方手动拼接方案（与 Bug 1 同一修复）。

> **规则：** 在小程序源码中避免使用 `Object.entries`、`Object.fromEntries`、`Array.from` 等可能触发 Babel helper 注入的方法，优先使用 for 循环或手动展开。

---

## 3. `onLoad` 收到的 URL 参数不会自动解码

**发现时间：** 2026-03-30
**影响文件：** `frontend/pages/menstrual/home.vue`

### 现象

从 `<navigator url="/pages/menstrual/home?apiBaseUrl=http%3A%2F%2Flocalhost%3A3000%2Fapi&...">` 导航后，`onLoad(options)` 中收到的 `options.apiBaseUrl` 仍是编码形式 `http%3A%2F%2Flocalhost%3A3000%2Fapi`，请求时报：

```
request:fail invalid url "http%3A%2F%2Flocalhost%3A3000%2Fapi/queries/..."
```

### 原因

微信小程序的页面路由**不会自动对 query 参数执行 `decodeURIComponent`**，`onLoad(options)` 收到的是原始字符串。

### 修复

在 `onLoad` 中手动解码所有参数：

```js
onLoad(options) {
    const d = v => v ? decodeURIComponent(v) : v;
    this.contractContext = {
        ...DEFAULT_MENSTRUAL_HOME_CONTEXT,
        apiBaseUrl:       d(options.apiBaseUrl)       || DEFAULT_MENSTRUAL_HOME_CONTEXT.apiBaseUrl,
        openid:           d(options.openid)           || DEFAULT_MENSTRUAL_HOME_CONTEXT.openid,
        moduleInstanceId: d(options.moduleInstanceId) || DEFAULT_MENSTRUAL_HOME_CONTEXT.moduleInstanceId,
        profileId:        d(options.profileId)        || DEFAULT_MENSTRUAL_HOME_CONTEXT.profileId,
        today:            d(options.today)            || DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
    };
    this.retryInitialLoad();
},
```

> **规则：** 任何通过 URL 传参导航的页面，`onLoad` 中必须对参数手动 `decodeURIComponent`。`decodeURIComponent` 对无百分号编码的字符串是安全的 no-op。

---

## 修复状态

| Bug | 源文件已修复 | dist 已修复 | 生产分支已合并 |
|-----|------------|------------|--------------|
| URLSearchParams | ✅ | ✅ | ❌ 待合并 |
| Object.entries Babel helper | ✅ | ✅ | ❌ 待合并 |
| onLoad URL 参数未解码 | ✅ | ✅ | ❌ 待合并 |
