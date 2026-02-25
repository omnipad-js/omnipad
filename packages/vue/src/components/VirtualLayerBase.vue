<script setup lang="ts">
import { ConfigTreeNode } from '@omnipad/core';
import { getComponent } from '../utils/componentRegistry';

defineProps<{
  nodes: ConfigTreeNode[];
}>();
</script>

<template>
  <div class="omnipad-virtual-layer-base omnipad-prevent">
    <component
      v-for="node in nodes || []"
      :key="node.uid"
      :is="getComponent(node.type)"
      :tree-node="node"
    />

    <slot />
  </div>
</template>

<style scoped>
.omnipad-virtual-layer-base {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* [核心]：图层本身不接收事件，确保不阻挡下方的模拟器 */
  pointer-events: none;
  z-index: 1000;
}

/* [关键]：确保子组件（Zone/Button）能够重新接收事件 */
:deep(.omnipad-input-zone),
:deep(.omnipad-button) {
  pointer-events: auto;
}
</style>
