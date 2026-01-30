import { describe, it, expect } from 'vitest';
import { generateFormSpec, generateMarkdownSpec } from '../spec-generator';
import type { FmbModule } from '../types';

describe('spec-generator', () => {
  const mockModule: FmbModule = {
    name: 'ODPCS126',
    title: 'Travel Expense Application',
    blocks: [
      {
        name: 'B1PCS1005',
        queryDataSource: 'PCS1005',
        singleRecord: false,
        items: [
          {
            name: 'SLIP_NO',
            itemType: 'TEXT_ITEM',
            prompt: 'Ispt No',
            canvas: 'CANVAS_BODY',
            dataType: 'Char',
            maximumLength: 32,
            required: false,
            enabled: false,
            visible: true,
            attributes: { CaseRestriction: 'Upper' },
          },
          {
            name: 'SLIP_DATE',
            itemType: 'TEXT_ITEM',
            prompt: 'Ispt Date',
            canvas: 'CANVAS_BODY',
            dataType: 'Date',
            maximumLength: 8,
            required: true,
            enabled: true,
            visible: true,
            attributes: { Hint: 'YYYYMMDD', InitialValue: '系統日' },
          },
          {
            name: 'SUPPLY_CODE',
            itemType: 'TEXT_ITEM',
            prompt: 'Payee',
            canvas: 'CANVAS_BODY',
            dataType: 'Char',
            maximumLength: 10,
            required: true,
            enabled: true,
            visible: true,
            lovName: 'LOV_SUPPLY',
            attributes: {},
          },
          {
            name: 'LIST',
            itemType: 'PUSH_BUTTON',
            label: '報告單',
            canvas: 'CANVAS_BODY',
            visible: true,
            attributes: {},
          },
        ],
        triggers: [],
        attributes: {
          WhereClause: "misc_type = 'TRAVEL'",
          OrderByClause: 'SLIP_DATE DESC',
          InsertAllowed: 'true',
          UpdateAllowed: 'true',
          DeleteAllowed: 'false',
        },
      },
    ],
    canvases: [],
    lovs: [
      { name: 'LOV_SUPPLY', title: 'Supplier', recordGroupName: 'G_SUPPLY_CODE', columnMappings: [{ name: 'SUPPLY_CODE', returnItem: 'B1PCS1005.SUPPLY_CODE' }], attributes: {} },
      { name: 'LOV_PAYMENT_TERM', title: 'Payment Terms', recordGroupName: 'G_PAYMENT_TERM', columnMappings: [], attributes: {} },
    ],
    triggers: [],
    attributes: {},
  };

  describe('generateFormSpec', () => {
    it('should extract form name and title', () => {
      const spec = generateFormSpec(mockModule);

      expect(spec.formName).toBe('ODPCS126');
      expect(spec.formTitle).toBe('Travel Expense Application');
    });

    it('should extract block information with WHERE and ORDER BY', () => {
      const spec = generateFormSpec(mockModule);

      expect(spec.blocks.length).toBe(1);
      expect(spec.blocks[0].name).toBe('B1PCS1005');
      expect(spec.blocks[0].baseTable).toBe('PCS1005');
      expect(spec.blocks[0].whereCondition).toBe("misc_type = 'TRAVEL'");
      expect(spec.blocks[0].orderByClause).toBe('SLIP_DATE DESC');
      expect(spec.blocks[0].insertAllowed).toBe(true);
      expect(spec.blocks[0].updateAllowed).toBe(true);
      expect(spec.blocks[0].deleteAllowed).toBe(false);
    });

    it('should extract fields with all attributes', () => {
      const spec = generateFormSpec(mockModule);
      const fields = spec.blocks[0].fields;

      expect(fields.length).toBe(3); // 3 items (excluding push button)

      // Check SLIP_NO field
      expect(fields[0].no).toBe(1);
      expect(fields[0].prompt).toBe('Ispt No');
      expect(fields[0].dbColumn).toBe('SLIP_NO');
      expect(fields[0].dataType).toBe('Char');
      expect(fields[0].caseRestriction).toBe('Upper');
      expect(fields[0].updateAllowed).toBe(false); // enabled=false

      // Check SLIP_DATE field
      expect(fields[1].prompt).toBe('Ispt Date');
      expect(fields[1].required).toBe(true);
      expect(fields[1].formatMask).toBe('YYYYMMDD');
      expect(fields[1].initialValue).toBe('系統日');

      // Check SUPPLY_CODE field
      expect(fields[2].lovName).toBe('LOV_SUPPLY');
    });

    it('should extract buttons (non-system)', () => {
      const spec = generateFormSpec(mockModule);

      expect(spec.buttons.length).toBe(1);
      expect(spec.buttons[0].label).toBe('報告單');
    });

    it('should extract LOVs with record group and return items', () => {
      const spec = generateFormSpec(mockModule);

      expect(spec.lovs.length).toBe(2);
      expect(spec.lovs[0].name).toBe('LOV_SUPPLY');
      expect(spec.lovs[0].recordGroupName).toBe('G_SUPPLY_CODE');

      // LOV_SUPPLY should have SUPPLY_CODE as return item
      expect(spec.lovs[0].columns.length).toBe(1);
      expect(spec.lovs[0].columns[0].columnName).toBe('SUPPLY_CODE');
      expect(spec.lovs[0].columns[0].returnItem).toBe('B1PCS1005.SUPPLY_CODE');
    });

    it('should generate remark for auto-generated fields', () => {
      const spec = generateFormSpec(mockModule);
      const slipNoField = spec.blocks[0].fields[0];

      // SLIP_NO with enabled=false should have auto-generate remark
      expect(slipNoField.remark).toContain('自動產生流水號');
    });
  });

  describe('generateMarkdownSpec', () => {
    it('should generate markdown with block info table', () => {
      const spec = generateFormSpec(mockModule);
      const markdown = generateMarkdownSpec(spec);

      expect(markdown).toContain('# ODPCS126 功能規格說明');
      expect(markdown).toContain('| Block Name | B1PCS1005 |');
      expect(markdown).toContain('| Base Table(表格名稱) | PCS1005 |');
      expect(markdown).toContain("misc_type = 'TRAVEL'");
      expect(markdown).toContain('SLIP_DATE DESC');
    });

    it('should generate markdown with fields table', () => {
      const spec = generateFormSpec(mockModule);
      const markdown = generateMarkdownSpec(spec);

      expect(markdown).toContain('| No | Prompt | DB Column |');
      expect(markdown).toContain('Ispt No');
      expect(markdown).toContain('SLIP_NO');
    });

    it('should generate markdown with LOV section', () => {
      const spec = generateFormSpec(mockModule);
      const markdown = generateMarkdownSpec(spec);

      expect(markdown).toContain('## (3) LOV');
      expect(markdown).toContain('LOV_SUPPLY');
      expect(markdown).toContain('G_SUPPLY_CODE');
      expect(markdown).toContain('B1PCS1005.SUPPLY_CODE');
    });
  });

  describe('filtering', () => {
    it('should skip TOOL_BUTTON block', () => {
      const moduleWithToolButton: FmbModule = {
        ...mockModule,
        blocks: [
          ...mockModule.blocks,
          {
            name: 'TOOL_BUTTON',
            singleRecord: false,
            items: [
              {
                name: 'SAVE_BUTTON',
                itemType: 'PUSH_BUTTON',
                label: 'Save : F10',
                canvas: 'CANVAS_BODY',
                visible: true,
                attributes: {},
              },
            ],
            triggers: [],
            attributes: {},
          },
        ],
      };

      const spec = generateFormSpec(moduleWithToolButton);

      // Should not include TOOL_BUTTON block
      expect(spec.blocks.find(b => b.name === 'TOOL_BUTTON')).toBeUndefined();
    });

    it('should skip hidden items', () => {
      const moduleWithHiddenItem: FmbModule = {
        ...mockModule,
        blocks: [
          {
            ...mockModule.blocks[0],
            items: [
              ...mockModule.blocks[0].items,
              {
                name: 'HIDDEN_FIELD',
                itemType: 'TEXT_ITEM',
                prompt: 'Hidden',
                canvas: 'CANVAS_BODY',
                visible: false,
                attributes: {},
              },
            ],
          },
        ],
      };

      const spec = generateFormSpec(moduleWithHiddenItem);

      expect(spec.blocks[0].fields.find(f => f.dbColumn === 'HIDDEN_FIELD')).toBeUndefined();
    });
  });

  describe('namespaced attributes', () => {
    it('should extract WhereClause and OrderByClause from namespaced attributes', () => {
      const moduleWithNamespacedAttrs: FmbModule = {
        name: 'ODPCS126',
        title: 'Test Form',
        blocks: [
          {
            name: 'B1TEST',
            queryDataSource: 'TEST_TABLE',
            singleRecord: false,
            items: [],
            triggers: [],
            attributes: {
              // Simulating real frmf2xml output with namespaced attributes
              '_overridden:WhereClause': "status = 'ACTIVE'",
              '_default:WhereClause': '',
              'ODPCS126_inherited:OrderByClause': 'CREATE_DATE DESC',
              '_default:InsertAllowed': 'true',
              '_overridden:DeleteAllowed': 'false',
            },
          },
        ],
        canvases: [],
        lovs: [],
        triggers: [],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithNamespacedAttrs);

      expect(spec.blocks[0].whereCondition).toBe("status = 'ACTIVE'");
      expect(spec.blocks[0].orderByClause).toBe('CREATE_DATE DESC');
      expect(spec.blocks[0].deleteAllowed).toBe(false);
    });

    it('should prioritize _overridden over _inherited and _default', () => {
      const moduleWithPriority: FmbModule = {
        name: 'TEST',
        title: 'Test',
        blocks: [
          {
            name: 'B1',
            queryDataSource: 'TEST_TABLE',
            singleRecord: false,
            items: [],
            triggers: [],
            attributes: {
              '_default:WhereClause': 'default_condition',
              '_inherited:WhereClause': 'inherited_condition',
              '_overridden:WhereClause': 'overridden_condition',
            },
          },
        ],
        canvases: [],
        lovs: [],
        triggers: [],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithPriority);

      expect(spec.blocks[0].whereCondition).toBe('overridden_condition');
    });
  });

  describe('triggers', () => {
    it('should include trigger statistics in FormSpec', () => {
      const moduleWithTriggers: FmbModule = {
        name: 'TEST',
        title: 'Test Form',
        blocks: [
          {
            name: 'B1',
            queryDataSource: 'TEST_TABLE',
            singleRecord: false,
            items: [],
            triggers: [
              { name: 'PRE-INSERT', triggerType: 'PL/SQL', triggerText: ':b1.id := seq.nextval;' },
            ],
            attributes: {},
          },
        ],
        canvases: [],
        lovs: [],
        triggers: [
          { name: 'ON-ERROR', triggerType: 'PL/SQL', triggerText: 'show_alert_message(sqlerrm);' },
        ],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithTriggers);

      expect(spec.triggers).toBeDefined();
      expect(spec.triggers.statistics.totalCount).toBe(2);
      expect(spec.triggers.statistics.formLevelCount).toBe(1);
      expect(spec.triggers.statistics.blockLevelCount).toBe(1);
    });

    it('should include trigger section in markdown output', () => {
      const moduleWithTriggers: FmbModule = {
        name: 'TEST',
        title: 'Test Form',
        blocks: [
          {
            name: 'B1',
            queryDataSource: 'TEST_TABLE',
            singleRecord: false,
            items: [],
            triggers: [
              { name: 'WHEN-VALIDATE-ITEM', triggerType: 'PL/SQL', triggerText: 'if :b1.value &lt; 0 then raise form_trigger_failure; end if;' },
            ],
            attributes: {},
          },
        ],
        canvases: [],
        lovs: [],
        triggers: [],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithTriggers);
      const markdown = generateMarkdownSpec(spec);

      expect(markdown).toContain('## (4) 觸發器規則');
      expect(markdown).toContain('### 統計摘要');
      expect(markdown).toContain('Block: B1');
      expect(markdown).toContain('WHEN-VALIDATE-ITEM');
    });

    it('should skip trigger section if no triggers', () => {
      const spec = generateFormSpec(mockModule); // mockModule has no triggers
      const markdown = generateMarkdownSpec(spec);

      expect(markdown).not.toContain('## (4) 觸發器規則');
    });
  });

  describe('record groups', () => {
    it('should include record group SQL in LOV spec', () => {
      const moduleWithLovAndRecordGroups: FmbModule = {
        name: 'TEST_FORM',
        title: 'Test Form',
        blocks: [],
        canvases: [],
        lovs: [
          {
            name: 'LOV_PAYMENT',
            recordGroupName: 'G_PAYMENT_TERM',
            columnMappings: [{ name: 'CODE_ID', returnItem: 'B1.PAYMENT_TERM' }],
            attributes: {},
          },
          {
            name: 'LOV_STATIC',
            recordGroupName: 'G_STATIC',
            columnMappings: [],
            attributes: {},
          },
        ],
        recordGroups: [
          {
            name: 'G_PAYMENT_TERM',
            recordGroupType: 'Query',
            query: "select code_id, desc_c from pcs1016\n where code_type = 'PAYMENT_TERM'",
            columns: [
              { name: 'CODE_ID', dataType: 'Character', maxLength: 32 },
              { name: 'DESC_C', dataType: 'Character', maxLength: 64 },
            ],
            attributes: {},
          },
          {
            name: 'G_STATIC',
            recordGroupType: 'Static',
            query: '',
            columns: [],
            attributes: {},
          },
        ],
        triggers: [],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithLovAndRecordGroups);

      // LOV should have recordGroupQuery from corresponding Record Group
      expect(spec.lovs).toHaveLength(2);
      expect(spec.lovs[0].name).toBe('LOV_PAYMENT');
      expect(spec.lovs[0].recordGroupName).toBe('G_PAYMENT_TERM');
      expect(spec.lovs[0].recordGroupQuery).toContain('select code_id');

      // Static record group should not have SQL
      expect(spec.lovs[1].name).toBe('LOV_STATIC');
      expect(spec.lovs[1].recordGroupQuery).toBe('');
    });

    it('should include SQL query in LOV section when record group exists', () => {
      const moduleWithLovAndRecordGroup: FmbModule = {
        name: 'TEST_FORM',
        title: 'Test Form',
        blocks: [],
        canvases: [],
        lovs: [
          {
            name: 'LOV_DEPT',
            recordGroupName: 'G_DEPT_LOV',
            columnMappings: [
              { name: 'DEPT_NO', returnItem: 'B1.DEPT_CODE' },
              { name: 'DEPT_NAME', returnItem: 'B1.DEPT_NAME' },
            ],
            attributes: {},
          },
        ],
        recordGroups: [
          {
            name: 'G_DEPT_LOV',
            recordGroupType: 'Query',
            query: 'select dept_no, dept_name from department',
            columns: [
              { name: 'DEPT_NO', dataType: 'Number', maxLength: 10 },
              { name: 'DEPT_NAME', dataType: 'Character', maxLength: 50 },
            ],
            attributes: {},
          },
        ],
        triggers: [],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithLovAndRecordGroup);
      const markdown = generateMarkdownSpec(spec);

      // LOV section should contain SQL from Record Group
      expect(markdown).toContain('## (3) LOV 與資料來源');
      expect(markdown).toContain('### 1. LOV_DEPT');
      expect(markdown).toContain('**Record Group:** G_DEPT_LOV');
      expect(markdown).toContain('| DEPT_NO | B1.DEPT_CODE |');
      expect(markdown).toContain('```sql');
      expect(markdown).toContain('select dept_no, dept_name from department');
    });

    it('should skip LOV section if no LOVs', () => {
      const moduleWithoutLovs: FmbModule = {
        name: 'TEST_FORM',
        title: 'Test Form',
        blocks: [],
        canvases: [],
        lovs: [],
        recordGroups: [],
        triggers: [],
        attributes: {},
      };

      const spec = generateFormSpec(moduleWithoutLovs);
      const markdown = generateMarkdownSpec(spec);

      expect(markdown).not.toContain('## (3) LOV');
    });
  });
});
