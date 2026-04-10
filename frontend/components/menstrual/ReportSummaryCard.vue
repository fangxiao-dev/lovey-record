<template>
	<view class="report-summary-card ui-card">
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
	</view>
</template>

<script>
	export default {
		name: 'ReportSummaryCard',
		props: {
			rows: {
				type: Array,
				default: () => []
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
</style>
