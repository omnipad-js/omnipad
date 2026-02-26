<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { TargetZone } from '@omnipad/vue';
import { ConfigTreeNode, LayoutBox } from '@omnipad/core';

const props = defineProps<{
  swfUrl: string | null;
  treeNode?: Record<string, any>;
  widgetId?: string;
  cursorEnabled?: boolean;
  cursorAutoDelay?: number;
  layout?: Record<string, any>;
}>();

const containerRef = ref<HTMLElement | null>(null);
const stageNode = computed(() => props.treeNode as ConfigTreeNode);
const stageLayout = computed(() => props.layout as LayoutBox);
let rufflePlayer: any = null;

const initPlayer = () => {
  if (!containerRef.value) return;

  // 1. 清空容器
  containerRef.value.innerHTML = '';

  // 2. 创建 Ruffle 实例
  // @ts-ignore (window.RufflePlayer 来自全局脚本)
  const ruffle = window.RufflePlayer.newest();
  rufflePlayer = ruffle.createPlayer();

  // 3. 配置播放器样式以撑满容器
  rufflePlayer.style.width = '100%';
  rufflePlayer.style.height = '100%';

  containerRef.value.appendChild(rufflePlayer);

  // 4. 如果有初始 URL，则加载
  if (props.swfUrl) {
    loadSwf(props.swfUrl);
  }
};

const loadSwf = (url: string) => {
  if (rufflePlayer && url) {
    console.log('[Playground] Loading SWF:', url);
    rufflePlayer.load({
      url: url,
      allowScriptAccess: true,
      backgroundColor: '#000000',
      letterbox: 'on',
    });
  }
};

// 监听 URL 变化实现重载
watch(
  () => props.swfUrl,
  (newUrl) => {
    if (newUrl) loadSwf(newUrl);
  },
);

onMounted(() => {
  initPlayer();
});
</script>

<template>
  <div class="ruffle-wrapper">
    <div class="ruffle-container">
      <div ref="containerRef" class="player-overlay"></div>
      <TargetZone
        :tree-node="stageNode"
        :widget-id="widgetId"
        :cursor-enabled="cursorEnabled"
        :cursor-auto-delay="cursorAutoDelay"
        :layout="stageLayout"
        class="player-overlay"
      >
        <template #focus-feedback="{ isReturning, cursorPos }">
          <Transition name="pulse">
            <div
              v-if="isReturning"
              class="focus-feedback-ring"
              :style="{
                left: `${cursorPos?.x}%`,
                top: `${cursorPos?.y}%`,
              }"
            ></div>
          </Transition>
        </template>
        <template #cursor="{ isDown }">
          <div class="cursor-dot" :class="{ 'is-down': isDown }"></div>
        </template>
      </TargetZone>
    </div>
  </div>
</template>

<style scoped>
.ruffle-wrapper {
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ruffle-container {
  /* 模拟典型的 Flash 游戏比例 */
  width: 550px;
  height: 400px;
  background: #000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  position: relative;
  /* 重要：为未来的 TargetZone 定位做准备 */
}

.placeholder {
  color: #666;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.player-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

/* 自定义光标样式 */
.cursor-dot {
  width: 100%;
  height: 100%;
  border: 2px solid white;
  border-radius: 50%;
  background: #ffba4380;
}

.cursor-dot.is-down {
  transform: scale(0.8);
  background: #ffba43;
}

/* 自定义焦点唤回样式 */
.focus-feedback-ring {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  border: 2px solid #ffba43;
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
