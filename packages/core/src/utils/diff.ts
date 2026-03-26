/**
 * Compares two objects and extracts the properties that have changed.
 *
 * This function performs a shallow comparison of keys. For nested objects,
 * it performs a structural check to determine if
 * the contents have changed.
 *
 * @param oldObj - The previous state or snapshot of the object.
 * @param newObj - The new state of the object to compare against the old one.
 * @returns A partial record containing only the key-value pairs that differ from the original.
 */
export function getObjectDiff(oldObj: any, newObj: any): Record<string, any> {
  const diff: Record<string, any> = {};

  // If the previous state doesn't exist, the entire new object is considered a change
  if (!oldObj) return { ...newObj };

  Object.keys(newObj).forEach((key) => {
    const newVal = newObj[key];
    const oldVal = oldObj[key];

    // Handle nested objects (like LayoutBox) via structural comparison
    if (typeof newVal === 'object' && newVal !== null) {
      // For performance in this specific use case, we use JSON stringification
      // to detect changes in nested layout properties.
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        diff[key] = newVal;
      }
    } else if (newVal !== oldVal) {
      // Handle primitive types (string, number, boolean)
      diff[key] = newVal;
    }
  });

  return diff;
}
