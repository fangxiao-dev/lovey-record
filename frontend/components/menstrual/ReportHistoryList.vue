<template>
	<view class="report-history-list ui-card">
		<view class="report-history-list__header">
			<text class="report-history-list__header-cell">开始</text>
			<text class="report-history-list__header-cell">结束</text>
			<text class="report-history-list__header-cell">时长</text>
			<text class="report-history-list__header-cell">周期</text>
		</view>

		<view
			v-for="row in rows"
			:key="row.key"
			class="report-history-list__row"
		>
			<text class="report-history-list__cell">{{ row.startLabel }}</text>
			<text class="report-history-list__cell">{{ row.endLabel }}</text>
			<text class="report-history-list__cell">{{ row.durationLabel }}</text>
			<text class="report-history-list__cell">{{ row.cycleLabel || '-' }}</text>
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
		display: grid;
		grid-template-columns: 1fr 1fr 96rpx 96rpx;
		column-gap: 12rpx;
		align-items: center;
	}

	.report-history-list__header {
		padding-bottom: 12rpx;
	}

	.report-history-list__row {
		padding: 16rpx 0;
		border-top: 2rpx solid #f4ece2;
	}

	.report-history-list__header-cell {
		font-size: 20rpx;
		color: $text-muted;
	}

	.report-history-list__cell {
		font-size: 22rpx;
		color: $text-primary;
	}
</style>
