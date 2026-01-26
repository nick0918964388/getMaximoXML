import type { SAFieldDefinition } from './types';

/**
 * Get the order value for a field, using the originalIndex as fallback
 * This handles legacy data that may not have the order property
 */
function getFieldOrder(field: SAFieldDefinition, originalIndex: number): number {
  return field.order ?? originalIndex;
}

/**
 * Get the group key for a field (used to identify which group a field belongs to)
 * Fields are grouped by: area, tabName, subTabName, and relationship (for detail fields)
 */
function getGroupKey(field: SAFieldDefinition): string {
  if (field.area === 'list') {
    return 'list';
  }
  const subTabPart = field.subTabName || '';
  if (field.area === 'detail') {
    return `${field.area}:${field.tabName || 'Main'}:${subTabPart}:${field.relationship || 'default'}`;
  }
  return `${field.area}:${field.tabName || 'Main'}:${subTabPart}`;
}

/**
 * Find all fields in the same group as the given field
 */
function getFieldsInSameGroup(
  fields: SAFieldDefinition[],
  targetField: SAFieldDefinition
): { field: SAFieldDefinition; originalIndex: number }[] {
  const targetGroupKey = getGroupKey(targetField);
  return fields
    .map((field, originalIndex) => ({ field, originalIndex }))
    .filter(({ field }) => getGroupKey(field) === targetGroupKey);
}

/**
 * Move a field up one position within its group
 * @param fields All fields
 * @param index The index of the field to move in the fields array
 * @returns Updated fields array
 */
export function moveFieldUp(
  fields: SAFieldDefinition[],
  index: number
): SAFieldDefinition[] {
  if (index < 0 || index >= fields.length) {
    return fields;
  }

  const targetField = fields[index];
  const groupFields = getFieldsInSameGroup(fields, targetField);

  // Sort by order to find position within group (use originalIndex as fallback for undefined order)
  const sortedGroup = [...groupFields].sort((a, b) =>
    getFieldOrder(a.field, a.originalIndex) - getFieldOrder(b.field, b.originalIndex)
  );

  // Find the position of our target field in the sorted group
  const positionInGroup = sortedGroup.findIndex(({ originalIndex }) => originalIndex === index);

  // If it's the first field in the group, can't move up
  if (positionInGroup <= 0) {
    return fields;
  }

  // Find the field above (in the sorted order)
  const fieldAbove = sortedGroup[positionInGroup - 1];

  // Swap orders (use computed order values for fields without order property)
  const newFields = [...fields];
  const targetOrder = getFieldOrder(newFields[index], index);
  const aboveOrder = getFieldOrder(newFields[fieldAbove.originalIndex], fieldAbove.originalIndex);

  newFields[index] = { ...newFields[index], order: aboveOrder };
  newFields[fieldAbove.originalIndex] = { ...newFields[fieldAbove.originalIndex], order: targetOrder };

  return newFields;
}

/**
 * Move a field down one position within its group
 * @param fields All fields
 * @param index The index of the field to move in the fields array
 * @returns Updated fields array
 */
export function moveFieldDown(
  fields: SAFieldDefinition[],
  index: number
): SAFieldDefinition[] {
  if (index < 0 || index >= fields.length) {
    return fields;
  }

  const targetField = fields[index];
  const groupFields = getFieldsInSameGroup(fields, targetField);

  // Sort by order to find position within group (use originalIndex as fallback for undefined order)
  const sortedGroup = [...groupFields].sort((a, b) =>
    getFieldOrder(a.field, a.originalIndex) - getFieldOrder(b.field, b.originalIndex)
  );

  // Find the position of our target field in the sorted group
  const positionInGroup = sortedGroup.findIndex(({ originalIndex }) => originalIndex === index);

  // If it's the last field in the group, can't move down
  if (positionInGroup < 0 || positionInGroup >= sortedGroup.length - 1) {
    return fields;
  }

  // Find the field below (in the sorted order)
  const fieldBelow = sortedGroup[positionInGroup + 1];

  // Swap orders (use computed order values for fields without order property)
  const newFields = [...fields];
  const targetOrder = getFieldOrder(newFields[index], index);
  const belowOrder = getFieldOrder(newFields[fieldBelow.originalIndex], fieldBelow.originalIndex);

  newFields[index] = { ...newFields[index], order: belowOrder };
  newFields[fieldBelow.originalIndex] = { ...newFields[fieldBelow.originalIndex], order: targetOrder };

  return newFields;
}

/**
 * Normalize field orders to be continuous (0, 1, 2, ...)
 * This is done per group (area + tabName + relationship)
 * @param fields All fields
 * @returns Updated fields array with normalized orders
 */
export function normalizeFieldOrders(
  fields: SAFieldDefinition[]
): SAFieldDefinition[] {
  if (fields.length === 0) {
    return [];
  }

  // Group fields by their group key
  const groups = new Map<string, { field: SAFieldDefinition; originalIndex: number }[]>();

  fields.forEach((field, originalIndex) => {
    const key = getGroupKey(field);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push({ field, originalIndex });
  });

  // Create a new fields array with normalized orders
  const newFields = [...fields];

  groups.forEach((groupFields) => {
    // Sort by current order (use originalIndex as fallback for undefined order)
    const sorted = [...groupFields].sort((a, b) =>
      getFieldOrder(a.field, a.originalIndex) - getFieldOrder(b.field, b.originalIndex)
    );

    // Assign normalized orders (0, 1, 2, ...)
    sorted.forEach((item, newOrder) => {
      newFields[item.originalIndex] = {
        ...newFields[item.originalIndex],
        order: newOrder,
      };
    });
  });

  return newFields;
}
