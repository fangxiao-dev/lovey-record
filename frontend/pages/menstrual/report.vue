<template>
	<view class="report-page u-page-shell">
		<view class="report-page__header u-page-section">
			<view
				class="report-page__back"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="handleBack"
			>
				<text class="report-page__back-label">返回</text>
			</view>
		</view>

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

			<ReportTrendCard
				class="report-page__trend-card u-page-section"
				:active-key="activeTrendKey"
				:cycle-series="reportView.trend.cycle"
				:duration-series="reportView.trend.duration"
				:empty-state-copy="reportView.trend.emptyStateCopy"
				@change="handleTrendChange"
			/>

			<ReportHistoryList
				class="report-page__history-list u-page-section"
				:rows="reportView.history.rows"
			/>
		</template>
	</view>
</template>

<script>
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
	import { mergeH5RouteQuery } from '../../utils/h5-route-query.js';
	import { resolveRuntimeOpenid } from '../../utils/dev-openid.js';

	export default {
		name: 'MenstrualReportPage',
		components: {
			ReportSummaryCard,
			ReportTrendCard,
			ReportHistoryList
		},
		data() {
			return {
				activeTrendKey: 'cycle',
				loadError: '',
				reportView: createReportPageViewModel(),
				contractContext: { ...DEFAULT_MENSTRUAL_REPORT_CONTEXT }
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
			handleSummaryFooterTap(footer) {
				if (!footer) return;
				if (footer.portalMode === 'readonly-warning') {
					uni.showModal({
						title: '只读权限',
						content: '当前只有只读权限，不能修改周期和时长设置',
						showCancel: false,
						confirmText: '知道了'
					});
					return;
				}
				const query = [
					`apiBaseUrl=${encodeURIComponent(this.contractContext.apiBaseUrl)}`,
					`openid=${encodeURIComponent(this.contractContext.openid)}`,
					`moduleInstanceId=${encodeURIComponent(footer.targetModuleInstanceId || this.contractContext.moduleInstanceId)}`
				].join('&');
				uni.navigateTo({
					url: `/pages/management/index?${query}`
				});
			},
			handleBack() {
				uni.navigateBack({
					delta: 1
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

	.report-page__header {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding-top: $space-2;
		padding-bottom: 0;
	}

	.report-page__back {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 88rpx;
		padding: 10rpx 20rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.76);
	}

	.report-page__back-label {
		font-size: 24rpx;
		color: $text-secondary;
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
</style>
