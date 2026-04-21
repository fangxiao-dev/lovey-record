<template>
	<view class="report-history-list ui-card">
		<view class="report-history-list__header">
			<text class="report-history-list__year-cell">年份</text>
			<view class="report-history-list__dates-group">
				<text class="report-history-list__header-cell">开始</text>
				<text class="report-history-list__header-cell">结束</text>
			</view>
			<view class="report-history-list__metrics-group">
				<text class="report-history-list__header-cell">周期</text>
				<text class="report-history-list__header-cell">时长</text>
			</view>
		</view>

		<view
			v-for="row in rows"
			:key="row.key"
			class="report-history-list__row"
		>
			<text class="report-history-list__year-cell">{{ row.yearLabel }}</text>
			<view class="report-history-list__dates-group">
				<text class="report-history-list__cell">{{ row.startLabel }}</text>
				<text class="report-history-list__cell">{{ row.endLabel }}</text>
			</view>
			<view class="report-history-list__metrics-group">
				<text class="report-history-list__cell">{{ row.cycleLabel || '-' }}</text>
				<text class="report-history-list__cell">{{ row.durationLabel }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ReportHistoryList',
		props: {
			rows: {
				type: Array,
				default: () => []
			}
		}
	};
</script>

<style lang="scss">
	.report-history-list {
		display: flex;
		flex-direction: column;
		padding: 20rpx 24rpx 12rpx;
	}

	.report-history-list__header,
	.report-history-list__row {
		display: flex;
		align-items: center;
		gap: 24rpx;
	}

	.report-history-list__header {
		padding-bottom: 16rpx;
	}

	.report-history-list__row {
		padding: 20rpx 0;
		border-top: 2rpx solid #f4ece2;
	}

	.report-history-list__year-cell {
		flex-shrink: 0;
		width: 72rpx;
		font-size: 26rpx;
		color: $text-muted;
	}

	.report-history-list__dates-group {
		flex-shrink: 0;
		display: flex;
		gap: 12rpx;
	}

	.report-history-list__dates-group > .report-history-list__header-cell,
	.report-history-list__dates-group > .report-history-list__cell {
		width: 88rpx;
	}

	.report-history-list__metrics-group {
		margin-left: auto;
		flex-shrink: 0;
		display: flex;
		gap: 12rpx;
	}

	.report-history-list__metrics-group > .report-history-list__header-cell,
	.report-history-list__metrics-group > .report-history-list__cell {
		width: 68rpx;
		text-align: right;
	}

	.report-history-list__header-cell {
		font-size: 26rpx;
		font-weight: $font-weight-medium;
		color: $text-muted;
	}

	.report-history-list__cell {
		font-size: 28rpx;
		color: $text-primary;
	}
</style>
