<template>
	<view
		class="module-tile"
		:class="{ 'module-tile--selected': selected }"
		hover-class="ui-pressable-hover"
		:hover-stay-time="70"
		@tap="$emit('select')"
	>
		<view v-if="showSharedDot" class="module-tile__status-dot" :class="`module-tile__status-dot--${ownershipTone}`"></view>
		<image class="module-tile__icon" :src="iconSrc" mode="aspectFit" />
		<text class="module-tile__title">{{ title }}</text>
	</view>
</template>

<script>
	export default {
		name: 'ModuleTileCompact',
		emits: ['select'],
		props: {
			title: {
				type: String,
				required: true
			},
			iconSrc: {
				type: String,
				required: true
			},
			ownershipTone: {
				type: String,
				default: 'private'
			},
			selected: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			showSharedDot() {
				return this.ownershipTone === 'shared';
			}
		}
	};
</script>

<style lang="scss">
	$management-shared-green: #6bb98e;

	.module-tile {
		position: relative;
		width: 200rpx;
		min-height: 136rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 16rpx 14rpx;
		border-radius: 22rpx;
		border: 2rpx solid transparent;
		background: $bg-subtle;
		box-sizing: border-box;
	}

	.module-tile--selected {
		border-color: rgba(216, 154, 141, 0.7);
		background: rgba(216, 154, 141, 0.12);
		box-shadow: 0 10rpx 20rpx rgba(216, 154, 141, 0.12);
	}

	.module-tile__status-dot {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		width: 24rpx;
		height: 24rpx;
		border-radius: 999rpx;
	}

	.module-tile__status-dot--shared {
		background: $management-shared-green;
	}

	.module-tile__icon {
		width: 56rpx;
		height: 56rpx;
	}

	.module-tile__title {
		font-size: 22rpx;
		line-height: 1.2;
		font-weight: $font-weight-title;
		color: $text-primary;
	}
</style>
