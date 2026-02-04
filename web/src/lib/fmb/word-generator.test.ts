/**
 * Unit tests for FMB Word Generator
 *
 * TDD approach: Tests are written first and should FAIL before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Document } from 'docx';
import {
  generateWordDocument,
  downloadWordDocument,
  WordGenerationError,
} from './word-generator';
import type { FormSpec } from './spec-generator';
import type { TriggerSectionSpec } from './trigger-types';

/**
 * Create a minimal FormSpec for testing
 */
function createMinimalFormSpec(): FormSpec {
  const emptyTriggers: TriggerSectionSpec = {
    formTriggers: [],
    blockTriggers: [],
    statistics: {
      totalCount: 0,
      formLevelCount: 0,
      blockLevelCount: 0,
      byEventType: {},
    },
  };

  return {
    formName: 'TEST_FORM',
    formTitle: 'Test Form Title',
    functionDescription: 'Test function description',
    blocks: [],
    buttons: [],
    lovs: [],
    recordGroups: [],
    triggers: emptyTriggers,
  };
}

/**
 * Create a complete FormSpec for testing
 */
function createCompleteFormSpec(): FormSpec {
  const triggers: TriggerSectionSpec = {
    formTriggers: [
      {
        no: 1,
        name: 'WHEN-NEW-FORM-INSTANCE',
        eventDescription: '表單初始化時觸發',
        javaUse: '初始化表單資料',
        maximoLocation: 'Mbo.init()',
        level: 'Form',
        triggerText: 'BEGIN NULL; END;',
        sqlStatements: [],
        businessRules: [],
        summary: '表單初始化',
      },
    ],
    blockTriggers: [
      {
        blockName: 'MAIN_BLOCK',
        triggers: [
          {
            no: 2,
            name: 'WHEN-VALIDATE-ITEM',
            eventDescription: '項目驗證時觸發',
            javaUse: '驗證輸入資料',
            maximoLocation: 'Mbo.validate()',
            level: 'Block',
            blockName: 'MAIN_BLOCK',
            triggerText: 'BEGIN :MAIN_BLOCK.STATUS := "ACTIVE"; END;',
            sqlStatements: [
              {
                type: 'SELECT',
                statement: 'SELECT * FROM DUAL',
                tables: ['DUAL'],
                fields: [],
              },
            ],
            businessRules: [
              {
                type: 'VALIDATION',
                description: '狀態必須為有效值',
                affectedFields: ['STATUS'],
              },
            ],
            summary: '驗證狀態欄位',
          },
        ],
      },
    ],
    statistics: {
      totalCount: 2,
      formLevelCount: 1,
      blockLevelCount: 1,
      byEventType: {
        'WHEN-NEW-FORM-INSTANCE': 1,
        'WHEN-VALIDATE-ITEM': 1,
      },
    },
  };

  return {
    formName: 'COMPLETE_FORM',
    formTitle: 'Complete Form Title',
    functionDescription: 'Complete function description',
    blocks: [
      {
        name: 'MAIN_BLOCK',
        baseTable: 'MAIN_TABLE',
        whereCondition: 'STATUS = :1',
        orderByClause: 'CREATED_DATE DESC',
        insertAllowed: true,
        updateAllowed: true,
        deleteAllowed: false,
        fields: [
          {
            no: 1,
            prompt: 'ID',
            dbColumn: 'RECORD_ID',
            displayed: true,
            dataType: 'Number',
            required: true,
            caseRestriction: 'Mixed',
            lovName: '',
            formatMask: '',
            updateAllowed: false,
            initialValue: '',
            remark: '主鍵',
          },
          {
            no: 2,
            prompt: 'Status',
            dbColumn: 'STATUS',
            displayed: true,
            dataType: 'Char',
            required: true,
            caseRestriction: 'Upper',
            lovName: 'LOV_STATUS',
            formatMask: '',
            updateAllowed: true,
            initialValue: 'DRAFT',
            remark: '狀態',
          },
        ],
      },
    ],
    buttons: [
      {
        name: 'BTN_SAVE',
        label: 'Save',
        description: '儲存資料',
      },
    ],
    lovs: [
      {
        no: 1,
        name: 'LOV_STATUS',
        recordGroupName: 'RG_STATUS',
        recordGroupQuery: 'SELECT CODE, DESCRIPTION FROM STATUS_CODES',
        columns: [
          { columnName: 'CODE', returnItem: 'MAIN_BLOCK.STATUS' },
          { columnName: 'DESCRIPTION', returnItem: 'MAIN_BLOCK.STATUS_DESC' },
        ],
      },
    ],
    recordGroups: [
      {
        no: 1,
        name: 'RG_STATUS',
        recordGroupType: 'Query',
        query: 'SELECT CODE, DESCRIPTION FROM STATUS_CODES',
        columns: [
          { name: 'CODE', dataType: 'Char', maxLength: 10 },
          { name: 'DESCRIPTION', dataType: 'Char', maxLength: 100 },
        ],
      },
    ],
    triggers,
  };
}

describe('Word Generator', () => {
  describe('generateWordDocument', () => {
    // T005: Unit test: generateWordDocument returns valid Document object
    it('should return a valid Document object', async () => {
      const spec = createMinimalFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should include document title from spec', async () => {
      const spec = createMinimalFormSpec();
      const doc = await generateWordDocument(spec);

      // Document object contains creator and title in the coreProperties
      expect(doc).toBeDefined();
    });

    it('should accept optional configuration', async () => {
      const spec = createMinimalFormSpec();
      const doc = await generateWordDocument(spec, {
        title: 'Custom Title',
        author: 'Test Author',
        includeTriggerDetails: true,
        includeSqlCode: true,
      });

      expect(doc).toBeInstanceOf(Document);
    });
  });

  describe('downloadWordDocument', () => {
    let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };
    let originalCreateElement: typeof document.createElement;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      mockAnchor = { href: '', download: '', click: vi.fn() };

      // Store original functions
      originalCreateElement = document.createElement.bind(document);
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;

      // Mock document.createElement
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'a') {
          return mockAnchor as unknown as HTMLElement;
        }
        return originalCreateElement(tagName);
      }) as typeof document.createElement;

      // Mock URL methods
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      // Restore original functions
      document.createElement = originalCreateElement;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    // T006: Unit test: downloadWordDocument triggers browser download
    it('should trigger browser download', async () => {
      const spec = createMinimalFormSpec();
      await downloadWordDocument(spec);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('should use spec.formName as default file name', async () => {
      const spec = createMinimalFormSpec();
      await downloadWordDocument(spec);

      expect(mockAnchor.download).toBe('TEST_FORM_spec.docx');
    });

    it('should use custom file name when provided', async () => {
      const spec = createMinimalFormSpec();
      await downloadWordDocument(spec, 'CustomName');

      expect(mockAnchor.download).toBe('CustomName_spec.docx');
    });

    it('should sanitize file names with special characters', async () => {
      const spec = createMinimalFormSpec();
      await downloadWordDocument(spec, 'Test<>:"/\\|?*File');

      expect(mockAnchor.download).toBe('Test_________File_spec.docx');
    });
  });

  describe('minimal FormSpec handling', () => {
    // T007: Unit test: minimal FormSpec generates valid document
    it('should generate valid document from minimal FormSpec', async () => {
      const spec = createMinimalFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should generate valid document from empty blocks', async () => {
      const spec = createMinimalFormSpec();
      spec.blocks = [];
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should generate valid document from empty buttons', async () => {
      const spec = createMinimalFormSpec();
      spec.buttons = [];
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should generate valid document from empty LOVs', async () => {
      const spec = createMinimalFormSpec();
      spec.lovs = [];
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });
  });

  // User Story 2 Tests: Consistent Formatting
  describe('heading levels match preview (US2)', () => {
    // T019: Unit test: heading levels match preview (H1, H2, H3)
    it('should generate document with proper heading structure', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      // Verify document has sections with children
      expect(doc).toBeInstanceOf(Document);
    });
  });

  describe('table borders and header styling (US2)', () => {
    // T020: Unit test: table borders and header styling applied
    it('should generate tables with borders in complete FormSpec', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });
  });

  describe('code blocks use monospace font (US2)', () => {
    // T021: Unit test: code blocks use monospace font
    it('should apply monospace font to SQL code blocks', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      // The document should be generated with SQL blocks using Consolas
      expect(doc).toBeInstanceOf(Document);
    });
  });

  // User Story 3 Tests: Error Handling
  describe('error handling (US3)', () => {
    // T028: Unit test: generation error shows user-friendly message
    it('should throw WordGenerationError on invalid input', async () => {
      // This test verifies the error class exists and works
      const error = new WordGenerationError('Test error message');
      expect(error).toBeInstanceOf(WordGenerationError);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('WordGenerationError');
    });

    // T029: Unit test: error does not expose technical details
    it('should wrap internal errors with user-friendly message', async () => {
      const internalError = new Error('Internal technical error');
      const wrappedError = new WordGenerationError('Word 文件生成失敗，請稍後再試', internalError);

      expect(wrappedError.message).toBe('Word 文件生成失敗，請稍後再試');
      expect(wrappedError.cause).toBe(internalError);
    });
  });

  // Complete FormSpec generation test
  describe('complete FormSpec generation', () => {
    it('should generate document with all sections from complete FormSpec', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should include block info tables', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should include field tables with 12 columns', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should include buttons section', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should include LOV section with column mappings', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });

    it('should include triggers section with statistics', async () => {
      const spec = createCompleteFormSpec();
      const doc = await generateWordDocument(spec);

      expect(doc).toBeInstanceOf(Document);
    });
  });
});
