import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import {
  Registry,
  ICoreEntity,
  ISpatial,
  IPointerHandler,
  AnyFunction,
  IDependencyBindable,
} from '@omnipad/core';
import { createPointerBridge } from '@omnipad/core/utils';

export function useCoreEntity<T extends ICoreEntity, S>(
  createCore: () => T,
  domEventOptions: Record<string, any> = {},
  initialDelegates?: Record<string, AnyFunction>,
) {
  const instance = createCore();
  const core = shallowRef<T>();
  const state = ref<S>();
  const elementRef = ref<any>(null);
  const domEvents = ref<Record<string, (e: PointerEvent) => any>>({});

  // 统一处理状态订阅
  const syncState = (newState: S) => {
    state.value = newState;
  };

  const bindDelegates = (delegates: Record<string, AnyFunction>) => {
    if (!core.value) return;

    const bindable = core.value as unknown as IDependencyBindable;
    if (typeof bindable.bindDelegate === 'function') {
      Object.entries(delegates).forEach(([key, fn]) => {
        bindable.bindDelegate(key, fn);
      });
    }
  };

  onMounted(() => {
    core.value = instance;

    // 注册到全局单例
    Registry.getInstance().register(instance);

    // 订阅逻辑层状态变化
    if ('subscribe' in instance) {
      (instance as any).subscribe(syncState);
    }

    // 初始时绑定的依赖方法
    if (initialDelegates) {
      bindDelegates(initialDelegates);
    }

    // 提取真实的 DOM 元素
    let domEl: Element | null = null;

    if (elementRef.value) {
      if (elementRef.value instanceof Element) {
        // 场景 A: ref 绑定在原生 HTML 标签上 (如 <div>)
        domEl = elementRef.value;
      } else if (elementRef.value.$el instanceof Element) {
        // 场景 B: ref 绑定在 Vue 组件上
        // 组件的根 DOM 节点存储在 .$el 属性中
        domEl = elementRef.value.$el;
      }
    }

    // 尺寸监听 (ISpatial 接口对接)
    if (domEl && 'bindRectProvider' in instance) {
      (instance as unknown as ISpatial).bindRectProvider(() => domEl!.getBoundingClientRect());
    }

    // 自动生成标准化 DOM 事件 (IPointerHandler 接口对接)
    if ('onPointerDown' in instance) {
      const bridge = createPointerBridge(instance as unknown as IPointerHandler, domEventOptions);
      domEvents.value = { ...bridge };
    }
  });

  onUnmounted(() => {
    if (core.value) {
      core.value.destroy(); // 内部会处理 Registry.unregister
    }
  });

  return {
    core,
    state,
    elementRef,
    domEvents,
    bindDelegates,
  };
}
