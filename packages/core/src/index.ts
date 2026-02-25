import { CONTEXT, KEYS, TYPES } from './types';

export * from './types';
export * from './utils';

export { InputManager } from './imputManager';
export { Registry } from './registry';

export { BaseEntity } from './entities/BaseEntity';
export { InputZoneCore } from './entities/InputZoneCore';
export { KeyboardButtonCore } from './entities/KeyboardButtonCore';
export { RootLayerCore } from './entities/RootLayerCore';
export { TargetZoneCore } from './entities/TargetZoneCore';

export const OmniPad = {
  Context: CONTEXT,
  Keys: KEYS,
  Types: TYPES,
};
