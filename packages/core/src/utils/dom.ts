import { AnchorPoint, Vec2 } from '../types';

// --- 1. Query Utilities ---

/**
 * Recursively penetrates Shadow DOM boundaries to find the deepest element at the
 * specified viewport coordinates.
 *
 * @param x - Viewport X coordinate (px)
 * @param y - Viewport Y coordinate (px)
 * @returns The deepmost Element or null if none found at the position.
 */
export const getDeepElement = (x: number, y: number): Element | null => {
  let el = document.elementFromPoint(x, y);

  // Drill down into shadowRoot if the current element is a host
  while (el && el.shadowRoot) {
    const nested = el.shadowRoot.elementFromPoint(x, y);
    // If no nested element found or the same element returned, break recursion
    if (!nested || nested === el) break;
    el = nested;
  }
  return el;
};

/**
 * Recursively finds the truly focused element by traversing Shadow DOM boundaries.
 *
 * @returns The deepmost active Element in focus or null.
 */
export const getDeepActiveElement = (): Element | null => {
  let el = document.activeElement;

  // Traverse through activeElements of shadow containers
  while (el && el.shadowRoot && el.shadowRoot.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
};

// --- 2. Action Utilities ---

/**
 * Forcefully focuses an element.
 * Automatically handles the 'tabindex' attribute to ensure non-focusable elements (like Canvas)
 * can receive focus.
 *
 * @param el - The target HTMLElement to focus.
 */
export const focusElement = (el: HTMLElement) => {
  // Skip if already focused
  if (getDeepActiveElement() === el) return;

  // Set tabindex if missing to make element focusable
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1');
  }
  el.focus();
};

/**
 * Dispatches a synthetic KeyboardEvent to the window object.
 *
 * @param type - The event type, e.g., 'keydown' or 'keyup'.
 * @param payload - Key mapping data including key, code, and legacy keyCode.
 */
export const dispatchKeyboardEvent = (
  type: string,
  payload: { key: string; code: string; keyCode: number },
) => {
  const ev = new KeyboardEvent(type, {
    ...payload,
    which: payload.keyCode, // Support for legacy Flash engines
    bubbles: true,
    cancelable: true,
    view: window,
  });
  window.dispatchEvent(ev);
};

/**
 * Dispatches a high-fidelity sequence of Pointer and Mouse events at specific pixel coordinates.
 * Finds the target element dynamically at the moment of dispatch.
 *
 * @param type - The event type (should start with 'pointer' for best compatibility).
 * @param x - Viewport X coordinate (px).
 * @param y - Viewport Y coordinate (px).
 * @param opts - Additional PointerEvent options (button, pressure, etc.).
 */
export const dispatchPointerEventAtPos = (
  type: string,
  x: number,
  y: number,
  opts: PointerEventInit = {},
) => {
  const target = getDeepElement(x, y);
  if (!target) return;

  const commonProps = {
    bubbles: true,
    cancelable: true,
    composed: true, // Crucial for piercing Shadow DOM boundaries
    clientX: x,
    clientY: y,
    view: window,
    ...opts,
  };

  // If type is pointer-based, dispatch both PointerEvent and MouseEvent for 100% engine compatibility
  if (type.startsWith('pointer')) {
    target.dispatchEvent(
      new PointerEvent(type, {
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse', // Emulate mouse behavior for Flash MouseOver/Down logic
        ...commonProps,
      }),
    );

    // Automatically map pointer events to traditional mouse events
    const mouseType = type.replace('pointer', 'mouse');
    target.dispatchEvent(new MouseEvent(mouseType, commonProps));
  } else {
    // Fallback for direct mouse event dispatch
    target.dispatchEvent(new MouseEvent(type, commonProps));
  }
};

// --- 3. Geometry Utilities ---

/**
 * Calculates the pixel coordinate of an anchor point within a given DOMRect.
 * Used to translate relative layout definitions into screen-space pixels.
 *
 * @param rect - The bounding box of the container.
 * @param anchor - The defined anchor point (e.g., 'center', 'top-left').
 * @returns The absolute viewport coordinates {x, y}.
 */
export const getAnchorPosition = (rect: DOMRect, anchor: AnchorPoint): Vec2 => {
  const { left: l, top: t, width: w, height: h } = rect;

  const map: Record<AnchorPoint, Vec2> = {
    'top-left': { x: l, y: t },
    'top-center': { x: l + w / 2, y: t },
    'top-right': { x: l + w, y: t },
    'center-left': { x: l, y: t + h / 2 },
    center: { x: l + w / 2, y: t + h / 2 },
    'center-right': { x: l + w, y: t + h / 2 },
    'bottom-left': { x: l, y: t + h },
    'bottom-center': { x: l + w / 2, y: t + h },
    'bottom-right': { x: l + w, y: t + h },
  };

  return map[anchor] || map['center'];
};
