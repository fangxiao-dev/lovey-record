<template>
	<view class="module-space u-page-shell">
		<view v-if="page" class="hero-card ui-card u-page-section">
			<view class="hero-header ui-card__header">
				<view>
					<text class="hero-title u-text-title-lg">{{ page.hero.title }}</text>
					<text class="hero-subtitle u-text-body-secondary">{{ page.hero.subtitle }}</text>
				</view>
				<view class="status-tag ui-badge">
					<text class="status-tag__text ui-badge__text">{{ page.hero.statusTag }}</text>
				</view>
			</view>
			<text class="hero-copy u-text-body-secondary">模块壳当前只做真实读状态和进入入口，share/settings 改动会在后续切片接入。</text>
		</view>

		<view v-if="page" class="zone-board ui-page-container u-page-section">
			<view class="zone-card ui-card">
				<view class="zone-card__header ui-card__header">
					<text class="zone-card__title u-text-title-sm">{{ page.privateZone.title }}</text>
					<text class="zone-card__caption u-text-caption">{{ page.privateZone.caption }}</text>
				</view>
				<view class="zone-card__body" :class="{ 'zone-card__body--empty': !page.privateZone.modules.length }">
					<navigator
						v-for="module in page.privateZone.modules"
						:key="module.id"
						class="module-tile ui-list-item is-private"
						:url="module.entryUrl"
					>
						<view class="module-tile__icon" :class="{ 'module-tile__icon--shared': module.zoneTone === 'shared' }">
							<text class="module-tile__icon-text">经</text>
						</view>
						<view class="module-tile__meta">
							<view class="module-tile__title-row">
								<text class="module-tile__title u-text-body">{{ module.moduleName }}</text>
								<text class="module-tile__badge ui-badge__text">{{ module.badgeText }}</text>
							</view>
							<text class="module-tile__hint u-text-caption">{{ module.statusText }}</text>
							<text class="module-tile__detail u-text-caption">{{ module.durationText }}</text>
						</view>
					</navigator>
					<text v-if="!page.privateZone.modules.length" class="zone-card__empty u-text-caption">{{ page.privateZone.emptyText }}</text>
				</view>
			</view>

			<view class="zone-card ui-card">
				<view class="zone-card__header ui-card__header">
					<text class="zone-card__title u-text-title-sm">{{ page.sharedZone.title }}</text>
					<text class="zone-card__caption u-text-caption">{{ page.sharedZone.caption }}</text>
				</view>
				<view class="zone-card__body" :class="{ 'zone-card__body--empty': !page.sharedZone.modules.length }">
					<navigator
						v-for="module in page.sharedZone.modules"
						:key="module.id"
						class="module-tile ui-list-item is-shared"
						:url="module.entryUrl"
					>
						<view class="module-tile__icon" :class="{ 'module-tile__icon--shared': module.zoneTone === 'shared' }">
							<text class="module-tile__icon-text">经</text>
						</view>
						<view class="module-tile__meta">
							<view class="module-tile__title-row">
								<text class="module-tile__title u-text-body">{{ module.moduleName }}</text>
								<text class="module-tile__badge ui-badge__text">{{ module.badgeText }}</text>
							</view>
							<text class="module-tile__hint u-text-caption">{{ module.statusText }}</text>
							<text class="module-tile__detail u-text-caption">{{ module.durationText }}</text>
						</view>
					</navigator>
					<text v-if="!page.sharedZone.modules.length" class="zone-card__empty u-text-caption">{{ page.sharedZone.emptyText }}</text>
				</view>
			</view>
		</view>

		<view v-if="page" class="info-panel ui-card u-page-section">
			<view class="info-panel__header ui-card__header">
				<text class="info-panel__title u-text-title-sm">{{ page.summaryCard.title }}</text>
				<text class="info-panel__state ui-badge__text">{{ page.summaryCard.sharingStatus.value }}</text>
			</view>
			<text class="info-panel__summary u-text-body-secondary">{{ page.summaryCard.description }}</text>
			<view class="summary-grid">
				<view class="summary-item">
					<text class="summary-item__label u-text-caption">{{ page.summaryCard.sharingStatus.label }}</text>
					<text class="summary-item__value u-text-body">{{ page.summaryCard.sharingStatus.value }}</text>
				</view>
				<view class="summary-item">
					<text class="summary-item__label u-text-caption">{{ page.summaryCard.activePartners.label }}</text>
					<text class="summary-item__value u-text-body">{{ page.summaryCard.activePartners.value }}</text>
				</view>
				<view class="summary-item">
					<text class="summary-item__label u-text-caption">{{ page.summaryCard.defaultPeriodDuration.label }}</text>
					<text class="summary-item__value u-text-body">{{ page.summaryCard.defaultPeriodDuration.value }}</text>
				</view>
			</view>
			<view class="settings-strip">
				<text class="settings-strip__label u-text-caption">{{ page.summaryCard.settingsControl.label }}</text>
				<view class="settings-strip__options">
					<view
						v-for="option in page.summaryCard.settingsControl.options"
						:key="option.value"
						class="settings-chip"
						:class="{ 'settings-chip--selected': option.selected }"
						@tap="handleSettingsOptionSelect(option.value)"
					>
						<text class="settings-chip__text" :class="{ 'settings-chip__text--selected': option.selected }">
							{{ option.label }}
						</text>
					</view>
				</view>
			</view>
			<view class="summary-actions">
				<view class="summary-action ui-button ui-button--secondary" @tap="handleShareAction">
					<text class="summary-action__text ui-button__text">
						{{ isMutating ? '处理中...' : page.summaryCard.shareAction.label }}
					</text>
				</view>
				<text class="summary-action__hint u-text-caption">{{ page.summaryCard.shareAction.helperText }}</text>
			</view>
			<navigator class="showcase-entry ui-button ui-button--primary" :url="page.primaryEntry.url">
				<text class="showcase-entry__text ui-button__text info-action__text--primary">{{ page.primaryEntry.label }}</text>
			</navigator>
		</view>

		<view v-else class="shell-state-card ui-card u-page-section">
			<text class="shell-state-card__title u-text-title-sm">{{ loadError ? '联调加载失败' : '正在连接记录空间' }}</text>
			<text class="shell-state-card__copy u-text-body-secondary">
				{{ loadError || '正在读取模块访问状态和模块设置。' }}
			</text>
			<view v-if="loadError" class="shell-state-card__action ui-button ui-button--primary" @tap="retryInitialLoad">
				<text class="ui-button__text info-action__text--primary">重新加载</text>
			</view>
		</view>

		<view v-if="isDev" class="dev-toolbar u-page-section">
			<view
				class="dev-reset-btn"
				:class="{ 'dev-reset-btn--busy': isResetting }"
				@tap="handleDevReset"
			>
				<text class="dev-reset-btn__text">{{ isResetting ? '重置中…' : devResetLabel }}</text>
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
	import {
		persistModuleSettings,
		persistModuleSharingState
	} from '../../services/menstrual/module-shell-command-service.js';

	export default {
		name: 'ModuleSpacePage',
		data() {
			return {
				page: null,
				loadError: '',
				isMutating: false,
				isResetting: false,
				devResetLabel: '🛠 Reset to seed',
				isDev: process.env.NODE_ENV !== 'production',
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

			this.retryInitialLoad();
		},
		methods: {
			async retryInitialLoad() {
				this.loadError = '';
				try {
					const result = await loadMenstrualModuleShellPageModel(this.context);
					this.page = result.page;
				} catch (error) {
					this.page = null;
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
				}
			},
			async handleShareAction() {
				if (this.isMutating || !this.page?.summaryCard?.shareAction) return;
				this.isMutating = true;
				this.loadError = '';
				try {
					await persistModuleSharingState({
						context: this.context,
						action: this.page.summaryCard.shareAction.action
					});
					await this.retryInitialLoad();
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '共享状态更新失败';
				} finally {
					this.isMutating = false;
				}
			},
			async handleDevReset() {
				if (this.isResetting) return;
				this.isResetting = true;
				this.devResetLabel = '🛠 Reset to seed';
				try {
					await new Promise((resolve, reject) => {
						uni.request({
							url: this.context.apiBaseUrl + '/dev/reset',
							method: 'POST',
							success: res => res.data?.ok ? resolve() : reject(new Error('reset failed')),
							fail: reject
						});
					});
					this.devResetLabel = '✓ Done';
					await this.retryInitialLoad();
				} catch {
					this.devResetLabel = '✗ Failed';
				} finally {
					this.isResetting = false;
				}
			},
			async handleSettingsOptionSelect(days) {
				if (this.isMutating || !days || days === this.page?.summaryCard?.settingsControl?.value) return;
				this.isMutating = true;
				this.loadError = '';
				try {
					await persistModuleSettings({
						context: this.context,
						defaultPeriodDurationDays: days
					});
					await this.retryInitialLoad();
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '模块设置更新失败';
				} finally {
					this.isMutating = false;
				}
			}
		}
	}
</script>

<style lang="scss">
	.module-space {
		padding-bottom: $space-12;
	}

	.hero-copy {
		margin-top: $space-6;
	}

	.zone-board {
		gap: $section-gap;
	}

	.zone-card__body {
		margin-top: $space-6;
		border: 2rpx solid $border-subtle;
		border-radius: $radius-card;
		padding: $card-padding;
		background: $bg-subtle;
		min-height: 180rpx;
		box-sizing: border-box;
	}

	.zone-card__body--empty {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zone-card__empty {
		text-align: center;
	}

	.module-tile {
		display: flex;
		align-items: center;
		padding-top: $space-3;
		padding-bottom: $space-3;
	}

	.module-tile__icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: $radius-field;
		background: $accent-period-soft;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $space-5;
		flex-shrink: 0;
	}

	.module-tile__icon--shared {
		background: rgba(121, 163, 141, 0.18);
	}

	.module-tile__icon-text {
		font-size: $font-size-body-lg;
		font-weight: $font-weight-title;
		color: $accent-period;
	}

	.module-tile__meta {
		display: flex;
		flex-direction: column;
		gap: $space-1;
	}

	.module-tile__title-row {
		display: flex;
		align-items: center;
		gap: $space-3;
	}

	.module-tile__badge {
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		background: $bg-subtle;
		color: $text-secondary;
	}

	.module-tile__detail {
		color: $text-muted;
	}

	.info-panel__summary {
		display: block;
		margin-top: $space-4;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: $space-4;
		margin-top: $space-6;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: $space-2;
		padding: $space-4;
		border-radius: $radius-card;
		background: $bg-subtle;
	}

	.summary-item__value {
		font-weight: $font-weight-title;
	}

	.settings-strip {
		display: flex;
		flex-direction: column;
		gap: $space-3;
		margin-top: $space-5;
	}

	.settings-strip__options {
		display: flex;
		flex-wrap: wrap;
		gap: $space-3;
	}

	.settings-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 56rpx;
		padding: 0 $space-4;
		border-radius: 999rpx;
		background: $bg-subtle;
		border: 2rpx solid transparent;
	}

	.settings-chip--selected {
		background: $accent-period-soft;
		border-color: $accent-period;
	}

	.settings-chip__text {
		font-size: $font-size-caption;
		line-height: 1;
		color: $text-secondary;
	}

	.settings-chip__text--selected {
		color: $accent-period;
		font-weight: $font-weight-title;
	}

	.summary-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $space-3;
		margin-top: $space-5;
	}

	.summary-action__text {
		color: $text-secondary;
	}

	.summary-action__hint {
		color: $text-muted;
	}

	.showcase-entry {
		display: inline-flex;
		margin-top: $space-6;
		align-self: flex-start;
	}

	.showcase-entry__text {
		color: $text-inverse;
	}

	.info-action__text--primary {
		color: $text-inverse;
	}

	.shell-state-card {
		display: flex;
		flex-direction: column;
		gap: $space-4;
	}

	.shell-state-card__action {
		align-self: flex-start;
	}

	.dev-toolbar {
		display: flex;
		justify-content: center;
		padding-top: $space-6;
		padding-bottom: $space-6;
		opacity: 0.5;
	}

	.dev-reset-btn {
		padding: $space-3 $space-5;
		border-radius: $radius-field;
		border: 2rpx dashed $border-subtle;
	}

	.dev-reset-btn--busy {
		opacity: 0.5;
	}

	.dev-reset-btn__text {
		font-size: $font-size-caption;
		color: $text-muted;
	}
</style>
