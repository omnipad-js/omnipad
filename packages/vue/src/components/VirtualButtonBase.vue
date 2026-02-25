<script setup lang="ts">
import { computed } from 'vue';
import { LayoutBox, resolveLayoutStyle } from '@omnipad/core';

const props = defineProps<{
  layout?: LayoutBox;
  isActive?: boolean;
  label?: string;
}>();

// 解析容器样式
const containerStyle = computed(() => {
  return props.layout ? resolveLayoutStyle(props.layout) : {};
});
</script>

<template>
  <div
    class="omnipad-button-base"
    :class="{ 'omnipad-is-active': isActive }"
    :style="containerStyle"
    tabindex="-1"
  >
    <slot>
      <span v-if="label" class="omnipad-button-label">{{ label }}</span>
    </slot>
  </div>
</template>

<style scoped>
.omnipad-button-base {
  user-select: none;
  touch-action: none;
  overflow: hidden;
  box-sizing: border-box;
  pointer-events: auto;
}

.omnipad-button-base.omnipad-is-active {
  background: var(--omnipad-btn-pressed-bg);
  border-color: var(--omnipad-btn-pressed-border-color);
  opacity: var(--omnipad-btn-pressed-opacity);
  filter: brightness(1.2);
}

.omnipad-button-label {
  font-family: var(--omnipad-btn-font-family);
  font-size: var(--omnipad-btn-font-size);
  color: var(--omnipad-btn-label-color);
  font-weight: var(--omnipad-btn-font-weight);
}
</style>
