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

		<view v-if="activeSeries.hasMinimumPoints" class="report-trend-card__chart-wrapper">
			<view class="report-trend-card__y-axis">
				<text
					v-for="label in yAxisLabels"
					:key="label.text"
					class="report-trend-card__y-label"
					:style="{ bottom: label.bottom + 'rpx' }"
				>{{ label.text }}</text>
			</view>
			<view class="report-trend-card__chart-body">
				<view class="report-trend-card__track">
					<view
						class="report-trend-card__average-line"
						:style="{ bottom: averagePointOffset + 'rpx' }"
					/>
					<view
						v-for="point in normalizedPoints"
						:key="point.key"
						class="report-trend-card__point-column"
					>
						<view
							class="report-trend-card__point-dot"
							:style="{ bottom: point.pointOffset + 'rpx' }"
						/>
					</view>
				</view>
				<view class="report-trend-card__x-axis">
					<text
						v-for="point in normalizedPoints"
						:key="point.key"
						class="report-trend-card__point-label"
					>{{ point.label }}</text>
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
					{ key: 'cycle', label: '周期' },
					{ key: 'duration', label: '时长' }
				];
			},
			activeSeries() {
				return this.activeKey === 'duration' ? this.durationSeries : this.cycleSeries;
			},
			yAxisInfo() {
				const points = this.activeSeries.points;
				if (!points.length) return { max: 0, mid: 0, min: 0 };
				const values = points.map(p => p.value);
				const rawMin = Math.min(...values);
				const rawMax = Math.max(...values);
				const min = this.activeKey === 'duration'
					? 0
					: (rawMin === rawMax ? rawMin - 1 : rawMin);
				const max = rawMin === rawMax
					? rawMax + 1
					: rawMax;
				const mid = Math.round((min + max) / 2);
				return { max, mid, min };
			},
			yAxisLabels() {
				const { min, max, mid } = this.yAxisInfo;
				const toBottom = (value) => {
					const range = max - min;
					if (range === 0) return 108;
					return Math.round(((value - min) / range) * 160 + 20) + 8;
				};
				return [
					{ text: max, bottom: toBottom(max) },
					{ text: mid, bottom: toBottom(mid) },
					{ text: min, bottom: toBottom(min) },
				];
			},
			normalizedPoints() {
				const { min, max } = this.yAxisInfo;
				const range = max - min;
				return this.activeSeries.points.map(point => ({
					...point,
					pointOffset: range > 0
						? Math.round(((point.value - min) / range) * 160 + 20)
						: 100
				}));
			},
			averagePointOffset() {
				const points = this.activeSeries.points;
				if (!points.length) return 100;
				const avg = points.reduce((sum, p) => sum + p.value, 0) / points.length;
				const { min, max } = this.yAxisInfo;
				const range = max - min;
				return range > 0 ? Math.round(((avg - min) / range) * 160 + 20) : 100;
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
		font-size: 30rpx;
		line-height: 1.4;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.report-trend-card__tabs {
		width: 320rpx;
	}

	.report-trend-card__tabs :deep(.segmented-control__label) {
		font-size: 28rpx;
	}

	.report-trend-card__chart-wrapper {
		display: flex;
		gap: 8rpx;
		padding-top: 8rpx;
	}

	.report-trend-card__y-axis {
		position: relative;
		width: 44rpx;
		height: 200rpx;
		flex-shrink: 0;
	}

	.report-trend-card__y-label {
		position: absolute;
		right: 0;
		transform: translateY(50%);
		font-size: 20rpx;
		color: $text-muted;
		line-height: 1;
	}

	.report-trend-card__chart-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.report-trend-card__track {
		position: relative;
		display: flex;
		align-items: stretch;
		justify-content: space-around;
		gap: 8rpx;
		height: 200rpx;
		border-left: 2rpx solid #f1e7dc;
		border-bottom: 2rpx solid #f1e7dc;
		padding-left: 8rpx;
	}

	.report-trend-card__average-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 2rpx;
		background: rgba(217, 132, 119, 0.5);
		pointer-events: none;
	}

	.report-trend-card__point-column {
		flex: 1;
		position: relative;
		max-width: 60rpx;
	}

	.report-trend-card__point-dot {
		position: absolute;
		left: 50%;
		width: 16rpx;
		height: 16rpx;
		transform: translateX(-50%);
		border-radius: 999rpx;
		background: #d98477;
		box-shadow: 0 0 0 6rpx rgba(217, 132, 119, 0.12);
	}

	.report-trend-card__x-axis {
		display: flex;
		justify-content: space-around;
		gap: 8rpx;
		padding-left: 8rpx;
	}

	.report-trend-card__point-label {
		flex: 1;
		font-size: 20rpx;
		color: $text-muted;
		text-align: center;
		max-width: 60rpx;
	}

	.report-trend-card__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 240rpx;
	}

	.report-trend-card__empty-copy {
		font-size: 26rpx;
		color: $text-muted;
	}
</style>
