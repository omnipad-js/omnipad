import { BaseEntity } from './BaseEntity';
import { ICoreEntity, IPointerHandler, ISignalReceiver } from '../types/traits';
import { TrackpadConfig } from '../types/configs';
import { TrackpadState } from '../types/state';
import { ACTION_TYPES, TYPES } from '../types';
import { Registry } from '../registry';
import { createRafThrottler } from '../utils/performance';

/** Internal gesture constants */
const GESTURE = {
  TAP_TIME: 200, // 200ms 内抬起视为轻点
  TAP_DISTANCE: 10, // 位移小于 10px 视为点击判定
  DOUBLE_TAP_GAP: 300, // 两次点击间隔小于 300ms 视为双击触发
};

/**
 * Initial state for the keyboard button.
 */
const INITIAL_STATE: TrackpadState = {
  isActive: false,
  isPressed: false,
  pointerId: null,
  value: 0,
};

export class TrackpadCore
  extends BaseEntity<TrackpadConfig, TrackpadState>
  implements IPointerHandler
{
  private lastPointerPos = { x: 0, y: 0 };
  private startTime = 0;
  private startPos = { x: 0, y: 0 };

  // 连击追踪
  private lastClickTime = 0;
  private isDragMode = false;

  private throttledPointerMove: (e: PointerEvent) => void;

  constructor(uid: string, config: TrackpadConfig) {
    super(uid, TYPES.TRACKPAD, config, INITIAL_STATE);

    this.throttledPointerMove = createRafThrottler<PointerEvent>((e) => {
      this.processPointerMove(e);
    });
  }

  public onPointerDown(e: PointerEvent): void {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    const now = Date.now();
    this.startTime = now;
    this.startPos = { x: e.clientX, y: e.clientY };
    this.lastPointerPos = { x: e.clientX, y: e.clientY };

    // 检测双击拖拽：当前按下时间 - 上次抬起时间
    if (now - this.lastClickTime < GESTURE.DOUBLE_TAP_GAP) {
      this.isDragMode = true;
      this.sendSignal(ACTION_TYPES.MOUSEDOWN);
      this.setState({ isPressed: true }); // 显示按压反馈
    }

    this.setState({ isActive: true, pointerId: e.pointerId });
  }

  public onPointerMove(e: PointerEvent): void {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    if (this.state.pointerId !== e.pointerId) return;

    this.throttledPointerMove(e);
  }

  private processPointerMove(e: PointerEvent) {
    // 计算物理像素位移量
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;

    // 应用灵敏度并转换为百分比增量 (假设 Stage 的尺寸是 100x100 的逻辑单位)
    // 这里的 delta 最好是在发送给 TargetZone 时根据其真实 Rect 换算，
    // 但为了解耦，我们在这里发送“灵敏度调整后的逻辑位移”
    const rect = this.getRect();
    if (!rect) return;

    // 算法：位移像素 / 容器像素 * 100 * 灵敏度
    const deltaX = (dx / rect.width) * 100 * this.config.sensitivity;
    const deltaY = (dy / rect.height) * 100 * this.config.sensitivity;

    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      this.sendSignal(ACTION_TYPES.MOUSEMOVE, { delta: { x: deltaX, y: deltaY } });
    }

    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  }

  public onPointerUp(e: PointerEvent): void {
    if (this.state.pointerId !== e.pointerId) return;
    if (e.cancelable) e.preventDefault();

    const duration = Date.now() - this.startTime;
    const dist = Math.hypot(e.clientX - this.startPos.x, e.clientY - this.startPos.y);

    if (this.isDragMode) {
      // 结束双击拖拽
      this.sendSignal(ACTION_TYPES.MOUSEUP);
      this.isDragMode = false;
    } else if (duration < GESTURE.TAP_TIME && dist < GESTURE.TAP_DISTANCE) {
      // 触发轻点点击 (完整序列)
      this.sendSignal(ACTION_TYPES.CLICK);
      // 记录这次有效点击的时间，为下一次 pointerdown 的双击判定做准备
      this.lastClickTime = Date.now();
    }

    this.handleRelease(e);
  }

  public onPointerCancel(e: PointerEvent): void {
    this.handleRelease(e);
  }

  public reset(): void {
    if (this.isDragMode) this.sendSignal(ACTION_TYPES.MOUSEUP);
    this.isDragMode = false;
    this.setState(INITIAL_STATE);
  }

  private handleRelease(e: PointerEvent) {
    if ((e.target as Element).hasPointerCapture(e.pointerId)) {
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
    this.setState(INITIAL_STATE);
  }

  private sendSignal(type: string, extraPayload: any = {}) {
    if (!this.config.targetStageId) return;
    const target = Registry.getInstance().getEntity<ICoreEntity & ISignalReceiver>(
      this.config.targetStageId,
    );
    target?.handleSignal({
      targetStageId: this.config.targetStageId,
      type,
      payload: {
        button: 0,
        ...extraPayload,
      },
    });
  }
}
