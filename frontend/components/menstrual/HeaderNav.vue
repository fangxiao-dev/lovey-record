<template>
	<view class="header-nav">
		<view class="header-nav__button" aria-hidden="true">
			<text class="header-nav__button-label">{{ leadingLabel }}</text>
		</view>
		<text class="header-nav__month">{{ monthLabel }}</text>
		<view class="header-nav__button" aria-hidden="true">
			<text class="header-nav__button-label">{{ trailingLabel }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'HeaderNav',
		props: {
			monthLabel: {
				type: String,
				required: true
			},
			leadingLabel: {
				type: String,
				default: '<'
			},
			trailingLabel: {
				type: String,
				default: '>'
			}
		}
	};
</script>

<style lang="scss">
	.header-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $space-3;
	}

	.header-nav__button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 52rpx;
		min-height: 52rpx;
		padding: 12rpx 16rpx;
		border-radius: 24rpx;
		background: #f3eee7;
	}

	.header-nav__button-label {
		font-size: 24rpx;
		line-height: 1;
		color: #72685f;
	}

	.header-nav__month {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}
</style>
