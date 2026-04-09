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
		<view v-if="isLoading" class="dashboard__state-card ui-card u-page-section">
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
				isLoading: false,
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
				this.isLoading = true;
				this.loadError = '';
				try {
					const result = await loadMenstrualModuleShellPageModel(this.context);
					const allModules = [
						...result.page.privateZone.modules,
						...result.page.sharedZone.modules
					];
					// NOTE: activePartners is global (one module instance per user). If multiple module types
					// are added in the future, each module's participants should be sourced per-module.
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
				} finally {
					this.isLoading = false;
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
		font-weight: $font-weight-title;
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
