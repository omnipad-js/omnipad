/**
 * Filters an object by removing undefined values and specific excluded keys.
 *
 * @param obj - The source object.
 * @param excludeKeys - A set of keys to be ignored.
 * @returns A new object containing only allowed business properties.
 */
export function filterObjectByKeys(
  obj: Record<string, any>,
  excludeKeys: Set<string>,
): Record<string, any> {
  const result: Record<string, any> = {};
  
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];

    if (value !== undefined && !excludeKeys.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

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
export function getObjectDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
): Record<string, any> {
  const diff: Record<string, any> = {};

  // 1. 安全检查
  if (!oldObj) return { ...newObj };

  // 2. 只有在新对象中存在的键才需要对比（增量更新语义）
  const keys = Object.keys(newObj);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const newVal = newObj[key];
    const oldVal = oldObj[key];

    // 简单的浅比较：如果引用不同或基本类型值不同
    // 注意：如果涉及 layout 等深度嵌套对象，建议在业务层特殊处理或在此使用递归
    if (newVal !== oldVal) {
      // 额外的深度一致性检查（可选，针对 layout 对象）
      if (typeof newVal === 'object' && newVal !== null && oldVal !== null) {
        if (JSON.stringify(newVal) === JSON.stringify(oldVal)) continue;
      }
      diff[key] = newVal;
    }
  }
  return diff;
}

/**
 * Merges multiple objects from left to right.
 * Later objects will override properties of earlier ones.
 *
 * @template T - The expected return type.
 * @param objects - A list of objects to merge.
 * @returns The merged object as type T.
 */
export function mergeObjects<T>(...objects: (Record<string, any> | undefined | null)[]): T {
  return objects.reduce((acc, obj) => {
    if (!obj) return acc;
    return { ...acc, ...obj };
  }, {} as any) as T;
}
