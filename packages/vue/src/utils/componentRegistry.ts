import { defineComponent, h, type Component } from 'vue';

const registry: Record<string, Component> = {};

export function registerComponent(type: string, component: Component) {
  registry[type] = component;
}

export function getComponent(type: string): Component {
  const comp = registry[type];
  if (!comp) {
    return defineComponent({
      render: () => h('div', { style: 'color:red' }, `[Unknown: ${type}]`),
    });
  }
  return comp;
}
