<script setup lang="ts">
import { computed } from 'vue';
import {
  ConfigTreeNode,
  CursorState,
  LayoutBox,
  TargetZoneConfig,
  TargetZoneCore,
  TYPES,
  resolveLayoutStyle,
} from '@omnipad/core';
import { useCoreEntity } from '../composables/useCoreEntity';
import { useWidgetConfig } from '../composables/useWidgetConfig';

interface TargetZoneProps {
  /** The runtime tree node for automatic setup. */
  treeNode?: ConfigTreeNode;

  /** Unique configuration ID (CID) for this zone. Used for profile serialization. */
  widgetId?: string;

  /** Whether the virtual visual cursor is enabled for this stage. */
  cursorEnabled?: boolean;

  /** Delay in milliseconds before the virtual cursor auto-hides after inactivity (0 to disable). */
  cursorAutoDelay?: number;

  /** Spatial layout configuration. Usually set to cover the entire game container. */
  layout?: LayoutBox;
}
const props = defineProps<TargetZoneProps>();
const defaultProps = {
  cursorAutoDelay: 2500,
};

// 整合配置
const { uid, config } = useWidgetConfig<TargetZoneConfig>(TYPES.TARGET_ZONE, props, defaultProps);
const { state, elementRef } = useCoreEntity<TargetZoneCore, CursorState>(
  () => new TargetZoneCore(uid.value, config.value),
);

const containerStyle = computed(() => resolveLayoutStyle(config.value.layout));

// 光标位置
const cursorStyle = computed(() => {
  if (!state.value) return { display: 'none' };
  return {
    left: `${state.value.position.x}%`,
    top: `${state.value.position.y}%`,
    opacity: state.value.isVisible ? 1 : 0,
  };
});
</script>

<template>
  <div :id="uid" ref="elementRef" class="omnipad-target-zone" :style="containerStyle">
    <!-- 焦点回归反馈 (波纹效果) -->
    <Transition name="pulse">
      <div
        v-if="state?.isFocusReturning"
        class="focus-feedback-ring"
        :style="{
          left: `${state.position.x}%`,
          top: `${state.position.y}%`,
        }"
      ></div>
    </Transition>
    <!-- 虚拟光标渲染 -->
    <div v-if="config.cursorEnabled" class="omnipad-virtual-cursor" :style="cursorStyle">
      <!-- 这里未来可以放十字准星图片 -->
      <div class="cursor-dot" :class="{ 'is-down': state?.isPointerDown }"></div>
    </div>
  </div>
</template>

<style scoped>
.omnipad-target-zone {
  pointer-events: auto;
  overflow: hidden;
}
.omnipad-virtual-cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: opacity 0.2s;
}
.cursor-dot {
  width: 100%;
  height: 100%;
  border: 2px solid white;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.5);
}
.cursor-dot.is-down {
  transform: scale(0.8);
  background: red;
}

/* 焦点回归波纹样式 */
.focus-feedback-ring {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(100, 200, 255, 0.8);
  border-radius: 50%;
  pointer-events: none;
  z-index: 5;
}

/* 波纹动画 */
.pulse-enter-active {
  animation: ripple-out 0.5s ease-out forwards;
}

@keyframes ripple-out {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.omnipad-virtual-cursor {
  /* 确保准星在波纹之上 */
  z-index: 10;
}
</style>
