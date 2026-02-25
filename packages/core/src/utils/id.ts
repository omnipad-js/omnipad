/**
 * Generates a globally unique identifier (UID) for runtime entity management and DOM keys.
 *
 * The generated ID follows the format: `[prefix]-[timestamp_base36]-[random_string]`.
 * This ensures that components generated at different times or across multiple sessions
 * remain unique within the current page instance.
 *
 * @param prefix - A string prefix for the ID, typically the component type (e.g., 'btn', 'joy'). Defaults to 'omnipad'.
 * @returns A unique string identifier.
 *
 * @example
 * generateUID('button') // returns "button-m7x8k1p2-f4k2"
 */
export const generateUID = (prefix: string = 'omnipad'): string => {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${stamp}-${random}`;
};

/**
 * Checks if the provided ID is a reserved global identifier.
 *
 * In OmniPad, IDs starting with the `$` symbol are considered "Global IDs".
 * These identifiers are treated as static references and are not transformed
 * into dynamic UIDs during configuration parsing.
 *
 * @param id - The identifier string to check.
 * @returns `true` if the ID starts with `$`, otherwise `false`.
 *
 * @example
 * isGlobalID('$root-layer') // returns true
 * isGlobalID('btn-up')      // returns false
 */
export function isGlobalID(id: string): boolean {
  return id.startsWith('$');
}
