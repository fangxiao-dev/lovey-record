<template>
	<view class="date-cell-showcase u-page-shell">
		<view class="date-cell-showcase__board ui-card u-page-section">
			<text class="date-cell-showcase__title u-text-title-lg">{{ board.title }}</text>
			<text class="date-cell-showcase__copy u-text-body-secondary">{{ board.intro }}</text>
			<view class="date-cell-showcase__group date-cell-showcase__group--base">
				<view
					v-for="item in board.groups[0].items"
					:key="item.variant"
					class="date-cell-showcase__state-wrap"
				>
					<view class="date-cell-showcase__state-body">
						<DateCell label="26" :variant="item.variant" />
					</view>
				</view>
			</view>
			<text class="date-cell-showcase__copy u-text-body-secondary">{{ board.selectedIntro }}</text>
			<view class="date-cell-showcase__group date-cell-showcase__group--selected">
				<view
					v-for="item in board.groups[1].items"
					:key="item.variant"
					class="date-cell-showcase__state-wrap"
				>
					<view class="date-cell-showcase__state-body">
						<DateCell label="26" :variant="item.variant" />
					</view>
				</view>
			</view>
			<view class="date-cell-showcase__group date-cell-showcase__group--today">
				<view
					v-for="item in board.groups[2].items"
					:key="item.variant"
					class="date-cell-showcase__state-wrap"
				>
					<view class="date-cell-showcase__state-body">
						<DateCell label="26" :variant="item.variant" />
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import DateCell from '../../components/menstrual/DateCell.vue';
	import { createDateCellShowcaseBoard } from '../../components/menstrual/date-cell-showcase-data.js';

	export default {
		name: 'DateCellShowcasePage',
		components: {
			DateCell
		},
		data() {
			return {
				board: createDateCellShowcaseBoard()
			};
		}
	};
</script>

<style lang="scss">
	.date-cell-showcase {
		padding-bottom: $space-12;
		background: $bg-card;
	}

	.date-cell-showcase__board {
		padding-bottom: $space-10;
		background: $bg-base;
	}

	.date-cell-showcase__copy {
		display: block;
		margin-top: $space-4;
	}

	.date-cell-showcase__group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(112rpx, 1fr));
		column-gap: $space-7;
		row-gap: $space-7;
		margin-top: $space-7;
	}

	.date-cell-showcase__group--base {
		align-items: flex-start;
	}

	.date-cell-showcase__group--selected {
		max-width: none;
	}

	.date-cell-showcase__group--today {
		max-width: none;
	}

	.date-cell-showcase__state-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}

	.date-cell-showcase__state-body {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}

	.date-cell-showcase__state-body :deep(.date-cell) {
		max-width: 116rpx;
	}
</style>
