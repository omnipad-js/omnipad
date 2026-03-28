import { AbstractRect } from '../types';
import { createCachedProvider } from '../utils/cache';

/**
 * StickyProvider manages the link between a virtual widget and a physical DOM element.
 * It provides efficient element caching and coordinate tracking to enable "sticky" layouts.
 */
export class StickyProvider {
  private _selector: string;
  private _cachedElement: Element | null = null;
  private _rectCache: ReturnType<typeof createCachedProvider<AbstractRect | null>>;

  /**
   * @param initialSelector - The CSS selector of the element to "stick" to.
   */
  constructor(initialSelector: string) {
    this._selector = initialSelector;

    // 初始化 Rect 缓存闭包 / Initialize Rect cache closure
    this._rectCache = createCachedProvider(() => {
      const el = this.getElement();
      if (!el) return null;
      // 执行昂贵的布局查询 / Perform expensive layout query
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    });
  }

  /**
   * Retrieves the target DOM element.
   * Uses a "lazy-refresh" strategy: only re-queries the DOM if the cached element is detached.
   *
   * @returns The target element or null if not found.
   */
  public getElement(): Element | null {
    // 检查缓存的元素是否依然在文档流中 / Check if the cached element is still in the document
    if (this._cachedElement && document.contains(this._cachedElement)) {
      return this._cachedElement;
    }

    // 执行 DOM 查询 / Execute DOM query
    this._cachedElement = document.querySelector(this._selector);

    if (import.meta.env?.DEV && !this._cachedElement) {
      console.warn(`[OmniPad-DOM] Sticky target not found: "${this._selector}"`);
    }

    return this._cachedElement;
  }

  /**
   * Returns the current Rect of the sticky target.
   * Uses internal cache to prevent layout thrashing.
   */
  public getRect(): AbstractRect | null {
    return this._rectCache.get();
  }

  /**
   * Invalidates the current Rect cache.
   * Should be called during window resize, scroll, or manual re-alignments.
   */
  public markDirty(): void {
    this._rectCache.markDirty();
  }

  /**
   * Updates the selector and clears the current element cache.
   *
   * @param newSelector - The new CSS selector.
   * @returns The previous cached element (if any).
   */
  public updateSelector(newSelector: string): Element | null {
    if (this._selector === newSelector) return null;

    const old = this._cachedElement;
    this._selector = newSelector;
    this._cachedElement = null;
    this.markDirty();

    return old;
  }
}
