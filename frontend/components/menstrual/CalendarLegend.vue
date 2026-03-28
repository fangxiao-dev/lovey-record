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
				<svg
					v-if="item.marker === 'eye'"
					class="calendar-legend__marker-svg"
					viewBox="0 0 24 24"
				>
					<path
						d="M2 12C4.2 8.15 7.78 6 12 6s7.8 2.15 10 6c-2.2 3.85-5.78 6-10 6S4.2 15.85 2 12Z"
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.9"
					/>
					<circle
						cx="12"
						cy="12"
						r="3.1"
						fill="none"
						stroke="currentColor"
						stroke-width="1.9"
					/>
				</svg>
			</view>
			<text class="calendar-legend__label">{{ item.label }}</text>
		</view>
	</view>
</template>

<script>
	import { createCalendarLegendItems } from './calendar-legend-data.js';

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
			}
		}
	};
</script>

<style lang="scss">
	.calendar-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: $space-5;
		row-gap: $space-3;
	}

	.calendar-legend__item {
		display: inline-flex;
		align-items: center;
		gap: $space-2;
	}

	.calendar-legend__marker {
		width: 24rpx;
		height: 24rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999rpx;
		flex-shrink: 0;
	}

	.calendar-legend__marker--fill {
		background: currentColor;
	}

	.calendar-legend__marker--period {
		color: $accent-period;
	}

	.calendar-legend__marker--prediction {
		color: $accent-prediction;
	}

	.calendar-legend__marker--special {
		color: $accent-period;
	}

	.calendar-legend__marker--eye {
		background: transparent;
	}

	.calendar-legend__marker-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.calendar-legend__label {
		font-family: $font-family-body;
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}
</style>
