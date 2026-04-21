<template>
	<view class="report-page u-page-shell">
		<PageNavBar
			title="周期小结"
			icon-src="/static/menstrual/calendar-menstrual.svg"
			:show-back="true"
			:large-title="true"
		/>

		<view v-if="loadError" class="report-page__state-card ui-card u-page-section">
			<text class="report-page__state-title">联调加载失败</text>
			<text class="report-page__state-copy">{{ loadError }}</text>
		</view>

		<template v-else>
			<ReportSummaryCard
				class="report-page__summary-card u-page-section"
				:rows="reportView.summary.rows"
				:footer="reportView.summary.footer"
				@footer-tap="handleSummaryFooterTap"
			/>

			<view class="report-page__bridge" aria-hidden="true">
				<view class="report-page__bridge-line"></view>
				<view class="report-page__bridge-node">
					<view class="report-page__bridge-node-core"></view>
				</view>
				<view class="report-page__bridge-line"></view>
			</view>

			<ReportTrendCard
				class="report-page__trend-card u-page-section"
				:active-key="activeTrendKey"
				:cycle-series="reportView.trend.cycle"
				:duration-series="reportView.trend.duration"
				:empty-state-copy="reportView.trend.emptyStateCopy"
				@change="handleTrendChange"
			/>

			<view class="report-page__bridge" aria-hidden="true">
				<view class="report-page__bridge-line"></view>
				<view class="report-page__bridge-node">
					<view class="report-page__bridge-node-core"></view>
				</view>
				<view class="report-page__bridge-line"></view>
			</view>

			<ReportHistoryList
				class="report-page__history-list u-page-section"
				:rows="reportView.history.rows"
			/>
		</template>

		<view
			v-if="alignDialog.visible"
			class="report-page__align-mask"
			@tap="closeAlignDialog"
		>
			<view class="report-page__align-dialog" @tap.stop>
				<text class="report-page__align-dialog-title">一键对齐</text>

				<view class="report-page__align-dialog-intro">
					<view class="report-page__align-dialog-illustration-slot">
						<image
							class="report-page__align-dialog-illustration"
							src="/static/icons/happy.png"
							mode="aspectFit"
						/>
					</view>
					<view class="report-page__align-dialog-copy-block">
						<text
							v-if="alignDialog.scenario === 'empty'"
							class="report-page__align-dialog-copy"
						>还没有统计到数据噢，先记一笔吧</text>
						<text
							v-else-if="alignDialog.scenario === 'duration-only'"
							class="report-page__align-dialog-copy"
						>
							<text class="report-page__align-dialog-copy-strong">周期</text>
							<text>统计至少需要两次记录，本次只会更改</text>
							<text class="report-page__align-dialog-copy-strong">时长</text>
							<text>噢</text>
						</text>
						<text
							v-else
							class="report-page__align-dialog-copy"
						>自动按均值对齐以下设置</text>
					</view>
				</view>

				<view
					v-if="alignDialog.scenario === 'full'"
					class="report-page__align-dialog-diffs"
				>
					<view class="report-page__align-dialog-diff-row">
						<view class="report-page__align-dialog-diff-values">
							<text class="report-page__align-dialog-diff-label">周期</text>
							<text class="report-page__align-dialog-diff-text">{{ formatAlignDiffValue(alignDialog.payload?.currentPredictionTermDays) }}</text>
							<view class="report-page__align-dialog-arrow" aria-hidden="true">
								<view class="report-page__align-dialog-arrow-line"></view>
								<view class="report-page__align-dialog-arrow-head"></view>
							</view>
							<text class="report-page__align-dialog-diff-text">{{ formatAlignDiffValue(alignDialog.payload?.nextPredictionTermDays) }}</text>
						</view>
					</view>
					<view class="report-page__align-dialog-diff-row">
						<text class="report-page__align-dialog-diff-label">时长</text>
						<view class="report-page__align-dialog-diff-values">
							<text class="report-page__align-dialog-diff-text">{{ formatAlignDiffValue(alignDialog.payload?.currentDurationDays) }}</text>
							<view class="report-page__align-dialog-arrow" aria-hidden="true">
								<view class="report-page__align-dialog-arrow-line"></view>
								<view class="report-page__align-dialog-arrow-head"></view>
							</view>
							<text class="report-page__align-dialog-diff-text">{{ formatAlignDiffValue(alignDialog.payload?.nextDurationDays) }}</text>
						</view>
					</view>
				</view>

				<view
					v-else-if="alignDialog.scenario === 'duration-only' && alignDialog.payload?.canAlignDuration"
					class="report-page__align-dialog-diffs"
				>
					<view class="report-page__align-dialog-diff-row">
						<view class="report-page__align-dialog-diff-values">
							<text class="report-page__align-dialog-diff-label">时长</text>
							<text class="report-page__align-dialog-diff-text">{{ formatAlignDiffValue(alignDialog.payload?.currentDurationDays) }}</text>
							<view class="report-page__align-dialog-arrow" aria-hidden="true">
								<view class="report-page__align-dialog-arrow-line"></view>
								<view class="report-page__align-dialog-arrow-head"></view>
							</view>
							<text class="report-page__align-dialog-diff-text">{{ formatAlignDiffValue(alignDialog.payload?.nextDurationDays) }}</text>
						</view>
					</view>
				</view>

				<view class="report-page__align-dialog-actions">
					<view
						v-if="alignDialog.scenario === 'empty'"
						class="report-page__align-dialog-button report-page__align-dialog-button--primary"
						hover-class="ui-pressable-hover"
						:hover-stay-time="70"
						@tap="closeAlignDialog"
					>
						<text class="report-page__align-dialog-button-text">知道了</text>
					</view>
					<template v-else>
						<view
							class="report-page__align-dialog-button report-page__align-dialog-button--primary"
							:class="{ 'report-page__align-dialog-button--disabled': alignDialog.busy }"
							hover-class="ui-pressable-hover"
							:hover-stay-time="70"
							@tap="handleAlignConfirm"
						>
							<text class="report-page__align-dialog-button-text">{{ alignDialog.busy ? '对齐中…' : '确认' }}</text>
						</view>
						<view
							class="report-page__align-dialog-button report-page__align-dialog-button--secondary"
							:class="{ 'report-page__align-dialog-button--disabled': alignDialog.busy }"
							hover-class="ui-pressable-hover"
							:hover-stay-time="70"
							@tap="closeAlignDialog"
						>
							<text class="report-page__align-dialog-button-text report-page__align-dialog-button-text--secondary">取消</text>
						</view>
					</template>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import PageNavBar from '../../components/common/PageNavBar.vue';
	import ReportSummaryCard from '../../components/menstrual/ReportSummaryCard.vue';
	import ReportTrendCard from '../../components/menstrual/ReportTrendCard.vue';
	import ReportHistoryList from '../../components/menstrual/ReportHistoryList.vue';
	import { createReportPageViewModel } from '../../components/menstrual/report-contract-adapter.js';
	import {
		DEFAULT_MENSTRUAL_REPORT_CONTEXT,
		loadMenstrualReportView
	} from '../../services/menstrual/report-contract-service.js';
	import { loadMenstrualModuleSettings } from '../../services/menstrual/home-contract-service.js';
	import { loadModuleAccessState } from '../../services/menstrual/module-shell-service.js';
	import {
		persistModulePredictionTerm,
		persistModuleSettings
	} from '../../services/menstrual/module-shell-command-service.js';
	import { mergeH5RouteQuery } from '../../utils/h5-route-query.js';
	import { resolveRuntimeOpenid } from '../../utils/dev-openid.js';

	function createAlignDialogState(overrides = {}) {
		return {
			visible: false,
			busy: false,
			scenario: 'empty',
			payload: null,
			...overrides
		};
	}

	function formatCurrentSettingValue(value) {
		return Number.isFinite(value) ? `${value} 天` : '-';
	}

	function createCurrentSettingsText(align) {
		return `当前设置：周期 ${formatCurrentSettingValue(align?.currentPredictionTermDays)} · 时长 ${formatCurrentSettingValue(align?.currentDurationDays)}`;
	}

	export default {
		name: 'MenstrualReportPage',
		components: {
			PageNavBar,
			ReportSummaryCard,
			ReportTrendCard,
			ReportHistoryList
		},
		data() {
			return {
				activeTrendKey: 'cycle',
				loadError: '',
				reportView: createReportPageViewModel(),
				contractContext: { ...DEFAULT_MENSTRUAL_REPORT_CONTEXT },
				alignDialog: createAlignDialogState()
			};
		},
		onLoad(options) {
			const runtimeOptions = mergeH5RouteQuery(options || {});
			const decode = (value) => value ? decodeURIComponent(value) : value;
			const openid = resolveRuntimeOpenid({
				explicitOpenid: decode(runtimeOptions.openid),
				fallbackOpenid: DEFAULT_MENSTRUAL_REPORT_CONTEXT.openid
			});
			this.contractContext = {
				...DEFAULT_MENSTRUAL_REPORT_CONTEXT,
				apiBaseUrl: decode(runtimeOptions.apiBaseUrl) || DEFAULT_MENSTRUAL_REPORT_CONTEXT.apiBaseUrl,
				openid,
				moduleInstanceId: decode(runtimeOptions.moduleInstanceId) || DEFAULT_MENSTRUAL_REPORT_CONTEXT.moduleInstanceId
			};
			this.loadReport();
		},
		methods: {
			async loadReport() {
				this.loadError = '';
				try {
					const [rawReport, moduleSettings, accessState] = await Promise.all([
						loadMenstrualReportView(this.contractContext),
						loadMenstrualModuleSettings(this.contractContext).catch(() => null),
						loadModuleAccessState(this.contractContext).catch(() => null)
					]);
					this.reportView = createReportPageViewModel({
						moduleInstanceId: this.contractContext.moduleInstanceId,
						moduleSettings,
						accessState,
						records: rawReport.records
					});
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
				}
			},
			handleTrendChange(nextKey) {
				if (!nextKey) return;
				this.activeTrendKey = nextKey;
			},
			showReadonlyWarning() {
				uni.showModal({
					title: '只读权限',
					content: '当前只有只读权限，不能修改周期和时长设置',
					showCancel: false,
					confirmText: '知道了'
				});
			},
			formatAlignDiffValue(value) {
				return Number.isFinite(value) ? `${value} 天` : '-';
			},
			createOptimisticAlignPayload(previousAlign, nextAlign) {
				return {
					...previousAlign,
					...nextAlign,
					currentDurationDays: Number.isFinite(nextAlign?.nextDurationDays)
						? nextAlign.nextDurationDays
						: previousAlign?.currentDurationDays ?? null,
					currentPredictionTermDays: Number.isFinite(nextAlign?.nextPredictionTermDays)
						? nextAlign.nextPredictionTermDays
						: previousAlign?.currentPredictionTermDays ?? null
				};
			},
			applyOptimisticFooterAlign(nextAlign) {
				const previousFooter = this.reportView?.summary?.footer;
				if (!previousFooter) return null;

				const optimisticAlign = this.createOptimisticAlignPayload(previousFooter.align, nextAlign);
				this.reportView = {
					...this.reportView,
					summary: {
						...this.reportView.summary,
						footer: {
							...previousFooter,
							currentSettingsText: createCurrentSettingsText(optimisticAlign),
							align: optimisticAlign
						}
					}
				};

				return previousFooter;
			},
			restoreSummaryFooter(previousFooter) {
				if (!previousFooter) return;

				this.reportView = {
					...this.reportView,
					summary: {
						...this.reportView.summary,
						footer: previousFooter
					}
				};
			},
			openAlignDialog(footer) {
				this.alignDialog = createAlignDialogState({
					visible: true,
					scenario: footer?.align?.scenario || 'empty',
					payload: footer?.align || null
				});
			},
			closeAlignDialog() {
				if (this.alignDialog.busy) return;
				this.alignDialog = createAlignDialogState();
			},
			async persistAlignChanges(align) {
				if (align?.canAlignDuration) {
					await persistModuleSettings({
						context: this.contractContext,
						defaultPeriodDurationDays: align.nextDurationDays
					});
				}

				if (align?.canAlignPrediction) {
					await persistModulePredictionTerm({
						context: this.contractContext,
						defaultPredictionTermDays: align.nextPredictionTermDays
					});
				}
			},
			async handleAlignConfirm() {
				if (this.alignDialog.busy || this.alignDialog.scenario === 'empty') {
					return;
				}

				const align = this.alignDialog.payload;
				const previousFooter = this.applyOptimisticFooterAlign(align);
				this.alignDialog = {
					...this.alignDialog,
					busy: true
				};

				try {
					await this.persistAlignChanges(align);
					this.alignDialog = createAlignDialogState();
					await this.loadReport();
				} catch (error) {
					this.restoreSummaryFooter(previousFooter);
					this.alignDialog = {
						...this.alignDialog,
						busy: false
					};
					uni.showToast({
						title: error instanceof Error ? error.message : '一键对齐失败',
						icon: 'none'
					});
				}
			},
			handleSummaryFooterTap(payload) {
				const footer = payload?.footer || payload;
				const action = payload?.action || 'settings';
				if (!footer) return;
				if (footer.portalMode === 'readonly-warning') {
					this.showReadonlyWarning();
					return;
				}
				if (action === 'align') {
					this.openAlignDialog(footer);
					return;
				}
				if (action !== 'settings') return;
				const query = [
					`apiBaseUrl=${encodeURIComponent(this.contractContext.apiBaseUrl)}`,
					`openid=${encodeURIComponent(this.contractContext.openid)}`,
					`moduleInstanceId=${encodeURIComponent(footer.targetModuleInstanceId || this.contractContext.moduleInstanceId)}`
				].join('&');
				uni.navigateTo({
					url: `/pages/management/index?${query}`
				});
			}
		}
	};
</script>

<style lang="scss">
	.report-page {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding-bottom: $space-12;
		background: $bg-base;
	}

	.report-page__title {
		font-size: 28rpx;
		font-weight: 500;
		color: $text-secondary;
		letter-spacing: 0.04em;
	}

	.report-page__summary-card,
	.report-page__trend-card,
	.report-page__history-list {
		width: 100%;
	}

	.report-page__bridge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16rpx;
		padding: 2rpx 20rpx 0;
		margin: -4rpx 0 -2rpx;
	}

	.report-page__bridge-line {
		flex: 1;
		max-width: 96rpx;
		height: 2rpx;
		background: linear-gradient(90deg, rgba(232, 196, 182, 0) 0%, rgba(232, 196, 182, 0.75) 48%, rgba(232, 196, 182, 0) 100%);
	}

	.report-page__bridge-node {
		width: 44rpx;
		height: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		background: linear-gradient(180deg, rgba(255, 253, 251, 0.98) 0%, rgba(252, 243, 237, 0.98) 100%);
		border: 2rpx solid rgba(234, 202, 188, 0.9);
		box-shadow:
			0 8rpx 18rpx rgba(208, 160, 142, 0.12),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.95);
	}

	.report-page__bridge-node-core {
		width: 14rpx;
		height: 14rpx;
		border-radius: 999rpx;
		background: radial-gradient(circle at 35% 35%, #f9d9cb 0%, #e4b09d 72%, #d89a8d 100%);
	}

	.report-page__state-card {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		padding: 24rpx;
	}

	.report-page__state-title {
		font-size: 28rpx;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.report-page__state-copy {
		font-size: 22rpx;
		line-height: 1.5;
		color: $text-secondary;
	}

	.report-page__align-mask {
		position: fixed;
		inset: 0;
		z-index: 999;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background: rgba(38, 24, 16, 0.36);
		padding: 36rpx 34rpx;
	}

	.report-page__align-dialog {
		width: 100%;
		padding: 38rpx 38rpx 34rpx;
		border-radius: 30rpx;
		background: linear-gradient(180deg, rgba(255, 253, 250, 0.99) 0%, #ffffff 100%);
		box-shadow: 0 20rpx 48rpx rgba(98, 70, 54, 0.16);
		display: flex;
		flex-direction: column;
		gap: 22rpx;
	}

	.report-page__align-dialog-intro {
		display: flex;
		align-items: center;
		gap: 22rpx;
	}

	.report-page__align-dialog-copy-block {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 10rpx 0;
	}

	.report-page__align-dialog-header {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.report-page__align-dialog-title {
		text-align: center;
		font-size: 32rpx;
		line-height: 1.3;
		font-weight: $font-weight-title;
		color: $text-primary;
	}

	.report-page__align-dialog-copy,
	.report-page__align-dialog-diff-text {
		font-size: 26rpx;
		line-height: 1.6;
		color: $text-secondary;
	}

	.report-page__align-dialog-copy-strong,
	.report-page__align-dialog-diff-label {
		font-size: 26rpx;
		line-height: 1.6;
		font-weight: $font-weight-title;
		color: $text-primary;
	}

	.report-page__align-dialog-illustration {
		width: 108rpx;
		height: 108rpx;
		flex-shrink: 0;
	}

	.report-page__align-dialog-illustration-slot {
		width: 120rpx;
		height: 120rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.report-page__align-dialog-diffs {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
		padding: 26rpx 24rpx;
		border-radius: 24rpx;
		background: #f8f1ea;
	}

	.report-page__align-dialog-diff-row {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.report-page__align-dialog-diff-values {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		flex-wrap: nowrap;
	}

	.report-page__align-dialog-arrow {
		display: inline-flex;
		align-items: center;
		gap: 0;
	}

	.report-page__align-dialog-arrow-line {
		width: 24rpx;
		height: 4rpx;
		border-radius: 999rpx;
		background: linear-gradient(90deg, #d89d8f 0%, #cf8474 100%);
	}

	.report-page__align-dialog-arrow-head {
		width: 12rpx;
		height: 12rpx;
		margin-left: -4rpx;
		border-top: 4rpx solid #cf8474;
		border-right: 4rpx solid #cf8474;
		transform: rotate(45deg);
	}

	.report-page__align-dialog-diff-label {
		font-size: 28rpx;
		line-height: 1.4;
		min-width: 72rpx;
		text-align: center;
	}

	.report-page__align-dialog-diff-text {
		font-size: 22rpx;
		line-height: 1.4;
	}

	.report-page__align-dialog-actions {
		display: flex;
		gap: 16rpx;
		margin-top: 2rpx;
	}

	.report-page__align-dialog-button {
		flex: 1;
		min-height: 88rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.report-page__align-dialog-button--primary {
		background: #cf8474;
	}

	.report-page__align-dialog-button--secondary {
		background: #f3ece4;
	}

	.report-page__align-dialog-button--disabled {
		opacity: 0.55;
	}

	.report-page__align-dialog-button-text {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-title;
		color: #ffffff;
	}

	.report-page__align-dialog-button-text--secondary {
		color: $text-secondary;
	}
</style>
