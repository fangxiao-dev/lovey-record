<template>
	<view class="sdp-showcase u-page-shell">
		<view
			v-for="state in states"
			:key="state.label"
			class="sdp-showcase__section u-page-section"
		>
			<text class="sdp-showcase__label u-text-meta-muted">{{ state.label }}</text>
			<SelectedDatePanel
				:title="state.title"
				:badge="state.badge"
				:summary-items="state.summaryItems"
				:attribute-rows="state.attributeRows"
				:initial-period-marked="state.isPeriodMarked"
				:initial-editor-open="state.isEditorOpen || false"
			/>
		</view>
	</view>
</template>

<script>
	import SelectedDatePanel from '../../components/menstrual/SelectedDatePanel.vue';
	import { allStates } from '../../components/menstrual/selected-date-panel-showcase-data.js';

	export default {
		name: 'SelectedDatePanelShowcasePage',
		components: {
			SelectedDatePanel
		},
		data() {
			return {
				states: allStates
			};
		}
	};
</script>

<style lang="scss">
	.sdp-showcase__section {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.sdp-showcase__label {
		font-size: 20rpx;
		color: $text-muted;
		font-weight: 500;
		padding-left: 4rpx;
	}
</style>
