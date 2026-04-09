<template>
	<view class="header-nav">
		<view
			class="header-nav__button"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handlePrev"
		>
			<image
				class="header-nav__button-icon"
				src="/static/icons/header-nav-left-arrow.svg"
				mode="aspectFit"
			/>
		</view>
		<text class="header-nav__month">{{ monthLabel }}</text>
		<view
			class="header-nav__button"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handleNext"
		>
			<image
				class="header-nav__button-icon header-nav__button-icon--next"
				src="/static/icons/header-nav-left-arrow.svg"
				mode="aspectFit"
			/>
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
		min-width: 60rpx;
		min-height: 60rpx;
		padding: 12rpx;
		border-radius: 20rpx;
		background: #f3eee7;
	}

	.header-nav__button-icon {
		width: 24rpx;
		height: 24rpx;
	}

	.header-nav__button-icon--next {
		transform: scaleX(-1);
	}

	.header-nav__month {
		font-size: 34rpx;
		line-height: 1;
		font-weight: 700;
		letter-spacing: 1rpx;
		color: $text-primary;
	}
</style>
