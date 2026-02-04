import { describe, it, expect } from 'vitest';
import {
  decodeTriggerText,
  extractSqlStatements,
  analyzeBusinessRules,
  generateTriggerSummary,
  analyzeTriggers,
} from '../trigger-analyzer';
import type { FmbModule } from '../types';

describe('trigger-analyzer', () => {
  describe('decodeTriggerText', () => {
    it('should decode HTML entities', () => {
      const encoded = 'if :b1.field &lt; 10 then&#10;   raise form_trigger_failure;&#10;end if;';
      const decoded = decodeTriggerText(encoded);

      expect(decoded).toBe('if :b1.field < 10 then\n   raise form_trigger_failure;\nend if;');
    });

    it('should handle &amp; entity', () => {
      const encoded = 'value1 &amp; value2';
      expect(decodeTriggerText(encoded)).toBe('value1 & value2');
    });

    it('should handle &gt; entity', () => {
      const encoded = 'if x &gt; 0 then';
      expect(decodeTriggerText(encoded)).toBe('if x > 0 then');
    });

    it('should handle &quot; entity', () => {
      const encoded = 'message(&quot;test&quot;)';
      expect(decodeTriggerText(encoded)).toBe('message("test")');
    });

    it('should handle &#13; carriage return', () => {
      const encoded = 'line1&#13;&#10;line2';
      expect(decodeTriggerText(encoded)).toBe('line1\r\nline2');
    });

    it('should return empty string for undefined input', () => {
      expect(decodeTriggerText(undefined)).toBe('');
    });
  });

  describe('extractSqlStatements', () => {
    it('should extract CURSOR declaration', () => {
      const plsql = `
        cursor c1 is select distinct arc1002_id
                      from pcs1015
                     where slip_no = :b1pcs1005.slip_no;
      `;
      const statements = extractSqlStatements(plsql);

      expect(statements.length).toBe(1);
      expect(statements[0].type).toBe('CURSOR');
      expect(statements[0].tables).toContain('pcs1015');
      expect(statements[0].fields).toContain('arc1002_id');
    });

    it('should extract SELECT INTO statement', () => {
      const plsql = `
        select name, code into v_name, v_code
        from employees
        where id = :emp_id;
      `;
      const statements = extractSqlStatements(plsql);

      expect(statements.length).toBe(1);
      expect(statements[0].type).toBe('SELECT');
      expect(statements[0].tables).toContain('employees');
      expect(statements[0].fields).toContain('name');
      expect(statements[0].fields).toContain('code');
    });

    it('should extract function call assignments', () => {
      const plsql = `:b1pcs1005.slip_no := sf_ars_0012('TP', :b1pcs1005.slip_date);`;
      const statements = extractSqlStatements(plsql);

      expect(statements.length).toBe(1);
      expect(statements[0].type).toBe('FUNCTION_CALL');
      expect(statements[0].statement).toContain('sf_ars_0012');
      expect(statements[0].fields).toContain('b1pcs1005.slip_no');
    });

    it('should extract procedure calls', () => {
      const plsql = `p_validate_timer_1;`;
      const statements = extractSqlStatements(plsql);

      expect(statements.length).toBe(1);
      expect(statements[0].type).toBe('FUNCTION_CALL');
      expect(statements[0].statement).toContain('p_validate_timer_1');
    });

    it('should extract multiple statements', () => {
      const plsql = `
        cursor c1 is select id from table1;
        :field := sf_get_value('X');
      `;
      const statements = extractSqlStatements(plsql);

      expect(statements.length).toBe(2);
    });

    it('should handle empty or simple trigger text', () => {
      expect(extractSqlStatements('null;')).toEqual([]);
      expect(extractSqlStatements("do_key('commit_form');")).toEqual([]);
    });
  });

  describe('analyzeBusinessRules', () => {
    it('should identify VALIDATION rule from raise form_trigger_failure', () => {
      const plsql = `
        if :b1.end_date < :b1.begin_date then
          s_alert('3', '截止日期不可小於起始日期!!!', lv_char);
          raise form_trigger_failure;
        end if;
      `;
      const rules = analyzeBusinessRules(plsql, 'WHEN-VALIDATE-ITEM');

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.type === 'VALIDATION')).toBe(true);
    });

    it('should identify AUTO_POPULATE rule from field assignment with function', () => {
      const plsql = `:b1pcs1005.slip_no := sf_ars_0012('TP', :b1pcs1005.slip_date);`;
      const rules = analyzeBusinessRules(plsql, 'PRE-INSERT');

      expect(rules.some(r => r.type === 'AUTO_POPULATE')).toBe(true);
      expect(rules.find(r => r.type === 'AUTO_POPULATE')?.affectedFields).toContain('b1pcs1005.slip_no');
    });

    it('should identify CALCULATION rule from arithmetic assignment', () => {
      const plsql = `:b1.total := :b1.qty * :b1.unit_price;`;
      const rules = analyzeBusinessRules(plsql, 'WHEN-VALIDATE-ITEM');

      expect(rules.some(r => r.type === 'CALCULATION')).toBe(true);
    });

    it('should identify NAVIGATION rule from go_block, go_item', () => {
      const plsql = `
        go_block('DETAIL');
        go_item('DETAIL.FIRST_FIELD');
      `;
      const rules = analyzeBusinessRules(plsql, 'WHEN-NEW-RECORD-INSTANCE');

      expect(rules.some(r => r.type === 'NAVIGATION')).toBe(true);
    });

    it('should identify MASTER_DETAIL rule from related cursor patterns', () => {
      const plsql = `
        cursor c1 is select * from detail where master_id = :master.id;
      `;
      const rules = analyzeBusinessRules(plsql, 'POST-QUERY');

      expect(rules.some(r => r.type === 'MASTER_DETAIL')).toBe(true);
    });

    it('should identify DELETE_CHECK rule in PRE-DELETE trigger', () => {
      const plsql = `
        select count(*) into v_count from child_table where parent_id = :b1.id;
        if v_count > 0 then
          raise form_trigger_failure;
        end if;
      `;
      const rules = analyzeBusinessRules(plsql, 'PRE-DELETE');

      expect(rules.some(r => r.type === 'DELETE_CHECK')).toBe(true);
    });

    it('should return CUSTOM for unrecognized patterns', () => {
      const plsql = `some_custom_procedure(:b1.field);`;
      const rules = analyzeBusinessRules(plsql, 'WHEN-BUTTON-PRESSED');

      expect(rules.some(r => r.type === 'CUSTOM')).toBe(true);
    });
  });

  describe('generateTriggerSummary', () => {
    it('should generate summary from validation rules', () => {
      const plsql = `
        if :b1.end_date < :b1.begin_date then
          s_alert('3', '截止日期不可小於起始日期!!!');
          raise form_trigger_failure;
        end if;
      `;
      const summary = generateTriggerSummary(plsql, 'WHEN-VALIDATE-ITEM');

      expect(summary).toContain('驗證');
    });

    it('should generate summary from auto-populate rules', () => {
      const plsql = `:b1pcs1005.slip_no := sf_ars_0012('TP', :b1pcs1005.slip_date);`;
      const summary = generateTriggerSummary(plsql, 'PRE-INSERT');

      expect(summary).toContain('自動');
    });

    it('should handle null/empty trigger text', () => {
      expect(generateTriggerSummary('null;', 'PRE-INSERT')).toBe('無特殊處理');
      expect(generateTriggerSummary("do_key('commit_form');", 'WHEN-BUTTON-PRESSED')).toBe('系統按鍵操作');
    });
  });

  describe('analyzeTriggers', () => {
    const mockModule: FmbModule = {
      name: 'ODPCS126',
      title: 'Travel Expense',
      blocks: [
        {
          name: 'B1PCS1005',
          queryDataSource: 'PCS1005',
          singleRecord: false,
          items: [],
          triggers: [
            {
              name: 'PRE-INSERT',
              triggerType: 'PL/SQL',
              triggerText: ':b1pcs1005.slip_no := sf_ars_0012(&#39;TP&#39;, :b1pcs1005.slip_date);',
            },
            {
              name: 'WHEN-VALIDATE-ITEM',
              triggerType: 'PL/SQL',
              triggerText: 'if :b1pcs1005.end_date &lt; :b1pcs1005.begin_date then&#10;  raise form_trigger_failure;&#10;end if;',
            },
          ],
          attributes: {},
        },
      ],
      canvases: [],
      lovs: [],
      triggers: [
        {
          name: 'ON-ERROR',
          triggerType: 'PL/SQL',
          triggerText: 'show_alert_message(sqlerrm);',
        },
        {
          name: 'WHEN-NEW-FORM-INSTANCE',
          triggerType: 'PL/SQL',
          triggerText: ':global.user_id := :system.current_user;',
        },
      ],
      attributes: {},
    };

    it('should analyze form-level triggers', () => {
      const result = analyzeTriggers(mockModule);

      expect(result.formTriggers.length).toBe(2);
      expect(result.formTriggers[0].level).toBe('Form');
      expect(result.formTriggers[0].name).toBe('ON-ERROR');
      expect(result.formTriggers[1].name).toBe('WHEN-NEW-FORM-INSTANCE');
    });

    it('should analyze block-level triggers', () => {
      const result = analyzeTriggers(mockModule);

      expect(result.blockTriggers.length).toBe(1);
      expect(result.blockTriggers[0].blockName).toBe('B1PCS1005');
      expect(result.blockTriggers[0].triggers.length).toBe(2);
      expect(result.blockTriggers[0].triggers[0].level).toBe('Block');
    });

    it('should calculate statistics correctly', () => {
      const result = analyzeTriggers(mockModule);

      expect(result.statistics.totalCount).toBe(4);
      expect(result.statistics.formLevelCount).toBe(2);
      expect(result.statistics.blockLevelCount).toBe(2);
    });

    it('should populate event descriptions from mapping', () => {
      const result = analyzeTriggers(mockModule);

      const onError = result.formTriggers.find(t => t.name === 'ON-ERROR');
      expect(onError?.eventDescription).toBe('當錯誤發生時觸發');
    });

    it('should populate maximoLocation from mapping', () => {
      const result = analyzeTriggers(mockModule);

      const onError = result.formTriggers.find(t => t.name === 'ON-ERROR');
      expect(onError?.maximoLocation).toBe('MXException 或 MboSetInfo - 錯誤訊息設定');

      const preInsert = result.blockTriggers[0].triggers.find(t => t.name === 'PRE-INSERT');
      expect(preInsert?.maximoLocation).toBe('Mbo.add() - 新增前初始化欄位預設值');

      const whenValidate = result.blockTriggers[0].triggers.find(t => t.name === 'WHEN-VALIDATE-ITEM');
      expect(whenValidate?.maximoLocation).toBe('Mbo.validateField(String attrName) 或 FldClass.validate() - 單一欄位驗證');
    });

    it('should assign sequential numbers', () => {
      const result = analyzeTriggers(mockModule);

      expect(result.formTriggers[0].no).toBe(1);
      expect(result.formTriggers[1].no).toBe(2);
      expect(result.blockTriggers[0].triggers[0].no).toBe(3);
      expect(result.blockTriggers[0].triggers[1].no).toBe(4);
    });

    it('should track event type statistics', () => {
      const result = analyzeTriggers(mockModule);

      expect(result.statistics.byEventType['ON-ERROR']).toBe(1);
      expect(result.statistics.byEventType['PRE-INSERT']).toBe(1);
    });

    it('should decode trigger text', () => {
      const result = analyzeTriggers(mockModule);

      const preInsert = result.blockTriggers[0].triggers.find(t => t.name === 'PRE-INSERT');
      expect(preInsert?.triggerText).not.toContain('&#39;');
      expect(preInsert?.triggerText).toContain("'TP'");
    });
  });
});
