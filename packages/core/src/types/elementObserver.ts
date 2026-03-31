/**
 * Interface for the global ElementObserver singleton.
 */
export interface IElementObserver<T> {
  /**
   * Starts observing size changes for a specific element.
   *
   * @param uid - The unique entity ID associated with the observation.
   * @param el - The target element to observe.
   * @param cb - Callback triggered when the element's size changes.
   */
  observeResize(uid: string, el: T, cb: () => void): void;

  /**
   * Stops observing size changes for the entity identified by the UID.
   *
   * @param uid - The unique entity ID to unregister.
   */
  unobserveResize(uid: string): void;

  /**
   * Starts observing visibility (intersection) changes for a specific element.
   *
   * @param uid - The unique entity ID associated with the observation.
   * @param el - The target element to observe.
   * @param cb - Callback triggered when visibility enters or exits the viewport.
   */
  observeIntersect(uid: string, el: T, cb: (isIntersecting: boolean) => void): void;

  /**
   * Stops observing intersection changes for the entity identified by the UID.
   *
   * @param uid - The unique entity ID to unregister.
   */
  unobserveIntersect(uid: string): void;

  /**
   * Disconnects all observers (RO and IO) associated with a specific UID.
   * Usually called during component destruction for thorough cleanup.
   *
   * @param uid - The unique entity ID to fully disconnect.
   */
  disconnect(uid: string): void;
}
