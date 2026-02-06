import { describe, it, expect } from 'vitest';
import { convertFmbToMaximo, mapItemType, inferMaxType } from './converter';
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
  it('should map DISPLAY_ITEM to textbox', () => {
    expect(mapItemType('DISPLAY_ITEM')).toBe('textbox');
  });
  it('should map LIST_ITEM to combobox', () => {
    expect(mapItemType('LIST_ITEM')).toBe('combobox');
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
            canvas: 'CANVAS_BODY',
            tabPage: 'TAB1',
            required: true,
            maximumLength: 30,
            attributes: {},
          },
          {
            name: 'CHK1',
            itemType: 'CHECK_BOX',
            prompt: 'Active',
            canvas: 'CANVAS_BODY',
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
            canvas: 'CANVAS_TAB',
            attributes: {},
          },
          {
            name: 'BTN1',
            itemType: 'PUSH_BUTTON',
            prompt: 'Save',
            canvas: 'CANVAS_TAB',
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
          canvas: 'CANVAS_BODY',
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

  it('should populate metadata from module with ZZ_ prefix for mboName', () => {
    const result = convertFmbToMaximo(fmbModule);
    expect(result.metadata.appName).toBe('MYFORM');
    expect(result.metadata.appTitle).toBe('My Form');
    expect(result.metadata.mboName).toBe('ZZ_MYFORM');
  });

  it('should set subTabName for detail items with tabPage', () => {
    const moduleWithTabs: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'HEADER',
          singleRecord: true,
          items: [
            { name: 'SLIP_NO', itemType: 'TEXT_ITEM', prompt: 'Slip No', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'EXPENSE',
          queryDataSource: 'EXPENSE_TBL',
          singleRecord: false,
          items: [
            { name: 'LINE_NO', itemType: 'TEXT_ITEM', prompt: 'Line No', canvas: 'CANVAS_TAB', tabPage: 'TP_EXPENSE', attributes: {} },
            { name: 'AMOUNT', itemType: 'TEXT_ITEM', prompt: 'Amount', canvas: 'CANVAS_TAB', tabPage: 'TP_EXPENSE', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'CERT',
          queryDataSource: 'CERT_TBL',
          singleRecord: false,
          items: [
            { name: 'CERT_NO', itemType: 'TEXT_ITEM', prompt: 'Cert No', canvas: 'CANVAS_TAB', tabPage: 'TP_CERT', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [
        {
          name: 'CVS',
          canvasType: 'TAB',
          tabPages: [
            { name: 'TP_EXPENSE', label: '費用', attributes: {} },
            { name: 'TP_CERT', label: 'Certificate', attributes: {} },
          ],
          attributes: {},
        },
      ],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithTabs);

    // Detail fields with tabPage should have subTabName set
    const expenseFields = result.fields.filter((f) => f.area === 'detail' && f.relationship === 'EXPENSE_TBL');
    expect(expenseFields).toHaveLength(2);
    expect(expenseFields[0].subTabName).toBe('費用');
    expect(expenseFields[1].subTabName).toBe('費用');

    const certFields = result.fields.filter((f) => f.area === 'detail' && f.relationship === 'CERT_TBL');
    expect(certFields).toHaveLength(1);
    expect(certFields[0].subTabName).toBe('Certificate');
  });

  it('should not set subTabName for header items even with tabPage', () => {
    const moduleWithHeaderTab: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'HEADER',
          singleRecord: true,
          items: [
            { name: 'FIELD1', itemType: 'TEXT_ITEM', prompt: 'Field 1', canvas: 'CANVAS_BODY', tabPage: 'TP_MAIN', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [
        {
          name: 'CVS',
          canvasType: 'TAB',
          tabPages: [
            { name: 'TP_MAIN', label: 'Main Tab', attributes: {} },
          ],
          attributes: {},
        },
      ],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithHeaderTab);
    const headerField = result.fields.find((f) => f.area === 'header' && f.fieldName === 'FIELD1');

    // Header fields should use tabName, not subTabName
    expect(headerField?.tabName).toBe('Main Tab');
    expect(headerField?.subTabName).toBe('');
  });

  it('should skip TOOL_BUTTON and HEAD_BLOCK blocks', () => {
    const moduleWithSkippedBlocks: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'TOOL_BUTTON',
          singleRecord: true,
          items: [
            { name: 'BTN_SAVE', itemType: 'PUSH_BUTTON', label: 'Save', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'BTN_CANCEL', itemType: 'PUSH_BUTTON', label: 'Cancel', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'HEAD_BLOCK',
          singleRecord: true,
          items: [
            { name: 'HEAD_FIELD', itemType: 'TEXT_ITEM', prompt: 'Head Field', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'MAIN_BLOCK',
          singleRecord: true,
          items: [
            { name: 'MAIN_FIELD', itemType: 'TEXT_ITEM', prompt: 'Main Field', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithSkippedBlocks);

    // Should NOT contain fields from TOOL_BUTTON or HEAD_BLOCK
    expect(result.fields.find((f) => f.fieldName === 'BTN_SAVE')).toBeUndefined();
    expect(result.fields.find((f) => f.fieldName === 'BTN_CANCEL')).toBeUndefined();
    expect(result.fields.find((f) => f.fieldName === 'HEAD_FIELD')).toBeUndefined();

    // Should contain field from MAIN_BLOCK
    const mainField = result.fields.find((f) => f.fieldName === 'MAIN_FIELD');
    expect(mainField).toBeDefined();
    expect(mainField?.label).toBe('Main Field');
  });

  it('should only include items on CANVAS_BODY or CANVAS_TAB with visible=true', () => {
    const moduleWithCanvases: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN_BLOCK',
          singleRecord: true,
          items: [
            // Should be included: CANVAS_BODY + visible
            { name: 'SLIP_NO', itemType: 'TEXT_ITEM', prompt: 'Slip No', canvas: 'CANVAS_BODY', visible: true, attributes: {} },
            // Should be included: CANVAS_TAB + visible (default)
            { name: 'LINE_NO', itemType: 'TEXT_ITEM', prompt: 'Line No', canvas: 'CANVAS_TAB', attributes: {} },
            // Should be excluded: CANVAS_BUTTON (toolbar)
            { name: 'BTN_SAVE', itemType: 'PUSH_BUTTON', label: 'Save', canvas: 'CANVAS_BUTTON', visible: true, attributes: {} },
            // Should be excluded: CANVAS_HEAD (header display)
            { name: 'FORM_NAME', itemType: 'DISPLAY_ITEM', prompt: 'Form', canvas: 'CANVAS_HEAD', visible: true, attributes: {} },
            // Should be excluded: visible=false
            { name: 'HIDDEN_FIELD', itemType: 'TEXT_ITEM', prompt: 'Hidden', canvas: 'CANVAS_BODY', visible: false, attributes: {} },
            // Should be excluded: no canvas
            { name: 'NO_CANVAS', itemType: 'TEXT_ITEM', prompt: 'No Canvas', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithCanvases);

    // Filter out list fields for this test
    const nonListFields = result.fields.filter((f) => f.area !== 'list');

    // Should include SLIP_NO and LINE_NO
    expect(nonListFields.find((f) => f.fieldName === 'SLIP_NO')).toBeDefined();
    expect(nonListFields.find((f) => f.fieldName === 'LINE_NO')).toBeDefined();

    // Should NOT include toolbar, header, hidden, or no-canvas items
    expect(nonListFields.find((f) => f.fieldName === 'BTN_SAVE')).toBeUndefined();
    expect(nonListFields.find((f) => f.fieldName === 'FORM_NAME')).toBeUndefined();
    expect(nonListFields.find((f) => f.fieldName === 'HIDDEN_FIELD')).toBeUndefined();
    expect(nonListFields.find((f) => f.fieldName === 'NO_CANVAS')).toBeUndefined();
  });

  it('should use canvas to determine area: CANVAS_BODY=header, CANVAS_TAB=detail', () => {
    const moduleWithMixedCanvas: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN_BLOCK',
          singleRecord: false, // Even with singleRecord=false
          queryDataSource: 'PCS1005',
          items: [
            // CANVAS_BODY items should be header (regardless of block.singleRecord)
            { name: 'SLIP_NO', itemType: 'TEXT_ITEM', prompt: 'Slip No', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'PSN_NAME', itemType: 'TEXT_ITEM', prompt: 'Payee', canvas: 'CANVAS_BODY', attributes: {} },
            // Pushbuttons on CANVAS_BODY should also be header
            { name: 'SUPPORTING', itemType: 'PUSH_BUTTON', label: 'Supporting', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'LIST', itemType: 'PUSH_BUTTON', label: '報告單', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'DETAIL_BLOCK',
          singleRecord: false,
          queryDataSource: 'PCS1006',
          items: [
            // CANVAS_TAB items should be detail
            { name: 'LINE_NO', itemType: 'TEXT_ITEM', prompt: 'Line No', canvas: 'CANVAS_TAB', tabPage: 'EXPENSE', attributes: {} },
            { name: 'AMOUNT', itemType: 'TEXT_ITEM', prompt: 'Amount', canvas: 'CANVAS_TAB', tabPage: 'EXPENSE', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [
        {
          name: 'CANVAS_TAB',
          canvasType: 'Tab',
          tabPages: [{ name: 'EXPENSE', label: 'Expense', attributes: {} }],
          attributes: {},
        },
      ],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithMixedCanvas);

    // CANVAS_BODY items should be header (no relationship)
    const slipNo = result.fields.find((f) => f.fieldName === 'SLIP_NO' && f.area !== 'list');
    expect(slipNo?.area).toBe('header');
    expect(slipNo?.relationship).toBe('');

    const psnName = result.fields.find((f) => f.fieldName === 'PSN_NAME' && f.area !== 'list');
    expect(psnName?.area).toBe('header');

    // Pushbuttons on CANVAS_BODY should be header
    const supporting = result.fields.find((f) => f.fieldName === 'SUPPORTING');
    expect(supporting?.area).toBe('header');
    expect(supporting?.type).toBe('pushbutton');

    const list = result.fields.find((f) => f.fieldName === 'LIST');
    expect(list?.area).toBe('header');
    expect(list?.type).toBe('pushbutton');

    // CANVAS_TAB items should be detail with relationship
    const lineNo = result.fields.find((f) => f.fieldName === 'LINE_NO' && f.area !== 'list');
    expect(lineNo?.area).toBe('detail');
    expect(lineNo?.relationship).toBe('PCS1006');

    const amount = result.fields.find((f) => f.fieldName === 'AMOUNT' && f.area !== 'list');
    expect(amount?.area).toBe('detail');
    expect(amount?.relationship).toBe('PCS1006');
  });

  it('should skip PCS1005 relationship (summary table)', () => {
    const moduleWithSummary: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'SUMMARY_BLOCK',
          singleRecord: false,
          queryDataSource: 'PCS1005',
          items: [
            // Summary fields on CANVAS_TAB with PCS1005 relationship should be skipped
            { name: 'CURR', itemType: 'TEXT_ITEM', prompt: 'Currency', canvas: 'CANVAS_TAB', tabPage: 'EXPENSE', attributes: {} },
            { name: 'TOTAL_AMOUNT', itemType: 'TEXT_ITEM', prompt: 'Amount', canvas: 'CANVAS_TAB', tabPage: 'EXPENSE', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'DETAIL_BLOCK',
          singleRecord: false,
          queryDataSource: 'PCS1006',
          items: [
            { name: 'LINE_NO', itemType: 'TEXT_ITEM', prompt: 'Line No', canvas: 'CANVAS_TAB', tabPage: 'EXPENSE', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithSummary);

    // PCS1005 detail fields should be skipped
    const currField = result.fields.find((f) => f.fieldName === 'CURR' && f.area === 'detail');
    expect(currField).toBeUndefined();

    const totalAmount = result.fields.find((f) => f.fieldName === 'TOTAL_AMOUNT' && f.area === 'detail');
    expect(totalAmount).toBeUndefined();

    // PCS1006 detail fields should be included
    const lineNo = result.fields.find((f) => f.fieldName === 'LINE_NO' && f.area === 'detail');
    expect(lineNo).toBeDefined();
    expect(lineNo?.relationship).toBe('PCS1006');
  });

  it('should include pushbuttons from control blocks (CBLK) on CANVAS_BODY', () => {
    const moduleWithControlBlock: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'CBLK', // Control block with buttons
          singleRecord: false,
          queryDataSource: '', // No data source
          items: [
            { name: 'PUSH_HELP', itemType: 'PUSH_BUTTON', label: 'HELP', canvas: 'CANVAS_BODY', visible: true, attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
        {
          name: 'B1PCS1005',
          singleRecord: true,
          queryDataSource: 'PCS1005',
          items: [
            { name: 'SLIP_NO', itemType: 'TEXT_ITEM', prompt: 'Ispt No', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'SUPPORTING', itemType: 'PUSH_BUTTON', label: 'Supporting', canvas: 'CANVAS_BODY', visible: true, attributes: {} },
            { name: 'LIST', itemType: 'PUSH_BUTTON', label: '報告單', canvas: 'CANVAS_BODY', visible: true, attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithControlBlock);

    // PUSH_HELP from control block should be included as header pushbutton
    const helpButton = result.fields.find((f) => f.fieldName === 'PUSH_HELP');
    expect(helpButton).toBeDefined();
    expect(helpButton?.type).toBe('pushbutton');
    expect(helpButton?.area).toBe('header');
    expect(helpButton?.label).toBe('HELP');

    // SUPPORTING and LIST buttons should also be included
    const supportingButton = result.fields.find((f) => f.fieldName === 'SUPPORTING');
    expect(supportingButton).toBeDefined();
    expect(supportingButton?.type).toBe('pushbutton');
    expect(supportingButton?.label).toBe('Supporting');

    const listButton = result.fields.find((f) => f.fieldName === 'LIST');
    expect(listButton).toBeDefined();
    expect(listButton?.type).toBe('pushbutton');
    expect(listButton?.label).toBe('報告單');
  });

  it('should convert TEXT_ITEM + DISPLAY_ITEM pair to multiparttextbox', () => {
    const moduleWithCodeName: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'B1PCS1005',
          singleRecord: true,
          queryDataSource: 'PCS1005',
          items: [
            // SUPPLY_CODE (Text Item) followed by SUPPLY_NAME (Display Item) - should become multiparttextbox
            { name: 'SUPPLY_CODE', itemType: 'TEXT_ITEM', prompt: 'Payee', canvas: 'CANVAS_BODY', lovName: 'LOV_SUPPLY1', attributes: {} },
            { name: 'SUPPLY_NAME', itemType: 'DISPLAY_ITEM', prompt: '', canvas: 'CANVAS_BODY', attributes: {} },
            // PSN_ID + PSN_NAME pair
            { name: 'PSN_ID', itemType: 'TEXT_ITEM', prompt: 'Employee', canvas: 'CANVAS_BODY', lovName: 'LOV_PSN_ID', attributes: {} },
            { name: 'PSN_NAME', itemType: 'DISPLAY_ITEM', prompt: '', canvas: 'CANVAS_BODY', attributes: {} },
            // Standalone text item (no following display item)
            { name: 'SLIP_NO', itemType: 'TEXT_ITEM', prompt: 'Ispt No', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithCodeName);

    // SUPPLY_CODE should become multiparttextbox with SUPPLY_NAME as descDataattribute
    const supplyField = result.fields.find((f) => f.fieldName === 'SUPPLY_CODE' && f.area !== 'list');
    expect(supplyField).toBeDefined();
    expect(supplyField?.type).toBe('multiparttextbox');
    expect(supplyField?.descDataattribute).toBe('SUPPLY_NAME');

    // PSN_ID should become multiparttextbox with PSN_NAME as descDataattribute
    const psnField = result.fields.find((f) => f.fieldName === 'PSN_ID' && f.area !== 'list');
    expect(psnField).toBeDefined();
    expect(psnField?.type).toBe('multiparttextbox');
    expect(psnField?.descDataattribute).toBe('PSN_NAME');

    // SUPPLY_NAME and PSN_NAME should NOT appear as separate fields (merged into multiparttextbox)
    const supplyNameField = result.fields.find((f) => f.fieldName === 'SUPPLY_NAME' && f.area !== 'list');
    expect(supplyNameField).toBeUndefined();

    const psnNameField = result.fields.find((f) => f.fieldName === 'PSN_NAME' && f.area !== 'list');
    expect(psnNameField).toBeUndefined();

    // SLIP_NO should remain textbox (no following display item)
    const slipNoField = result.fields.find((f) => f.fieldName === 'SLIP_NO' && f.area !== 'list');
    expect(slipNoField).toBeDefined();
    expect(slipNoField?.type).toBe('textbox');
  });

  it('should convert TEXT_ITEM + TEXT_ITEM (description) pair to multiparttextbox', () => {
    // DEPT_NAME is a TEXT_ITEM (not DISPLAY_ITEM) but used as description field
    const moduleWithTextDesc: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'B1PCS1005',
          singleRecord: true,
          queryDataSource: 'PCS1005',
          items: [
            // DEPARTMENT_CODE (Text Item) followed by DEPT_NAME (Text Item with empty prompt)
            { name: 'DEPARTMENT_CODE', itemType: 'TEXT_ITEM', prompt: 'Department', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'DEPT_NAME', itemType: 'TEXT_ITEM', prompt: '', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithTextDesc);

    // DEPARTMENT_CODE should become multiparttextbox with DEPT_NAME as descDataattribute
    const deptField = result.fields.find((f) => f.fieldName === 'DEPARTMENT_CODE' && f.area !== 'list');
    expect(deptField).toBeDefined();
    expect(deptField?.type).toBe('multiparttextbox');
    expect(deptField?.descDataattribute).toBe('DEPT_NAME');

    // DEPT_NAME should NOT appear as separate field (merged into multiparttextbox)
    const deptNameField = result.fields.find((f) => f.fieldName === 'DEPT_NAME' && f.area !== 'list');
    expect(deptNameField).toBeUndefined();
  });

  it('should convert standalone DISPLAY_ITEM to textbox with readonly inputMode', () => {
    const moduleWithDisplayItem: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'B1PCS1005',
          singleRecord: true,
          queryDataSource: 'PCS1005',
          items: [
            // Standalone DISPLAY_ITEM (not paired with TEXT_ITEM) should become textbox with readonly
            { name: 'FORM_TITLE', itemType: 'DISPLAY_ITEM', prompt: 'Form Title', canvas: 'CANVAS_BODY', attributes: {} },
            // Another standalone DISPLAY_ITEM
            { name: 'STATUS_DESC', itemType: 'DISPLAY_ITEM', prompt: 'Status Description', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithDisplayItem);

    // FORM_TITLE should be textbox with inputMode=readonly
    const formTitle = result.fields.find((f) => f.fieldName === 'FORM_TITLE' && f.area !== 'list');
    expect(formTitle).toBeDefined();
    expect(formTitle?.type).toBe('textbox');
    expect(formTitle?.inputMode).toBe('readonly');

    // STATUS_DESC should also be textbox with inputMode=readonly
    const statusDesc = result.fields.find((f) => f.fieldName === 'STATUS_DESC' && f.area !== 'list');
    expect(statusDesc).toBeDefined();
    expect(statusDesc?.type).toBe('textbox');
    expect(statusDesc?.inputMode).toBe('readonly');
  });

  it('should convert LIST_ITEM to combobox', () => {
    const moduleWithListItem: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'B1PCS1005',
          singleRecord: true,
          queryDataSource: 'PCS1005',
          items: [
            { name: 'MISC_SUB_TYPE', itemType: 'LIST_ITEM', prompt: 'Type', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithListItem);

    const miscSubType = result.fields.find((f) => f.fieldName === 'MISC_SUB_TYPE' && f.area !== 'list');
    expect(miscSubType).toBeDefined();
    expect(miscSubType?.type).toBe('combobox');
  });

  it('should include items on Tab canvas (like CANVAS_BODY2) with TabPages as main tabs', () => {
    // This simulates ODGLS148 structure where CANVAS_BODY2 is a Tab canvas with multiple TabPages
    // Items on Tab canvases with TabPages should create MAIN TABS (header area with tabName)
    const moduleWithTabCanvas: FmbModule = {
      name: 'ODGLS148',
      title: 'General Ledger',
      blocks: [
        {
          name: 'B2GLG7050',
          singleRecord: false,
          queryDataSource: 'GLG7050',
          items: [
            { name: 'ITEM_CODE', itemType: 'TEXT_ITEM', prompt: 'Code', canvas: 'CANVAS_BODY2', tabPage: 'EDI_CLASS', visible: true, attributes: {} },
            { name: 'NEW_ITEM', itemType: 'TEXT_ITEM', prompt: 'New Item', canvas: 'CANVAS_BODY2', tabPage: 'EDI_CLASS', visible: true, attributes: {} },
            { name: 'COMBINE_AMT', itemType: 'TEXT_ITEM', prompt: 'Combine Amount', canvas: 'CANVAS_BODY2', tabPage: 'COMBINE_CLASS', visible: true, attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [
        {
          name: 'CANVAS_BODY2',
          canvasType: 'Tab',
          tabPages: [
            { name: 'EDI_CLASS', label: '單一財報', attributes: {} },
            { name: 'COMBINE_CLASS', label: '合併底稿', attributes: {} },
          ],
          attributes: {},
        },
      ],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(moduleWithTabCanvas);

    // Items on CANVAS_BODY2 (Tab canvas) should be HEADER with tabName to create MAIN TABS
    const itemCode = result.fields.find((f) => f.fieldName === 'ITEM_CODE' && f.area !== 'list');
    expect(itemCode).toBeDefined();
    expect(itemCode?.area).toBe('header'); // Tab canvas items create main tabs (header area)
    expect(itemCode?.tabName).toBe('單一財報'); // TabPage label used as tabName for main tabs
    expect(itemCode?.subTabName).toBe(''); // Not sub-tabs

    const combineAmt = result.fields.find((f) => f.fieldName === 'COMBINE_AMT' && f.area !== 'list');
    expect(combineAmt).toBeDefined();
    expect(combineAmt?.area).toBe('header');
    expect(combineAmt?.tabName).toBe('合併底稿'); // Different TabPage = different main tab

    // Should have 3 header fields from Tab canvas + list fields
    const headerFields = result.fields.filter((f) => f.area === 'header');
    expect(headerFields.length).toBe(3);
  });
});

describe('inferMaxType', () => {
  describe('AMOUNT type inference', () => {
    it('should infer AMOUNT for fields containing AMT', () => {
      expect(inferMaxType('TOTAL_AMT')).toBe('AMOUNT');
      expect(inferMaxType('AMT')).toBe('AMOUNT');
      expect(inferMaxType('LINE_AMT')).toBe('AMOUNT');
    });

    it('should infer AMOUNT for fields containing AMOUNT', () => {
      expect(inferMaxType('TOTAL_AMOUNT')).toBe('AMOUNT');
      expect(inferMaxType('AMOUNT')).toBe('AMOUNT');
      expect(inferMaxType('NET_AMOUNT')).toBe('AMOUNT');
    });

    it('should infer AMOUNT for fields containing PRICE', () => {
      expect(inferMaxType('UNIT_PRICE')).toBe('AMOUNT');
      expect(inferMaxType('PRICE')).toBe('AMOUNT');
      expect(inferMaxType('SALE_PRICE')).toBe('AMOUNT');
    });

    it('should infer AMOUNT for fields containing COST', () => {
      expect(inferMaxType('TOTAL_COST')).toBe('AMOUNT');
      expect(inferMaxType('COST')).toBe('AMOUNT');
      expect(inferMaxType('UNIT_COST')).toBe('AMOUNT');
    });
  });

  describe('DATE type inference', () => {
    it('should infer DATE for fields ending with _DATE', () => {
      expect(inferMaxType('START_DATE')).toBe('DATE');
      expect(inferMaxType('END_DATE')).toBe('DATE');
      expect(inferMaxType('CREATE_DATE')).toBe('DATE');
      expect(inferMaxType('TRANS_DATE')).toBe('DATE');
    });

    it('should infer DATE for field named DATE', () => {
      expect(inferMaxType('DATE')).toBe('DATE');
    });
  });

  describe('DATETIME type inference', () => {
    it('should infer DATETIME for fields ending with _DATETIME', () => {
      expect(inferMaxType('CREATE_DATETIME')).toBe('DATETIME');
      expect(inferMaxType('UPDATE_DATETIME')).toBe('DATETIME');
    });

    it('should infer DATETIME for fields ending with _TIME', () => {
      expect(inferMaxType('START_TIME')).toBe('DATETIME');
      expect(inferMaxType('END_TIME')).toBe('DATETIME');
    });

    it('should infer DATETIME for fields ending with _TIMESTAMP', () => {
      expect(inferMaxType('CREATE_TIMESTAMP')).toBe('DATETIME');
      expect(inferMaxType('MODIFY_TIMESTAMP')).toBe('DATETIME');
    });

    it('should infer DATETIME for field named DATETIME', () => {
      expect(inferMaxType('DATETIME')).toBe('DATETIME');
    });
  });

  describe('YORN type inference', () => {
    it('should infer YORN for fields ending with _YN', () => {
      expect(inferMaxType('ACTIVE_YN')).toBe('YORN');
      expect(inferMaxType('COMPLETE_YN')).toBe('YORN');
    });

    it('should infer YORN for fields starting with IS_', () => {
      expect(inferMaxType('IS_ACTIVE')).toBe('YORN');
      expect(inferMaxType('IS_COMPLETE')).toBe('YORN');
    });

    it('should infer YORN for fields starting with HAS_', () => {
      expect(inferMaxType('HAS_ATTACHMENT')).toBe('YORN');
      expect(inferMaxType('HAS_ERROR')).toBe('YORN');
    });

    it('should infer YORN for fields ending with _FLAG', () => {
      expect(inferMaxType('ACTIVE_FLAG')).toBe('YORN');
      expect(inferMaxType('DELETE_FLAG')).toBe('YORN');
      expect(inferMaxType('COMPLETE_FLAG')).toBe('YORN');
    });

    it('should infer YORN for field named FLAG', () => {
      expect(inferMaxType('FLAG')).toBe('YORN');
    });
  });

  describe('INTEGER type inference', () => {
    it('should infer INTEGER for fields ending with _QTY', () => {
      expect(inferMaxType('ORDER_QTY')).toBe('INTEGER');
      expect(inferMaxType('QTY')).toBe('INTEGER');
    });

    it('should infer INTEGER for fields ending with _NUM', () => {
      expect(inferMaxType('LINE_NUM')).toBe('INTEGER');
      expect(inferMaxType('SEQ_NUM')).toBe('INTEGER');
    });

    it('should infer INTEGER for fields ending with _COUNT', () => {
      expect(inferMaxType('ITEM_COUNT')).toBe('INTEGER');
      expect(inferMaxType('COUNT')).toBe('INTEGER');
    });

    it('should infer INTEGER for fields ending with _SEQ', () => {
      expect(inferMaxType('LINE_SEQ')).toBe('INTEGER');
      expect(inferMaxType('SEQ')).toBe('INTEGER');
    });
  });

  describe('default to ALN', () => {
    it('should default to ALN for unrecognized field names', () => {
      expect(inferMaxType('DESCRIPTION')).toBe('ALN');
      expect(inferMaxType('NAME')).toBe('ALN');
      expect(inferMaxType('SLIP_NO')).toBe('ALN');
      expect(inferMaxType('STATUS')).toBe('ALN');
    });
  });

  describe('case insensitivity', () => {
    it('should handle lowercase field names', () => {
      expect(inferMaxType('total_amount')).toBe('AMOUNT');
      expect(inferMaxType('start_date')).toBe('DATE');
      expect(inferMaxType('is_active')).toBe('YORN');
    });

    it('should handle mixed case field names', () => {
      expect(inferMaxType('Total_Amount')).toBe('AMOUNT');
      expect(inferMaxType('Start_Date')).toBe('DATE');
    });
  });
});

describe('convertFmbToMaximo maxType inference', () => {
  it('should infer maxType for amount fields', () => {
    const fmbModule: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN',
          singleRecord: true,
          items: [
            { name: 'TOTAL_AMT', itemType: 'TEXT_ITEM', prompt: 'Total Amount', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'UNIT_PRICE', itemType: 'TEXT_ITEM', prompt: 'Unit Price', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(fmbModule);

    const totalAmt = result.fields.find(f => f.fieldName === 'TOTAL_AMT' && f.area !== 'list');
    expect(totalAmt?.maxType).toBe('AMOUNT');

    const unitPrice = result.fields.find(f => f.fieldName === 'UNIT_PRICE' && f.area !== 'list');
    expect(unitPrice?.maxType).toBe('AMOUNT');
  });

  it('should infer maxType for date fields', () => {
    const fmbModule: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN',
          singleRecord: true,
          items: [
            { name: 'START_DATE', itemType: 'TEXT_ITEM', prompt: 'Start Date', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'CREATE_DATETIME', itemType: 'TEXT_ITEM', prompt: 'Created', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(fmbModule);

    const startDate = result.fields.find(f => f.fieldName === 'START_DATE' && f.area !== 'list');
    expect(startDate?.maxType).toBe('DATE');

    const createDatetime = result.fields.find(f => f.fieldName === 'CREATE_DATETIME' && f.area !== 'list');
    expect(createDatetime?.maxType).toBe('DATETIME');
  });

  it('should infer maxType for boolean fields', () => {
    const fmbModule: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN',
          singleRecord: true,
          items: [
            { name: 'IS_ACTIVE', itemType: 'TEXT_ITEM', prompt: 'Active', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'COMPLETE_YN', itemType: 'TEXT_ITEM', prompt: 'Complete', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(fmbModule);

    const isActive = result.fields.find(f => f.fieldName === 'IS_ACTIVE' && f.area !== 'list');
    expect(isActive?.maxType).toBe('YORN');

    const completeYn = result.fields.find(f => f.fieldName === 'COMPLETE_YN' && f.area !== 'list');
    expect(completeYn?.maxType).toBe('YORN');
  });

  it('should infer maxType for integer fields', () => {
    const fmbModule: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN',
          singleRecord: true,
          items: [
            { name: 'ORDER_QTY', itemType: 'TEXT_ITEM', prompt: 'Quantity', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'LINE_SEQ', itemType: 'TEXT_ITEM', prompt: 'Sequence', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(fmbModule);

    const orderQty = result.fields.find(f => f.fieldName === 'ORDER_QTY' && f.area !== 'list');
    expect(orderQty?.maxType).toBe('INTEGER');

    const lineSeq = result.fields.find(f => f.fieldName === 'LINE_SEQ' && f.area !== 'list');
    expect(lineSeq?.maxType).toBe('INTEGER');
  });

  it('should default to ALN for regular fields', () => {
    const fmbModule: FmbModule = {
      name: 'TESTFORM',
      blocks: [
        {
          name: 'MAIN',
          singleRecord: true,
          items: [
            { name: 'DESCRIPTION', itemType: 'TEXT_ITEM', prompt: 'Description', canvas: 'CANVAS_BODY', attributes: {} },
            { name: 'STATUS', itemType: 'TEXT_ITEM', prompt: 'Status', canvas: 'CANVAS_BODY', attributes: {} },
          ],
          triggers: [],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [],
      attributes: {},
    };

    const result = convertFmbToMaximo(fmbModule);

    const description = result.fields.find(f => f.fieldName === 'DESCRIPTION' && f.area !== 'list');
    expect(description?.maxType).toBe('ALN');

    const status = result.fields.find(f => f.fieldName === 'STATUS' && f.area !== 'list');
    expect(status?.maxType).toBe('ALN');
  });
});
