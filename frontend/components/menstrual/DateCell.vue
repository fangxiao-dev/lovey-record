<template>
	<view class="date-cell" :class="rootClasses">
		<text class="date-cell__label" :class="labelClasses">{{ label }}</text>
		<view class="date-cell__marker-slot" aria-hidden="true">
			<view class="date-cell__marker-eye" :class="markerClasses"></view>
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
			}
		}
	};
</script>

<style lang="scss">
	.date-cell {
		width: 132rpx;
		height: 132rpx;
		padding: 0;
		border: 2rpx solid transparent;
		border-radius: 26rpx;
		background: transparent;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		box-sizing: border-box;
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
		height: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 12rpx;
	}

	.date-cell__marker-eye {
		width: 24rpx;
		height: 14rpx;
		border: 2rpx solid transparent;
		border-radius: 999rpx;
		position: relative;
		box-sizing: border-box;
		opacity: 0;
	}

	.date-cell__marker-eye::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 5rpx;
		height: 5rpx;
		border-radius: 999rpx;
		background: currentColor;
		transform: translate(-50%, -50%);
	}

	.date-cell__marker-eye--placeholder {
		opacity: 0;
	}

	.date-cell__marker-eye--visible {
		opacity: 1;
	}

	.date-cell__marker-eye--period {
		border-color: $accent-period;
		color: $accent-period;
	}

	.date-cell__marker-eye--period-contrast {
		border-color: $accent-period-contrast;
		color: $accent-period-contrast;
	}

	.date-cell__label {
		min-width: 56rpx;
		text-align: center;
		margin-top: 34rpx;
		line-height: 1;
		font-family: $font-family-body;
		font-size: 44rpx;
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
