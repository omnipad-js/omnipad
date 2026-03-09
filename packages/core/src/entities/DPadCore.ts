import { BaseEntity } from './BaseEntity';
import { IPointerHandler, IProgrammatic } from '../types/traits';
import { DPadConfig } from '../types/configs';
import { DPadState } from '../types/state';
import { AbstractPointerEvent, CMP_TYPES } from '../types';
import { ActionEmitter } from '../utils/action';
import { clamp } from '../utils/math';
import { createRafThrottler } from '../utils/performance';

const INITIAL_STATE: DPadState = {
  isActive: false,
  pointerId: null,
  vector: { x: 0, y: 0 },
};

/**
 * Core logic for a virtual D-Pad widget.
 *
 * Acts as a spatial distributor that maps a single touch point to 4 independent ActionEmitters.
 * Supports 8-way input by allowing simultaneous activation of orthogonal directions.
 */
export class DPadCore
  extends BaseEntity<DPadConfig, DPadState>
  implements IPointerHandler, IProgrammatic
{
  // 维护四个独立的动作发射器 / Maintain four independent action emitters
  private emitters: {
    up: ActionEmitter;
    down: ActionEmitter;
    left: ActionEmitter;
    right: ActionEmitter;
  };

  private throttledPointerMove: (e: AbstractPointerEvent) => void;

  constructor(uid: string, config: DPadConfig) {
    super(uid, CMP_TYPES.D_PAD, config, INITIAL_STATE);

    // 为每个方向初始化发射器 / Initialize emitters for each direction
    const target = config.targetStageId;
    this.emitters = {
      up: new ActionEmitter(target, config.mapping?.up),
      down: new ActionEmitter(target, config.mapping?.down),
      left: new ActionEmitter(target, config.mapping?.left),
      right: new ActionEmitter(target, config.mapping?.right),
    };

    this.throttledPointerMove = createRafThrottler<AbstractPointerEvent>((e) => {
      this.processInput(e);
    });
  }

  // --- IPointerHandler Implementation ---

  public get activePointerId(): number | null {
    return this.state.pointerId;
  }

  public onPointerDown(e: AbstractPointerEvent): void {
    this.setState({ isActive: true, pointerId: e.pointerId, vector: { x: 0, y: 0 } });
  }

  public onPointerMove(e: AbstractPointerEvent): void {
    if (!this.state.isActive || e.pointerId !== this.state.pointerId) return;
    this.throttledPointerMove(e);
  }

  public onPointerUp(e: AbstractPointerEvent): void {
    if (!this.state.isActive || e.pointerId !== this.state.pointerId) return;
    this.reset();
  }

  public onPointerCancel(): void {
    this.reset();
  }

  // --- Internal Logic ---

  /**
   * Evaluates the touch position and updates the 4 emitters accordingly.
   * 使用轴向分割逻辑处理 8 方向输入
   */
  private processInput(e: AbstractPointerEvent, validate: boolean = false) {
    // 状态锁保护，防止节流产生的异常信号 / State lock protection prevents abnormal signals caused by throttling.
    if (!this.state.isActive) return;

    const rect = this.rect;
    if (!rect) return;

    // 1. 计算归一化向量 / Calculate normalized vector
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radiusX = rect.width / 2;
    const radiusY = rect.height / 2;

    const normX = (e.clientX - centerX) / radiusX;
    const normY = (e.clientY - centerY) / radiusY;

    // 验证触发点位置；若超出边界，则重置触发点位置 / Verify the trigger point location; if it is out of bounds, reset it.
    if (validate) {
      if (normX != clamp(normX, -1, 1) || normY != clamp(normY, -1, 1)) {
        this.setState({ vector: { x: 0, y: 0 } });
        return;
      }
    }

    const vector = { x: clamp(normX, -1, 1), y: clamp(normY, -1, 1) };

    // 更新内部 vector 状态供适配层渲染浮标 / Update vector for floating stick rendering
    this.setState({ vector });

    this.handleDigitalKeys(vector);
  }

  /**
   * 将摇杆位置转换为 4/8 方向按键信号
   */
  private handleDigitalKeys(v: { x: number; y: number }) {
    const threshold = this.config.threshold ?? 0.3;

    // Y-axis
    if (v.y < -threshold) {
      this.emitters.up.press();
      this.emitters.down.release();
    } else if (v.y > threshold) {
      this.emitters.down.press();
      this.emitters.up.release();
    } else {
      this.emitters.up.release();
      this.emitters.down.release();
    }

    // X-axis
    if (v.x < -threshold) {
      this.emitters.left.press();
      this.emitters.right.release();
    } else if (v.x > threshold) {
      this.emitters.right.press();
      this.emitters.left.release();
    } else {
      this.emitters.left.release();
      this.emitters.right.release();
    }
  }

  // --- IResettable Implementation ---

  public reset(): void {
    // 强制按顺序切断所有信号 / Forcefully cut off all signals in sequence
    this.emitters.up.reset();
    this.emitters.down.reset();
    this.emitters.left.reset();
    this.emitters.right.reset();

    this.setState(INITIAL_STATE);
  }

  // --- IConfigurable Implementation ---

  public override updateConfig(newConfig: Partial<DPadConfig>): void {
    super.updateConfig(newConfig);

    // 同步更新发射器配置 / sync update configuration of emitter
    this.emitters.up.update(this.config.targetStageId, this.config.mapping?.up);
    this.emitters.down.update(this.config.targetStageId, this.config.mapping?.down);
    this.emitters.left.update(this.config.targetStageId, this.config.mapping?.left);
    this.emitters.right.update(this.config.targetStageId, this.config.mapping?.right);
  }

  // --- IProgrammatic Implementation ---

  triggerVector(x: number, y: number): void {
    const vector = { x, y };
    const deadzone = this.config.threshold ?? 0.3;
    if (Math.abs(x) >= deadzone || Math.abs(y) >= deadzone) {
      this.setState({ isActive: true, vector });
      this.handleDigitalKeys(vector);
    } else {
      this.reset();
    }
  }
}
