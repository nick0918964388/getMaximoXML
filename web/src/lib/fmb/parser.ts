import type {
  FmbModule,
  FmbBlock,
  FmbItem,
  FmbItemType,
  FmbTrigger,
  FmbCanvas,
  FmbTabPage,
  FmbLov,
  FmbLovColumnMapping,
} from './types';

/**
 * Parse an Oracle Forms frmf2xml XML string into an FmbModule structure.
 * Supports both simple XML (plain attributes) and real frmf2xml output
 * (namespaced attributes like ODGLS144_overridden:Name).
 */
export function parseFmbXml(xml: string): FmbModule {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error(`Invalid XML: ${errorNode.textContent}`);
  }

  const root = doc.documentElement;
  if (localName(root) !== 'Module') {
    throw new Error(`Expected root element "Module", got "${localName(root)}"`);
  }

  // Real frmf2xml: <Module> contains <FormModule> which has blocks etc.
  // Simple format: <Module> directly has blocks
  const formModule = findChild(root, 'FormModule');
  const container = formModule ?? root;

  return {
    name: nsAttr(formModule ?? root, 'Name') ?? '',
    title: nsAttr(formModule ?? root, 'Title'),
    blocks: parseBlocks(container),
    canvases: parseCanvases(container),
    lovs: parseLovs(container),
    triggers: parseTriggers(container),
    attributes: allAttributes(container),
  };
}

function parseBlocks(parent: Element): FmbBlock[] {
  return Array.from(findChildren(parent, 'Block')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    queryDataSource: nsAttr(el, 'QueryDataSourceName'),
    singleRecord: nsAttr(el, 'SingleRecord') === 'true',
    items: parseItems(el),
    triggers: parseTriggers(el),
    attributes: allAttributes(el),
  }));
}

function parseItems(parent: Element): FmbItem[] {
  return Array.from(findChildren(parent, 'Item')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    itemType: normalizeItemType(nsAttr(el, 'ItemType') ?? 'Text Item'),
    prompt: nsAttr(el, 'Prompt'),
    label: nsAttr(el, 'Label'),
    canvas: nsAttr(el, 'CanvasName') ?? nsAttr(el, 'Canvas'),
    tabPage: nsAttr(el, 'TabPageName') ?? nsAttr(el, 'TabPage'),
    dataType: nsAttr(el, 'DataType'),
    maximumLength: nsAttrInt(el, 'MaximumLength'),
    required: nsAttr(el, 'Required') === 'true',
    enabled: nsAttr(el, 'Enabled') !== 'false',
    visible: nsAttr(el, 'Visible') !== 'false',
    lovName: nsAttr(el, 'LovName') ?? nsAttr(el, 'LOVName'),
    attributes: allAttributes(el),
  }));
}

function parseTriggers(parent: Element): FmbTrigger[] {
  return Array.from(findChildren(parent, 'Trigger')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    triggerType: nsAttr(el, 'TriggerType') ?? nsAttr(el, 'TriggerStyle') ?? '',
    triggerText: nsAttr(el, 'TriggerText'),
  }));
}

function parseCanvases(parent: Element): FmbCanvas[] {
  return Array.from(findChildren(parent, 'Canvas')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    canvasType: nsAttr(el, 'CanvasType') ?? 'CONTENT',
    tabPages: parseTabPages(el),
    attributes: allAttributes(el),
  }));
}

function parseTabPages(parent: Element): FmbTabPage[] {
  return Array.from(findChildren(parent, 'TabPage')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    label: nsAttr(el, 'Label'),
    attributes: allAttributes(el),
  }));
}

function parseLovs(parent: Element): FmbLov[] {
  return Array.from(findChildren(parent, 'LOV')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    title: nsAttr(el, 'Title'),
    recordGroupName: nsAttr(el, 'RecordGroupName'),
    columnMappings: parseLovColumnMappings(el),
    attributes: allAttributes(el),
  }));
}

function parseLovColumnMappings(parent: Element): FmbLovColumnMapping[] {
  return Array.from(findChildren(parent, 'LOVColumnMapping')).map((el) => ({
    name: nsAttr(el, 'Name') ?? '',
    title: nsAttr(el, 'Title'),
    returnItem: nsAttr(el, 'ReturnItem') ?? '',
    displayWidth: nsAttrInt(el, 'DisplayWidth'),
  }));
}

// --- Item type normalization ---

/** Map Oracle Forms human-readable item types to our enum */
const ITEM_TYPE_NORMALIZE: Record<string, FmbItemType> = {
  'text item': 'TEXT_ITEM',
  'check box': 'CHECK_BOX',
  'list item': 'LIST_ITEM',
  'push button': 'PUSH_BUTTON',
  'display item': 'DISPLAY_ITEM',
  'radio group': 'RADIO_GROUP',
  'image': 'IMAGE',
  'bean area': 'BEAN_AREA',
  'chart item': 'CHART_ITEM',
  'user area': 'USER_AREA',
  // Also accept our own enum values (already normalized)
  'text_item': 'TEXT_ITEM',
  'check_box': 'CHECK_BOX',
  'list_item': 'LIST_ITEM',
  'push_button': 'PUSH_BUTTON',
  'display_item': 'DISPLAY_ITEM',
  'radio_group': 'RADIO_GROUP',
  'bean_area': 'BEAN_AREA',
  'chart_item': 'CHART_ITEM',
  'user_area': 'USER_AREA',
};

function normalizeItemType(raw: string): FmbItemType {
  return ITEM_TYPE_NORMALIZE[raw.toLowerCase()] ?? 'TEXT_ITEM';
}

// --- helpers ---

function localName(el: Element): string {
  return el.localName || el.tagName;
}

/**
 * Find direct children by local tag name (ignoring namespace prefix).
 */
function findChildren(parent: Element, tagName: string): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (localName(child) === tagName) result.push(child);
  }
  return result;
}

function findChild(parent: Element, tagName: string): Element | undefined {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (localName(child) === tagName) return child;
  }
  return undefined;
}

/**
 * Get attribute value by local name, searching across all namespace prefixes.
 * Oracle frmf2xml uses attributes like ODGLS144_overridden:Name, FORM_STD_inherited:Name.
 * We search all attributes for one whose local name matches.
 * Priority: _overridden > plain > _inherited > _default
 */
function nsAttr(el: Element, localAttrName: string): string | undefined {
  // Try plain attribute first (simple XML format)
  const plain = el.getAttribute(localAttrName);
  if (plain != null) return plain;

  // Search namespaced attributes by local name, with priority
  let overridden: string | undefined;
  let inherited: string | undefined;
  let defaultVal: string | undefined;
  let any: string | undefined;

  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    const aLocal = a.localName || a.name.split(':').pop() || a.name;
    if (aLocal !== localAttrName) continue;

    const fullName = a.name;
    if (fullName.includes('_overridden:')) {
      overridden = a.value;
    } else if (fullName.includes('_inherited:') || fullName.includes('inherited_overridden:')) {
      if (!inherited) inherited = a.value;
    } else if (fullName.includes('_default:')) {
      defaultVal = a.value;
    } else {
      any = a.value;
    }
  }

  return overridden ?? inherited ?? any ?? defaultVal;
}

function nsAttrInt(el: Element, localAttrName: string): number | undefined {
  const v = nsAttr(el, localAttrName);
  if (v == null) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}

function allAttributes(el: Element): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    result[a.name] = a.value;
  }
  return result;
}
