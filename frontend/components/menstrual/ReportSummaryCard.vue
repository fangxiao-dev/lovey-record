<template>
	<view class="report-summary-card ui-card">
		<text class="report-summary-card__title">摘要（平均值）</text>
		<view
			v-for="row in rows"
			:key="row.key"
			class="report-summary-card__row"
		>
			<view class="report-summary-card__metric">
				<text class="report-summary-card__label">{{ row.label }}</text>
				<text class="report-summary-card__average">{{ row.averageText }}</text>
			</view>
			<text class="report-summary-card__fluctuation">{{ row.fluctuationText }}</text>
		</view>
		<view
			v-if="footer"
			class="report-summary-card__footer"
		>
			<view class="report-summary-card__footer-main">
				<text class="report-summary-card__footer-copy">{{ footer.currentSettingsText }}</text>
				<view class="report-summary-card__footer-divider" />
				<view
					class="report-summary-card__footer-trigger"
					hover-class="ui-pressable-hover"
					:hover-stay-time="70"
					@tap="$emit('footer-tap', footer)"
				>
					<text class="report-summary-card__footer-action">
						{{ footer.portalMode === 'readonly-warning' ? '!' : '可手动调整：>' }}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ReportSummaryCard',
		emits: ['footer-tap'],
		props: {
			rows: {
				type: Array,
				default: () => []
			},
			footer: {
				type: Object,
				default: null
			}
		}
	};
</script>

<style lang="scss">
	.report-summary-card {
		display: flex;
		flex-direction: column;
		padding: 24rpx;
	}

	.report-summary-card__title {
		display: block;
		text-align: center;
		font-size: 22rpx;
		color: $text-muted;
		padding-bottom: 12rpx;
		border-bottom: 2rpx solid #f1e7dc;
		margin-bottom: 4rpx;
	}

	.report-summary-card__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		padding: 12rpx 0;
	}

	.report-summary-card__row + .report-summary-card__row {
		border-top: 2rpx solid #f1e7dc;
	}

	.report-summary-card__metric {
		display: inline-flex;
		align-items: baseline;
		gap: 10rpx;
		min-width: 0;
	}

	.report-summary-card__label,
	.report-summary-card__average,
	.report-summary-card__fluctuation {
		font-size: 24rpx;
		line-height: 1.4;
	}

	.report-summary-card__label {
		color: $text-secondary;
	}

	.report-summary-card__average {
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.report-summary-card__fluctuation {
		color: $text-muted;
		flex-shrink: 0;
	}

	.report-summary-card__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		padding-top: 16rpx;
		margin-top: 6rpx;
		border-top: 2rpx solid #f1e7dc;
	}

	.report-summary-card__footer-main {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
		flex: 1;
		min-width: 0;
	}

	.report-summary-card__footer-copy {
		font-size: 22rpx;
		line-height: 1.5;
		color: $text-muted;
	}

	.report-summary-card__footer-divider {
		width: 2rpx;
		height: 22rpx;
		background: rgba(176, 148, 132, 0.28);
		flex-shrink: 0;
	}

	.report-summary-card__footer-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: flex-start;
		min-height: 44rpx;
		padding-right: 6rpx;
		flex-shrink: 0;
	}

	.report-summary-card__footer-action {
		font-size: 22rpx;
		line-height: 1.4;
		color: $text-primary;
	}
</style>
