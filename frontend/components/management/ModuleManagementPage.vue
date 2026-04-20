<template>
	<view class="management-page">
		<template v-if="page">
			<PageNavBar title="记录空间" icon-src="/static/management/toolkit_pekomon.svg" />
			<view class="management-page__body">
			<view class="management-board ui-card">
				<view class="management-board__header ui-card__header">
					<view class="management-board__title-group">
						<text class="management-board__title u-text-title-sm">{{ page.moduleBoard.title }}</text>
					</view>
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
						<text class="management-card__module-name u-text-title-sm">{{ selectedModule.moduleName }}</text>
						<text class="management-card__title u-text-caption">{{ page.managementCard.title }}</text>
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
						@custom-preview-change="handleCustomPickerPreviewChange(setting.key, $event)"
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

			<ChangelogEntryRow
				:entries="changelogEntries"
				:last-viewed-version="lastViewedVersion"
				@open="openChangelog"
			/>
		</view>
		</template>

		<LoadingScreen v-else :error-message="loadError" @retry="retryInitialLoad" />

		<!-- Share confirmation modal -->
		<view v-if="showShareModal" class="share-modal-mask" @tap="showShareModal = false">
			<view class="share-modal" @tap.stop>
				<view class="share-modal__header">
					<text class="share-modal__title u-text-title-sm">共享模块</text>
					<text class="share-modal__module-name u-text-body">{{ selectedModule && selectedModule.moduleName }}</text>
				</view>

				<!-- 权限选择器 -->
				<view class="share-modal__perm-selector">
					<view
						class="share-modal__perm-option"
						:class="{ 'share-modal__perm-option--active': selectedPermission === 'VIEWER' }"
						@tap="selectedPermission = 'VIEWER'"
					>
						<view class="share-modal__perm-option-radio">
							<view v-if="selectedPermission === 'VIEWER'" class="share-modal__perm-option-radio-dot" />
						</view>
						<view class="share-modal__perm-option-body">
							<text class="share-modal__perm-option-label">仅查看</text>
							<text class="share-modal__perm-option-desc">TA 可以查看你的记录</text>
						</view>
					</view>
					<view
						class="share-modal__perm-option"
						:class="{ 'share-modal__perm-option--active': selectedPermission === 'PARTNER' }"
						@tap="selectedPermission = 'PARTNER'"
					>
						<view class="share-modal__perm-option-radio">
							<view v-if="selectedPermission === 'PARTNER'" class="share-modal__perm-option-radio-dot" />
						</view>
						<view class="share-modal__perm-option-body">
							<text class="share-modal__perm-option-label">可编辑</text>
							<text class="share-modal__perm-option-desc">TA 可以帮你添加和编辑</text>
						</view>
					</view>
				</view>

				<view class="share-modal__badge" :class="{ 'share-modal__badge--partner': selectedPermission === 'PARTNER' }">
					<view class="share-modal__badge-dot" />
					<text class="share-modal__badge-text">{{ selectedPermission === 'PARTNER' ? '可编辑权限' : '只读权限' }}</text>
				</view>

				<view class="share-modal__perms">
					<view class="share-modal__perm-row">
						<view class="share-modal__perm-icon share-modal__perm-icon--ok">
							<text class="share-modal__perm-icon-text">✓</text>
						</view>
						<text class="share-modal__perm-text"><text class="share-modal__perm-bold">可以看到</text>所有周期记录和数据</text>
					</view>
					<view class="share-modal__perm-row">
						<view v-if="selectedPermission === 'PARTNER'" class="share-modal__perm-icon share-modal__perm-icon--ok">
							<text class="share-modal__perm-icon-text">✓</text>
						</view>
						<view v-else class="share-modal__perm-icon share-modal__perm-icon--no">
							<text class="share-modal__perm-icon-text">✕</text>
						</view>
						<text class="share-modal__perm-text">
							<text class="share-modal__perm-bold">{{ selectedPermission === 'PARTNER' ? '可以帮你记录' : '无法修改' }}</text>{{ selectedPermission === 'PARTNER' ? '日常数据和经期信息' : '任何内容' }}
						</text>
					</view>
				</view>

				<view class="share-modal__actions">
					<button
						class="share-modal__btn share-modal__btn--primary"
						open-type="share"
					>发送邀请</button>
					<view
						class="share-modal__btn share-modal__btn--secondary"
						hover-class="ui-pressable-hover"
						:hover-stay-time="70"
						@tap="showShareModal = false"
					>
						<text>取消</text>
					</view>
				</view>
			</view>
		</view>

		<ChangelogSheet
			:visible="showChangelogSheet"
			:entries="changelogEntries"
			@close="closeChangelog"
		/>

		<view
			v-if="activeCustomPickerKey"
			class="management-page__picker-backdrop"
			@tap="handleCustomPickerBackdropTap"
		/>
	</view>
</template>

<script>
	import SharedLegendChip from './SharedLegendChip.vue';
	import ModuleTileCompact from './ModuleTileCompact.vue';
	import ModuleActionRow from './ModuleActionRow.vue';
	import ModuleSettingStrip from './ModuleSettingStrip.vue';
	import LoadingScreen from '../common/LoadingScreen.vue';
	import PageNavBar from '../common/PageNavBar.vue';
	import {
		DEFAULT_MODULE_SHELL_CONTEXT,
		createShareableJoinLink,
		createDemoMenstrualModuleShellPageModel,
		loadMenstrualModuleShellPageModel,
		resolveModuleContext
	} from '../../services/menstrual/module-shell-service.js';
	import {
		persistModuleSettings,
		persistModulePredictionTerm
	} from '../../services/menstrual/module-shell-command-service.js';
	import ChangelogEntryRow from './ChangelogEntryRow.vue';
	import ChangelogSheet from './ChangelogSheet.vue';
	import changelogEntries from '../../utils/changelog-data.js';
	import { buildCenteredQuickOptions } from '../../utils/picker-quick-options.js';
	import { readLastViewedVersion, writeLastViewedVersion } from '../../utils/changelog.js';
	import { mergeH5RouteQuery } from '../../utils/h5-route-query.js';
	import { resolveRuntimeOpenid } from '../../utils/dev-openid.js';

	export default {
		name: 'ModuleManagementPage',
		components: {
			SharedLegendChip,
			ModuleTileCompact,
			ModuleActionRow,
			ModuleSettingStrip,
			LoadingScreen,
			ChangelogEntryRow,
			ChangelogSheet,
			PageNavBar
		},
		data() {
			return {
				page: null,
				loadError: '',
				isMutating: false,
				isResetting: false,
				isDev: process.env.NODE_ENV !== 'production',
				isDemoMode: false,
				showShareModal: false,
				selectedPermission: 'VIEWER',
				selectedModuleId: '',
				activeCustomPickerKey: '',
				quickWindowAnchors: {},
				customPickerDraftIndices: {},
				context: { ...DEFAULT_MODULE_SHELL_CONTEXT },
				showChangelogSheet: false,
				changelogEntries,
				lastViewedVersion: 'v0.0.0'
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
				const anchor = this.quickWindowAnchors[key] ?? selectedValue ?? 0;
				const previewValue = this.activeCustomPickerKey === key ? this.quickWindowAnchors[key] : undefined;
				const resolvedSelectedValue = typeof previewValue === 'number' ? previewValue : selectedValue;
				const options = buildCenteredQuickOptions(anchor, resolvedSelectedValue, customPickerOptions);
				const resolvedValueIndex = customPickerValueIndex >= 0 ? customPickerValueIndex : 0;

				return {
					key,
					label: control?.label || '',
					options,
					customLabel: control?.customLabel || '自定义',
					customPickerVisible: this.activeCustomPickerKey === key,
					customPickerOptions,
					customPickerValueIndex: this.activeCustomPickerKey === key
						? this.getActiveCustomPickerDraftIndex(key, resolvedValueIndex)
						: resolvedValueIndex,
					pickerAlign: key === 'prediction' ? 'end' : 'start'
				};
			},
			getActiveCustomPickerDraftIndex(key, fallbackIndex) {
				const draftIndex = this.customPickerDraftIndices?.[key];
				if (typeof draftIndex === 'number' && draftIndex >= 0) {
					return draftIndex;
				}

				return fallbackIndex >= 0 ? fallbackIndex : 0;
			},
			syncQuickWindowAnchorsFromPage(page) {
				const card = page?.managementCard;

				if (!card) return;

				this.quickWindowAnchors = {
					duration: card.settingsControl?.value,
					prediction: card.predictionSettingsControl?.value
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
				this.lastViewedVersion = readLastViewedVersion();
				const runtimeOptions = mergeH5RouteQuery(options || {});
				const openid = resolveRuntimeOpenid({
					explicitOpenid: runtimeOptions.openid,
					fallbackOpenid: DEFAULT_MODULE_SHELL_CONTEXT.openid
				});
				const isDemoMode = runtimeOptions.demo === '1' || runtimeOptions.demo === 'true';
				this.isDemoMode = isDemoMode;
				this.page = null;
				this.selectedModuleId = '';
				this.activeCustomPickerKey = '';
				this.quickWindowAnchors = {};
				this.customPickerDraftIndices = {};
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
					this.syncQuickWindowAnchorsFromPage(result.page);
					this.customPickerDraftIndices = {};
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

				// Auto-show on first launch after a new version.
				// Deferred to next tick so the page DOM is settled before the sheet appears.
				// Guard: skip if load failed to avoid masking the error/retry UI.
				if (
					!this.loadError &&
					this.changelogEntries.length > 0 &&
					this.changelogEntries[0].version !== this.lastViewedVersion
				) {
					this.$nextTick(() => {
						this.showChangelogSheet = true;
					});
				}
			},
			async retryInitialLoad() {
				this.loadError = '';
				try {
					const result = await loadMenstrualModuleShellPageModel(this.context);
					this.page = result.page;
					this.activeCustomPickerKey = '';
					this.customPickerDraftIndices = {};
					this.selectedModuleId = result.page?.moduleBoard?.modules?.find((module) => module.selected)?.id
						|| result.page?.moduleBoard?.modules?.[0]?.id
						|| '';
					this.syncQuickWindowAnchorsFromPage(result.page);
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

				if (this.activeCustomPickerKey === key) {
					this.handleCustomPickerBackdropTap();
					return;
				}

				const control = this.getSettingControlByKey(key);
				const selectedValue = control?.value;
				const currentIndex = (control?.customPickerOptions || []).findIndex((option) => option.value === selectedValue);
				const anchorValue = typeof selectedValue === 'number' ? selectedValue : 0;
				this.customPickerDraftIndices = {
					...this.customPickerDraftIndices,
					[key]: currentIndex >= 0 ? currentIndex : 0
				};
				this.quickWindowAnchors = {
					...this.quickWindowAnchors,
					[key]: anchorValue
				};
				this.activeCustomPickerKey = key;
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
			async commitCustomPickerSelection(key) {
				const control = this.getSettingControlByKey(key);
				const draftIndex = this.customPickerDraftIndices?.[key];
				const option = control?.customPickerOptions?.[draftIndex];
				const nextValue = option?.value;

				if (this.isMutating || !control || !option || !nextValue || nextValue === control.value) return true;

				if (this.isDemoMode) {
					this.quickWindowAnchors = { ...this.quickWindowAnchors, [key]: nextValue };
					this.applyDemoSettingUpdate(key, nextValue);
					return true;
				}

				const previousAnchor = this.quickWindowAnchors[key];
				this.isMutating = true;
				this.loadError = '';
				try {
					await this.persistSettingByKey(key, nextValue);
					await this.retryInitialLoad();
					this.quickWindowAnchors = { ...this.quickWindowAnchors, [key]: nextValue };
					return true;
				} catch (error) {
					this.quickWindowAnchors = { ...this.quickWindowAnchors, [key]: previousAnchor };
					this.loadError = error instanceof Error ? error.message : '模块设置更新失败';
					return false;
				} finally {
					this.isMutating = false;
				}
			},
			async handleCustomPickerBackdropTap() {
				if (!this.activeCustomPickerKey || this.isMutating) return;

				const key = this.activeCustomPickerKey;
				const committed = await this.commitCustomPickerSelection(key);
				if (committed === false) return;

				this.activeCustomPickerKey = '';
				this.customPickerDraftIndices = {};
			},
			async handleCustomPickerPreviewChange(key, payload) {
				const index = payload?.index;
				const value = payload?.value;

				if (!key || typeof index !== 'number' || index < 0 || typeof value === 'undefined') return;

				this.customPickerDraftIndices = {
					...this.customPickerDraftIndices,
					[key]: index
				};
				this.quickWindowAnchors = {
					...this.quickWindowAnchors,
					[key]: value
				};
			},
			handleShareAction() {
				if (this.isMutating || !this.page?.managementCard?.secondaryAction) return;

				if (this.isDemoMode) {
					uni.showToast({ title: 'Demo 模式暂不支持共享邀请', icon: 'none' });
					return;
				}

				this.showShareModal = true;
			},
			openChangelog() {
				this.showChangelogSheet = true;
			},
			closeChangelog() {
				if (this.changelogEntries.length > 0) {
					writeLastViewedVersion(this.changelogEntries[0].version);
					this.lastViewedVersion = this.changelogEntries[0].version;
				}
				this.showChangelogSheet = false;
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
		min-height: 100vh;
		background: $bg-base;
	}

	.management-page__body {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding: 16rpx $page-padding-x 48rpx;
	}

	.management-board,
	.management-card,
	.management-page__state-card {
		background: #ffffff;
	}

	/* ── Module board title ─────────────────────────────────────── */
	.management-board__title-group {
		display: flex;
		align-items: center;
	}

	.management-card {
		position: relative;
		z-index: 21;
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

	/* module-name is now the primary title, title is the secondary label */
	.management-card__module-name {
		color: $text-primary;
	}

	.management-card__title {
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

	.management-page__picker-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.01);
		z-index: 20;
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

	// ── Share confirmation modal ───────────────────────────────────
	$modal-rose:         #c9786a;
	$modal-amber-bg:     #fdf3e9;
	$modal-amber-border: #e8c99a;
	$modal-amber-text:   #8a5e28;
	$modal-amber-dot:    #c6914b;
	$modal-ok-bg:        #ecf5e9;
	$modal-ok-text:      #5a8a4a;
	$modal-err-bg:       #faeae9;
	$modal-err-text:     #b96858;
	$modal-brown-900:    #2f2a26;
	$modal-brown-700:    #72685f;
	$modal-brown-500:    #a29488;
	$modal-warm-100:     #f3eee7;
	$modal-warm-200:     #e6ded5;

	.share-modal-mask {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 999;
	}

	.share-modal {
		width: 100%;
		background: #ffffff;
		border-radius: 32rpx 32rpx 0 0;
		padding: 36rpx 32rpx 48rpx;
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}

	.share-modal__header {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.share-modal__title {
		color: $modal-brown-900;
	}

	.share-modal__module-name {
		color: $modal-brown-500;
	}

	.share-modal__badge {
		display: flex;
		align-items: center;
		gap: 8rpx;
		align-self: flex-start;
		background: $modal-amber-bg;
		border: 1rpx solid $modal-amber-border;
		border-radius: 999rpx;
		padding: 6rpx 20rpx;
	}

	.share-modal__badge-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: $modal-amber-dot;
	}

	.share-modal__badge-text {
		font-size: 22rpx;
		font-weight: 600;
		color: $modal-amber-text;
	}

	.share-modal__perms {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.share-modal__perm-row {
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
	}

	.share-modal__perm-icon {
		width: 32rpx;
		height: 32rpx;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 2rpx;

		&--ok { background: $modal-ok-bg; }
		&--no { background: $modal-err-bg; }
	}

	.share-modal__perm-icon-text {
		font-size: 18rpx;
		font-weight: 700;

		.share-modal__perm-icon--ok & { color: $modal-ok-text; }
		.share-modal__perm-icon--no & { color: $modal-err-text; }
	}

	.share-modal__perm-text {
		font-size: 26rpx;
		color: $modal-brown-700;
		line-height: 1.6;
	}

	.share-modal__perm-bold {
		font-weight: 600;
		color: $modal-brown-900;
	}

	.share-modal__actions {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		margin-top: 8rpx;
	}

	.share-modal__btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		border-radius: 999rpx;
		border: none;
		font-size: 28rpx;
		font-weight: 600;
		padding: 28rpx 0;
		line-height: 1;
		box-sizing: border-box;

		&::after { border: none; }

		&--primary {
			background: $modal-rose;
			color: #ffffff;
		}

		&--secondary {
			background: $modal-warm-100;
			color: $modal-brown-700;
		}
	}

	// ── 权限选择器 ─────────────────────────────────────────────
	.share-modal__perm-selector {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.share-modal__perm-option {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 20rpx 24rpx;
		border-radius: 18rpx;
		border: 2rpx solid $modal-warm-200;
		background: #ffffff;
		transition: border-color 0.15s;

		&--active {
			border-color: $modal-rose;
			background: rgba(201, 120, 106, 0.04);
		}
	}

	.share-modal__perm-option-radio {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		border: 2rpx solid $modal-warm-200;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		.share-modal__perm-option--active & {
			border-color: $modal-rose;
		}
	}

	.share-modal__perm-option-radio-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: $modal-rose;
	}

	.share-modal__perm-option-body {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.share-modal__perm-option-label {
		font-size: 28rpx;
		font-weight: 600;
		color: $modal-brown-900;
	}

	.share-modal__perm-option-desc {
		font-size: 22rpx;
		color: $modal-brown-500;
	}

	// badge partner variant
	.share-modal__badge--partner {
		background: #eaf7f0;
		border-color: #b2dfc8;

		.share-modal__badge-dot {
			background: #4caf82;
		}

		.share-modal__badge-text {
			color: #2e7d52;
		}
	}
</style>
