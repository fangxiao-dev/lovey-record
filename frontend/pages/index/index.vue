<template>
	<view class="module-space u-page-shell">
		<view class="hero-card ui-card u-page-section">
			<view class="hero-header ui-card__header">
				<view>
					<text class="hero-title u-text-title-lg">记录空间</text>
					<text class="hero-subtitle u-text-body-secondary">先看模块位置，再进入具体记录。</text>
				</view>
				<view class="status-tag ui-badge">
					<text class="status-tag__text ui-badge__text">MVP</text>
				</view>
			</view>
			<text class="hero-copy u-text-body-secondary">私人和共享都指向同一个模块实例，当前首页先承接模块分布与入口信息。</text>
		</view>

		<view class="zone-board ui-page-container u-page-section">
			<view class="zone-card ui-card">
				<view class="zone-card__header ui-card__header">
					<text class="zone-card__title u-text-title-sm">私人</text>
					<text class="zone-card__caption u-text-caption">owner 视角</text>
				</view>
				<view class="zone-card__body">
					<view class="module-tile ui-list-item is-private">
						<view class="module-tile__icon">
							<text class="module-tile__icon-text">经</text>
						</view>
						<view class="module-tile__meta">
							<text class="module-tile__title u-text-body">月经记录</text>
							<text class="module-tile__hint u-text-caption">未共享</text>
						</view>
					</view>
				</view>
			</view>

			<view class="zone-card ui-card">
				<view class="zone-card__header ui-card__header">
					<text class="zone-card__title u-text-title-sm">共享</text>
					<text class="zone-card__caption u-text-caption">shared 入口</text>
				</view>
				<view class="zone-card__body zone-card__body--empty">
					<text class="zone-card__empty u-text-caption">拖入后在这里呈现共享模块</text>
				</view>
			</view>
		</view>

		<view class="info-panel ui-card u-page-section">
			<view class="info-panel__header ui-card__header">
				<text class="info-panel__title u-text-title-sm">模块信息区</text>
				<text class="info-panel__state ui-badge__text">静态壳</text>
			</view>
			<text class="info-panel__summary u-text-body-secondary">轻击模块后，这里展示摘要、进入模块和共享相关动作。当前版本先固定展示首页说明。</text>
			<view class="info-actions">
				<view class="info-action ui-button ui-button--primary info-action--primary">
					<text class="info-action__text ui-button__text info-action__text--primary">进入模块</text>
				</view>
				<view class="info-action ui-button ui-button--secondary">
					<text class="info-action__text ui-button__text">改为共享</text>
				</view>
			</view>
			<navigator class="showcase-entry" url="/pages/menstrual/home">
				<text class="showcase-entry__text u-text-caption">打开月经首页</text>
			</navigator>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ModuleSpacePage'
	}
</script>

<style lang="scss">
	.module-space {
		padding-bottom: $space-12;
	}

	.hero-copy {
		margin-top: $space-6;
	}

	.zone-board {
		gap: $section-gap;
	}

	.zone-card__body {
		margin-top: $space-6;
		border: 2rpx solid $border-subtle;
		border-radius: $radius-card;
		padding: $card-padding;
		background: $bg-subtle;
		min-height: 180rpx;
		box-sizing: border-box;
	}

	.zone-card__body--empty {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zone-card__empty {
		text-align: center;
	}

	.module-tile {
		padding-top: $space-3;
		padding-bottom: $space-3;
	}

	.module-tile__icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: $radius-field;
		background: $accent-period-soft;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: $space-5;
		flex-shrink: 0;
	}

	.module-tile__icon-text {
		font-size: $font-size-body-lg;
		font-weight: $font-weight-title;
		color: $accent-period;
	}

	.module-tile__meta {
		display: flex;
		flex-direction: column;
		gap: $space-1;
	}

	.info-panel__summary {
		display: block;
		margin-top: $space-4;
	}

	.info-actions {
		margin-top: $space-6;
		gap: $space-4;
		justify-content: flex-start;
	}

	.showcase-entry {
		display: inline-flex;
		margin-top: $space-4;
		padding: $space-2 0;
	}

	.showcase-entry__text {
		color: $text-secondary;
	}

	.info-action__text--primary {
		color: $text-inverse;
	}
</style>
