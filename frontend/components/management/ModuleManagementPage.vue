<template>
	<view class="management-page u-page-shell">
		<view v-if="page" class="management-page__body">
			<view class="management-page__intro ui-card">
				<text class="management-page__title u-text-title-lg">{{ page.title }}</text>
				<text class="management-page__helper u-text-caption">{{ page.helperText }}</text>
			</view>

			<view class="management-board ui-card">
				<view class="management-board__header ui-card__header">
					<text class="management-board__title u-text-title-sm">{{ page.moduleBoard.title }}</text>
					<view class="management-board__legend">
						<SharedLegendChip
							v-for="item in page.moduleBoard.legendItems"
							:key="item.key"
							:label="item.label"
							:tone="item.tone"
						/>
					</view>
				</view>

				<view class="management-board__list">
					<ModuleTileCompact
						v-for="module in moduleTiles"
						:key="module.id"
						:title="module.moduleName"
						:icon-src="module.iconSrc"
						:ownership-tone="module.ownershipTone"
						:selected="module.selected"
						@select="handleModuleSelect(module.id)"
					/>
				</view>

				<text class="management-board__continuation u-text-caption">{{ page.moduleBoard.continuationText }}</text>
			</view>

			<view v-if="selectedModule && page.managementCard" class="management-card ui-card">
				<view class="management-card__header ui-card__header">
					<view class="management-card__title-block">
						<text class="management-card__title u-text-title-sm">{{ page.managementCard.title }}</text>
						<text class="management-card__module-name u-text-body">{{ selectedModule.moduleName }}</text>
					</view>
				</view>

				<view class="management-card__summary-grid">
					<view class="management-card__summary-item">
						<text class="management-card__summary-label u-text-caption">{{ page.managementCard.defaultPeriodDuration.label }}</text>
						<text class="management-card__summary-value u-text-body">{{ page.managementCard.defaultPeriodDuration.value }}</text>
					</view>
					<view class="management-card__summary-item">
						<text class="management-card__summary-label u-text-caption">{{ page.managementCard.defaultPredictionTerm.label }}</text>
						<text class="management-card__summary-value u-text-body">{{ page.managementCard.defaultPredictionTerm.value }}</text>
					</view>
				</view>

				<view class="management-card__settings-grid">
					<ModuleSettingStrip
						v-for="setting in managementSettingRows"
						:key="setting.key"
						:label="setting.label"
						:options="setting.options"
						:custom-label="setting.customLabel"
						:custom-picker-visible="setting.customPickerVisible"
						:custom-picker-options="setting.customPickerOptions"
						:custom-picker-value-index="setting.customPickerValueIndex"
						:picker-align="setting.pickerAlign"
						@select="handleSettingOptionSelect(setting.key, $event)"
						@custom="toggleCustomPicker(setting.key)"
						@custom-change="handleCustomPickerChange(setting.key, $event)"
					/>
				</view>

				<ModuleActionRow
					:primary-label="page.managementCard.primaryAction.label"
					:primary-url="page.managementCard.primaryAction.url"
					:secondary-label="page.managementCard.secondaryAction.label"
					:destructive-label="page.managementCard.destructiveAction.label"
					:is-mutating="isMutating"
					@share="handleShareAction"
				/>
			</view>

			<view v-if="isDev" class="management-page__dev-toolbar">
				<view
					class="management-page__dev-reset"
					:class="{ 'management-page__dev-reset--busy': isResetting }"
					hover-class="ui-pressable-hover"
					:hover-stay-time="70"
					@tap="handleDevReset"
				>
					<text class="management-page__dev-reset-text">{{ isResetting ? '重置中…' : 'Reset to seed' }}</text>
				</view>
			</view>
		</view>

		<view v-else class="management-page__state-card ui-card">
			<text class="management-page__state-title u-text-title-sm">{{ loadError ? '联调加载失败' : '正在连接模块管理' }}</text>
			<text class="management-page__state-copy u-text-body-secondary">
				{{ loadError || '正在读取模块访问状态和模块设置。' }}
			</text>
			<view
				v-if="loadError"
				class="management-page__state-action ui-button ui-button--primary"
				:hover-stay-time="70"
				hover-class="ui-pressable-hover"
				@tap="retryInitialLoad"
			>
				<text class="ui-button__text management-action__text management-action__text--primary">重新加载</text>
			</view>
		</view>
	</view>
</template>

<script>
	import SharedLegendChip from './SharedLegendChip.vue';
	import ModuleTileCompact from './ModuleTileCompact.vue';
	import ModuleActionRow from './ModuleActionRow.vue';
	import ModuleSettingStrip from './ModuleSettingStrip.vue';
	import {
		DEFAULT_MODULE_SHELL_CONTEXT,
		createDemoMenstrualModuleShellPageModel,
		loadMenstrualModuleShellPageModel,
		resolveModuleContext
	} from '../../services/menstrual/module-shell-service.js';
	import {
		persistModuleSettings,
		persistModulePredictionTerm,
		persistModuleSharingState
	} from '../../services/menstrual/module-shell-command-service.js';
	import { mergeH5RouteQuery } from '../../utils/h5-route-query.js';

	export default {
		name: 'ModuleManagementPage',
		components: {
			SharedLegendChip,
			ModuleTileCompact,
			ModuleActionRow,
			ModuleSettingStrip
		},
		data() {
			return {
				page: null,
				loadError: '',
				isMutating: false,
				isResetting: false,
				isDev: process.env.NODE_ENV !== 'production',
				isDemoMode: false,
				selectedModuleId: '',
				activeCustomPickerKey: '',
				context: { ...DEFAULT_MODULE_SHELL_CONTEXT }
			};
		},
		computed: {
			managementSettingRows() {
				const card = this.page?.managementCard;

				if (!card) return [];

				return [
					this.buildSettingRow('duration', card.settingsControl),
					this.buildSettingRow('prediction', card.predictionSettingsControl)
				];
			},
			moduleTiles() {
				const modules = this.page?.moduleBoard?.modules || [];
				return modules.map((module) => ({
					...module,
					selected: module.id === this.selectedModuleId
				}));
			},
			selectedModule() {
				return this.moduleTiles.find((module) => module.id === this.selectedModuleId) || this.moduleTiles[0] || null;
			}
		},
		methods: {
			buildSettingRow(key, control) {
				const customPickerOptions = control?.customPickerOptions || [];
				const selectedValue = control?.value;
				const customPickerValueIndex = customPickerOptions.findIndex((option) => option.value === selectedValue);

				return {
					key,
					label: control?.label || '',
					options: control?.options || [],
					customLabel: control?.customLabel || '自定义',
					customPickerVisible: this.activeCustomPickerKey === key,
					customPickerOptions,
					customPickerValueIndex: customPickerValueIndex >= 0 ? customPickerValueIndex : 0,
					pickerAlign: key === 'prediction' ? 'end' : 'start'
				};
			},
			updateDemoSettingRow(control, days) {
				if (!control) return;

				control.value = days;
				control.options = (control.options || []).map((option) => ({
					...option,
					selected: option.value === days
				}));
			},
			applyDemoSettingUpdate(key, days) {
				const card = this.page?.managementCard;

				if (!card) return;

				if (key === 'prediction') {
					card.defaultPredictionTerm.value = `${days} 天`;
					this.updateDemoSettingRow(card.predictionSettingsControl, days);
					return;
				}

				card.defaultPeriodDuration.value = `${days} 天`;
				this.updateDemoSettingRow(card.settingsControl, days);
			},
			applyDemoShareToggle() {
				const card = this.page?.managementCard;
				const module = this.page?.moduleBoard?.modules?.[0];

				if (!card || !module) return;

				const nextAction = card.secondaryAction.action === 'share' ? 'revoke' : 'share';
				const isShared = nextAction === 'revoke';

				card.sharingStatus.value = isShared ? '共享中' : '未共享';
				card.sharingStatus.tone = isShared ? 'shared' : 'private';
				card.secondaryAction.action = nextAction;
				card.secondaryAction.helperText = isShared
					? `当前目标：${this.context.partnerUserId}`
					: `当前目标：${this.context.partnerUserId}`;
				module.ownershipTone = isShared ? 'shared' : 'private';
			},
			getSettingControlByKey(key) {
				if (!this.page?.managementCard) return null;

				return key === 'prediction'
					? this.page.managementCard.predictionSettingsControl
					: this.page.managementCard.settingsControl;
			},
			async persistSettingByKey(key, days) {
				if (key === 'prediction') {
					await persistModulePredictionTerm({
						context: this.context,
						defaultPredictionTermDays: days
					});
					return;
				}

				await persistModuleSettings({
					context: this.context,
					defaultPeriodDurationDays: days
				});
			},
			async initialize(options = {}) {
				const runtimeOptions = mergeH5RouteQuery(options || {});
				const openid = runtimeOptions.openid || DEFAULT_MODULE_SHELL_CONTEXT.openid;
				const isDemoMode = runtimeOptions.demo === '1' || runtimeOptions.demo === 'true';
				this.isDemoMode = isDemoMode;
				this.page = null;
				this.selectedModuleId = '';
				this.activeCustomPickerKey = '';
				this.loadError = '';
				this.context = {
					...DEFAULT_MODULE_SHELL_CONTEXT,
					apiBaseUrl: runtimeOptions.apiBaseUrl || DEFAULT_MODULE_SHELL_CONTEXT.apiBaseUrl,
					openid,
					moduleInstanceId: runtimeOptions.moduleInstanceId || DEFAULT_MODULE_SHELL_CONTEXT.moduleInstanceId,
					profileId: runtimeOptions.profileId || DEFAULT_MODULE_SHELL_CONTEXT.profileId,
					partnerUserId: runtimeOptions.partnerUserId || DEFAULT_MODULE_SHELL_CONTEXT.partnerUserId,
					today: runtimeOptions.today || DEFAULT_MODULE_SHELL_CONTEXT.today
				};

				if (isDemoMode) {
					const result = createDemoMenstrualModuleShellPageModel(this.context);
					this.page = result.page;
					this.selectedModuleId = result.page?.moduleBoard?.modules?.[0]?.id || '';
					return;
				}

				if (!runtimeOptions.moduleInstanceId) {
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

				await this.retryInitialLoad();
			},
			async retryInitialLoad() {
				this.loadError = '';
				try {
					const result = await loadMenstrualModuleShellPageModel(this.context);
					this.page = result.page;
					this.activeCustomPickerKey = '';
					this.selectedModuleId = result.page?.moduleBoard?.modules?.find((module) => module.selected)?.id
						|| result.page?.moduleBoard?.modules?.[0]?.id
						|| '';
				} catch (error) {
					this.page = null;
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
				}
			},
			handleModuleSelect(moduleId) {
				if (!moduleId || moduleId === this.selectedModuleId) return;
				this.selectedModuleId = moduleId;
			},
			toggleCustomPicker(key) {
				if (!key || this.isMutating) return;
				this.activeCustomPickerKey = this.activeCustomPickerKey === key ? '' : key;
			},
			async handleSettingOptionSelect(key, days) {
				const control = this.getSettingControlByKey(key);

				if (this.isMutating || !control || !days || days === control.value) return;

				if (this.isDemoMode) {
					this.applyDemoSettingUpdate(key, days);
					this.activeCustomPickerKey = '';
					return;
				}

				this.isMutating = true;
				this.loadError = '';
				try {
					await this.persistSettingByKey(key, days);
					await this.retryInitialLoad();
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '模块设置更新失败';
				} finally {
					this.isMutating = false;
				}
			},
			async handleCustomPickerChange(key, payload) {
				const control = this.getSettingControlByKey(key);
				const nextValue = payload?.value;

				if (this.isMutating || !control || !nextValue || nextValue === control.value) return;

				if (this.isDemoMode) {
					this.applyDemoSettingUpdate(key, nextValue);
					return;
				}

				this.isMutating = true;
				this.loadError = '';
				try {
					await this.persistSettingByKey(key, nextValue);
					await this.retryInitialLoad();
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '模块设置更新失败';
				} finally {
					this.isMutating = false;
				}
			},
			async handleShareAction() {
				if (this.isMutating || !this.page?.managementCard?.secondaryAction) return;

				if (this.isDemoMode) {
					this.applyDemoShareToggle();
					return;
				}

				this.isMutating = true;
				this.loadError = '';
				try {
					await persistModuleSharingState({
						context: this.context,
						action: this.page.managementCard.secondaryAction.action
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
				try {
					await new Promise((resolve, reject) => {
						uni.request({
							url: this.context.apiBaseUrl + '/dev/reset',
							method: 'POST',
							success: (res) => res.data?.ok ? resolve() : reject(new Error('reset failed')),
							fail: reject
						});
					});
					await this.retryInitialLoad();
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '重置失败';
				} finally {
					this.isResetting = false;
				}
			}
		}
	};
</script>

<style lang="scss">
	.management-page {
		padding-bottom: 48rpx;
	}

	.management-page__body {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.management-page__intro,
	.management-board,
	.management-card,
	.management-page__state-card {
		background: #ffffff;
	}

	.management-page__title {
		display: block;
	}

	.management-page__helper {
		display: block;
		margin-top: 8rpx;
		color: $text-secondary;
	}

	.management-board__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	.management-board__legend {
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx;
		justify-content: flex-end;
	}

	.management-board__list {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.management-board__continuation {
		display: block;
		margin-top: 14rpx;
		color: $text-muted;
	}

	.management-card__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	.management-card__title-block {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.management-card__module-name {
		color: $text-secondary;
	}

	.management-card__summary-grid,
	.management-card__settings-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12rpx;
		margin-top: 16rpx;
		align-items: start;
	}

	.management-card__summary-item {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		padding: 18rpx;
		border-radius: 24rpx;
		background: $bg-subtle;
	}

	.management-card__summary-value {
		font-weight: $font-weight-title;
	}

	.management-page__dev-toolbar {
		display: flex;
		justify-content: center;
		padding: 10rpx 0 0;
	}

	.management-page__dev-reset {
		padding: 12rpx 24rpx;
		border-radius: 999rpx;
		border: 2rpx dashed $border-subtle;
	}

	.management-page__dev-reset--busy {
		opacity: 0.5;
	}

	.management-page__dev-reset-text {
		font-size: 20rpx;
		color: $text-muted;
	}

	.management-page__state-card {
		display: flex;
		flex-direction: column;
		gap: 14rpx;
	}

	.management-page__state-action {
		align-self: flex-start;
	}
</style>
