import { describe, it, expect } from 'vitest';
import { convertFmbToMaximo, mapItemType } from './converter';
import type { FmbModule } from './types';

describe('mapItemType', () => {
  it('should map TEXT_ITEM to textbox', () => {
    expect(mapItemType('TEXT_ITEM')).toBe('textbox');
  });
  it('should map CHECK_BOX to checkbox', () => {
    expect(mapItemType('CHECK_BOX')).toBe('checkbox');
  });
  it('should map PUSH_BUTTON to pushbutton', () => {
    expect(mapItemType('PUSH_BUTTON')).toBe('pushbutton');
  });
  it('should map DISPLAY_ITEM to statictext', () => {
    expect(mapItemType('DISPLAY_ITEM')).toBe('statictext');
  });
  it('should map LIST_ITEM to textbox (with lookup)', () => {
    expect(mapItemType('LIST_ITEM')).toBe('textbox');
  });
  it('should default unknown types to textbox', () => {
    expect(mapItemType('RADIO_GROUP')).toBe('textbox');
  });
});

describe('convertFmbToMaximo', () => {
  const fmbModule: FmbModule = {
    name: 'MYFORM',
    title: 'My Form',
    blocks: [
      {
        name: 'HEADER',
        queryDataSource: 'MYTABLE',
        singleRecord: true,
        items: [
          {
            name: 'FIELD1',
            itemType: 'TEXT_ITEM',
            prompt: 'Field One',
            canvas: 'CVS',
            tabPage: 'TAB1',
            required: true,
            maximumLength: 30,
            attributes: {},
          },
          {
            name: 'CHK1',
            itemType: 'CHECK_BOX',
            prompt: 'Active',
            attributes: {},
          },
        ],
        triggers: [],
        attributes: {},
      },
      {
        name: 'DETAIL',
        queryDataSource: 'DETAIL_TBL',
        singleRecord: false,
        items: [
          {
            name: 'COL1',
            itemType: 'TEXT_ITEM',
            prompt: 'Column One',
            attributes: {},
          },
          {
            name: 'BTN1',
            itemType: 'PUSH_BUTTON',
            prompt: 'Save',
            attributes: {},
          },
        ],
        triggers: [],
        attributes: {},
      },
    ],
    canvases: [
      {
        name: 'CVS',
        canvasType: 'TAB',
        tabPages: [{ name: 'TAB1', label: 'Main Tab', attributes: {} }],
        attributes: {},
      },
    ],
    lovs: [],
    triggers: [],
    attributes: {},
  };

  it('should produce fields for all items plus auto-generated list fields', () => {
    const result = convertFmbToMaximo(fmbModule);
    // HEADER: 2 items, DETAIL: 2 items, LIST: 3 auto-generated (non-pushbutton/statictext)
    const nonList = result.fields.filter((f) => f.area !== 'list');
    expect(nonList).toHaveLength(4);
  });

  it('should set area=header for single-record block items', () => {
    const result = convertFmbToMaximo(fmbModule);
    const headerFields = result.fields.filter((f) => f.area === 'header');
    expect(headerFields).toHaveLength(2);
  });

  it('should set area=detail for multi-record block items', () => {
    const result = convertFmbToMaximo(fmbModule);
    const detailFields = result.fields.filter((f) => f.area === 'detail');
    expect(detailFields).toHaveLength(2);
  });

  it('should auto-generate list fields from non-pushbutton fields', () => {
    const result = convertFmbToMaximo(fmbModule);
    const listFields = result.fields.filter((f) => f.area === 'list');
    // 3 candidates: FIELD1 (textbox), CHK1 (checkbox), COL1 (textbox) — BTN1 excluded
    expect(listFields).toHaveLength(3);
    expect(listFields.every((f) => f.inputMode === 'readonly')).toBe(true);
  });

  it('should use label attribute for pushbutton fields', () => {
    const moduleWithBtn: FmbModule = {
      ...fmbModule,
      blocks: [{
        name: 'BLK',
        singleRecord: true,
        items: [{
          name: 'BTN_SAVE',
          itemType: 'PUSH_BUTTON',
          label: 'Save Record',
          prompt: '',
          attributes: {},
        }],
        triggers: [],
        attributes: {},
      }],
    };
    const result = convertFmbToMaximo(moduleWithBtn);
    const btn = result.fields.find((f) => f.fieldName === 'BTN_SAVE');
    expect(btn?.label).toBe('Save Record');
  });

  it('should map field types correctly', () => {
    const result = convertFmbToMaximo(fmbModule);
    expect(result.fields[0].type).toBe('textbox');
    expect(result.fields[1].type).toBe('checkbox');
  });

  it('should use prompt as label', () => {
    const result = convertFmbToMaximo(fmbModule);
    expect(result.fields[0].label).toBe('Field One');
  });

  it('should set inputMode=required for required items', () => {
    const result = convertFmbToMaximo(fmbModule);
    expect(result.fields[0].inputMode).toBe('required');
  });

  it('should set relationship from block queryDataSource for detail', () => {
    const result = convertFmbToMaximo(fmbModule);
    const detailFields = result.fields.filter((f) => f.area === 'detail');
    expect(detailFields[0].relationship).toBe('DETAIL_TBL');
  });

  it('should set tabName from tabPage label', () => {
    const result = convertFmbToMaximo(fmbModule);
    expect(result.fields[0].tabName).toBe('Main Tab');
  });

  it('should populate metadata from module', () => {
    const result = convertFmbToMaximo(fmbModule);
    expect(result.metadata.appName).toBe('MYFORM');
    expect(result.metadata.appTitle).toBe('My Form');
  });
});
