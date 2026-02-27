import './styles/index.css';

import { TYPES } from '@omnipad/core';
import { registerComponent } from './utils/componentRegistry';
import InputZone from './components/InputZone.vue';
import RootLayer from './components/RootLayer.vue';
import TargetZone from './components/TargetZone.vue';
import VirtualKeyboardButton from './components/VirtualKeyboardButton.vue';
import VirtualMouseButton from './components/VirtualMouseButton.vue';
import VirtualTrackpad from './components/VirtualTrackpad.vue';

registerComponent(TYPES.INPUT_ZONE, InputZone);
registerComponent(TYPES.ROOT_LAYER, RootLayer);
registerComponent(TYPES.TARGET_ZONE, TargetZone);
registerComponent(TYPES.KEYBOARD_BUTTON, VirtualKeyboardButton);
registerComponent(TYPES.MOUSE_BUTTON, VirtualMouseButton);
registerComponent(TYPES.TRACKPAD, VirtualTrackpad);

export {
  InputZone,
  RootLayer,
  TargetZone,
  VirtualKeyboardButton,
  VirtualMouseButton,
  VirtualTrackpad,
};

export { registerComponent };
