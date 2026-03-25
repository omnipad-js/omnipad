import { LayoutBox, AnchorPoint, VALID_UNITS, CssUnit, ParsedLength } from '../types';

/**
 * Convert the length input into a sanitized ParsedLength
 *
 * @param input - The raw length input.
 * @returns A sanitized ParsedLength.
 */
export function parseLength(input: string | number | undefined): ParsedLength {
  // 1. 处理空值或无效值
  if (input === undefined || input === null) {
    return { value: 0, unit: 'px' };
  }

  // 2. 处理纯数字：默认 px
  if (typeof input === 'number') {
    return {
      value: Number.isFinite(input) ? input : 0,
      unit: 'px',
    };
  }

  // 3. 处理字符串
  const val = input.trim();
  const numericPart = parseFloat(val);

  // 检查数字部分是否有效
  if (isNaN(numericPart)) {
    return { value: 0, unit: 'px' };
  }

  // 提取单位部分
  const unitMatch = val.match(/[a-z%]+$/i);
  const unitPart = unitMatch ? unitMatch[0].toLowerCase() : 'px';

  return sanitizeParsedLength({ value: numericPart, unit: unitPart as CssUnit });
}

/**
 * Check the whitelist of verification units and sanitize ParsedLength.
 */
export const sanitizeParsedLength = (parsed: ParsedLength): ParsedLength => {
  const { value, unit } = parsed;
  if ((VALID_UNITS as readonly string[]).includes(unit)) {
    return { value, unit };
  }

  // 非法单位，降级为 px
  console.warn(`[Omnipad-Core] Blocked invalid CSS unit: ${unit}`);
  return { value, unit: 'px' };
};

/**
 * Convert the ParsedLength back to a CSS string
 */
export const lengthToCss = (parsed: ParsedLength): string => {
  return `${parsed.value}${parsed.unit}`;
};

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

  // 强制使用绝对定位，因为 LayoutBox 是基于坐标系的 / Forced use of absolute positioning because LayoutBox is based on a coordinate system.
  style.position = 'absolute';
  // 设置等宽等高；当仅设置单一维度时视为正方形 / Equal width and height; when only one dimension is set, it is treated as a square.
  if (layout.isSquare) style.aspectRatio = '1/1';

  // 1. 处理基础位置和尺寸
  // 遍历标准的 CSS 位置属性
  const fields: (keyof LayoutBox)[] = ['left', 'top', 'right', 'bottom', 'width', 'height'];
  fields.forEach((field) => {
    const rawValue = layout[field];
    if (rawValue != undefined) {
      // 检查是否已经是解析好的对象
      if (typeof rawValue === 'object' && 'unit' in rawValue) {
        const parsed = sanitizeParsedLength(rawValue as ParsedLength);
        style[field] = lengthToCss(parsed);
      } else if (typeof rawValue === 'string' || typeof rawValue === 'number') {
        const parsed = parseLength(rawValue as string | number);
        style[field] = lengthToCss(parsed);
      }
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
