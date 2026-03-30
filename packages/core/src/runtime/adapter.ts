import { EntityType } from '../types';
import { BaseConfig, ConfigTreeNode } from '../types/configs';
import { filterObjectByKeys, mergeObjects } from '../utils/object';

/**
 * Extract filtered override configurations.
 * @param props Original Props object (e.g. Vue's props)
 * @param skipKeys Ignore key set
 */
export function getOverrideProps(props: Record<string, any>, skipKeys: Set<string>) {
  return filterObjectByKeys(props, skipKeys);
}

/**
 * Merges multiple configuration sources into a unified widget configuration object.
 *
 * @description
 * This function performs a shallow merge of the provided configuration objects with a
 * specific precedence order (Right-most takes priority). It also performs a one-level
 * deep merge specifically for the `layout` property to ensure layout settings are
 * preserved across different sources.
 *
 * **Merge Priority (Highest to Lowest):**
 * 1. Fixed metadata (`id`, `baseType`, `parentId`) - *Guaranteed overrides*
 * 2. `overrideProps`
 * 3. `treeConfig`
 * 4. `defaultProps`
 *
 * @param requiredType - The formal entity type (e.g., 'button', 'input-zone') assigned to `baseType`.
 * @param uid - The unique identifier to be assigned to the `id` property.
 * @param parentId - The unique identifier of the parent container, if any.
 * @param defaultProps - The baseline fallback configuration.
 * @param treeConfig - Configuration derived from the widget tree structure.
 * @param overrideProps - Domain-specific or instance-specific property overrides.
 *
 * @returns A complete configuration object of type `T`.
 */
export function mergeWidgetConfig<T extends BaseConfig>(
  requiredType: EntityType,
  uid: string,
  parentId: string | undefined,
  defaultProps: Record<string, any>,
  treeConfig: Record<string, any>,
  overrideProps: Record<string, any>,
): T {
  // 1. 先进行整体扁平属性的合并
  const merged = mergeObjects<T>(defaultProps, treeConfig, overrideProps);

  // 2. 注入固定身份信息
  merged.id = uid;
  merged.baseType = requiredType;
  merged.parentId = parentId;

  // 3. 特殊处理：Layout 深度合并
  // 即使 businessProps 只传了 { width: 100 }，也要确保不会丢失 treeConfig 里的 { left: '10%' }
  merged.layout = mergeObjects(defaultProps.layout, treeConfig.layout, overrideProps.layout);

  return merged;
}

/**
 * Validates that the provided node exists and is non-empty.
 *
 * It matches the node against the `requiredType` by checking both the protocol-level `config.baseType`
 * and the potentially custom `type`.
 *
 * @param node - The configuration node to validate. Can be `undefined`.
 * @param requiredType - The expected {@link EntityType} the node should represent.
 *
 * @returns The original `node` if validation passes; otherwise, `undefined`.
 */
export function validateWidgetNode(
  node: ConfigTreeNode | undefined,
  requiredType: EntityType,
): ConfigTreeNode | undefined {
  if (!node || Object.keys(node ?? {}).length === 0) return undefined;

  const isValid = node.config?.baseType === requiredType || node.type === requiredType;

  if (!isValid) {
    if (import.meta.env?.DEV) {
      console.warn(
        `[OmniPad-Validation] Type mismatch! Expected "${requiredType}", received "${node.type}". Config ignored.`,
      );
    }
    return undefined;
  }

  return node;
}
