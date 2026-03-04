// --- Query Utilities ---

/**
 * Recursively penetrates Shadow DOM boundaries to find the deepest element at the
 * specified viewport coordinates.
 *
 * @param x - Viewport X coordinate (px)
 * @param y - Viewport Y coordinate (px)
 * @param ignoreClass - Style class of DOM elements to be ignored
 * @returns The deepmost Element or null if none found at the position.
 */
export const getDeepElement = (
  x: number,
  y: number,
  ignoreClass: string = 'omnipad-target-zone',
): Element | null => {
  // Get all elements beneath the point
  const elements = document.elementsFromPoint(x, y);

  // Find the first element without ignoreClass (To skip elements like TargetZone)
  let target = elements.find((el) => !el.classList.contains(ignoreClass));

  if (!target) return null;

  // Drill down into shadowRoot if the current element is a host
  while (target && target.shadowRoot) {
    const nestedElements = target.shadowRoot.elementsFromPoint(x, y);
    const nestedTarget = nestedElements.find((el) => !el.classList.contains(ignoreClass));

    // If no nested element found or the same element returned, break recursion
    if (!nestedTarget || nestedTarget === target) break;
    target = nestedTarget;
  }

  return target;
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

// --- Action Utilities ---

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
        pointerId: 9999,
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

// --- Compatibility ---
let _isContainerQueriesSupported: boolean | undefined;

export const supportsContainerQueries = (): boolean => {
  if (_isContainerQueriesSupported !== undefined) return _isContainerQueriesSupported;

  _isContainerQueriesSupported =
    typeof window !== 'undefined' && !!window.CSS?.supports?.('width: 1cqw');

  return _isContainerQueriesSupported;
};

// --- Safe Capture ---

/**
 * Safely sets pointer capture on an element.
 *
 * @param el - The target element to capture the pointer.
 * @param pointerId - The unique ID of the pointer (from PointerEvent).
 */
export const safeSetCapture = (el: EventTarget | null, pointerId: number) => {
  if (el instanceof Element) {
    try {
      el.setPointerCapture(pointerId);
    } catch (err) {
      if (import.meta.env?.DEV) console.warn('[Omnipad-DOM] Failed to set pointer capture:', err);
    }
  }
};

/**
 * Safely releases pointer capture from an element.
 * Checks for current capture state and wraps in try-catch to prevent crashes.
 *
 * @param el - The target element.
 * @param pointerId - The unique ID of the pointer to release.
 */
export const safeReleaseCapture = (el: EventTarget | null, pointerId: number) => {
  if (el instanceof Element && el.hasPointerCapture(pointerId)) {
    try {
      el.releasePointerCapture(pointerId);
    } catch (err) {
      // Browsers often auto-release on up/cancel, so we silently ignore errors here.
    }
  }
};
