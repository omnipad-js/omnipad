import { Registry } from '../registry';

/**
 * Unique symbol key for the global InputManager instance.
 */
const INPUT_MANAGER_KEY = Symbol.for('omnipad.input_manager.instance');

/**
 * Global Input Manager Singleton.
 *
 * Responsible for monitoring global browser events (resize, blur, visibility)
 * and coordinating system-wide resets to prevent stuck inputs.
 */
export class InputManager {
  /** Internal flag to prevent multiple event registrations */
  private _isListening = false;

  private constructor() {}

  /**
   * Retrieves the global instance of the InputManager.
   * Ensures uniqueness across multiple bundles or modules.
   */
  public static getInstance(): InputManager {
    const globalObj = globalThis as any;

    if (!globalObj[INPUT_MANAGER_KEY]) {
      globalObj[INPUT_MANAGER_KEY] = new InputManager();
    }

    return globalObj[INPUT_MANAGER_KEY];
  }

  /**
   * Initializes global safety listeners.
   * Should be called once at the root component lifecycle (e.g., VirtualLayer).
   */
  public init(): void {
    // If already listening, return to prevent redundant registrations
    if (this._isListening) return;

    // 1. Monitor window resize (e.g., orientation change on mobile)
    window.addEventListener('resize', this.handleGlobalReset);

    // 2. Monitor window focus loss (e.g., clicking address bar, switching apps)
    window.addEventListener('blur', this.handleGlobalReset);

    // 3. Monitor page visibility (e.g., switching browser tabs)
    // document.addEventListener('visibilitychange', () => {
    //   if (document.visibilityState === 'hidden') {
    //     this.handleGlobalReset();
    //   }
    // });

    this._isListening = true;

    if (import.meta.env?.DEV) {
      console.log('[OmniPad-Core] Global InputManager monitoring started.');
    }
  }

  /**
   * Manually triggers a system-wide input reset via Registry.
   */
  private handleGlobalReset = (): void => {
    if (import.meta.env?.DEV) {
      console.debug('[OmniPad-Core] Safety reset triggered by environment change.');
    }
    Registry.getInstance().resetAll();
  };

  /**
   * Toggle full-screen state of the page.
   * @param element Target HTMLElement
   */
  public async toggleFullscreen(element?: HTMLElement): Promise<void> {
    const target = element || document.documentElement;

    try {
      if (!document.fullscreenElement) {
        // Before entering full-screen mode, perform a global reset to prevent input contamination during the transition.
        Registry.getInstance().resetAll();

        await target.requestFullscreen();
      } else {
        // Reset once before exiting full screen.
        Registry.getInstance().resetAll();

        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(`[OmniPad-Core] Fullscreen toggle failed:`, err);
    }
  }

  /**
   * Full-screen status query provided to the UI layer.
   */
  public isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  /**
   * Detaches all global listeners.
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleGlobalReset);
    window.removeEventListener('blur', this.handleGlobalReset);
    this._isListening = false;
  }
}
