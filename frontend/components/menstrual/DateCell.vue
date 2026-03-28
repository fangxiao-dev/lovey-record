<template>
	<view class="date-cell" :class="rootClasses">
		<text class="date-cell__label" :class="labelClasses">{{ label }}</text>
		<view class="date-cell__marker-slot" aria-hidden="true">
			<view v-if="usesSpecialMarker" class="date-cell__marker-icon" :class="markerClasses">
				<svg class="date-cell__marker-svg" viewBox="0 0 24 24" aria-hidden="true">
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
			<view v-else class="date-cell__marker-placeholder"></view>
		</view>
	</view>
</template>

<script>
	import { dateCellVariants } from './date-cell-state.js';
	import { getDateCellViewModel } from './date-cell-view-model.js';

	export default {
		name: 'DateCell',
		props: {
			label: {
				type: [String, Number],
				required: true
			},
			variant: {
				type: String,
				default: 'default',
				validator(value) {
					return dateCellVariants.includes(value);
				}
			}
		},
		computed: {
			viewModel() {
				return getDateCellViewModel(this.variant);
			},
			rootClasses() {
				return this.viewModel.rootClasses;
			},
			labelClasses() {
				return this.viewModel.labelClasses;
			},
			markerClasses() {
				return this.viewModel.markerClasses;
			},
			usesSpecialMarker() {
				return this.viewModel.usesSpecialMarker;
			}
		}
	};
</script>

<style lang="scss">
	.date-cell {
		width: 100%;
		height: 112rpx;
		padding: 24rpx 0 0;
		border: 2rpx solid transparent;
		border-radius: 26rpx;
		background: transparent;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 10rpx;
		box-sizing: border-box;
		min-width: 0;
	}

	.date-cell--circle {
		border-radius: 999rpx;
	}

	.date-cell--bg-period {
		background: $accent-period;
	}

	.date-cell--bg-period-soft {
		background: $accent-period-soft;
	}

	.date-cell--bg-prediction {
		background: $accent-prediction;
	}

	.date-cell--border-today {
		border-color: transparent;
	}

	.date-cell--selected {
		box-shadow: $shadow-selected;
	}

	.date-cell--stroke-selected {
		border-color: $border-strong;
	}

	.date-cell--stroke-today {
		border-color: $border-today;
	}

	.date-cell__marker-slot {
		width: 100%;
		min-height: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.date-cell__marker-placeholder,
	.date-cell__marker-icon {
		width: 24rpx;
		height: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.date-cell__marker-placeholder {
		opacity: 0;
	}

	.date-cell__marker-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.date-cell__marker-icon--period {
		color: $accent-period;
	}

	.date-cell__marker-icon--period-contrast {
		color: $accent-period-contrast;
	}

	.date-cell__label {
		min-width: 0;
		text-align: center;
		line-height: 1;
		font-family: $font-family-body;
		font-size: 28rpx;
		font-weight: $font-weight-strong;
	}

	.date-cell__label--primary {
		color: $text-primary;
	}

	.date-cell__label--secondary {
		color: $text-secondary;
	}

	.date-cell__label--muted {
		color: $text-muted;
	}

	.date-cell__label--period-contrast {
		color: $accent-period-contrast;
	}
</style>
