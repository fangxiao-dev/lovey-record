<template>
	<view class="report-trend-card ui-card">
		<view class="report-trend-card__header">
			<text class="report-trend-card__label">趋势</text>
			<SegmentedControl
				class="report-trend-card__tabs"
				:options="trendOptions"
				:value="activeKey"
				@change="$emit('change', $event)"
			/>
		</view>

		<view v-if="activeSeries.hasMinimumPoints" class="report-trend-card__chart">
			<view class="report-trend-card__track">
				<view
					v-for="point in activeSeries.points"
					:key="point.key"
					class="report-trend-card__point-column"
				>
					<view class="report-trend-card__point" />
					<text class="report-trend-card__point-label">{{ point.label }}</text>
				</view>
			</view>
		</view>
		<view v-else class="report-trend-card__empty">
			<text class="report-trend-card__empty-copy">{{ emptyStateCopy }}</text>
		</view>
	</view>
</template>

<script>
	import SegmentedControl from './SegmentedControl.vue';

	export default {
		name: 'ReportTrendCard',
		components: {
			SegmentedControl
		},
		props: {
			activeKey: {
				type: String,
				default: 'cycle'
			},
			cycleSeries: {
				type: Object,
				default: () => ({ points: [], hasMinimumPoints: false })
			},
			durationSeries: {
				type: Object,
				default: () => ({ points: [], hasMinimumPoints: false })
			},
			emptyStateCopy: {
				type: String,
				default: '记录 3 次后开始有图'
			}
		},
		emits: ['change'],
		computed: {
			trendOptions() {
				return [
					{ key: 'cycle', label: 'Cycle' },
					{ key: 'duration', label: 'Duration' }
				];
			},
			activeSeries() {
				return this.activeKey === 'duration' ? this.durationSeries : this.cycleSeries;
			}
		}
	};
</script>

<style lang="scss">
	.report-trend-card {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		padding: 24rpx;
	}

	.report-trend-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.report-trend-card__label {
		font-size: 22rpx;
		color: $text-muted;
	}

	.report-trend-card__tabs {
		width: 280rpx;
	}

	.report-trend-card__chart {
		min-height: 240rpx;
		padding: 16rpx 8rpx 0;
	}

	.report-trend-card__track {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12rpx;
		min-height: 220rpx;
		padding-bottom: 8rpx;
		border-bottom: 2rpx solid #f1e7dc;
	}

	.report-trend-card__point-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: 14rpx;
	}

	.report-trend-card__point {
		width: 16rpx;
		height: 16rpx;
		border-radius: 999rpx;
		background: #d98477;
		box-shadow: 0 -84rpx 0 0 rgba(217, 132, 119, 0.22);
	}

	.report-trend-card__point-label {
		font-size: 18rpx;
		color: $text-muted;
	}

	.report-trend-card__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 240rpx;
	}

	.report-trend-card__empty-copy {
		font-size: 24rpx;
		color: $text-muted;
	}
</style>
