<template>
	<view class="calendar-legend">
		<view
			v-for="item in resolvedItems"
			:key="item.key"
			class="calendar-legend__item"
		>
			<view
				class="calendar-legend__marker"
				:class="markerClasses(item)"
				aria-hidden="true"
			>
				<image
					v-if="item.marker === 'eye'"
					class="calendar-legend__marker-image"
					:src="markerSrc(item)"
					mode="aspectFit"
				/>
			</view>
			<text class="calendar-legend__label">{{ item.label }}</text>
		</view>
	</view>
</template>

<script>
	import { createCalendarLegendItems } from './calendar-legend-data.js';
	import { getMarkerAssetSrc } from './marker-assets.js';

	export default {
		name: 'CalendarLegend',
		props: {
			items: {
				type: Array,
				default() {
					return createCalendarLegendItems();
				}
			}
		},
		computed: {
			resolvedItems() {
				return this.items.length ? this.items : createCalendarLegendItems();
			}
		},
		methods: {
			markerClasses(item) {
				return [
					`calendar-legend__marker--${item.tone}`,
					`calendar-legend__marker--${item.marker}`
				];
			},
			markerSrc(item) {
				return item.marker === 'eye' ? getMarkerAssetSrc('accent.period') : null;
			}
		}
	};
</script>

<style lang="scss">
	.calendar-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: 24rpx;
		row-gap: 8rpx;
	}

	.calendar-legend__item {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
	}

	.calendar-legend__marker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		flex-shrink: 0;
	}

	.calendar-legend__marker--fill {
		width: 20rpx;
		height: 20rpx;
		background: currentColor;
	}

	.calendar-legend__marker--period {
		color: $accent-period;
	}

	.calendar-legend__marker--prediction {
		color: $accent-prediction;
	}

	.calendar-legend__marker--detail {
		color: $accent-period;
	}

	.calendar-legend__marker--eye {
		width: 24rpx;
		height: 24rpx;
		background: transparent;
	}

	.calendar-legend__marker-image {
		width: 100%;
		height: 100%;
		display: block;
	}

	.calendar-legend__label {
		font-family: $font-family-body;
		font-size: 22rpx;
		line-height: 22rpx;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}
</style>
