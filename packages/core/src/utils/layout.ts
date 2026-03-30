import {
  LayoutBox,
  AnchorPoint,
  VALID_UNITS,
  CssUnit,
  ParsedLength,
  FlexibleLength,
  AbstractRect,
} from '../types';
import { sanitizeDomString } from './security';

/**
 * Convert the length input into a sanitized ParsedLength
 *
 * @param input - The raw length input.
 * @returns A sanitized ParsedLength.
 */
export function parseLength(input: FlexibleLength | undefined): ParsedLength | undefined {
  // 1. 处理空值或无效值
  if (input == null) {
    return undefined;
  }

  // 2. 处理 ParsedLength 对象
  if (typeof input === 'object' && 'unit' in input && 'value' in input) {
    return sanitizeParsedLength(input);
  }

  // 3. 处理纯数字：默认 px
  if (typeof input === 'number') {
    return {
      value: Number.isFinite(input) ? input : 0,
      unit: 'px',
    };
  }

  // 4. 处理字符串
  const val = input.trim().toLowerCase();
  const numericPart = parseFloat(val);

  // 检查数字部分是否有效
  if (isNaN(numericPart)) {
    return { value: 0, unit: 'px' };
  }

  // 直接截取剩下的所有内容作为单位
  const unitPart = val.slice(String(numericPart).length).trim();

  return sanitizeParsedLength({ value: numericPart, unit: unitPart as CssUnit });
}

/**
 * Check the whitelist of verification units and sanitize ParsedLength.
 */
export const sanitizeParsedLength = (parsed: ParsedLength): ParsedLength => {
  const { value, unit } = parsed;

  if (!isNaN(value) && (VALID_UNITS as readonly string[]).includes(unit)) {
    return { value, unit };
  }

  // 非法单位，降级为 px
  console.warn(`[OmniPad-Core] Blocked invalid CSS unit: ${unit}`);
  return { value: isNaN(value) ? 0 : value, unit: 'px' };
};

/**
 * Convert the ParsedLength back to a CSS string
 */
export const lengthToCss = (parsed: ParsedLength | undefined): string | undefined => {
  return parsed == null ? undefined : `${parsed.value}${parsed.unit}`;
};

/**
 * Validate a raw LayoutBox config.
 */
export function validateLayoutBox(raw: LayoutBox): LayoutBox {
  return {
    ...raw,
    left: parseLength(raw.left),
    top: parseLength(raw.top),
    right: parseLength(raw.right),
    bottom: parseLength(raw.bottom),
    width: parseLength(raw.width),
    height: parseLength(raw.height),
    // 关键：对选择器和类名进行脱毒处理 / Critical: Sanitize selector and class names
    stickySelector: sanitizeDomString(raw.stickySelector),
  };
}

/**
 * Compress layout properties into css strings.
 */
export function compressLayoutBox(raw: LayoutBox): LayoutBox {
  return {
    ...raw,
    left: lengthToCss(raw.left as any),
    top: lengthToCss(raw.top as any),
    right: lengthToCss(raw.right as any),
    bottom: lengthToCss(raw.bottom as any),
    width: lengthToCss(raw.width as any),
    height: lengthToCss(raw.height as any),
  };
}

/**
 * Resolves a relative 'absolute' layout configuration into a 'fixed' pixel-based layout.
 *
 * **Transformation:**
 * - **Input:** A `layout` defined relative to the `targetRect` (similar to CSS `position: absolute`).
 * - **Output:** A `layout` defined in the same coordinate space as the `targetRect` (similar to CSS `position: fixed` or global coordinates).
 *
 * **Key Logic:**
 * 1. Converts dynamic units (like `%`) into `px` based on the `targetRect`'s dimensions.
 * 2. Adds the `targetRect`'s own offset (`left`/`top`) to the result, effectively
 * "pinning" the layout to a fixed position in the parent/viewport coordinate system.
 * 3. Clears `right` and `bottom` to ensure the output is a normalized [left, top, width, height] box.
 *
 * @param layout - The relative layout (e.g., `{ left: '10%' }` of the target).
 * @param targetRect - The reference rect used as the "container" for calculation.
 * @param toPx - Optional converter for custom unit handling.
 * @returns A normalized `LayoutBox` with fixed pixel strings.
 */
export function flattenRelativeLayout(
  layout: LayoutBox,
  targetRect: AbstractRect,
  toPx?: (p: ParsedLength | undefined, base: number) => number,
): LayoutBox {
  // 1. 解析所有维度参数
  const pL = layout.left !== undefined ? parseLength(layout.left) : null;
  const pR = layout.right !== undefined ? parseLength(layout.right) : null;
  const pT = layout.top !== undefined ? parseLength(layout.top) : null;
  const pB = layout.bottom !== undefined ? parseLength(layout.bottom) : null;
  const pW = layout.width !== undefined ? parseLength(layout.width) : null;
  const pH = layout.height !== undefined ? parseLength(layout.height) : null;

  if (!toPx) {
    toPx = (p: ParsedLength | undefined, base: number) =>
      p ? (p.unit === '%' ? (p.value / 100) * base : p.value) : 0;
  }

  // --- 水平计算 (Horizontal) ---
  let finalWidth: number;
  let finalLeft: number;

  if (pL !== null && pR !== null && pW === null) {
    // 情况 A: left + right 决定宽度
    finalLeft = targetRect.left + toPx(pL, targetRect.width);
    const rightOffset = targetRect.right - toPx(pR, targetRect.width);
    finalWidth = rightOffset - finalLeft;
  } else {
    // 情况 B: 标准优先级 (left > right)
    finalWidth = pW ? toPx(pW, targetRect.width) : 0;
    if (pL !== null) {
      finalLeft = targetRect.left + toPx(pL, targetRect.width);
    } else if (pR !== null) {
      finalLeft = targetRect.right - toPx(pR, targetRect.width) - finalWidth;
    } else {
      finalLeft = targetRect.left; // 默认靠左
    }
  }

  // --- 垂直计算 (Vertical) ---
  let finalHeight: number;
  let finalTop: number;

  if (pT !== null && pB !== null && pH === null) {
    // 情况 A: top + bottom 决定高度
    finalTop = targetRect.top + toPx(pT, targetRect.height);
    const bottomOffset = targetRect.bottom - toPx(pB, targetRect.height);
    finalHeight = bottomOffset - finalTop;
  } else {
    // 情况 B: 标准优先级 (top > bottom)
    finalHeight = pH ? toPx(pH, targetRect.height) : 0;
    if (pT !== null) {
      finalTop = targetRect.top + toPx(pT, targetRect.height);
    } else if (pB !== null) {
      finalTop = targetRect.bottom - toPx(pB, targetRect.height) - finalHeight;
    } else {
      finalTop = targetRect.top; // 默认靠顶
    }
  }

  // 更新结果对象
  return {
    ...layout,
    left: `${finalLeft}px`,
    top: `${finalTop}px`,
    width: pW || (pL && pR) ? `${finalWidth}px` : layout.width,
    height: pH || (pT && pB) ? `${finalHeight}px` : layout.height,
    // 清除 right 和 bottom，因为已经转换为了 fixed 坐标系的 top/left
    right: undefined,
    bottom: undefined,
  };
}

/**
 * Converts a LayoutBox configuration into a CSS style object suitable for Vue/React.
 *
 * This utility handles:
 * 1. Unit normalization: Converts numeric values to 'px' strings while preserving unit strings (vh, %, etc.).
 * 2. Positioning: Sets 'absolute' positioning by default.
 * 3. Anchoring: Maps AnchorPoint values to CSS 'transform' translations to ensure
 *    the component's origin matches its defined coordinates.
 *
 * @param layout - The LayoutBox configuration object.
 * @returns A CSS style record object.
 *
 * @example
 * // returns { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
 * resolveLayoutStyle({ left: '50%', top: '50%', anchor: 'center' });
 */
export const resolveLayoutStyle = (layout: LayoutBox): Record<string, string | number> => {
  if (Object.keys(layout ?? {}).length === 0) return {};

  const style: Record<string, string | number> = {};

  // 根据布局模式强制指定定位方式，确保与 LayoutBox 的坐标系统同步
  // Forced positioning mode to maintain consistency with the LayoutBox coordinate system.
  style.position = layout.stickySelector ? 'fixed' : 'absolute';
  // 设置等宽等高；当仅设置单一维度时视为正方形 / Equal width and height; when only one dimension is set, it is treated as a square.
  if (layout.isSquare) style.aspectRatio = '1/1';

  // 1. 处理基础位置和尺寸
  // 遍历标准的 CSS 位置属性
  const fields: (keyof LayoutBox)[] = ['left', 'top', 'right', 'bottom', 'width', 'height'];
  fields.forEach((field) => {
    const rawValue = layout[field];
    if (rawValue != undefined) {
      const parsed = parseLength(rawValue as ParsedLength);
      if (parsed != null) style[field] = lengthToCss(parsed)!;
    }
  });

  // 2. 处理 zIndex
  if (layout.zIndex !== undefined) style.zIndex = layout.zIndex;

  // 3. 核心：处理锚点 (Anchor -> Transform)
  // 通过 translate 偏移，使得开发者设置的 left/top 坐标点 成为组件的“锚定点”
  const anchorMap: Record<AnchorPoint, string> = {
    'top-left': 'translate(0, 0)',
    'top-center': 'translate(-50%, 0)',
    'top-right': 'translate(-100%, 0)',
    'center-left': 'translate(0, -50%)',
    center: 'translate(-50%, -50%)',
    'center-right': 'translate(-100%, -50%)',
    'bottom-left': 'translate(0, -100%)',
    'bottom-center': 'translate(-50%, -100%)',
    'bottom-right': 'translate(-100%, -100%)',
  };

  if (layout.anchor) {
    style.transform = anchorMap[layout.anchor];
  }

  return style;
};
