<template>
	<view class="management-legend-chip">
		<view class="management-legend-chip__dot" :class="`management-legend-chip__dot--${tone}`"></view>
		<text class="management-legend-chip__text">{{ label }}</text>
	</view>
</template>

<script>
	export default {
		name: 'SharedLegendChip',
		props: {
			label: {
				type: String,
				required: true
			},
			tone: {
				type: String,
				default: 'shared'
			}
		}
	};
</script>

<style lang="scss">
	$management-shared-green: #6bb98e;

	.management-legend-chip {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 14rpx;
		border-radius: 999rpx;
		background: $bg-subtle;
	}

	.management-legend-chip__dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 999rpx;
	}

	.management-legend-chip__dot--shared {
		background: $management-shared-green;
	}

	.management-legend-chip__text {
		font-size: 20rpx;
		line-height: 1;
		color: $text-secondary;
	}
</style>
