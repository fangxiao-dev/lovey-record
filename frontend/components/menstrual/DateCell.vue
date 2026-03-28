<template>
	<view class="date-cell" :class="rootClasses">
		<view class="date-cell__marker-slot" aria-hidden="true">
			<view class="date-cell__marker-eye" :class="markerClasses"></view>
		</view>
		<text class="date-cell__label" :class="labelClasses">{{ label }}</text>
	</view>
</template>

<script>
	import {
		dateCellVariants,
		getDateCellPresentation
	} from './date-cell-state.js';

	const TOKEN_CLASS_MAP = {
		'accent.period': 'date-cell--bg-period',
		'accent.prediction': 'date-cell--bg-prediction',
		'border.today': 'date-cell--border-today',
		'shadow.selected': 'date-cell--selected',
		'text.primary': 'date-cell__label--primary',
		'text.secondary': 'date-cell__label--secondary',
		'text.muted': 'date-cell__label--muted',
		'accent.period.contrast': 'date-cell__label--period-contrast',
		'marker:accent.period': 'date-cell__marker-eye--period',
		'marker:accent.period.contrast': 'date-cell__marker-eye--period-contrast'
	};

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
			presentation() {
				return getDateCellPresentation(this.variant);
			},
			rootClasses() {
				const classes = [];

				if (this.presentation.shape === 'circle') {
					classes.push('date-cell--circle');
				}

				if (this.presentation.backgroundToken) {
					classes.push(TOKEN_CLASS_MAP[this.presentation.backgroundToken]);
				}

				if (this.presentation.borderToken) {
					classes.push(TOKEN_CLASS_MAP[this.presentation.borderToken]);
				}

				if (this.presentation.shadowToken) {
					classes.push(TOKEN_CLASS_MAP[this.presentation.shadowToken]);
				}

				return classes.filter(Boolean);
			},
			labelClasses() {
				return [TOKEN_CLASS_MAP[this.presentation.textToken]].filter(Boolean);
			},
			markerClasses() {
				const classes = ['date-cell__marker-eye--placeholder'];

				if (this.presentation.usesSpecialMarker && this.presentation.markerToken) {
					return [
						'date-cell__marker-eye--visible',
						TOKEN_CLASS_MAP[`marker:${this.presentation.markerToken}`]
					].filter(Boolean);
				}

				return classes;
			}
		}
	};
</script>

<style lang="scss">
	.date-cell {
		width: 96rpx;
		min-height: 96rpx;
		padding: $space-2 0;
		border: 2rpx solid transparent;
		border-radius: $radius-field;
		background: transparent;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: $space-1;
		box-sizing: border-box;
	}

	.date-cell--circle {
		border-radius: 999rpx;
	}

	.date-cell--bg-period {
		background: $accent-period;
	}

	.date-cell--bg-prediction {
		background: $accent-prediction;
	}

	.date-cell--border-today {
		border-color: $border-today;
	}

	.date-cell--selected {
		box-shadow: $shadow-selected;
	}

	.date-cell__marker-slot {
		width: 100%;
		height: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.date-cell__marker-eye {
		width: 20rpx;
		height: 12rpx;
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
		width: 4rpx;
		height: 4rpx;
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
		@include text-body();
		min-width: 48rpx;
		text-align: center;
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
