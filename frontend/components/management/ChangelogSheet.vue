<template>
  <view v-if="visible" class="changelog-sheet">
    <!-- Overlay -->
    <view class="changelog-sheet__overlay" @tap="$emit('close')" />

    <!-- Sheet panel -->
    <view class="changelog-sheet__panel">
      <view
        class="changelog-sheet__drag-bar-wrapper"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <view class="changelog-sheet__drag-indicator" />
      </view>

      <scroll-view class="changelog-sheet__scroll" scroll-y>
        <view class="changelog-sheet__content">
          <text class="changelog-sheet__title u-text-title-lg">更新记录</text>

          <text class="changelog-sheet__section-label u-text-caption">最近更新</text>
          <view class="changelog-sheet__latest-entry">
            <text class="changelog-sheet__latest-version u-text-body">{{ entries[0].version }}</text>
            <text class="changelog-sheet__latest-title u-text-body">{{ entries[0].title }}</text>
          </view>
          <view class="changelog-sheet__change-list">
            <view
              v-for="(change, i) in entries[0].changes"
              :key="i"
              class="changelog-sheet__change-item"
            >
              <text class="changelog-sheet__bullet">·</text>
              <text class="changelog-sheet__change-text u-text-body">{{ change }}</text>
            </view>
          </view>

          <view class="changelog-sheet__divider" />

          <text class="changelog-sheet__section-label u-text-caption">历史版本</text>
          <view class="changelog-sheet__accordion">
            <view
              v-for="(entry, i) in entries.slice(1)"
              :key="entry.version"
              class="changelog-sheet__accordion-item"
            >
              <view
                class="changelog-sheet__accordion-header"
                hover-class="ui-pressable-hover"
                :hover-stay-time="70"
                @tap="toggleAccordion(i)"
              >
                <text class="changelog-sheet__accordion-label u-text-body">{{ entry.version }} {{ entry.title }}</text>
                <text class="changelog-sheet__accordion-chevron">{{ expandedIndex === i ? '˅' : '›' }}</text>
              </view>
              <view v-if="expandedIndex === i" class="changelog-sheet__accordion-body">
                <view
                  v-for="(change, j) in entry.changes"
                  :key="j"
                  class="changelog-sheet__change-item changelog-sheet__change-item--indented"
                >
                  <text class="changelog-sheet__bullet">·</text>
                  <text class="changelog-sheet__change-text u-text-body">{{ change }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
  export default {
    name: 'ChangelogSheet',
    emits: ['close'],
    props: {
      visible: {
        type: Boolean,
        default: false,
      },
      entries: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        expandedIndex: -1,
        touchStartX: 0,
        touchStartY: 0,
      };
    },
    watch: {
      visible(val) {
        if (!val) {
          this.expandedIndex = -1;
          this.touchStartX = 0;
          this.touchStartY = 0;
        }
      },
    },
    methods: {
      toggleAccordion(index) {
        this.expandedIndex = this.expandedIndex === index ? -1 : index;
      },
      onTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      },
      onTouchEnd(e) {
        const deltaX = Math.abs(e.changedTouches[0].clientX - this.touchStartX);
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        // Only dismiss on primarily downward vertical swipe
        if (deltaY > 60 && deltaY > deltaX) {
          this.$emit('close');
        }
      },
    },
  };
</script>

<style lang="scss">
  .changelog-sheet {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 998;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .changelog-sheet__overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.18);
  }

  .changelog-sheet__panel {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 70vh;
    background: #ffffff;
    border-radius: 28rpx 28rpx 0 0;
    display: flex;
    flex-direction: column;
  }

  .changelog-sheet__drag-bar-wrapper {
    display: flex;
    justify-content: center;
    padding: 24rpx 0 16rpx;
    flex-shrink: 0;
  }

  .changelog-sheet__drag-indicator {
    width: 64rpx;
    height: 8rpx;
    border-radius: 999rpx;
    background: #e6ded5;
  }

  // Explicit height required: scroll-view in WeChat mini-program does not
  // scroll with flex:1 alone — it needs a calculated pixel/vh height.
  .changelog-sheet__scroll {
    height: calc(70vh - 64rpx); // 64rpx = drag-bar-wrapper height
  }

  .changelog-sheet__content {
    padding: 32rpx 40rpx 64rpx;
    display: flex;
    flex-direction: column;
  }

  .changelog-sheet__title {
    color: $text-primary;
    margin-bottom: 18rpx;
  }

  .changelog-sheet__section-label {
    color: $text-muted;
    margin-bottom: 10rpx;
  }

  .changelog-sheet__change-list {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-bottom: 10rpx;
  }

  .changelog-sheet__latest-entry {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 8rpx;
  }

  .changelog-sheet__latest-version {
    color: $text-muted;
    font-weight: 500;
    flex-shrink: 0;
  }

  .changelog-sheet__latest-title {
    color: $text-primary;
    font-weight: 500;
  }

  .changelog-sheet__change-item {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
  }

  .changelog-sheet__change-item--indented {
    padding-left: 24rpx;
  }

  .changelog-sheet__bullet {
    color: $text-muted;
    font-size: 24rpx;
    line-height: 1.3;
    flex-shrink: 0;
  }

  .changelog-sheet__change-text {
    color: $text-primary;
    line-height: 1.35;
  }

  .changelog-sheet__divider {
    width: 100%;
    height: 1rpx;
    background: #e6ded5;
    margin: 32rpx 0;
  }

  .changelog-sheet__accordion {
    display: flex;
    flex-direction: column;
  }

  .changelog-sheet__accordion-item {
    border-top: 1rpx solid #e6ded5;

    &:last-child {
      border-bottom: 1rpx solid #e6ded5;
    }
  }

  .changelog-sheet__accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    gap: 12rpx;
  }

  .changelog-sheet__accordion-label {
    font-weight: 500;
    color: $text-primary;
    flex: 1;
  }

  .changelog-sheet__accordion-chevron {
    font-size: 28rpx;
    color: $text-muted;
    flex-shrink: 0;
  }

  .changelog-sheet__accordion-body {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    padding-bottom: 16rpx;
  }
</style>
