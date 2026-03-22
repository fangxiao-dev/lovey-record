<template>
	<view class="module-space">
		<view class="hero-card">
			<view class="hero-header">
				<view>
					<text class="hero-title">记录空间</text>
					<text class="hero-subtitle">先看模块位置，再进入具体记录。</text>
				</view>
				<view class="status-tag">
					<text class="status-tag__text">MVP</text>
				</view>
			</view>
			<text class="hero-copy">私人和共享都指向同一个模块实例，当前首页先承接模块分布与入口信息。</text>
		</view>

		<view class="zone-board">
			<view class="zone-card">
				<view class="zone-card__header">
					<text class="zone-card__title">私人</text>
					<text class="zone-card__caption">owner 视角</text>
				</view>
				<view class="zone-card__body">
					<view class="module-tile is-private">
						<view class="module-tile__icon">
							<text class="module-tile__icon-text">经</text>
						</view>
						<view class="module-tile__meta">
							<text class="module-tile__title">月经记录</text>
							<text class="module-tile__hint">未共享</text>
						</view>
					</view>
				</view>
			</view>

			<view class="zone-card">
				<view class="zone-card__header">
					<text class="zone-card__title">共享</text>
					<text class="zone-card__caption">shared 入口</text>
				</view>
				<view class="zone-card__body zone-card__body--empty">
					<text class="zone-card__empty">拖入后在这里呈现共享模块</text>
				</view>
			</view>
		</view>

		<view class="info-panel">
			<view class="info-panel__header">
				<text class="info-panel__title">模块信息区</text>
				<text class="info-panel__state">静态壳</text>
			</view>
			<text class="info-panel__summary">轻击模块后，这里展示摘要、进入模块和共享相关动作。当前版本先固定展示首页说明。</text>
			<view class="info-actions">
				<view class="info-action info-action--primary">
					<text class="info-action__text info-action__text--primary">进入模块</text>
				</view>
				<view class="info-action">
					<text class="info-action__text">改为共享</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ModuleSpacePage'
	}
</script>

<style>
	page {
		background: #faf7f2;
	}

	.module-space {
		min-height: 100vh;
		padding: 32rpx;
		background: #faf7f2;
		box-sizing: border-box;
	}

	.hero-card,
	.zone-card,
	.info-panel {
		background: #ffffff;
		border-radius: 28rpx;
		box-sizing: border-box;
	}

	.hero-card {
		padding: 32rpx;
		margin-bottom: 24rpx;
	}

	.hero-header,
	.zone-card__header,
	.info-panel__header,
	.info-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.hero-title,
	.zone-card__title,
	.info-panel__title,
	.module-tile__title {
		display: block;
		color: #2f2a26;
	}

	.hero-title {
		font-size: 40rpx;
		font-weight: 600;
		margin-bottom: 8rpx;
	}

	.hero-subtitle,
	.hero-copy,
	.zone-card__caption,
	.zone-card__empty,
	.info-panel__summary,
	.module-tile__hint,
	.info-action__text,
	.status-tag__text,
	.info-panel__state {
		color: #72685f;
	}

	.hero-subtitle,
	.hero-copy,
	.info-panel__summary,
	.info-action__text {
		font-size: 26rpx;
		line-height: 1.6;
	}

	.hero-copy {
		margin-top: 24rpx;
	}

	.status-tag,
	.info-panel__state {
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		background: #f3eee7;
	}

	.status-tag__text,
	.info-panel__state {
		font-size: 22rpx;
	}

	.zone-board {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.zone-card {
		padding: 28rpx;
	}

	.zone-card__title {
		font-size: 30rpx;
		font-weight: 600;
	}

	.zone-card__caption {
		font-size: 22rpx;
	}

	.zone-card__body {
		margin-top: 24rpx;
		border: 2rpx solid #eadfd6;
		border-radius: 24rpx;
		padding: 24rpx;
		background: #fcfaf7;
		min-height: 180rpx;
		box-sizing: border-box;
	}

	.zone-card__body--empty {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zone-card__empty {
		font-size: 24rpx;
	}

	.module-tile {
		display: flex;
		align-items: center;
		padding: 22rpx 24rpx;
		border-radius: 22rpx;
		background: #ffffff;
		border: 2rpx solid #e6ded5;
	}

	.module-tile__icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: #f3d7d1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.module-tile__icon-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #c9786a;
	}

	.module-tile__meta {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.module-tile__title {
		font-size: 28rpx;
		font-weight: 600;
	}

	.module-tile__hint {
		font-size: 22rpx;
	}

	.info-panel {
		margin-top: 24rpx;
		padding: 28rpx;
	}

	.info-panel__title {
		font-size: 30rpx;
		font-weight: 600;
	}

	.info-panel__summary {
		display: block;
		margin-top: 18rpx;
	}

	.info-actions {
		margin-top: 24rpx;
		gap: 16rpx;
		justify-content: flex-start;
	}

	.info-action {
		padding: 18rpx 28rpx;
		border-radius: 999rpx;
		background: #f3eee7;
	}

	.info-action--primary {
		background: #c9786a;
	}

	.info-action__text--primary {
		color: #ffffff;
	}
</style>
