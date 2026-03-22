<template>
	<view class="token-playground u-page-shell">
		<view class="token-playground__hero ui-card u-page-section">
			<text class="u-text-title-md">Token Playground</text>
			<text class="u-text-body-secondary u-mt-md">
				当前以 H5 / web 预览为主，用来快速校准 token。后续如果要迁回微信端，再补小程序侧的兼容检查。
			</text>
		</view>

		<view class="token-nav ui-card u-page-section">
			<text class="u-text-title-sm">Sections</text>
			<view class="token-nav__list u-mt-lg">
				<view
					v-for="item in sectionNavItems"
					:key="item.target"
					class="ui-button ui-button--secondary token-nav__item"
					@click="scrollToSection(item.target)"
				>
					<text class="ui-button__text">{{ item.label }}</text>
				</view>
			</view>
		</view>

		<view id="colors" class="ui-card u-page-section">
			<text class="u-text-title-sm">Colors</text>
			<text class="u-text-body-secondary u-mt-md">优先检查语义色之间的层级关系，而不是单个色值本身。</text>
			<view class="token-grid u-mt-lg">
				<view v-for="item in colorItems" :key="item.name" class="token-grid__item">
					<view :class="['color-swatch', item.className]"></view>
					<text class="u-text-body">{{ item.name }}</text>
					<text class="u-text-caption">{{ item.description }}</text>
					<text class="u-text-caption-muted">{{ item.token }}</text>
				</view>
			</view>
		</view>

		<view id="typography" class="ui-card u-page-section">
			<text class="u-text-title-sm">Typography</text>
			<text class="u-text-body-secondary u-mt-md">标题、正文、说明的层级需要在移动端一眼可区分，但不能做成强 H5 感。</text>
			<view class="u-stack-lg u-mt-lg">
				<view v-for="item in typographyItems" :key="item.name" class="u-stack-sm">
					<text :class="item.className">{{ item.name }}</text>
					<text class="u-text-caption">{{ item.description }}</text>
					<text class="u-text-caption-muted">{{ item.token }}</text>
				</view>
			</view>
		</view>

		<view id="spacing" class="ui-card u-page-section">
			<text class="u-text-title-sm">Spacing</text>
			<text class="u-text-body-secondary u-mt-md">间距 token 用来控制页面呼吸感，页面里不再散落新的 padding / gap 数值。</text>
			<view class="u-stack-md u-mt-lg">
				<view v-for="item in spacingItems" :key="item.name" class="spacing-item">
					<view class="spacing-item__meta">
						<text class="u-text-body">{{ item.name }}</text>
						<text class="u-text-caption">{{ item.description }}</text>
						<text class="u-text-caption-muted">{{ item.token }}</text>
					</view>
					<view class="spacing-item__track">
						<view :class="['spacing-item__bar', item.className]"></view>
					</view>
				</view>
			</view>
		</view>

		<view id="radius" class="ui-card u-page-section">
			<text class="u-text-title-sm">Radius</text>
			<text class="u-text-body-secondary u-mt-md">圆角层级控制了小程序工具感，卡片、输入和按钮的圆角不要混乱增长。</text>
			<view class="token-grid u-mt-lg">
				<view v-for="item in radiusItems" :key="item.name" class="token-grid__item">
					<view :class="['radius-swatch', item.className]"></view>
					<text class="u-text-body">{{ item.name }}</text>
					<text class="u-text-caption">{{ item.description }}</text>
					<text class="u-text-caption-muted">{{ item.token }}</text>
				</view>
			</view>
		</view>

		<view id="shadow" class="ui-card u-page-section">
			<text class="u-text-title-sm">Shadow</text>
			<text class="u-text-body-secondary u-mt-md">当前设计语言偏克制，阴影只用来做轻微层次，不承担强装饰任务。</text>
			<view class="token-grid u-mt-lg">
				<view v-for="item in shadowItems" :key="item.name" class="token-grid__item">
					<view :class="['shadow-swatch', item.className]">
						<text class="u-text-caption">{{ item.name }}</text>
					</view>
					<text class="u-text-caption">{{ item.description }}</text>
					<text class="u-text-caption-muted">{{ item.token }}</text>
				</view>
			</view>
		</view>

		<view id="blocks" class="ui-card u-page-section">
			<text class="u-text-title-sm">Sample UI Blocks</text>
			<text class="u-text-body-secondary u-mt-md">基础 block 用于看 token 在真实组件模式里的协同，而不是只看孤立色板。</text>
			<view class="u-stack-lg u-mt-lg">
				<view class="u-row-start u-gap-md sample-actions">
					<view class="ui-button ui-button--primary">
						<text class="ui-button__text">主按钮</text>
					</view>
					<view class="ui-button ui-button--secondary">
						<text class="ui-button__text">次按钮</text>
					</view>
				</view>

				<view class="ui-card ui-card--soft sample-card">
					<view class="ui-card__header">
						<text class="u-text-title-sm">状态卡片</text>
						<view class="ui-badge">
							<text class="ui-badge__text">Preview</text>
						</view>
					</view>
					<text class="u-text-body-secondary u-mt-md">用于观察 surface、title、body、badge 和内边距是否协同。</text>
				</view>

				<view class="u-stack-md">
					<view v-for="item in listItems" :key="item.title" class="ui-list-item sample-list-item">
						<view :class="['sample-list-item__icon', item.iconClass]">
							<text class="sample-list-item__icon-text">{{ item.icon }}</text>
						</view>
						<view class="u-stack-sm sample-list-item__meta">
							<text class="u-text-body">{{ item.title }}</text>
							<text class="u-text-caption">{{ item.description }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view id="page-preview" class="ui-card u-page-section">
			<text class="u-text-title-sm">Page Preview</text>
			<text class="u-text-body-secondary u-mt-md">组合预览区用来检查“改完 token 之后，页面整体气质是不是还成立”。</text>
			<view class="page-preview u-mt-lg">
				<view class="page-preview__surface">
					<view class="page-preview__hero ui-card">
						<view class="ui-card__header">
							<view class="u-stack-sm">
								<text class="u-text-title-md">月经记录</text>
								<text class="u-text-body-secondary">今天状态正常，可继续记录或查看本次周期。</text>
							</view>
							<view class="ui-badge">
								<text class="ui-badge__text">状态优先</text>
							</view>
						</view>
					</view>

					<view class="page-preview__calendar ui-card">
						<view class="ui-card__header">
							<text class="u-text-title-sm">3 周视图</text>
							<text class="u-text-caption">浏览 + 定位</text>
						</view>
						<view class="calendar-preview u-mt-lg">
							<view
								v-for="item in previewCalendarDays"
								:key="item.label"
								:class="['calendar-preview__cell', item.className]"
							>
								<text class="calendar-preview__text">{{ item.label }}</text>
								<view v-if="item.hasDot" class="calendar-preview__dot"></view>
							</view>
						</view>
					</view>

					<view class="page-preview__panel ui-card">
						<view class="ui-card__header">
							<text class="u-text-title-sm">单日编辑</text>
							<text class="u-text-caption">原地完成</text>
						</view>
						<view class="u-row-start u-gap-md u-mt-lg sample-actions">
							<view class="ui-button ui-button--primary">
								<text class="ui-button__text">记录月经</text>
							</view>
							<view class="ui-button ui-button--secondary">
								<text class="ui-button__text">标记特殊</text>
							</view>
						</view>
						<view class="u-stack-md u-mt-lg">
							<view class="ui-list-item preview-field">
								<text class="u-text-body">流量</text>
								<text class="u-text-caption">中</text>
							</view>
							<view class="ui-list-item preview-field">
								<text class="u-text-body">疼痛</text>
								<text class="u-text-caption">轻微</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TokenPlaygroundPage',
		data() {
			return {
				sectionNavItems: [
					{ label: 'Colors', target: 'colors' },
					{ label: 'Typography', target: 'typography' },
					{ label: 'Spacing', target: 'spacing' },
					{ label: 'Radius', target: 'radius' },
					{ label: 'Shadow', target: 'shadow' },
					{ label: 'Blocks', target: 'blocks' },
					{ label: 'Page Preview', target: 'page-preview' }
				],
				colorItems: [
					{ name: 'Page', token: '$bg-page', description: '页面主背景', className: 'color-swatch--bg-page' },
					{ name: 'Surface', token: '$bg-surface', description: '卡片和主要承载面', className: 'color-swatch--bg-surface' },
					{ name: 'Surface Soft', token: '$bg-surface-soft', description: '弱层级背景与占位', className: 'color-swatch--bg-surface-soft' },
					{ name: 'Primary Text', token: '$text-primary', description: '标题与主信息文字', className: 'color-swatch--text-primary' },
					{ name: 'Secondary Text', token: '$text-secondary', description: '说明与次要信息', className: 'color-swatch--text-secondary' },
					{ name: 'Primary Action', token: '$action-primary-bg', description: '主要操作背景色', className: 'color-swatch--action-primary' },
					{ name: 'Period', token: '$status-period', description: '经期主状态', className: 'color-swatch--status-period' },
					{ name: 'Special', token: '$status-special', description: '特殊标记状态', className: 'color-swatch--status-special' }
				],
				typographyItems: [
					{ name: 'Title Large', token: '$font-size-title-lg / .u-text-title-lg', description: '页面主标题', className: 'u-text-title-lg' },
					{ name: 'Title Medium', token: '$font-size-title-md / .u-text-title-md', description: '区块标题', className: 'u-text-title-md' },
					{ name: 'Body', token: '$font-size-body / .u-text-body', description: '正文和主要标签', className: 'u-text-body' },
					{ name: 'Body Secondary', token: '$font-size-body / .u-text-body-secondary', description: '次说明文字', className: 'u-text-body-secondary' },
					{ name: 'Caption', token: '$font-size-caption / .u-text-caption', description: '弱提示、附属标签', className: 'u-text-caption' }
				],
				spacingItems: [
					{ name: 'Space 2', token: '$space-2', description: '最小间距 / chip 内边距', className: 'spacing-item__bar--2' },
					{ name: 'Space 4', token: '$space-4', description: '卡片基础内边距', className: 'spacing-item__bar--4' },
					{ name: 'Space 6', token: '$space-6', description: '区块内部主间距', className: 'spacing-item__bar--6' },
					{ name: 'Space 8', token: '$space-8', description: '页面纵向节奏', className: 'spacing-item__bar--8' },
					{ name: 'Space 12', token: '$space-12', description: '页面尾部留白 / 大分隔', className: 'spacing-item__bar--12' }
				],
				radiusItems: [
					{ name: 'Field', token: '$radius-field', description: '输入、轻控件', className: 'radius-swatch--field' },
					{ name: 'Card', token: '$radius-card', description: '常规卡片', className: 'radius-swatch--card' },
					{ name: 'Page Card', token: '$radius-page-card', description: '主层级大卡片', className: 'radius-swatch--page-card' },
					{ name: 'Button', token: '$radius-button', description: '按钮 / badge 圆角', className: 'radius-swatch--button' }
				],
				shadowItems: [
					{ name: 'None', token: '$shadow-card', description: '默认卡片阴影，保持克制', className: 'shadow-swatch--none' },
					{ name: 'Floating', token: '$shadow-floating', description: '轻浮层和预览强调', className: 'shadow-swatch--floating' },
					{ name: 'Overlay', token: '$shadow-overlay', description: '覆盖层或更高层级面板', className: 'shadow-swatch--overlay' }
				],
				listItems: [
					{ title: '月经记录', description: 'list item / card / typography', icon: '经', iconClass: 'sample-list-item__icon--period' },
					{ title: '共享空间', description: 'secondary text / border / surface', icon: '享', iconClass: 'sample-list-item__icon--shared' }
				],
				previewCalendarDays: [
					{ label: '16', className: 'calendar-preview__cell--period', hasDot: false },
					{ label: '17', className: 'calendar-preview__cell--period', hasDot: false },
					{ label: '18', className: 'calendar-preview__cell--today', hasDot: false },
					{ label: '19', className: 'calendar-preview__cell--special', hasDot: true },
					{ label: '26', className: 'calendar-preview__cell--prediction', hasDot: false },
					{ label: '27', className: 'calendar-preview__cell--prediction', hasDot: false }
				]
			}
		},
		methods: {
			scrollToSection(target) {
				uni.pageScrollTo({
					selector: `#${target}`,
					duration: 200
				})
			}
		}
	}
</script>

<style lang="scss">
	.token-playground {
		padding-bottom: $space-12;
	}

	.token-nav__list {
		display: flex;
		flex-wrap: wrap;
		gap: $space-3;
	}

	.token-nav__item {
		min-width: 180rpx;
	}

	.token-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: $space-4;
	}

	.token-grid__item {
		display: flex;
		flex-direction: column;
		gap: $space-2;
	}

	.color-swatch,
	.radius-swatch,
	.shadow-swatch {
		width: 100%;
		height: 120rpx;
		border: 2rpx solid $border-subtle;
		background: $bg-surface;
	}

	.color-swatch--bg-page {
		background: $bg-page;
	}

	.color-swatch--bg-surface {
		background: $bg-surface;
	}

	.color-swatch--bg-surface-soft {
		background: $bg-surface-soft;
	}

	.color-swatch--text-primary {
		background: $text-primary;
	}

	.color-swatch--text-secondary {
		background: $text-secondary;
	}

	.color-swatch--action-primary {
		background: $action-primary-bg;
	}

	.color-swatch--status-period {
		background: $status-period;
	}

	.color-swatch--status-special {
		background: $status-special;
	}

	.spacing-item {
		display: flex;
		flex-direction: column;
		gap: $space-2;
	}

	.spacing-item__meta,
	.spacing-item__track {
		display: flex;
		align-items: center;
	}

	.spacing-item__track {
		width: 100%;
		min-height: $space-8;
		padding: $space-2 0;
		background: $bg-surface-soft;
		border-radius: $radius-field;
	}

	.spacing-item__bar {
		height: $space-4;
		background: $action-primary-bg;
		border-radius: $radius-pill;
	}

	.spacing-item__bar--2 {
		width: $space-2;
	}

	.spacing-item__bar--4 {
		width: $space-4;
	}

	.spacing-item__bar--6 {
		width: $space-6;
	}

	.spacing-item__bar--8 {
		width: $space-8;
	}

	.spacing-item__bar--12 {
		width: $space-12;
	}

	.radius-swatch {
		background: $status-period-soft;
	}

	.radius-swatch--field {
		border-radius: $radius-field;
	}

	.radius-swatch--card {
		border-radius: $radius-card;
	}

	.radius-swatch--page-card {
		border-radius: $radius-page-card;
	}

	.radius-swatch--button {
		border-radius: $radius-button;
	}

	.shadow-swatch {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: $radius-card;
	}

	.shadow-swatch--none {
		box-shadow: $shadow-card;
	}

	.shadow-swatch--floating {
		box-shadow: $shadow-floating;
	}

	.shadow-swatch--overlay {
		box-shadow: $shadow-overlay;
	}

	.sample-actions {
		flex-wrap: wrap;
	}

	.sample-card {
		box-shadow: $shadow-floating;
	}

	.sample-list-item {
		padding-top: $space-4;
		padding-bottom: $space-4;
	}

	.sample-list-item__icon {
		width: 72rpx;
		height: 72rpx;
		margin-right: $space-4;
		border-radius: $radius-field;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.sample-list-item__icon--period {
		background: $status-period-soft;
	}

	.sample-list-item__icon--shared {
		background: $bg-surface-soft;
	}

	.sample-list-item__icon-text {
		font-size: $font-size-body-lg;
		font-weight: $font-weight-title;
		color: $text-accent;
	}

	.sample-list-item__meta {
		flex: 1;
	}

	.page-preview {
		background: $bg-page-muted;
		border-radius: $radius-page-card;
		padding: $space-4;
	}

	.page-preview__surface {
		display: flex;
		flex-direction: column;
		gap: $section-gap;
	}

	.page-preview__hero,
	.page-preview__calendar,
	.page-preview__panel {
		box-shadow: $shadow-card;
	}

	.calendar-preview {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $space-3;
	}

	.calendar-preview__cell {
		position: relative;
		height: 120rpx;
		border: 2rpx solid $border-subtle;
		border-radius: $radius-card;
		background: $bg-surface;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.calendar-preview__cell--period {
		background: $status-period-soft;
		border-color: $status-period-soft;
	}

	.calendar-preview__cell--prediction {
		background: $bg-surface-soft;
	}

	.calendar-preview__cell--today {
		border-color: $status-today-ring;
	}

	.calendar-preview__cell--special {
		border-color: $border-subtle;
	}

	.calendar-preview__text {
		font-size: $font-size-body-lg;
		font-weight: $font-weight-title;
		color: $text-primary;
	}

	.calendar-preview__dot {
		position: absolute;
		left: 50%;
		bottom: 20rpx;
		width: 10rpx;
		height: 10rpx;
		margin-left: -5rpx;
		border-radius: $radius-pill;
		background: $status-special;
	}

	.preview-field {
		justify-content: space-between;
	}
</style>
