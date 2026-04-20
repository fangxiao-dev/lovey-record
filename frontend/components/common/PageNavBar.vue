<template>
	<view class="page-nav-bar">
		<!-- Status bar spacer -->
		<view class="page-nav-bar__status" :style="{ height: statusBarHeight + 'px' }" />
		<!-- Nav content row -->
		<view class="page-nav-bar__content">
			<view
				v-if="showBack"
				class="page-nav-bar__back"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="handleBack"
			>
				<image class="page-nav-bar__back-icon" src="/static/icons/return.svg" mode="aspectFit" />
			</view>
			<view v-else class="page-nav-bar__back page-nav-bar__back--placeholder" />

			<view class="page-nav-bar__center">
				<image
					v-if="iconSrc"
					class="page-nav-bar__icon"
					:src="iconSrc"
					mode="aspectFit"
				/>
				<text class="page-nav-bar__title" :class="{ 'page-nav-bar__title--large': largeTitle }">{{ title }}</text>
			</view>

			<view class="page-nav-bar__back page-nav-bar__back--placeholder" />
		</view>
	</view>
</template>

<script>
	export default {
		name: 'PageNavBar',
		props: {
			title: {
				type: String,
				required: true
			},
			iconSrc: {
				type: String,
				default: ''
			},
			showBack: {
				type: Boolean,
				default: false
			},
			largeTitle: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				statusBarHeight: 20
			};
		},
		created() {
			try {
				const info = uni.getSystemInfoSync();
				this.statusBarHeight = info.statusBarHeight ?? 20;
			} catch (_) {}
		},
		methods: {
			handleBack() {
				uni.navigateBack({
					delta: 1,
					fail: () => {
						uni.reLaunch({ url: '/pages/index/index' });
					}
				});
			}
		}
	};
</script>

<style lang="scss">
	.page-nav-bar {
		width: 100%;
		background: $bg-base;
	}

	.page-nav-bar__status {
		width: 100%;
	}

	.page-nav-bar__content {
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 32rpx;
	}

	.page-nav-bar__back {
		width: 56rpx;
		height: 56rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.page-nav-bar__back--placeholder {
		opacity: 0;
		pointer-events: none;
	}

	.page-nav-bar__back-icon {
		width: 34rpx;
		height: 34rpx;
		flex-shrink: 0;
	}

	.page-nav-bar__center {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		min-width: 0;
	}

	.page-nav-bar__icon {
		width: 44rpx;
		height: 44rpx;
		flex-shrink: 0;
		border-radius: 50%;
	}

	.page-nav-bar__title {
		font-size: $font-size-title-sm;
		font-weight: $font-weight-title;
		color: $text-primary;
		line-height: 1;
	}

	.page-nav-bar__title--large {
		font-size: 32rpx;
	}
</style>
