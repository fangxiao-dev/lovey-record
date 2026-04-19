<template>
	<view class="header-nav">
		<view
			class="header-nav__button"
			:class="{
				'header-nav__button--textual': true,
				'header-nav__button--focused': focusedMode,
				'header-nav__button--invalid': focusedMode && prevInvalid
			}"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handlePrev"
		>
			<view class="header-nav__focused-icon header-nav__focused-icon--prev"></view>
			<text class="header-nav__button-label">{{ leadingLabel }}</text>
			<view
				v-if="inlineMessage && inlineMessageSide === 'prev'"
				class="header-nav__bubble header-nav__bubble--prev"
				@tap="handleCloseBubble"
			>
				<text class="header-nav__bubble-text">{{ inlineMessage }}</text>
				<view class="header-nav__bubble-arrow header-nav__bubble-arrow--prev"></view>
			</view>
		</view>
		<view class="header-nav__title-group">
			<text v-if="startYearLabel" class="header-nav__year header-nav__year--start">{{ startYearLabel }}</text>
			<text class="header-nav__month">{{ monthLabel }}</text>
			<text v-if="endYearLabel" class="header-nav__year header-nav__year--end">{{ endYearLabel }}</text>
		</view>
		<view
			class="header-nav__button header-nav__button--next"
			:class="{
				'header-nav__button--textual': true,
				'header-nav__button--focused': focusedMode,
				'header-nav__button--invalid': focusedMode && nextInvalid
			}"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handleNext"
		>
			<text class="header-nav__button-label">{{ trailingLabel }}</text>
			<view class="header-nav__focused-icon"></view>
			<view v-if="inlineMessage && inlineMessageSide === 'next'" class="header-nav__bubble header-nav__bubble--next" @tap.stop="handleCloseBubble">
				<text class="header-nav__bubble-text">{{ inlineMessage }}</text>
				<view class="header-nav__bubble-arrow header-nav__bubble-arrow--next"></view>
			</view>
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
			startYearLabel: {
				type: String,
				default: ''
			},
			endYearLabel: {
				type: String,
				default: ''
			},
			leadingLabel: {
				type: String,
				default: '‹'
			},
			trailingLabel: {
				type: String,
				default: '›'
			},
			focusedMode: {
				type: Boolean,
				default: false
			},
			nextInvalid: {
				type: Boolean,
				default: false
			},
			prevInvalid: {
				type: Boolean,
				default: false
			},
			inlineMessage: {
				type: String,
				default: ''
			},
			inlineMessageSide: {
				type: String,
				default: 'next'
			},
			busy: {
				type: Boolean,
				default: false
			}
		},
		emits: ['prev', 'next', 'close-message'],
		methods: {
			handlePrev() {
				if (this.busy) return;
				this.$emit('prev');
			},
			handleNext() {
				if (this.busy) return;
				this.$emit('next');
			},
			handleCloseBubble() {
				this.$emit('close-message');
			}
		}
	};
</script>

<style lang="scss">
	.header-nav {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-template-rows: auto;
		align-items: center;
		column-gap: $space-3;
		position: relative;
	}

	.header-nav__title-group {
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
		position: relative;
		height: 60rpx;
	}

	.header-nav__button {
		grid-row: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 60rpx;
		min-height: 60rpx;
		padding: 12rpx;
		border-radius: 20rpx;
		background: #f3eee7;
	}

	.header-nav__button--textual {
		min-width: 132rpx;
		padding: 0 14rpx;
		background: transparent;
		gap: 8rpx;
	}

	.header-nav__button--focused {
		min-width: 144rpx;
	}

	.header-nav__button--invalid {
		opacity: 0.45;
	}

	.header-nav__button:first-child {
		grid-column: 1;
	}

	.header-nav__button:nth-of-type(2) {
		grid-column: 3;
		justify-self: end;
	}

	.header-nav__button-label {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
		white-space: nowrap;
	}

	.header-nav__focused-icon {
		width: 36rpx;
		height: 36rpx;
		flex-shrink: 0;
		background-color: $text-primary;
		mask-image: url('/static/menstrual/header-nav-next.svg');
		mask-repeat: no-repeat;
		mask-position: center;
		mask-size: contain;
		-webkit-mask-image: url('/static/menstrual/header-nav-next.svg');
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
		-webkit-mask-size: contain;
	}

	.header-nav__focused-icon--prev {
		transform: scaleX(-1);
	}

	.header-nav__month {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: 34rpx;
		line-height: 1;
		font-weight: 700;
		letter-spacing: 1rpx;
		color: $text-primary;
		text-align: center;
		white-space: nowrap;
		max-width: 100%;
	}

	.header-nav__year {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-muted;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.header-nav__year--start {
		left: 0;
		text-align: left;
	}

	.header-nav__year--end {
		right: 0;
		text-align: right;
	}

	.header-nav__button--next {
		position: relative;
	}

	.header-nav__button:first-child {
		position: relative;
	}

	.header-nav__bubble {
		position: absolute;
		bottom: calc(100% + 14rpx);
		background: #8b6f63;
		border-radius: 14rpx;
		padding: 12rpx 18rpx;
		pointer-events: auto;
		z-index: 10;
		white-space: nowrap;
	}

	.header-nav__bubble--next {
		right: 0;
	}

	.header-nav__bubble--prev {
		left: 0;
	}

	.header-nav__bubble-text {
		font-size: 22rpx;
		line-height: 1.3;
		color: #fff;
	}

	.header-nav__bubble-arrow {
		position: absolute;
		top: 100%;
		width: 0;
		height: 0;
		border-left: 10rpx solid transparent;
		border-right: 10rpx solid transparent;
		border-top: 10rpx solid #8b6f63;
	}

	.header-nav__bubble-arrow--next {
		right: 20rpx;
	}

	.header-nav__bubble-arrow--prev {
		left: 20rpx;
	}
</style>
