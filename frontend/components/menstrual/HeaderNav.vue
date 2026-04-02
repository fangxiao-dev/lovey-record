<template>
	<view class="header-nav">
		<view
			class="header-nav__button"
			:class="{ 'ui-pressable--busy': busy }"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handlePrev"
		>
			<text class="header-nav__button-label">{{ leadingLabel }}</text>
		</view>
		<text class="header-nav__month">{{ monthLabel }}</text>
		<view
			class="header-nav__button"
			:class="{ 'ui-pressable--busy': busy }"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handleNext"
		>
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
				default: '‹'
			},
			trailingLabel: {
				type: String,
				default: '›'
			},
			busy: {
				type: Boolean,
				default: false
			}
		},
		emits: ['prev', 'next'],
		methods: {
			handlePrev() {
				if (this.busy) return;
				this.$emit('prev');
			},
			handleNext() {
				if (this.busy) return;
				this.$emit('next');
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
		min-width: 48rpx;
		min-height: 48rpx;
		padding: 8rpx 10rpx;
		border-radius: 20rpx;
		background: #f3eee7;
	}

	.header-nav__button-label {
		font-size: 22rpx;
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
