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

export function getComponentSafe(type: string | undefined): Component | null {
  if (!type || !registry[type]) return null;
  return registry[type];
}

export function hasRegisteredComponent(type: string | undefined): boolean {
  if (!type) return false;
  return !!registry[type];
}
