/**
 * FMB Spec Extractor - Extract functional specification from Oracle Forms FMB XML
 *
 * Extracts:
 * - Form metadata (name, title)
 * - Header fields with prompts, types, hints
 * - Detail table fields
 * - Buttons and their labels
 * - LOV (List of Values) definitions
 * - Record Groups (SQL queries)
 */

export interface FmbFieldSpec {
  /** Field name */
  name: string;
  /** Field label/prompt */
  label: string;
  /** Field type (Text Item, Display Item, Check Box, List Item, Push Button) */
  itemType: string;
  /** Data type (Char, Number, Date) */
  dataType: string;
  /** Maximum length */
  maxLength: number;
  /** Hint text (often contains format info or description) */
  hint: string;
  /** Associated LOV name */
  lovName: string;
  /** Block name (for grouping) */
  blockName: string;
  /** Input mode (required, readonly, etc.) */
  required: boolean;
  /** Query allowed */
  queryAllowed: boolean;
  /** Insert allowed */
  insertAllowed: boolean;
  /** Update allowed */
  updateAllowed: boolean;
  /** Visible */
  visible: boolean;
  /** Canvas name (for layout grouping) */
  canvasName: string;
  /** X position */
  xPosition: number;
  /** Y position */
  yPosition: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
}

export interface FmbLovSpec {
  /** LOV name */
  name: string;
  /** LOV title */
  title: string;
  /** Associated record group */
  recordGroupName: string;
  /** Column mappings */
  columns: Array<{
    name: string;
    title: string;
    returnItem: string;
  }>;
}

export interface FmbButtonSpec {
  /** Button name */
  name: string;
  /** Button label */
  label: string;
  /** Associated trigger (action) */
  trigger: string;
}

export interface FmbBlockSpec {
  /** Block name */
  name: string;
  /** Database table/view name */
  queryDataSourceName: string;
  /** Is single record block */
  singleRecord: boolean;
  /** Records display count */
  recordsDisplayCount: number;
  /** Fields in this block */
  fields: FmbFieldSpec[];
}

export interface FmbFormSpec {
  /** Form module name */
  name: string;
  /** Form title */
  title: string;
  /** Blocks (data sources) */
  blocks: FmbBlockSpec[];
  /** LOVs */
  lovs: FmbLovSpec[];
  /** Standalone buttons */
  buttons: FmbButtonSpec[];
  /** Record groups (SQL queries) */
  recordGroups: Array<{
    name: string;
    queryType: string;
    query: string;
  }>;
}

/**
 * FMB Spec Extractor class
 */
export class FmbSpecExtractor {
  private content: string = '';

  /**
   * Extract attribute value from XML string
   */
  private extractAttr(
    attrs: string,
    attrName: string,
    defaultValue: string = ''
  ): string {
    const pattern = new RegExp(`:${attrName}="([^"]*)"`, 'i');
    const match = attrs.match(pattern);
    return match ? match[1] : defaultValue;
  }

  /**
   * Extract numeric attribute
   */
  private extractNumAttr(
    attrs: string,
    attrName: string,
    defaultValue: number = 0
  ): number {
    const value = this.extractAttr(attrs, attrName);
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Extract boolean attribute
   */
  private extractBoolAttr(
    attrs: string,
    attrName: string,
    defaultValue: boolean = false
  ): boolean {
    const value = this.extractAttr(attrs, attrName).toLowerCase();
    if (value === 'true' || value === 'yes') return true;
    if (value === 'false' || value === 'no') return false;
    return defaultValue;
  }

  /**
   * Parse FMB XML content and extract specification
   */
  parse(xmlContent: string): FmbFormSpec {
    this.content = xmlContent;

    const spec: FmbFormSpec = {
      name: '',
      title: '',
      blocks: [],
      lovs: [],
      buttons: [],
      recordGroups: [],
    };

    // Extract FormModule info
    const fmMatch = this.content.match(/<FormModule\s+([^>]+)>/);
    if (fmMatch) {
      spec.name = this.extractAttr(fmMatch[1], 'Name');
      spec.title = this.extractAttr(fmMatch[1], 'Title');
    }

    // Extract Blocks
    spec.blocks = this.extractBlocks();

    // Extract LOVs
    spec.lovs = this.extractLovs();

    // Extract Record Groups
    spec.recordGroups = this.extractRecordGroups();

    // Extract standalone buttons
    spec.buttons = this.extractButtons();

    return spec;
  }

  /**
   * Extract blocks and their fields
   */
  private extractBlocks(): FmbBlockSpec[] {
    const blocks: FmbBlockSpec[] = [];
    const blockPattern = /<Block\s+([^>]+)>/g;

    let match;
    while ((match = blockPattern.exec(this.content)) !== null) {
      const attrs = match[1];
      const name = this.extractAttr(attrs, 'Name');

      // Skip system blocks
      if (
        !name ||
        name === 'HEAD_BLOCK' ||
        name === 'TOOL_BUTTON' ||
        name === 'CBLK'
      ) {
        continue;
      }

      const block: FmbBlockSpec = {
        name,
        queryDataSourceName: this.extractAttr(attrs, 'QueryDataSourceName'),
        singleRecord: this.extractBoolAttr(attrs, 'SingleRecord'),
        recordsDisplayCount: this.extractNumAttr(attrs, 'RecordsDisplayCount'),
        fields: this.extractFieldsForBlock(name),
      };

      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Extract fields for a specific block
   */
  private extractFieldsForBlock(blockName: string): FmbFieldSpec[] {
    const fields: FmbFieldSpec[] = [];
    const itemPattern = /<Item\s+([^>]+)>/g;

    let match;
    while ((match = itemPattern.exec(this.content)) !== null) {
      const attrs = match[1];
      const name = this.extractAttr(attrs, 'Name');
      const itemType = this.extractAttr(attrs, 'ItemType');

      // Skip non-meaningful items
      if (
        !name ||
        !itemType ||
        itemType === 'Image' ||
        name.startsWith('GRP_')
      ) {
        continue;
      }

      // Check if this item belongs to the current block by name prefix
      const belongsToBlock =
        name.startsWith(blockName) ||
        (blockName.startsWith('B1') && !name.startsWith('B2') && !name.startsWith('B3')) ||
        (blockName.startsWith('B2') && name.startsWith('B2')) ||
        (blockName.startsWith('B3') && name.startsWith('B3'));

      if (!belongsToBlock) continue;

      // Skip push buttons (handled separately)
      if (itemType === 'Push Button') continue;

      const field: FmbFieldSpec = {
        name,
        label: this.extractAttr(attrs, 'Prompt') || this.extractAttr(attrs, 'Label'),
        itemType,
        dataType: this.extractAttr(attrs, 'DataType', 'Char'),
        maxLength: this.extractNumAttr(attrs, 'MaximumLength'),
        hint: this.extractAttr(attrs, 'Hint'),
        lovName: this.extractAttr(attrs, 'LOVName'),
        blockName,
        required: this.extractBoolAttr(attrs, 'Required'),
        queryAllowed: this.extractBoolAttr(attrs, 'QueryAllowed', true),
        insertAllowed: this.extractBoolAttr(attrs, 'InsertAllowed', true),
        updateAllowed: this.extractBoolAttr(attrs, 'UpdateAllowed', true),
        visible: this.extractBoolAttr(attrs, 'Visible', true),
        canvasName: this.extractAttr(attrs, 'CanvasName'),
        xPosition: this.extractNumAttr(attrs, 'XPosition'),
        yPosition: this.extractNumAttr(attrs, 'YPosition'),
        width: this.extractNumAttr(attrs, 'Width'),
        height: this.extractNumAttr(attrs, 'Height'),
      };

      fields.push(field);
    }

    // Sort by Y position then X position
    fields.sort((a, b) => {
      if (a.yPosition !== b.yPosition) return a.yPosition - b.yPosition;
      return a.xPosition - b.xPosition;
    });

    return fields;
  }

  /**
   * Extract LOVs with column mappings
   */
  private extractLovs(): FmbLovSpec[] {
    const lovs: FmbLovSpec[] = [];

    // Match LOV element with content and closing tag: <LOV ...>...</LOV>
    const lovWithContentPattern = /<LOV\s+([^>]+)>([\s\S]*?)<\/LOV>/g;
    // Match self-closing LOV: <LOV .../>
    const lovSelfClosingPattern = /<LOV\s+([^/>]+)\/>/g;

    let match;

    // First pass: LOVs with content (have column mappings)
    while ((match = lovWithContentPattern.exec(this.content)) !== null) {
      const attrs = match[1];
      const lovContent = match[2];
      const name = this.extractAttr(attrs, 'Name');

      if (!name) continue;

      const lov: FmbLovSpec = {
        name,
        title: this.extractAttr(attrs, 'Title'),
        recordGroupName: this.extractAttr(attrs, 'RecordGroupName'),
        columns: this.extractLovColumns(lovContent),
      };

      lovs.push(lov);
    }

    // Second pass: Self-closing LOVs (no column mappings)
    while ((match = lovSelfClosingPattern.exec(this.content)) !== null) {
      const attrs = match[1];
      const name = this.extractAttr(attrs, 'Name');

      if (!name) continue;

      // Skip if already found in first pass
      if (lovs.some((l) => l.name === name)) continue;

      const lov: FmbLovSpec = {
        name,
        title: this.extractAttr(attrs, 'Title'),
        recordGroupName: this.extractAttr(attrs, 'RecordGroupName'),
        columns: [],
      };

      lovs.push(lov);
    }

    return lovs;
  }

  /**
   * Extract LOV column mappings from LOV content
   */
  private extractLovColumns(
    lovContent: string
  ): Array<{ name: string; title: string; returnItem: string }> {
    const columns: Array<{ name: string; title: string; returnItem: string }> =
      [];
    const colPattern = /<LOVColumnMapping\s+([^>]+)\/>/g;

    let match;
    while ((match = colPattern.exec(lovContent)) !== null) {
      const attrs = match[1];
      const name = this.extractAttr(attrs, 'Name');

      if (!name) continue;

      columns.push({
        name,
        title: this.extractAttr(attrs, 'Title'),
        returnItem: this.extractAttr(attrs, 'ReturnItem'),
      });
    }

    return columns;
  }

  /**
   * Extract Record Groups (SQL queries)
   */
  private extractRecordGroups(): Array<{
    name: string;
    queryType: string;
    query: string;
  }> {
    const groups: Array<{ name: string; queryType: string; query: string }> =
      [];
    const rgPattern = /<RecordGroup\s+([^>]+)>/g;

    let match;
    while ((match = rgPattern.exec(this.content)) !== null) {
      const attrs = match[1];
      const name = this.extractAttr(attrs, 'Name');
      const queryType = this.extractAttr(attrs, 'QueryDataSourceType');
      const query = this.extractAttr(attrs, 'QueryDataSourceName');

      if (name && query) {
        groups.push({ name, queryType, query });
      }
    }

    return groups;
  }

  /**
   * Extract buttons
   */
  private extractButtons(): FmbButtonSpec[] {
    const buttons: FmbButtonSpec[] = [];
    const itemPattern = /<Item\s+([^>]+)>/g;

    // System button labels to skip
    const systemLabels = [
      'Save',
      'Query',
      'Record',
      'Scroll',
      'Values',
      'Form',
      'Clear',
      'Exit',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
    ];

    let match;
    while ((match = itemPattern.exec(this.content)) !== null) {
      const attrs = match[1];
      const itemType = this.extractAttr(attrs, 'ItemType');

      if (itemType !== 'Push Button') continue;

      const name = this.extractAttr(attrs, 'Name');
      const label = this.extractAttr(attrs, 'Label');

      // Skip system buttons
      if (systemLabels.some((sys) => label.includes(sys))) continue;

      if (name && label) {
        buttons.push({
          name,
          label,
          trigger: '', // Could be extended to parse triggers
        });
      }
    }

    return buttons;
  }

  /**
   * Generate markdown specification document
   */
  generateMarkdownSpec(spec: FmbFormSpec): string {
    const lines: string[] = [];

    lines.push(`# ${spec.name} 功能規格說明`);
    lines.push('');
    lines.push(`**表單標題:** ${spec.title || 'N/A'}`);
    lines.push('');

    // Header fields
    const headerBlock = spec.blocks.find(
      (b) => b.singleRecord || b.recordsDisplayCount === 1
    );
    if (headerBlock && headerBlock.fields.length > 0) {
      lines.push('## 表頭欄位');
      lines.push('');
      lines.push(
        '| 欄位名稱 | 標籤 | 類型 | 資料類型 | 長度 | 提示說明 | LOV |'
      );
      lines.push(
        '|----------|------|------|----------|------|----------|-----|'
      );

      for (const field of headerBlock.fields) {
        const row = [
          field.name,
          field.label || '-',
          field.itemType,
          field.dataType,
          field.maxLength.toString() || '-',
          field.hint || '-',
          field.lovName || '-',
        ];
        lines.push(`| ${row.join(' | ')} |`);
      }
      lines.push('');
    }

    // Detail blocks
    const detailBlocks = spec.blocks.filter(
      (b) => !b.singleRecord && b.recordsDisplayCount > 1
    );
    for (const block of detailBlocks) {
      if (block.fields.length === 0) continue;

      lines.push(`## 明細欄位 - ${block.name}`);
      lines.push('');
      lines.push(
        '| 欄位名稱 | 標籤 | 類型 | 資料類型 | 長度 | 提示說明 | LOV |'
      );
      lines.push(
        '|----------|------|------|----------|------|----------|-----|'
      );

      for (const field of block.fields) {
        const row = [
          field.name,
          field.label || '-',
          field.itemType,
          field.dataType,
          field.maxLength.toString() || '-',
          field.hint || '-',
          field.lovName || '-',
        ];
        lines.push(`| ${row.join(' | ')} |`);
      }
      lines.push('');
    }

    // Buttons
    if (spec.buttons.length > 0) {
      lines.push('## 按鈕');
      lines.push('');
      for (const btn of spec.buttons) {
        lines.push(`- **${btn.name}**: ${btn.label}`);
      }
      lines.push('');
    }

    // LOVs
    if (spec.lovs.length > 0) {
      lines.push('## LOV (下拉選單)');
      lines.push('');
      lines.push(
        '| LOV名稱 | Record Group | 欄位名稱 | 回傳目標 |'
      );
      lines.push('|---------|--------------|----------|----------|');
      for (const lov of spec.lovs) {
        if (lov.columns.length > 0) {
          // Output each column mapping as a row
          for (const col of lov.columns) {
            lines.push(
              `| ${lov.name} | ${lov.recordGroupName || '-'} | ${col.name} | ${col.returnItem || '-'} |`
            );
          }
        } else {
          // LOV without column mappings
          lines.push(
            `| ${lov.name} | ${lov.recordGroupName || '-'} | - | - |`
          );
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate JSON specification
   */
  generateJsonSpec(spec: FmbFormSpec): string {
    return JSON.stringify(spec, null, 2);
  }
}
