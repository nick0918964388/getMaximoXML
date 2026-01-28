import type { FmbModule, FmbItemType } from './types';
import type { FieldType, FieldArea, InputMode, SAFieldDefinition } from '../types';
import { DEFAULT_FIELD } from '../types';

export interface FmbConversionResult {
  fields: SAFieldDefinition[];
  metadata: {
    appName: string;
    appTitle: string;
  };
}

const ITEM_TYPE_MAP: Record<string, FieldType> = {
  TEXT_ITEM: 'textbox',
  CHECK_BOX: 'checkbox',
  PUSH_BUTTON: 'pushbutton',
  DISPLAY_ITEM: 'statictext',
};

export function mapItemType(itemType: FmbItemType | string): FieldType {
  return ITEM_TYPE_MAP[itemType] ?? 'textbox';
}

/** Max number of fields to auto-add to the list area */
const MAX_LIST_FIELDS = 10;

/**
 * Convert an FmbModule to Maximo SAFieldDefinition array.
 */
export function convertFmbToMaximo(module: FmbModule): FmbConversionResult {
  // Build tabPage name → label map from canvases
  const tabPageLabelMap = new Map<string, string>();
  for (const canvas of module.canvases) {
    for (const tp of canvas.tabPages) {
      if (tp.label) tabPageLabelMap.set(tp.name, tp.label);
    }
  }

  const fields: SAFieldDefinition[] = [];

  for (const block of module.blocks) {
    const area: FieldArea = block.singleRecord ? 'header' : 'detail';

    for (const item of block.items) {
      // For pushbuttons, prefer item.label over item.prompt
      const label = item.itemType === 'PUSH_BUTTON'
        ? (item.label ?? item.prompt ?? item.name)
        : (item.prompt ?? item.name);

      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        fieldName: item.name,
        label,
        type: mapItemType(item.itemType),
        area,
        inputMode: resolveInputMode(item.required, item.enabled),
        relationship: area === 'detail' ? (block.queryDataSource ?? '') : '',
        tabName: item.tabPage ? (tabPageLabelMap.get(item.tabPage) ?? item.tabPage) : '',
        lookup: item.lovName ?? '',
        length: item.maximumLength ?? 100,
      };
      fields.push(field);
    }
  }

  // Auto-generate list fields from the first N non-pushbutton header/detail fields
  const listCandidates = fields.filter(
    (f) => f.type !== 'pushbutton' && f.type !== 'statictext'
  );
  const listCount = Math.min(MAX_LIST_FIELDS, listCandidates.length);
  for (let i = 0; i < listCount; i++) {
    fields.push({
      ...listCandidates[i],
      area: 'list',
      type: 'textbox',
      inputMode: 'readonly',
    });
  }

  return {
    fields,
    metadata: {
      appName: module.name,
      appTitle: module.title ?? module.name,
    },
  };
}

function resolveInputMode(
  required?: boolean,
  enabled?: boolean
): InputMode {
  if (required) return 'required';
  if (enabled === false) return 'readonly';
  return 'optional';
}
