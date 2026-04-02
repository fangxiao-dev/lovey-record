<template>
	<view class="selected-date-panel">
		<view class="selected-date-panel__head">
			<text class="selected-date-panel__title">{{ title }}</text>
			<text v-if="badge" class="selected-date-panel__badge">{{ badge }}</text>
		</view>

		<view class="selected-date-panel__chip-row">
			<view
				class="selected-date-panel__chip"
				:class="{ 'selected-date-panel__chip--accent': isPeriodMarked }"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="togglePeriod"
			>
				<text class="selected-date-panel__chip-label">经期</text>
			</view>
			<view
				class="selected-date-panel__chip"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="toggleEditor"
			>
				<text class="selected-date-panel__chip-label">{{ isEditorOpen ? '↑ 收起' : '+ 记录详情' }}</text>
			</view>
		</view>

		<view class="selected-date-panel__summary-row">
			<text v-if="summaryItems.length === 0" class="selected-date-panel__summary-empty">选择属性后将显示在这里</text>
			<view
				v-for="item in summaryItems"
				:key="item.key"
				class="selected-date-panel__summary-item"
				:class="`selected-date-panel__summary-item--${item.tone}`"
			>
				<image class="selected-date-panel__summary-icon" :src="summaryIcon(item.icon)" mode="aspectFit" />
				<text class="selected-date-panel__summary-label">{{ item.label }}</text>
				<view
					class="selected-date-panel__summary-badge"
					:class="`selected-date-panel__summary-badge--${item.tone}`"
				>
					<text
						class="selected-date-panel__summary-badge-label"
						:class="`selected-date-panel__summary-badge-label--${item.tone}`"
					>
						{{ item.value }}
					</text>
				</view>
			</view>
		</view>

		<view v-if="attributeRows.length && isEditorOpen" class="selected-date-panel__editor">
			<view
				v-for="row in attributeRows"
				:key="row.key"
				class="selected-date-panel__editor-row"
			>
				<view class="selected-date-panel__editor-label">
					<image class="selected-date-panel__editor-icon" :src="summaryIcon(row.icon)" mode="aspectFit" />
					<text class="selected-date-panel__editor-label-text">{{ row.label }}</text>
				</view>
				<view class="selected-date-panel__editor-options">
					<view
						v-for="option in row.options"
						:key="option.key"
						class="selected-date-panel__editor-option"
						:class="[
							`selected-date-panel__editor-option--${option.tone}`,
							{ 'selected-date-panel__editor-option--selected': option.selected }
						]"
						hover-class="ui-pressable-hover"
						:hover-stay-time="70"
						@tap="toggleAttributeOption(row.key, option.key)"
					>
						<text
							class="selected-date-panel__editor-option-label"
							:class="`selected-date-panel__editor-option-label--${option.tone}`"
						>
							{{ option.label }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<view
			v-if="summaryItems.length > 0 && isEditorOpen"
			class="selected-date-panel__clear-button"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="clearAttributes"
		>
			<text class="selected-date-panel__clear-button-label">清空</text>
		</view>

		<view v-if="showNote" class="selected-date-panel__note-block">
			<view class="selected-date-panel__note-head">
				<text class="selected-date-panel__note-title">当天备注</text>
				<text class="selected-date-panel__note-count">{{ noteDraft.length }}/500</text>
			</view>
			<textarea
				class="selected-date-panel__note-input"
				:value="noteDraft"
				:maxlength="500"
				placeholder="写一句今天的状态、事件或提醒"
				placeholder-class="selected-date-panel__note-placeholder"
				@input="handleNoteInput"
				@blur="commitNote"
			/>
		</view>
	</view>
</template>

<script>
	import flowIcon from '../../static/menstrual/flow.svg';
	import painIcon from '../../static/menstrual/summary-pain.svg';
	import colorIcon from '../../static/menstrual/summary-color.svg';

	export default {
		name: 'SelectedDatePanel',
		props: {
			title: {
				type: String,
				required: true
			},
			badge: {
				type: String,
				default: ''
			},
			summaryItems: {
				type: Array,
				default() {
					return [];
				}
			},
			attributeRows: {
				type: Array,
				default() {
					return [];
				}
			},
			note: {
				type: String,
				default: ''
			},
			initialPeriodMarked: {
				type: Boolean,
				default: false
			},
			initialEditorOpen: {
				type: Boolean,
				default: false
			},
			showNote: {
				type: Boolean,
				default: true
			},
			busy: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isEditorOpen: this.initialEditorOpen,
				isPeriodMarked: this.initialPeriodMarked,
				noteDraft: this.note
			};
		},
		watch: {
			note(nextValue) {
				this.noteDraft = nextValue;
			},
			initialEditorOpen(nextValue) {
				this.isEditorOpen = nextValue;
			},
			initialPeriodMarked(nextValue) {
				this.isPeriodMarked = nextValue;
			}
		},
		methods: {
			toggleEditor() {
				if (this.busy) return;
				this.isEditorOpen = !this.isEditorOpen;
				this.$emit('toggle-editor', this.isEditorOpen);
			},
			togglePeriod() {
				if (this.busy) return;
				this.isPeriodMarked = !this.isPeriodMarked;
				this.$emit('toggle-period', this.isPeriodMarked);
			},
			toggleAttributeOption(rowKey, optionKey) {
				if (this.busy) return;
				this.$emit('toggle-attribute-option', { rowKey, optionKey });
			},
			clearAttributes() {
				if (this.busy) return;
				this.$emit('clear-attributes');
			},
			handleNoteInput(event) {
				this.noteDraft = event?.detail?.value || '';
			},
			commitNote(event) {
				const nextValue = event?.detail?.value ?? this.noteDraft;
				this.noteDraft = nextValue;
				if (nextValue === this.note) return;
				this.$emit('note-change', nextValue);
			},
			summaryIcon(icon) {
				if (icon === 'water_drop') return flowIcon;
				if (icon === 'favorite') return painIcon;
				if (icon === 'palette') return colorIcon;
				return flowIcon;
			}
		}
	};
</script>

<style lang="scss">
	.selected-date-panel {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		padding: 32rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.selected-date-panel__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.selected-date-panel__title {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.selected-date-panel__badge {
		font-size: 22rpx;
		line-height: 1;
		color: #8e7c6d;
	}

	.selected-date-panel__chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.selected-date-panel__chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 52rpx;
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #f3eee7;
		cursor: pointer;
	}

	.selected-date-panel__chip--accent {
		background: #f3d7d1;
	}

	.selected-date-panel__chip-label {
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}

	.selected-date-panel__summary-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		padding: 12rpx;
		border-radius: 32rpx;
		background: #faf3eb;
	}

	.selected-date-panel__summary-empty {
		font-size: 20rpx;
		line-height: 1;
		color: $text-muted;
		flex: 1;
		text-align: center;
		padding: 14rpx 0;
	}

	.selected-date-panel__summary-item {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		min-height: 60rpx;
		padding: 14rpx 16rpx;
		border-radius: 999rpx;
		background: #faf7f2;
		min-width: 0;
	}

	.selected-date-panel__editor {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		gap: 6rpx;
		padding: 4rpx 6rpx;
		border-radius: 32rpx;
		background: #faf7f2;
		box-shadow: 0 8rpx 8rpx rgba(47, 42, 38, 0.16);
	}

	.selected-date-panel__editor-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20rpx;
		min-height: 104rpx;
		padding: 18rpx 24rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.selected-date-panel__editor-label {
		width: 52rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4rpx;
		flex-shrink: 0;
	}

	.selected-date-panel__editor-icon {
		width: 24rpx;
		height: 24rpx;
		display: block;
	}

	.selected-date-panel__editor-label-text {
		font-size: 20rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.selected-date-panel__editor-options {
		flex: 1;
		display: flex;
		gap: 12rpx;
		min-width: 0;
	}

	.selected-date-panel__editor-option {
		flex: 1;
		min-width: 0;
		min-height: 82rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8rpx 6rpx;
		border: 2rpx solid transparent;
		border-radius: 24rpx;
		cursor: pointer;
	}

	.selected-date-panel__editor-option--selected {
		border-color: #8e7c6d;
		box-shadow: 0 8rpx 8rpx rgba(47, 42, 38, 0.24);
	}

	.selected-date-panel__editor-option--flow-spotting,
	.selected-date-panel__editor-option--pain-none {
		background: #fbf7f2;
	}

	.selected-date-panel__editor-option--flow-light {
		background: #f2e5d4;
	}

	.selected-date-panel__editor-option--flow-normal {
		background: #e2c8a6;
	}

	.selected-date-panel__editor-option--flow-heavy {
		background: #d0aa7e;
	}

	.selected-date-panel__editor-option--flow-very-heavy {
		background: #bc8a5f;
	}

	.selected-date-panel__editor-option--pain-light {
		background: #f0e4f3;
	}

	.selected-date-panel__editor-option--pain-normal {
		background: #dec7e5;
	}

	.selected-date-panel__editor-option--pain-strong {
		background: #c7a4d2;
	}

	.selected-date-panel__editor-option--pain-very-strong {
		background: #a97dba;
	}

	.selected-date-panel__editor-option--color-very-light {
		background: #f7e7e4;
	}

	.selected-date-panel__editor-option--color-light {
		background: #e8aaa0;
	}

	.selected-date-panel__editor-option--color-normal {
		background: #c95b55;
	}

	.selected-date-panel__editor-option--color-deep {
		background: #8f5149;
	}

	.selected-date-panel__editor-option--color-very-deep {
		background: #654743;
	}

	.selected-date-panel__editor-option-label {
		font-size: 20rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
		white-space: nowrap;
	}

	.selected-date-panel__editor-option-label--flow-spotting,
	.selected-date-panel__editor-option-label--flow-light {
		color: #a29488;
	}

	.selected-date-panel__editor-option-label--flow-normal,
	.selected-date-panel__editor-option-label--flow-heavy,
	.selected-date-panel__editor-option-label--flow-very-heavy,
	.selected-date-panel__editor-option-label--pain-normal,
	.selected-date-panel__editor-option-label--pain-strong,
	.selected-date-panel__editor-option-label--pain-very-strong,
	.selected-date-panel__editor-option-label--color-normal,
	.selected-date-panel__editor-option-label--color-deep,
	.selected-date-panel__editor-option-label--color-very-deep {
		color: #fff7e8;
	}

	.selected-date-panel__editor-option-label--pain-none,
	.selected-date-panel__editor-option-label--pain-light {
		color: #8b6e95;
	}

	.selected-date-panel__editor-option-label--color-very-light,
	.selected-date-panel__editor-option-label--color-light {
		color: #d97f6c;
	}

	.selected-date-panel__summary-icon {
		width: 20rpx;
		height: 20rpx;
		display: block;
	}

	.selected-date-panel__summary-label {
		font-size: 20rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
		flex-shrink: 0;
	}

	.selected-date-panel__summary-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 34rpx;
		padding: 0 8rpx;
		border-radius: 8rpx;
	}

	// Badge backgrounds — mirror editor option backgrounds exactly
	.selected-date-panel__summary-badge--flow-spotting,
	.selected-date-panel__summary-badge--pain-none {
		background: #fbf7f2;
	}
	.selected-date-panel__summary-badge--flow-light {
		background: #f2e5d4;
	}
	.selected-date-panel__summary-badge--flow-normal {
		background: #e2c8a6;
	}
	.selected-date-panel__summary-badge--flow-heavy {
		background: #d0aa7e;
	}
	.selected-date-panel__summary-badge--flow-very-heavy {
		background: #bc8a5f;
	}
	.selected-date-panel__summary-badge--pain-light {
		background: #f0e4f3;
	}
	.selected-date-panel__summary-badge--pain-normal {
		background: #dec7e5;
	}
	.selected-date-panel__summary-badge--pain-strong {
		background: #c7a4d2;
	}
	.selected-date-panel__summary-badge--pain-very-strong {
		background: #a97dba;
	}
	.selected-date-panel__summary-badge--color-very-light {
		background: #f7e7e4;
	}
	.selected-date-panel__summary-badge--color-light {
		background: #e8aaa0;
	}
	.selected-date-panel__summary-badge--color-normal {
		background: #c95b55;
	}
	.selected-date-panel__summary-badge--color-deep {
		background: #8f5149;
	}
	.selected-date-panel__summary-badge--color-very-deep {
		background: #654743;
	}

	.selected-date-panel__summary-badge-label {
		font-size: 18rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
	}

	// Badge label colors — mirror editor option label colors exactly
	.selected-date-panel__summary-badge-label--flow-spotting,
	.selected-date-panel__summary-badge-label--flow-light {
		color: #a29488;
	}
	.selected-date-panel__summary-badge-label--flow-normal,
	.selected-date-panel__summary-badge-label--flow-heavy,
	.selected-date-panel__summary-badge-label--flow-very-heavy,
	.selected-date-panel__summary-badge-label--pain-normal,
	.selected-date-panel__summary-badge-label--pain-strong,
	.selected-date-panel__summary-badge-label--pain-very-strong,
	.selected-date-panel__summary-badge-label--color-normal,
	.selected-date-panel__summary-badge-label--color-deep,
	.selected-date-panel__summary-badge-label--color-very-deep {
		color: #fff7e8;
	}
	.selected-date-panel__summary-badge-label--pain-none,
	.selected-date-panel__summary-badge-label--pain-light {
		color: #8b6e95;
	}
	.selected-date-panel__summary-badge-label--color-very-light,
	.selected-date-panel__summary-badge-label--color-light {
		color: #d97f6c;
	}

	.selected-date-panel__clear-button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 72rpx;
		padding: 16rpx 24rpx;
		border-radius: 24rpx;
		background: $bg-subtle;
	}

	.selected-date-panel__clear-button-label {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-secondary;
		cursor: pointer;
	}

	.selected-date-panel__note-block {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		padding: 18rpx 20rpx;
		border-radius: 28rpx;
		background: #faf7f2;
	}

	.selected-date-panel__note-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.selected-date-panel__note-title,
	.selected-date-panel__note-count {
		font-size: 20rpx;
		line-height: 1;
		color: $text-muted;
	}

	.selected-date-panel__note-input {
		width: 100%;
		height: 154rpx;
		font-size: 24rpx;
		line-height: 1.6;
		color: $text-primary;
	}

	.selected-date-panel__note-placeholder {
		color: $text-muted;
	}

</style>
