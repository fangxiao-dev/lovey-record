# 首页双 Tab 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为小程序添加原生底部 tabBar，首页变为消息面板（工作台首页），原管理页保留为第二个 Tab。

**Architecture:** 在 `pages.json` 配置 uni-app 原生 `tabBar`（两个 tab），新建 `pages/dashboard/index.vue` 作为首页，复用现有 `loadMenstrualModuleShellPageModel` 服务获取数据，不新增后端接口。

**Tech Stack:** uni-app (Vue 2 Options API)，WeChat 小程序 + H5，SCSS tokens

> **注意：** 前端没有配置测试框架，所有验证步骤为 H5 手动验证（`npm run dev:h5`）。

---

## 文件变更范围

| 文件 | 操作 | 职责 |
|------|------|------|
| `frontend/pages.json` | 修改 | 添加 dashboard 路由 + tabBar 配置 |
| `frontend/pages/dashboard/index.vue` | 新建 | 工作台首页：模块卡片 + 状态摘要 + 管理快捷入口 |

---

## Task 1：配置 tabBar（pages.json）

**Files:**
- Modify: `frontend/pages.json`

- [ ] **Step 1：更新 pages.json**

将 `frontend/pages.json` 替换为以下内容（保留现有非 tabBar 页面，在首位插入 dashboard，添加 tabBar 块）：

```json
{
  "pages": [
    {
      "path": "pages/dashboard/index",
      "style": {
        "navigationBarTitleText": "工作台首页"
      }
    },
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "记录空间"
      }
    },
    {
      "path": "pages/menstrual/date-cell-showcase",
      "style": {
        "navigationBarTitleText": "DateCell Showcase"
      }
    },
    {
      "path": "pages/menstrual/home",
      "style": {
        "navigationBarTitleText": "月经记录"
      }
    },
    {
      "path": "pages/menstrual/calendar-grid-showcase",
      "style": {
        "navigationBarTitleText": "CalendarGrid Showcase"
      }
    },
    {
      "path": "pages/menstrual/selected-date-panel-showcase",
      "style": {
        "navigationBarTitleText": "SelectedDatePanel Showcase"
      }
    }
  ],
  "tabBar": {
    "color": "#a29488",
    "selectedColor": "#c9786a",
    "backgroundColor": "#faf7f2",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/dashboard/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/index/index",
        "text": "模块管理"
      }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "记录空间",
    "navigationBarBackgroundColor": "#FAF7F2",
    "backgroundColor": "#FAF7F2"
  },
  "uniIdRouter": {}
}
```

- [ ] **Step 2：创建 dashboard 目录占位文件**

创建空文件 `frontend/pages/dashboard/index.vue`，内容如下（最小占位，防止编译报路径未找到错误）：

```vue
<template>
  <view><text>dashboard placeholder</text></view>
</template>
<script>
export default { name: 'DashboardPage' };
</script>
```

- [ ] **Step 3：H5 验证 tabBar 出现**

在 `frontend/` 目录下运行：
```bash
npm run dev:h5
```

打开浏览器，确认：
- 底部出现两个 tab："首页" 和 "模块管理"
- 默认落在"首页"（显示 placeholder 文字）
- 点击"模块管理"tab 能跳到原管理页（私有区域 / 共享区域 / 设置面板 正常显示）
- 点击"首页"tab 能返回

- [ ] **Step 4：Commit**

```bash
git add frontend/pages.json frontend/pages/dashboard/index.vue
git commit -m "feat(nav): add tabBar with dashboard and module-management tabs"
```

---

## Task 2：实现工作台首页（dashboard/index.vue）

**Files:**
- Modify: `frontend/pages/dashboard/index.vue`

- [ ] **Step 1：写入完整页面代码**

用以下内容替换 `frontend/pages/dashboard/index.vue`：

```vue
<template>
	<view class="dashboard u-page-shell">
		<!-- 管理快捷入口 -->
		<view class="dashboard__top-row u-page-section">
			<view
				class="dashboard__manage-shortcut"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="goToManagement"
			>
				<text class="dashboard__manage-label u-text-caption">模块管理 ›</text>
			</view>
		</view>

		<!-- 加载中 -->
		<view v-if="modules === null && !loadError" class="dashboard__state-card ui-card u-page-section">
			<text class="dashboard__state-text u-text-body-secondary">正在加载...</text>
		</view>

		<!-- 加载失败 -->
		<view v-if="loadError" class="dashboard__state-card ui-card u-page-section">
			<text class="dashboard__state-text u-text-body-secondary">{{ loadError }}</text>
			<view
				class="dashboard__retry ui-button ui-button--secondary"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="retryLoad"
			>
				<text class="ui-button__text">重试</text>
			</view>
		</view>

		<!-- 模块卡片列表 -->
		<view v-if="modules !== null && modules.length" class="dashboard__modules u-page-section">
			<navigator
				v-for="mod in modules"
				:key="mod.id"
				class="module-card ui-card"
				:url="mod.entryUrl"
			>
				<view class="module-card__body">
					<view class="module-card__icon">
						<text class="module-card__icon-text">经</text>
					</view>
					<view class="module-card__meta">
						<view class="module-card__title-row">
							<text class="module-card__name u-text-body">{{ mod.moduleName }}</text>
							<text class="module-card__badge ui-badge__text">{{ mod.badgeText }}</text>
						</view>
						<text class="module-card__status u-text-caption">{{ mod.statusText }}</text>
					</view>
				</view>
				<view v-if="mod.participants.length" class="module-card__participants">
					<view
						v-for="p in mod.participants"
						:key="p.userId"
						class="participant-avatar"
					>
						<text class="participant-avatar__initial">{{ p.initial }}</text>
					</view>
				</view>
			</navigator>
		</view>

		<!-- 空状态 -->
		<view
			v-if="modules !== null && !modules.length && !loadError"
			class="dashboard__state-card ui-card u-page-section"
		>
			<text class="dashboard__state-text u-text-body-secondary">暂无模块，前往模块管理添加。</text>
			<view
				class="dashboard__manage-btn ui-button ui-button--secondary"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="goToManagement"
			>
				<text class="ui-button__text">前往模块管理</text>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		DEFAULT_MODULE_SHELL_CONTEXT,
		loadMenstrualModuleShellPageModel,
		resolveModuleContext
	} from '../../services/menstrual/module-shell-service.js';

	export default {
		name: 'DashboardPage',
		data() {
			return {
				modules: null,
				loadError: '',
				context: { ...DEFAULT_MODULE_SHELL_CONTEXT }
			};
		},
		async onLoad(options) {
			const openid = options.openid || DEFAULT_MODULE_SHELL_CONTEXT.openid;
			this.context = {
				...DEFAULT_MODULE_SHELL_CONTEXT,
				apiBaseUrl: options.apiBaseUrl || DEFAULT_MODULE_SHELL_CONTEXT.apiBaseUrl,
				openid,
				moduleInstanceId: options.moduleInstanceId || DEFAULT_MODULE_SHELL_CONTEXT.moduleInstanceId,
				profileId: options.profileId || DEFAULT_MODULE_SHELL_CONTEXT.profileId,
				partnerUserId: options.partnerUserId || DEFAULT_MODULE_SHELL_CONTEXT.partnerUserId,
				today: options.today || DEFAULT_MODULE_SHELL_CONTEXT.today
			};

			if (!options.moduleInstanceId) {
				try {
					const resolved = await resolveModuleContext(openid);
					this.context = {
						...this.context,
						moduleInstanceId: resolved.moduleInstanceId,
						profileId: resolved.profileId
					};
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '获取模块信息失败';
					return;
				}
			}

			await this.retryLoad();
		},
		onShow() {
			// 从其他 tab 返回时刷新（modules !== null 说明初始加载已完成）
			if (this.modules !== null) {
				this.retryLoad();
			}
		},
		methods: {
			async retryLoad() {
				this.loadError = '';
				try {
					const result = await loadMenstrualModuleShellPageModel(this.context);
					const allModules = [
						...result.page.privateZone.modules,
						...result.page.sharedZone.modules
					];
					const activePartners = result.raw.accessState.activePartners || [];
					this.modules = allModules.map(mod => ({
						...mod,
						participants: activePartners.map(p => ({
							userId: p.userId,
							initial: (p.userId || '?').charAt(0).toUpperCase()
						}))
					}));
				} catch (error) {
					this.modules = [];
					this.loadError = error instanceof Error ? error.message : '加载失败';
				}
			},
			goToManagement() {
				uni.switchTab({ url: '/pages/index/index' });
			}
		}
	};
</script>

<style lang="scss">
	.dashboard {
		padding-bottom: $space-12;
	}

	.dashboard__top-row {
		display: flex;
		justify-content: flex-end;
		padding-top: $space-4;
	}

	.dashboard__manage-shortcut {
		padding: $space-2 $space-4;
		border-radius: $radius-pill;
		background: $bg-subtle;
	}

	.dashboard__manage-label {
		color: $text-secondary;
	}

	.dashboard__modules {
		display: flex;
		flex-direction: column;
		gap: $space-4;
	}

	.dashboard__state-card {
		display: flex;
		flex-direction: column;
		gap: $space-4;
	}

	.dashboard__state-text {
		color: $text-muted;
	}

	.dashboard__retry,
	.dashboard__manage-btn {
		align-self: flex-start;
	}

	/* 模块卡片 */
	.module-card {
		display: flex;
		flex-direction: column;
		gap: $space-4;
	}

	.module-card__body {
		display: flex;
		align-items: center;
		gap: $space-4;
	}

	.module-card__icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: $radius-field;
		background: $accent-period-soft;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.module-card__icon-text {
		font-size: $font-size-body-lg;
		font-weight: $font-weight-title;
		color: $accent-period;
	}

	.module-card__meta {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $space-1;
	}

	.module-card__title-row {
		display: flex;
		align-items: center;
		gap: $space-3;
	}

	.module-card__name {
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}

	.module-card__badge {
		padding: 4rpx 12rpx;
		border-radius: $radius-pill;
		background: $bg-subtle;
		color: $text-secondary;
	}

	.module-card__status {
		color: $text-muted;
	}

	/* 参与者头像 */
	.module-card__participants {
		display: flex;
		justify-content: flex-end;
		gap: $space-2;
	}

	.participant-avatar {
		width: 48rpx;
		height: 48rpx;
		border-radius: $radius-pill;
		background: $support-calm;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.participant-avatar__initial {
		font-size: $font-size-caption;
		font-weight: $font-weight-title;
		color: $text-inverse;
	}
</style>
```

- [ ] **Step 2：H5 验证首页内容**

```bash
npm run dev:h5
```

验证以下场景：

**加载成功：**
- 首页显示至少一张模块卡片（月经记录）
- 卡片包含：图标（"经"）、模块名、badge（私人/共享）、状态文字
- 右上角有"模块管理 ›"文字按钮
- 点击卡片跳转到月经记录页

**参与者头像（需要共享状态）：**
- 若模块处于共享状态，卡片底部右侧出现绿色字母头像

**"模块管理 ›"快捷入口：**
- 点击"模块管理 ›"，切换到第二个 tab（模块管理页）

**Tab 切换：**
- 切换到模块管理再切回首页，数据刷新（`onShow` 触发 `retryLoad`）

**错误场景：**
- 若联调后端未启动，首页显示错误文字 + "重试"按钮

- [ ] **Step 3：Commit**

```bash
git add frontend/pages/dashboard/index.vue
git commit -m "feat(dashboard): add home tab with module cards and participant avatars"
```

---

## 自检清单（实现完成后确认）

- [ ] 底部 tabBar 正常渲染，"首页" 为默认落点
- [ ] 从"模块管理"切换回"首页"，数据自动刷新
- [ ] "模块管理 ›"能跳转到第二个 tab
- [ ] 原管理页（`pages/index/index.vue`）功能无任何变化
