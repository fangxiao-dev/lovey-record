<template>
  <view
    v-if="entries && entries.length > 0"
    class="changelog-entry-row"
    hover-class="ui-pressable-hover"
    :hover-stay-time="70"
    @tap="$emit('open')"
  >
    <view class="changelog-entry-row__left">
      <view class="changelog-entry-row__title-line">
        <text class="changelog-entry-row__label u-text-body">更新记录</text>
        <view v-if="hasUnreadUpdate" class="changelog-entry-row__dot" />
      </view>
      <text class="changelog-entry-row__preview u-text-caption">最近：{{ entries[0].title }}</text>
    </view>
    <text class="changelog-entry-row__chevron">›</text>
  </view>
</template>

<script>
  import { hasUnread } from '../../utils/changelog.js';

  export default {
    name: 'ChangelogEntryRow',
    emits: ['open'],
    props: {
      entries: {
        type: Array,
        default: () => [],
      },
      lastViewedVersion: {
        type: String,
        default: 'v0.0.0',
      },
    },
    computed: {
      hasUnreadUpdate() {
        return hasUnread(this.entries, this.lastViewedVersion);
      },
    },
  };
</script>

<style lang="scss">
  .changelog-entry-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    gap: 16rpx;
  }

  .changelog-entry-row__left {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    flex: 1;
  }

  .changelog-entry-row__title-line {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .changelog-entry-row__label {
    font-weight: 500;
    color: $text-primary;
  }

  .changelog-entry-row__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 999rpx;
    background: #c9786a;
    flex-shrink: 0;
  }

  .changelog-entry-row__preview {
    color: $text-muted;
  }

  .changelog-entry-row__chevron {
    font-size: 36rpx;
    color: $text-muted;
    line-height: 1;
    flex-shrink: 0;
  }
</style>
