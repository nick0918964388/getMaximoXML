import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapMaximoTypeToDbcType,
  extractMboDefinitions,
  generateDbcXml,
  generateDbc,
  downloadDbc,
  validateFieldCoverage,
} from '../dbc-generator';
import type { FmbModule } from '../types';
import type { SAFieldDefinition, ApplicationMetadata } from '../../types';
import { DEFAULT_FIELD, DEFAULT_METADATA } from '../../types';

// Mock FmbModule for testing
const createMockFmbModule = (overrides?: Partial<FmbModule>): FmbModule => ({
  name: 'TEST_MODULE',
  title: 'Test Module',
  blocks: [
    {
      name: 'MAIN_BLOCK',
      queryDataSource: 'ZZ_TEST_TABLE',
      singleRecord: true,
      items: [],
      triggers: [],
      attributes: {},
    },
  ],
  canvases: [],
  lovs: [],
  recordGroups: [],
  triggers: [],
  attributes: {},
  ...overrides,
});

// Mock SAFieldDefinition for testing
const createMockField = (overrides?: Partial<SAFieldDefinition>): SAFieldDefinition => ({
  ...DEFAULT_FIELD,
  fieldName: 'TEST_FIELD',
  label: 'Test Field',
  maxType: 'ALN',
  length: 100,
  title: 'Test Field Title',
  dbRequired: false,
  ...overrides,
});

// Mock ApplicationMetadata for testing
const createMockMetadata = (overrides?: Partial<ApplicationMetadata>): ApplicationMetadata => ({
  ...DEFAULT_METADATA,
  mboName: 'ZZ_TEST_TABLE',
  ...overrides,
});

describe('mapMaximoTypeToDbcType', () => {
  it('should map ALN to ALN', () => {
    expect(mapMaximoTypeToDbcType('ALN')).toBe('ALN');
  });

  it('should map UPPER to UPPER', () => {
    expect(mapMaximoTypeToDbcType('UPPER')).toBe('UPPER');
  });

  it('should map LOWER to LOWER', () => {
    expect(mapMaximoTypeToDbcType('LOWER')).toBe('LOWER');
  });

  it('should map INTEGER to INTEGER', () => {
    expect(mapMaximoTypeToDbcType('INTEGER')).toBe('INTEGER');
  });

  it('should map SMALLINT to SMALLINT', () => {
    expect(mapMaximoTypeToDbcType('SMALLINT')).toBe('SMALLINT');
  });

  it('should map DECIMAL to DECIMAL by default', () => {
    expect(mapMaximoTypeToDbcType('DECIMAL')).toBe('DECIMAL');
  });

  it('should map DECIMAL to AMOUNT when field name contains AMT', () => {
    expect(mapMaximoTypeToDbcType('DECIMAL', 'TOTAL_AMT')).toBe('AMOUNT');
  });

  it('should map DECIMAL to AMOUNT when field name contains AMOUNT', () => {
    expect(mapMaximoTypeToDbcType('DECIMAL', 'LINE_AMOUNT')).toBe('AMOUNT');
  });

  it('should map DECIMAL to AMOUNT when field name contains PRICE', () => {
    expect(mapMaximoTypeToDbcType('DECIMAL', 'UNIT_PRICE')).toBe('AMOUNT');
  });

  it('should map DECIMAL to AMOUNT when field name contains COST', () => {
    expect(mapMaximoTypeToDbcType('DECIMAL', 'ACTUAL_COST')).toBe('AMOUNT');
  });

  it('should map FLOAT to FLOAT', () => {
    expect(mapMaximoTypeToDbcType('FLOAT')).toBe('FLOAT');
  });

  it('should map DATE to DATE', () => {
    expect(mapMaximoTypeToDbcType('DATE')).toBe('DATE');
  });

  it('should map DATETIME to DATETIME', () => {
    expect(mapMaximoTypeToDbcType('DATETIME')).toBe('DATETIME');
  });

  it('should map TIME to TIME', () => {
    expect(mapMaximoTypeToDbcType('TIME')).toBe('TIME');
  });

  it('should map YORN to YORN', () => {
    expect(mapMaximoTypeToDbcType('YORN')).toBe('YORN');
  });

  it('should map CLOB to CLOB', () => {
    expect(mapMaximoTypeToDbcType('CLOB')).toBe('CLOB');
  });

  it('should map LONGALN to LONGALN', () => {
    expect(mapMaximoTypeToDbcType('LONGALN')).toBe('LONGALN');
  });

  it('should map GL to GL', () => {
    expect(mapMaximoTypeToDbcType('GL')).toBe('GL');
  });

  it('should default to ALN for unknown types', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapMaximoTypeToDbcType('UNKNOWN' as any)).toBe('ALN');
  });
});

describe('extractMboDefinitions', () => {
  it('should extract MBO definitions from FmbModule', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_MAIN_MBO' });
    const fields = [
      createMockField({ fieldName: 'FIELD1', maxType: 'ALN', length: 50, title: 'Field 1', dbRequired: true }),
      createMockField({ fieldName: 'FIELD2', maxType: 'INTEGER', title: 'Field 2' }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].object).toBe('ZZ_MAIN_MBO');
    // 3 attributes: 1 auto-generated primary key + 2 fields
    expect(result.tables[0].attributes).toHaveLength(3);
  });

  it('should use metadata.mboName as main table object name (not queryDataSource)', () => {
    const fmbModule = createMockFmbModule({
      blocks: [
        {
          name: 'BLOCK1',
          queryDataSource: 'DIFFERENT_QUERY_SOURCE',
          singleRecord: true,
          items: [],
          triggers: [],
          attributes: {},
        },
      ],
    });
    const metadata = createMockMetadata({ mboName: 'ZZ_MAIN_MBO' });
    const fields = [createMockField()];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    // Should use metadata.mboName, not queryDataSource
    expect(result.tables[0].object).toBe('ZZ_MAIN_MBO');
  });

  it('should exclude pushbutton fields from DBC attributes', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata();
    const fields = [
      createMockField({ fieldName: 'TEXT_FIELD', type: 'textbox' }),
      createMockField({ fieldName: 'BUTTON_FIELD', type: 'pushbutton' }),
      createMockField({ fieldName: 'CHECKBOX_FIELD', type: 'checkbox' }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    const attrNames = result.tables[0].attributes.map(a => a.attribute);
    expect(attrNames).toContain('TEXT_FIELD');
    expect(attrNames).toContain('CHECKBOX_FIELD');
    expect(attrNames).not.toContain('BUTTON_FIELD');
  });

  it('should exclude statictext fields from DBC attributes', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata();
    const fields = [
      createMockField({ fieldName: 'TEXT_FIELD', type: 'textbox' }),
      createMockField({ fieldName: 'STATIC_FIELD', type: 'statictext' }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    const attrNames = result.tables[0].attributes.map(a => a.attribute);
    expect(attrNames).toContain('TEXT_FIELD');
    expect(attrNames).not.toContain('STATIC_FIELD');
  });

  it('should remove duplicate field names from DBC attributes', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_TEST_TABLE' });
    const fields = [
      createMockField({ fieldName: 'FIELD1', area: 'header' }),
      createMockField({ fieldName: 'FIELD1', area: 'header' }), // duplicate
      createMockField({ fieldName: 'FIELD2', area: 'header' }),
      createMockField({ fieldName: 'FIELD2', area: 'header' }), // duplicate
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    const attrNames = result.tables[0].attributes.map(a => a.attribute);
    // Should only have: auto-generated primary key + 2 unique fields
    expect(attrNames.filter(n => n === 'FIELD1')).toHaveLength(1);
    expect(attrNames.filter(n => n === 'FIELD2')).toHaveLength(1);
    // Total: 1 primary key + 2 unique fields = 3
    expect(result.tables[0].attributes).toHaveLength(3);
  });

  it('should generate separate table definitions for child relationships', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_GL_JE_HEADERS' });
    const fields = [
      createMockField({ fieldName: 'HEADER_FIELD', area: 'header' }),
      createMockField({ fieldName: 'LINE_FIELD1', area: 'detail', relationship: 'ZZ_GL_JE_LINES' }),
      createMockField({ fieldName: 'LINE_FIELD2', area: 'detail', relationship: 'ZZ_GL_JE_LINES' }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    expect(result.tables).toHaveLength(2);
    expect(result.tables[0].object).toBe('ZZ_GL_JE_HEADERS');
    expect(result.tables[1].object).toBe('ZZ_GL_JE_LINES');
    expect(result.tables[1].attributes.map(a => a.attribute)).toContain('LINE_FIELD1');
    expect(result.tables[1].attributes.map(a => a.attribute)).toContain('LINE_FIELD2');
  });

  it('should generate create_relationship for child tables', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_GL_JE_HEADERS' });
    const fields = [
      createMockField({ fieldName: 'JE_HEADER_ID', area: 'header', dbRequired: true }),
      createMockField({ fieldName: 'LINE_FIELD', area: 'detail', relationship: 'ZZ_GL_JE_LINES' }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].name).toBe('ZZ_GL_JE_LINES');
    expect(result.relationships[0].parent).toBe('ZZ_GL_JE_HEADERS');
    expect(result.relationships[0].child).toBe('ZZ_GL_JE_LINES');
  });

  it('should set default classname and service', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata();
    const fields = [createMockField()];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    expect(result.tables[0].classname).toBe('psdi.mbo.custapp.CustomMboSet');
    expect(result.tables[0].service).toBe('CUSTAPP');
    expect(result.tables[0].type).toBe('system');
  });

  it('should auto-generate primary key as {objectname}ID with BIGINT type', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_TEST_TABLE' });
    const fields = [
      createMockField({ fieldName: 'TABLE_ID', dbRequired: true }),
      createMockField({ fieldName: 'DESCRIPTION', dbRequired: false }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    // Primary key should be auto-generated as {mboName}ID
    expect(result.tables[0].primarykey).toBe('ZZ_TEST_TABLEID');
    // First attribute should be the auto-generated primary key
    expect(result.tables[0].attributes[0].attribute).toBe('ZZ_TEST_TABLEID');
    expect(result.tables[0].attributes[0].maxtype).toBe('BIGINT');
    expect(result.tables[0].attributes[0].required).toBe(true);
  });

  it('should include auto-generated primary key as first attribute', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_TEST_TABLE' });
    const fields = [
      createMockField({ fieldName: 'FIRST_FIELD', dbRequired: false }),
      createMockField({ fieldName: 'SECOND_FIELD', dbRequired: false }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    // First attribute is auto-generated primary key
    expect(result.tables[0].attributes[0].attribute).toBe('ZZ_TEST_TABLEID');
    // Followed by the actual fields
    expect(result.tables[0].attributes[1].attribute).toBe('FIRST_FIELD');
    expect(result.tables[0].attributes[2].attribute).toBe('SECOND_FIELD');
  });

  it('should map field attributes correctly (after auto-generated primary key)', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata({ mboName: 'ZZ_TEST_TABLE' });
    const fields = [
      createMockField({
        fieldName: 'TEST_ATTR',
        maxType: 'ALN',
        length: 75,
        title: 'Test Attribute',
        label: 'Test Label',
        dbRequired: true,
      }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);
    // attributes[0] is auto-generated primary key, attributes[1] is the field
    const attr = result.tables[0].attributes[1];

    expect(attr.attribute).toBe('TEST_ATTR');
    expect(attr.maxtype).toBe('ALN');
    expect(attr.length).toBe(75);
    expect(attr.title).toBe('Test Attribute');
    expect(attr.remarks).toBe('Test Label');
    expect(attr.required).toBe(true);
  });

  it('should return empty tables when no valid fields', () => {
    const fmbModule = createMockFmbModule({
      blocks: [],
    });
    const metadata = createMockMetadata();
    const fields: SAFieldDefinition[] = [];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    expect(result.tables).toHaveLength(0);
  });

  it('should filter out list area fields from main table attributes', () => {
    const fmbModule = createMockFmbModule();
    const metadata = createMockMetadata();
    const fields = [
      createMockField({ fieldName: 'HEADER_FIELD', area: 'header' }),
      createMockField({ fieldName: 'LIST_FIELD', area: 'list' }),
    ];

    const result = extractMboDefinitions(fmbModule, fields, metadata);

    const attrNames = result.tables[0].attributes.map(a => a.attribute);
    expect(attrNames).toContain('HEADER_FIELD');
    expect(attrNames).not.toContain('LIST_FIELD');
  });
});

describe('generateDbcXml', () => {
  it('should generate valid XML with script root element', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: 'Test description',
      },
      tables: [],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<!DOCTYPE script SYSTEM "script.dtd">');
    expect(xml).toContain('<script');
    expect(xml).toContain('author="TestAuthor"');
    expect(xml).toContain('scriptname="TEST_SCRIPT"');
    expect(xml).toContain('</script>');
  });

  it('should include description in script element', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: 'This is a test script',
      },
      tables: [],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('<description>This is a test script</description>');
  });

  it('should generate define_table elements', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: '',
      },
      tables: [
        {
          object: 'ZZ_TEST_TABLE',
          description: 'Test table description',
          type: 'system' as const,
          primarykey: 'TABLEID',
          classname: 'psdi.mbo.custapp.CustomMboSet',
          service: 'CUSTAPP',
          attributes: [],
        },
      ],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('<define_table');
    expect(xml).toContain('object="ZZ_TEST_TABLE"');
    expect(xml).toContain('description="Test table description"');
    expect(xml).toContain('type="system"');
    expect(xml).toContain('primarykey="TABLEID"');
    expect(xml).toContain('classname="psdi.mbo.custapp.CustomMboSet"');
    expect(xml).toContain('service="CUSTAPP"');
  });

  it('should generate attrdef elements', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: '',
      },
      tables: [
        {
          object: 'ZZ_TEST_TABLE',
          description: 'Test table',
          type: 'system' as const,
          primarykey: 'TABLEID',
          classname: 'psdi.mbo.custapp.CustomMboSet',
          service: 'CUSTAPP',
          attributes: [
            {
              attribute: 'TABLEID',
              maxtype: 'UPPER' as const,
              length: 30,
              title: 'Table ID',
              remarks: 'Primary key',
              required: true,
            },
            {
              attribute: 'DESCRIPTION',
              maxtype: 'ALN' as const,
              length: 100,
              title: 'Description',
              remarks: 'Description field',
              required: false,
            },
          ],
        },
      ],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('<attrdef');
    expect(xml).toContain('attribute="TABLEID"');
    expect(xml).toContain('maxtype="UPPER"');
    expect(xml).toContain('length="30"');
    expect(xml).toContain('title="Table ID"');
    expect(xml).toContain('remarks="Primary key"');
    expect(xml).toContain('required="true"');
    expect(xml).toContain('attribute="DESCRIPTION"');
  });

  it('should omit length attribute for non-string types', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: '',
      },
      tables: [
        {
          object: 'ZZ_TEST_TABLE',
          description: 'Test table',
          type: 'system' as const,
          primarykey: 'ID',
          classname: 'psdi.mbo.custapp.CustomMboSet',
          service: 'CUSTAPP',
          attributes: [
            {
              attribute: 'ID',
              maxtype: 'INTEGER' as const,
              title: 'ID',
              remarks: 'Integer field',
              required: true,
            },
            {
              attribute: 'ACTIVE',
              maxtype: 'YORN' as const,
              title: 'Active',
              remarks: 'Boolean field',
            },
          ],
        },
      ],
    };

    const xml = generateDbcXml(script);

    // INTEGER and YORN should not have length attribute
    const idMatch = xml.match(/<attrdef[^>]*attribute="ID"[^>]*>/);
    expect(idMatch?.[0]).not.toContain('length=');

    const activeMatch = xml.match(/<attrdef[^>]*attribute="ACTIVE"[^>]*>/);
    expect(activeMatch?.[0]).not.toContain('length=');
  });

  it('should escape special XML characters', () => {
    const script = {
      metadata: {
        author: 'Test & Author',
        scriptname: 'TEST_SCRIPT',
        description: 'Description with <special> & "characters"',
      },
      tables: [],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('author="Test &amp; Author"');
    expect(xml).toContain('&lt;special&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;characters&quot;');
  });

  it('should generate statements wrapper element', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: '',
      },
      tables: [
        {
          object: 'ZZ_TEST_TABLE',
          description: 'Test table',
          type: 'system' as const,
          primarykey: 'ID',
          classname: 'psdi.mbo.custapp.CustomMboSet',
          service: 'CUSTAPP',
          attributes: [],
        },
      ],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('<statements>');
    expect(xml).toContain('</statements>');
  });

  it('should generate create_relationship elements', () => {
    const script = {
      metadata: {
        author: 'TestAuthor',
        scriptname: 'TEST_SCRIPT',
        description: '',
      },
      tables: [],
      relationships: [
        {
          name: 'ZZ_GL_JE_LINES',
          parent: 'ZZ_GL_JE_HEADERS',
          child: 'ZZ_GL_JE_LINES',
          whereclause: 'je_header_id = :je_header_id',
          remarks: '建立傳票主檔與明細的關聯',
        },
      ],
    };

    const xml = generateDbcXml(script);

    expect(xml).toContain('<create_relationship');
    expect(xml).toContain('name="ZZ_GL_JE_LINES"');
    expect(xml).toContain('parent="ZZ_GL_JE_HEADERS"');
    expect(xml).toContain('child="ZZ_GL_JE_LINES"');
    expect(xml).toContain('whereclause="je_header_id = :je_header_id"');
    expect(xml).toContain('remarks="建立傳票主檔與明細的關聯"');
  });
});

describe('generateDbc', () => {
  it('should return complete DbcGenerationResult', () => {
    const fmbModule = createMockFmbModule();
    const fields = [
      createMockField({ fieldName: 'FIELD1', dbRequired: true }),
    ];
    const metadata = createMockMetadata();
    const scriptMetadata = {
      author: 'TestAuthor',
      scriptname: 'TEST_SCRIPT',
      description: 'Test description',
    };

    const result = generateDbc(fields, fmbModule, metadata, scriptMetadata);

    expect(result.content).toContain('<?xml version="1.0"');
    expect(result.script.metadata.author).toBe('TestAuthor');
    expect(result.suggestedFilename).toMatch(/\.dbc$/);
  });

  it('should generate suggested filename from module name', () => {
    const fmbModule = createMockFmbModule({ name: 'MY_MODULE' });
    const fields = [createMockField()];
    const metadata = createMockMetadata();

    const result = generateDbc(fields, fmbModule, metadata);

    expect(result.suggestedFilename).toBe('MY_MODULE_dbc.dbc');
  });

  it('should use default metadata when not provided', () => {
    const fmbModule = createMockFmbModule();
    const fields = [createMockField()];
    const metadata = createMockMetadata({ mboName: 'ZZ_DEFAULT_MBO' });

    const result = generateDbc(fields, fmbModule, metadata);

    expect(result.script.metadata.author).toBe('MaximoExpert');
    expect(result.content).toContain('author="MaximoExpert"');
  });

  it('should generate scriptname from MBO name when not provided', () => {
    const fmbModule = createMockFmbModule();
    const fields = [createMockField()];
    const metadata = createMockMetadata({ mboName: 'ZZ_TEST_TABLE' });

    const result = generateDbc(fields, fmbModule, metadata);

    expect(result.script.metadata.scriptname).toBe('ZZ_TEST_TABLE_SETUP');
  });
});

describe('downloadDbc', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let appendChildMock: ReturnType<typeof vi.fn>;
  let removeChildMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
    revokeObjectURLMock = vi.fn();
    appendChildMock = vi.fn();
    removeChildMock = vi.fn();
    clickMock = vi.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildMock);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a Blob with correct content and type', () => {
    const content = '<?xml version="1.0"?><script></script>';
    const filename = 'test.dbc';

    // Mock createElement to capture the anchor element
    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    downloadDbc(content, filename);

    expect(createObjectURLMock).toHaveBeenCalled();
    const blobArg = createObjectURLMock.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
  });

  it('should set correct filename on anchor element', () => {
    const content = '<?xml version="1.0"?><script></script>';
    const filename = 'my_module_dbc.dbc';

    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    downloadDbc(content, filename);

    expect(mockAnchor.download).toBe(filename);
  });

  it('should trigger download by clicking anchor', () => {
    const content = '<?xml version="1.0"?><script></script>';
    const filename = 'test.dbc';

    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    downloadDbc(content, filename);

    expect(clickMock).toHaveBeenCalled();
  });

  it('should revoke object URL after download', () => {
    const content = '<?xml version="1.0"?><script></script>';
    const filename = 'test.dbc';

    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    downloadDbc(content, filename);

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test-url');
  });
});

describe('validateFieldCoverage', () => {
  it('should return isValid=true when all fields are covered', () => {
    const fields = [
      createMockField({ fieldName: 'FIELD1', area: 'header' }),
      createMockField({ fieldName: 'FIELD2', area: 'header' }),
    ];
    const dbcScript = {
      metadata: { author: 'Test', scriptname: 'TEST', description: '' },
      tables: [
        {
          object: 'ZZ_TEST',
          description: 'Test',
          type: 'system' as const,
          primarykey: 'ZZ_TESTID',
          classname: 'test',
          service: 'test',
          attributes: [
            { attribute: 'ZZ_TESTID', maxtype: 'BIGINT' as const, title: 'ID', remarks: '', required: true },
            { attribute: 'FIELD1', maxtype: 'ALN' as const, title: 'Field 1', remarks: '' },
            { attribute: 'FIELD2', maxtype: 'ALN' as const, title: 'Field 2', remarks: '' },
          ],
        },
      ],
    };

    const result = validateFieldCoverage(fields, dbcScript);

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('should return isValid=false when fields are missing from DBC', () => {
    const fields = [
      createMockField({ fieldName: 'FIELD1', area: 'header' }),
      createMockField({ fieldName: 'FIELD2', area: 'header' }),
      createMockField({ fieldName: 'FIELD3', area: 'header' }),
    ];
    const dbcScript = {
      metadata: { author: 'Test', scriptname: 'TEST', description: '' },
      tables: [
        {
          object: 'ZZ_TEST',
          description: 'Test',
          type: 'system' as const,
          primarykey: 'ZZ_TESTID',
          classname: 'test',
          service: 'test',
          attributes: [
            { attribute: 'ZZ_TESTID', maxtype: 'BIGINT' as const, title: 'ID', remarks: '', required: true },
            { attribute: 'FIELD1', maxtype: 'ALN' as const, title: 'Field 1', remarks: '' },
            // FIELD2 and FIELD3 are missing
          ],
        },
      ],
    };

    const result = validateFieldCoverage(fields, dbcScript);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('FIELD2');
    expect(result.missingFields).toContain('FIELD3');
  });

  it('should exclude pushbutton and statictext fields from validation', () => {
    const fields = [
      createMockField({ fieldName: 'FIELD1', area: 'header', type: 'textbox' }),
      createMockField({ fieldName: 'BUTTON1', area: 'header', type: 'pushbutton' }),
      createMockField({ fieldName: 'STATIC1', area: 'header', type: 'statictext' }),
    ];
    const dbcScript = {
      metadata: { author: 'Test', scriptname: 'TEST', description: '' },
      tables: [
        {
          object: 'ZZ_TEST',
          description: 'Test',
          type: 'system' as const,
          primarykey: 'ZZ_TESTID',
          classname: 'test',
          service: 'test',
          attributes: [
            { attribute: 'ZZ_TESTID', maxtype: 'BIGINT' as const, title: 'ID', remarks: '', required: true },
            { attribute: 'FIELD1', maxtype: 'ALN' as const, title: 'Field 1', remarks: '' },
            // BUTTON1 and STATIC1 should not be expected
          ],
        },
      ],
    };

    const result = validateFieldCoverage(fields, dbcScript);

    expect(result.isValid).toBe(true);
    expect(result.expectedFields).not.toContain('BUTTON1');
    expect(result.expectedFields).not.toContain('STATIC1');
  });

  it('should exclude list area fields from validation', () => {
    const fields = [
      createMockField({ fieldName: 'FIELD1', area: 'header' }),
      createMockField({ fieldName: 'LIST_FIELD', area: 'list' }),
    ];
    const dbcScript = {
      metadata: { author: 'Test', scriptname: 'TEST', description: '' },
      tables: [
        {
          object: 'ZZ_TEST',
          description: 'Test',
          type: 'system' as const,
          primarykey: 'ZZ_TESTID',
          classname: 'test',
          service: 'test',
          attributes: [
            { attribute: 'ZZ_TESTID', maxtype: 'BIGINT' as const, title: 'ID', remarks: '', required: true },
            { attribute: 'FIELD1', maxtype: 'ALN' as const, title: 'Field 1', remarks: '' },
          ],
        },
      ],
    };

    const result = validateFieldCoverage(fields, dbcScript);

    expect(result.isValid).toBe(true);
    expect(result.expectedFields).not.toContain('LIST_FIELD');
  });
});
