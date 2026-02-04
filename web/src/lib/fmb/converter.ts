import type { FmbModule, FmbItemType } from './types';
import type { FieldType, FieldArea, InputMode, SAFieldDefinition, MaximoDataType } from '../types';
import { DEFAULT_FIELD } from '../types';

/** MBO name prefix for custom objects */
const MBO_PREFIX = 'ZZ_';

/**
 * Field name patterns for type inference
 */
const AMOUNT_PATTERNS = ['AMT', 'AMOUNT', 'PRICE', 'COST'];
const DATE_SUFFIXES = ['_DATE'];
const DATETIME_SUFFIXES = ['_DATETIME', '_TIME', '_TIMESTAMP'];
const YORN_SUFFIXES = ['_YN', '_FLAG'];
const YORN_PREFIXES = ['IS_', 'HAS_'];
const YORN_EXACT = ['FLAG'];
const INTEGER_SUFFIXES = ['_QTY', '_NUM', '_COUNT', '_SEQ'];

/**
 * Infers Maximo data type from field name
 * @param fieldName The field name to analyze
 * @returns Inferred MaximoDataType
 */
export function inferMaxType(fieldName: string): MaximoDataType {
  const upperName = fieldName.toUpperCase();

  // Check for AMOUNT patterns (contains AMT, AMOUNT, PRICE, COST)
  if (AMOUNT_PATTERNS.some(pattern => upperName.includes(pattern))) {
    return 'AMOUNT';
  }

  // Check for DATETIME patterns (must check before DATE to avoid false positives)
  // Also handle exact match for 'DATETIME'
  if (upperName === 'DATETIME' || DATETIME_SUFFIXES.some(suffix => upperName.endsWith(suffix))) {
    return 'DATETIME';
  }

  // Check for DATE patterns (ends with _DATE or exact match 'DATE')
  if (upperName === 'DATE' || DATE_SUFFIXES.some(suffix => upperName.endsWith(suffix))) {
    return 'DATE';
  }

  // Check for YORN patterns (ends with _YN/_FLAG, starts with IS_/HAS_, or exact match)
  if (YORN_EXACT.includes(upperName) ||
      YORN_SUFFIXES.some(suffix => upperName.endsWith(suffix)) ||
      YORN_PREFIXES.some(prefix => upperName.startsWith(prefix))) {
    return 'YORN';
  }

  // Check for INTEGER patterns (ends with _QTY, _NUM, _COUNT, _SEQ or exact matches)
  if (upperName === 'QTY' || upperName === 'COUNT' || upperName === 'SEQ' ||
      INTEGER_SUFFIXES.some(suffix => upperName.endsWith(suffix))) {
    return 'INTEGER';
  }

  // Default to ALN for unrecognized patterns
  return 'ALN';
}

export interface FmbConversionResult {
  fields: SAFieldDefinition[];
  metadata: {
    appName: string;
    appTitle: string;
    /** MBO name with ZZ_ prefix */
    mboName: string;
  };
}

const ITEM_TYPE_MAP: Record<string, FieldType> = {
  TEXT_ITEM: 'textbox',
  CHECK_BOX: 'checkbox',
  PUSH_BUTTON: 'pushbutton',
  DISPLAY_ITEM: 'statictext',
  LIST_ITEM: 'combobox',
};

export function mapItemType(itemType: FmbItemType | string): FieldType {
  return ITEM_TYPE_MAP[itemType] ?? 'textbox';
}

/** Max number of fields to auto-add to the list area */
const MAX_LIST_FIELDS = 10;

/** Block names to skip during conversion */
const SKIP_BLOCKS = ['TOOL_BUTTON', 'HEAD_BLOCK'];

/** Default canvas names that contain visible form fields */
const DEFAULT_VISIBLE_CANVASES = ['CANVAS_BODY', 'CANVAS_TAB'];

/** Canvas that maps to header area */
const HEADER_CANVAS = 'CANVAS_BODY';

/** Relationships to skip (summary tables) */
const SKIP_RELATIONSHIPS = ['PCS1005'];

/**
 * Convert an FmbModule to Maximo SAFieldDefinition array.
 */
export function convertFmbToMaximo(module: FmbModule): FmbConversionResult {
  // Build tabPage name → label map from canvases
  // Also collect canvases that have TabPages (Tab type canvases)
  const tabPageLabelMap = new Map<string, string>();
  const tabCanvasNames = new Set<string>();

  for (const canvas of module.canvases) {
    for (const tp of canvas.tabPages) {
      if (tp.label) tabPageLabelMap.set(tp.name, tp.label);
      // Track canvases that contain TabPages
      tabCanvasNames.add(canvas.name);
    }
  }

  // Build set of visible canvases: default + any canvas with TabPages
  const visibleCanvases = new Set([...DEFAULT_VISIBLE_CANVASES, ...tabCanvasNames]);

  const fields: SAFieldDefinition[] = [];
  // Track display items that have been merged into multiparttextbox
  const mergedDisplayItems = new Set<string>();

  for (const block of module.blocks) {
    // Skip TOOL_BUTTON and HEAD_BLOCK blocks
    if (SKIP_BLOCKS.includes(block.name)) {
      continue;
    }

    // Pre-process: identify TEXT_ITEM + description field pairs for multiparttextbox
    // A description field (DISPLAY_ITEM or TEXT_ITEM with empty prompt) following a TEXT_ITEM
    // becomes its descrAttribute
    const displayItemMap = new Map<string, string>(); // TEXT_ITEM name -> description field name
    for (let i = 0; i < block.items.length - 1; i++) {
      const current = block.items[i];
      const next = block.items[i + 1];

      // Check if current is TEXT_ITEM and next is a description field
      // Description field can be:
      // 1. DISPLAY_ITEM with empty/no prompt
      // 2. TEXT_ITEM with empty/no prompt (often used as display-only field)
      const isNextDescriptionField =
        (next.itemType === 'DISPLAY_ITEM' || next.itemType === 'TEXT_ITEM') &&
        (!next.prompt || next.prompt === '') &&
        current.canvas === next.canvas;

      if (current.itemType === 'TEXT_ITEM' && isNextDescriptionField) {
        displayItemMap.set(current.name, next.name);
        mergedDisplayItems.add(next.name);
      }
    }

    for (const item of block.items) {
      // Skip items not on visible canvases (CANVAS_BODY, CANVAS_TAB, or any Tab canvas with TabPages)
      if (!item.canvas || !visibleCanvases.has(item.canvas)) {
        continue;
      }

      // Skip hidden items (visible=false)
      if (item.visible === false) {
        continue;
      }

      // Skip display items that were merged into a multiparttextbox
      if (mergedDisplayItems.has(item.name)) {
        continue;
      }

      // Determine area based on canvas:
      // - CANVAS_BODY = header area
      // - Non-default Tab canvas (canvas with TabPages, not in DEFAULT_VISIBLE_CANVASES) + item has tabPage
      //   = header area (creates main tabs) - e.g., CANVAS_BODY2 in ODGLS148
      // - Default canvases like CANVAS_TAB = detail area (for detail tables with sub-tabs)
      const isNonDefaultTabCanvas =
        tabCanvasNames.has(item.canvas ?? '') &&
        !DEFAULT_VISIBLE_CANVASES.includes(item.canvas ?? '') &&
        item.tabPage;
      const area: FieldArea = (item.canvas === HEADER_CANVAS || isNonDefaultTabCanvas) ? 'header' : 'detail';

      // Skip summary tables (PCS1005) for detail items
      if (area === 'detail' && SKIP_RELATIONSHIPS.includes(block.queryDataSource ?? '')) {
        continue;
      }

      // For pushbuttons, prefer item.label over item.prompt
      const label = item.itemType === 'PUSH_BUTTON'
        ? (item.label ?? item.prompt ?? item.name)
        : (item.prompt ?? item.name);

      // Resolve tabPage label
      const tabPageLabel = item.tabPage ? (tabPageLabelMap.get(item.tabPage) ?? item.tabPage) : '';

      // Check if this TEXT_ITEM should become multiparttextbox
      const descrAttribute = displayItemMap.get(item.name);
      const fieldType: FieldType = descrAttribute ? 'multiparttextbox' : mapItemType(item.itemType);

      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        fieldName: item.name,
        label,
        type: fieldType,
        area,
        inputMode: resolveInputMode(item.required, item.enabled),
        relationship: area === 'detail' ? (block.queryDataSource ?? '') : '',
        // For header items, tabPage becomes tabName (creates main tabs)
        // For detail items, tabPage becomes subTabName (creates sub-tabs within a detail area)
        tabName: area === 'header' && tabPageLabel ? tabPageLabel : '',
        subTabName: area === 'detail' && tabPageLabel ? tabPageLabel : '',
        lookup: item.lovName ?? '',
        length: item.maximumLength ?? 100,
        descDataattribute: descrAttribute ?? '',
        maxType: inferMaxType(item.name),
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

  // Generate mboName with ZZ_ prefix
  const mboName = `${MBO_PREFIX}${module.name}`;

  return {
    fields,
    metadata: {
      appName: module.name,
      appTitle: module.title ?? module.name,
      mboName,
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
