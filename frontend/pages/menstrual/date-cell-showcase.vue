<template>
	<view class="date-cell-showcase u-page-shell">
		<view class="date-cell-showcase__hero ui-card u-page-section">
			<text class="date-cell-showcase__title u-text-title-lg">DateCell Showcase</text>
			<text class="date-cell-showcase__copy u-text-body-secondary">
				当前页只用于 runtime 视觉核验，直接把已批准的 DateCell 变体跑全，不引入业务数据和交互状态。
			</text>
		</view>

		<view
			v-for="section in sections"
			:key="section.id"
			class="date-cell-showcase__section ui-card u-page-section"
		>
			<view class="date-cell-showcase__section-header">
				<text class="u-text-title-sm">{{ section.title }}</text>
				<text class="u-text-caption">{{ section.caption }}</text>
			</view>
			<view class="date-cell-showcase__grid">
				<view
					v-for="item in section.items"
					:key="item.variant"
					class="date-cell-showcase__item"
				>
					<DateCell :label="item.day" :variant="item.variant" />
					<text class="date-cell-showcase__item-label u-text-caption">{{ item.label }}</text>
					<text class="date-cell-showcase__item-variant u-text-caption-muted">{{ item.variant }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import DateCell from '../../components/menstrual/DateCell.vue';
	import { createDateCellShowcaseSections } from '../../components/menstrual/date-cell-showcase-data.js';

	export default {
		name: 'DateCellShowcasePage',
		components: {
			DateCell
		},
		data() {
			return {
				sections: createDateCellShowcaseSections()
			};
		}
	};
</script>

<style lang="scss">
	.date-cell-showcase {
		padding-bottom: $space-12;
	}

	.date-cell-showcase__copy {
		display: block;
		margin-top: $space-4;
	}

	.date-cell-showcase__section-header {
		display: flex;
		flex-direction: column;
		gap: $space-2;
	}

	.date-cell-showcase__grid {
		margin-top: $space-6;
		display: flex;
		flex-wrap: wrap;
		gap: $space-5;
	}

	.date-cell-showcase__item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: calc((100% - #{$space-5} * 2) / 3);
		gap: $space-2;
		padding: $space-3;
		border-radius: $radius-card;
		background: $bg-subtle;
	}

	.date-cell-showcase__item-label,
	.date-cell-showcase__item-variant {
		text-align: center;
	}
</style>
