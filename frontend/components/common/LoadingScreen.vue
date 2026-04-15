<template>
	<view class="loading-screen">
		<view class="loading-screen__spinner" />
		<text class="loading-screen__text">{{ errorMessage ? '加载失败' : '加载中' }}</text>
		<view
			v-if="errorMessage"
			class="loading-screen__retry"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="$emit('retry')"
		>
			<text class="loading-screen__retry-label">重新加载</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'LoadingScreen',
	props: {
		errorMessage: {
			type: String,
			default: ''
		}
	},
	emits: ['retry']
};
</script>

<style scoped lang="scss">
$text-primary: #000000;
$accent-period: #ff6b7a;
$accent-period-contrast: #ffffff;

.loading-screen {
	display: flex;
	flex-direction: column;
	gap: 32rpx;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 32rpx;
	background: #ffffff;
}

.loading-screen__spinner {
	width: 48rpx;
	height: 48rpx;
	border: 4rpx solid #f0f0f0;
	border-top-color: $accent-period;
	border-radius: 50%;
	animation: loading-spin 0.8s linear infinite;
}

.loading-screen__text {
	font-size: 28rpx;
	font-weight: 500;
	color: $text-primary;
}

.loading-screen__retry {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 72rpx;
	padding: 0 24rpx;
	border-radius: 24rpx;
	background: $accent-period;
	margin-top: 16rpx;
}

.loading-screen__retry-label {
	font-size: 24rpx;
	line-height: 1;
	font-weight: 600;
	color: $accent-period-contrast;
}

@keyframes loading-spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
