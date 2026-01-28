/**
 * FMB XML structure types
 * Represents elements parsed from Oracle Forms frmf2xml export
 */

export type FmbItemType =
  | 'TEXT_ITEM'
  | 'CHECK_BOX'
  | 'LIST_ITEM'
  | 'PUSH_BUTTON'
  | 'DISPLAY_ITEM'
  | 'RADIO_GROUP'
  | 'IMAGE'
  | 'BEAN_AREA'
  | 'CHART_ITEM'
  | 'USER_AREA';

export interface FmbItem {
  name: string;
  itemType: FmbItemType;
  prompt?: string;
  /** Label attribute (used primarily by push buttons) */
  label?: string;
  canvas?: string;
  tabPage?: string;
  dataType?: string;
  maximumLength?: number;
  required?: boolean;
  enabled?: boolean;
  visible?: boolean;
  lovName?: string;
  /** Raw attributes from XML for extensibility */
  attributes: Record<string, string>;
}

export interface FmbTrigger {
  name: string;
  triggerType: string;
  triggerText?: string;
}

export interface FmbBlock {
  name: string;
  queryDataSource?: string;
  singleRecord: boolean;
  items: FmbItem[];
  triggers: FmbTrigger[];
  /** Raw attributes */
  attributes: Record<string, string>;
}

export interface FmbCanvas {
  name: string;
  canvasType: string;
  tabPages: FmbTabPage[];
  attributes: Record<string, string>;
}

export interface FmbTabPage {
  name: string;
  label?: string;
  attributes: Record<string, string>;
}

export interface FmbLov {
  name: string;
  title?: string;
  attributes: Record<string, string>;
}

export interface FmbModule {
  name: string;
  title?: string;
  blocks: FmbBlock[];
  canvases: FmbCanvas[];
  lovs: FmbLov[];
  triggers: FmbTrigger[];
  /** Module-level attributes */
  attributes: Record<string, string>;
}
