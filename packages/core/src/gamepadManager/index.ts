import { Registry } from '../registry';
import { ICoreEntity, IPointerHandler, IProgrammatic } from '../types/traits';
import { GamepadMappingConfig, StandardButton } from '../types/gamepad';

/**
 * Unique symbol key for the global GameManager instance.
 */
const GAMEPAD_MANAGER_KEY = Symbol.for('omnipad.gamepad_manager.instance');

// 标准手柄按键索引映射
const BUTTON_MAP: Record<StandardButton, number> = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  Select: 8,
  Start: 9,
  L3: 10,
  R3: 11,
  Up: 12,
  Down: 13,
  Left: 14,
  Right: 15,
};

export class GamepadManager {
  private isRunning = false;
  private config: GamepadMappingConfig | null = null;

  // 记录上一帧的状态，用于判定按下/抬起边缘
  private lastButtonStates: boolean[] = [];

  private constructor() {}

  public static getInstance(): GamepadManager {
    const globalObj = globalThis as any;

    if (!globalObj[GAMEPAD_MANAGER_KEY]) {
      globalObj[GAMEPAD_MANAGER_KEY] = new GamepadManager();
    }

    return globalObj[GAMEPAD_MANAGER_KEY];
  }

  public setConfig(config: GamepadMappingConfig) {
    this.config = config;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    window.addEventListener('gamepadconnected', (e) => {
      console.log('[Omnipad-Core] Gamepad Connected:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', () => {
      console.log('[Omnipad-Core] Gamepad disconnected.');
    });
    this.loop();
  }

  public stop() {
    this.isRunning = false;
  }

  private loop = () => {
    if (!this.isRunning) return;

    const gamepads = navigator.getGamepads();

    // 简单起见，只取第一个连接的手柄
    const pad = Array.from(gamepads).filter((p) => p !== null)[0];

    if (pad && this.config) {
      this.processButtons(pad);
      this.processDPad(pad);
      this.processAxes(pad);
    }

    requestAnimationFrame(this.loop);
  };

  private processButtons(pad: Gamepad) {
    if (!this.config?.buttons) return;

    Object.entries(this.config.buttons).forEach(([btnName, targetCid]) => {
      const btnIndex = BUTTON_MAP[btnName as StandardButton];
      if (btnIndex === undefined || !pad.buttons[btnIndex]) return;

      const isPressed = pad.buttons[btnIndex].pressed;
      const wasPressed = this.lastButtonStates[btnIndex] || false;

      // 边缘检测 (Edge Detection)
      if (isPressed && !wasPressed) {
        this.triggerVirtualEntity(targetCid, 'down');
      } else if (!isPressed && wasPressed) {
        this.triggerVirtualEntity(targetCid, 'up');
      }

      this.lastButtonStates[btnIndex] = isPressed;
    });
  }

  private processDPad(pad: Gamepad) {
    const targetUid = this.config?.dpad;
    if (!targetUid) return;

    // 1. 获取实体十字键的原始状态 (Standard Mapping: 12-Up, 13-Down, 14-Left, 15-Right)
    const up = pad.buttons[12]?.pressed ? -1 : 0;
    const down = pad.buttons[13]?.pressed ? 1 : 0;
    const left = pad.buttons[14]?.pressed ? -1 : 0;
    const right = pad.buttons[15]?.pressed ? 1 : 0;

    // 2. 合并为向量
    const vx = left + right; // 结果为 -1, 0, 或 1
    const vy = up + down;

    // 3. 发送给虚拟 D-Pad 或 虚拟摇杆
    // 它们都实现了 triggerVector(x, y) 契约
    this.triggerVirtualEntity(targetUid, 'vector', { x: vx, y: vy });
  }

  private processAxes(pad: Gamepad) {
    const deadzone = this.config?.deadzone ?? 0.1;

    // 左摇杆 (Axis 0: X, Axis 1: Y)
    if (this.config?.leftStick) {
      const x = Math.abs(pad.axes[0]) > deadzone ? pad.axes[0] : 0;
      const y = Math.abs(pad.axes[1]) > deadzone ? pad.axes[1] : 0;
      this.triggerVirtualEntity(this.config.leftStick, 'vector', { x, y });
    }

    // 右摇杆 (Axis 2: X, Axis 3: Y)
    if (this.config?.rightStick) {
      const x = Math.abs(pad.axes[2]) > deadzone ? pad.axes[2] : 0;
      const y = Math.abs(pad.axes[3]) > deadzone ? pad.axes[3] : 0;
      this.triggerVirtualEntity(this.config.rightStick, 'vector', { x, y });
    }
  }

  /**
   * 工具：通过 Registry 查找组件，并调用程序化接口
   */
  private triggerVirtualEntity(
    uid: string,
    action: 'down' | 'up' | 'vector',
    payload?: { x: number; y: number },
  ) {
    const target = Registry.getInstance().getEntity<ICoreEntity & IProgrammatic & IPointerHandler>(uid);
    if (!target || target.activePointerId) return;

    if (action === 'down' && target.triggerDown) target.triggerDown();
    if (action === 'up' && target.triggerUp) target.triggerUp();
    if (action === 'vector' && target.triggerVector && payload) {
      target.triggerVector(payload.x, payload.y);
    }
  }
}
