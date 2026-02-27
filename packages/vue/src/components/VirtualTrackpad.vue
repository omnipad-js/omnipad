<script setup lang="ts">
import {
  ConfigTreeNode,
  type TrackpadConfig,
  TrackpadCore,
  type TrackpadState,
  TYPES,
} from '@omnipad/core';
import { useCoreEntity } from '../composables/useCoreEntity';
import { useWidgetConfig } from '../composables/useWidgetConfig';
import VirtualButtonBase from './VirtualButtonBase.vue';

const props = defineProps<{
  treeNode?: ConfigTreeNode;
  widgetId?: string;
  label?: string;
  sensitivity?: number;
  targetStageId?: string;
  layout?: any;
}>();

const { uid, config } = useWidgetConfig<TrackpadConfig>(TYPES.TRACKPAD, props, {
  label: 'TRACKPAD',
  sensitivity: 1.0,
});

const { core, state, elementRef } = useCoreEntity<TrackpadCore, TrackpadState>(
  () => new TrackpadCore(uid.value, config.value),
);

// 转发交互
const onPointerDown = (e: PointerEvent) => core.value?.onPointerDown(e);
const onPointerMove = (e: PointerEvent) => core.value?.onPointerMove(e);
const onPointerUp = (e: PointerEvent) => core.value?.onPointerUp(e);
const onPointerCancel = (e: PointerEvent) => core.value?.onPointerCancel(e);

// 暴露转发方法
defineExpose({
  uid,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
});
</script>

<template>
  <VirtualButtonBase
    :id="uid"
    ref="elementRef"
    class="omnipad-trackpad"
    :layout="config.layout"
    :label="config.label"
    :is-active="state?.isPressed"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @lostpointercapture="onPointerCancel"
  />
</template>

<style scoped>
.omnipad-trackpad {
  /* 重写按钮样式变量，使其看起来更像触摸板 */
  --wvg-btn-border-style: dashed;
  --wvg-btn-bg-color: rgba(255, 255, 255, 0.05);
  cursor: crosshair;
}

/* 可以在这里添加一个简单的网格背景，视觉上暗示这是触摸区 */
.omnipad-trackpad::before {
  content: '';
  position: absolute;
  inset: 10px;
  background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}
</style>
