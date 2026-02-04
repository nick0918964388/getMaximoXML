/**
 * FMB Word Generator - Generate Word (.docx) document from FormSpec
 *
 * Uses the docx npm package to generate Word documents in the browser.
 * Output format matches the Markdown spec generator structure.
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  convertInchesToTwip,
} from 'docx';
import type { FormSpec, BlockSpec, FieldSpec, LovSpec, ButtonSpec } from './spec-generator';
import type { TriggerSectionSpec, TriggerSpec } from './trigger-types';

/**
 * Word document generation options
 */
export interface WordDocumentOptions {
  /** Document title (shown in document properties) */
  title?: string;
  /** Document author */
  author?: string;
  /** Include trigger details */
  includeTriggerDetails?: boolean;
  /** Include SQL code */
  includeSqlCode?: boolean;
}

/**
 * Word style configuration
 */
export interface WordStyleConfig {
  /** Heading font sizes (pt) */
  headingSizes: {
    h1: number;
    h2: number;
    h3: number;
  };
  /** Table header background color (hex without #) */
  tableHeaderBgColor: string;
  /** Code block font family */
  codeFont: string;
  /** Code block background color (hex without #) */
  codeBgColor: string;
}

/** Default style configuration */
const DEFAULT_STYLE_CONFIG: WordStyleConfig = {
  headingSizes: {
    h1: 24,
    h2: 18,
    h3: 14,
  },
  tableHeaderBgColor: 'E0E0E0',
  codeFont: 'Consolas',
  codeBgColor: 'F5F5F5',
};

/** Table border style */
const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

/**
 * Custom error class for Word generation errors
 */
export class WordGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'WordGenerationError';
  }
}

/**
 * Generate a Word document from FormSpec
 *
 * @param spec - The form specification
 * @param options - Optional generation options
 * @param styleConfig - Optional style configuration
 * @returns Promise resolving to a Document object
 */
export async function generateWordDocument(
  spec: FormSpec,
  options: WordDocumentOptions = {},
  styleConfig: WordStyleConfig = DEFAULT_STYLE_CONFIG
): Promise<Document> {
  const children: (Paragraph | Table)[] = [];

  // Document header
  children.push(...generateDocumentHeader(spec, styleConfig));

  // Blocks (畫面規格)
  children.push(...generateBlocksSections(spec.blocks, styleConfig));

  // Buttons
  if (spec.buttons.length > 0) {
    children.push(...generateButtonsSection(spec.buttons, styleConfig));
  }

  // LOVs
  if (spec.lovs.length > 0) {
    children.push(...generateLovsSection(spec.lovs, styleConfig, options.includeSqlCode ?? true));
  }

  // Triggers
  if (spec.triggers && spec.triggers.statistics.totalCount > 0) {
    children.push(...generateTriggersSection(spec.triggers, styleConfig, options.includeTriggerDetails ?? true));
  }

  return new Document({
    title: options.title ?? `${spec.formName} 功能規格說明`,
    creator: options.author ?? 'FMB Converter',
    sections: [{ children }],
  });
}

/**
 * Download FormSpec as Word document
 *
 * @param spec - The form specification
 * @param fileName - The file name (without extension)
 * @param options - Optional generation options
 */
export async function downloadWordDocument(
  spec: FormSpec,
  fileName?: string,
  options: WordDocumentOptions = {}
): Promise<void> {
  try {
    const doc = await generateWordDocument(spec, options);
    const blob = await Packer.toBlob(doc);

    // Sanitize file name
    const safeName = sanitizeFileName(fileName ?? spec.formName);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_spec.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof WordGenerationError) {
      throw error;
    }
    throw new WordGenerationError(
      'Word 文件生成失敗，請稍後再試',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Sanitize file name by removing invalid characters
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Generate document header section
 */
function generateDocumentHeader(spec: FormSpec, config: WordStyleConfig): (Paragraph | Table)[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: `${spec.formName} 功能規格說明`,
          bold: true,
          size: config.headingSizes.h1 * 2, // docx uses half-points
        }),
      ],
    }),
    new Paragraph({
      children: [new TextRun(`程式名稱: ${spec.formTitle}`)],
      spacing: { after: 200 },
    }),
  ];
}

/**
 * Generate blocks sections (畫面規格)
 */
function generateBlocksSections(blocks: BlockSpec[], config: WordStyleConfig): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];

  blocks.forEach((block, idx) => {
    // Block heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `(${idx + 1}) 畫面(${idx + 1})`,
            bold: true,
            size: config.headingSizes.h2 * 2,
          }),
        ],
        spacing: { before: 400 },
      })
    );

    // Block info table
    children.push(generateBlockInfoTable(block, config));

    // Fields table
    if (block.fields.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: '欄位清單',
              bold: true,
              size: config.headingSizes.h3 * 2,
            }),
          ],
          spacing: { before: 200 },
        })
      );
      children.push(generateFieldsTable(block.fields, config));
    }
  });

  return children;
}

/**
 * Generate block info table
 */
function generateBlockInfoTable(block: BlockSpec, config: WordStyleConfig): Table {
  const rows: TableRow[] = [
    createInfoRow('Block Name', block.name, config),
    createInfoRow('Base Table(表格名稱)', block.baseTable || '-', config),
  ];

  if (block.whereCondition) {
    rows.push(createInfoRow('Where Condition(條件)', block.whereCondition, config, true));
  }

  if (block.orderByClause) {
    rows.push(createInfoRow('Order By Clause(排序)', block.orderByClause, config));
  }

  rows.push(
    createInfoRow('Insert Allowed(新增資料否)', block.insertAllowed ? 'true' : 'false', config),
    createInfoRow('Update Allowed(更新資料否)', block.updateAllowed ? 'true' : 'false', config),
    createInfoRow('Delete Allowed(刪除資料否)', block.deleteAllowed ? 'true' : 'false', config)
  );

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });
}

/**
 * Create info table row with label and value
 */
function createInfoRow(label: string, value: string, config: WordStyleConfig, isCode: boolean = false): TableRow {
  const valueChildren = isCode
    ? [new TextRun({ text: value, font: config.codeFont, size: 20 })]
    : [new TextRun({ text: value })];

  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: config.tableHeaderBgColor, type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [new Paragraph({ children: valueChildren })],
        width: { size: 70, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

/**
 * Generate fields table (12 columns)
 */
function generateFieldsTable(fields: FieldSpec[], config: WordStyleConfig): Table {
  const headers = ['No', 'Prompt', 'DB Column', 'Displayed', 'Data Type', 'Required', 'Case', 'LOV', 'FormatMask', 'Update', 'Initial', 'Remark'];

  const headerRow = new TableRow({
    children: headers.map((header) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 18 })] })],
        shading: { fill: config.tableHeaderBgColor, type: ShadingType.SOLID },
      })
    ),
    tableHeader: true,
  });

  const dataRows = fields.map((field) =>
    new TableRow({
      children: [
        createTextCell(String(field.no)),
        createTextCell(field.prompt || '-'),
        createTextCell(field.dbColumn, true),
        createTextCell(field.displayed ? 'Y' : 'N'),
        createTextCell(field.dataType),
        createTextCell(field.required ? 'TRUE' : '-'),
        createTextCell(field.caseRestriction),
        createTextCell(field.lovName || '-', true),
        createTextCell(field.formatMask || '-'),
        createTextCell(field.updateAllowed ? 'TRUE' : 'FALSE'),
        createTextCell(field.initialValue || '-'),
        createTextCell(field.remark || '-'),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });
}

/**
 * Create a simple text cell
 */
function createTextCell(text: string, isCode: boolean = false): TableCell {
  const run = isCode
    ? new TextRun({ text, font: 'Consolas', size: 18 })
    : new TextRun({ text, size: 18 });

  return new TableCell({
    children: [new Paragraph({ children: [run] })],
  });
}

/**
 * Generate buttons section
 */
function generateButtonsSection(buttons: ButtonSpec[], config: WordStyleConfig): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: '按鈕',
          bold: true,
          size: config.headingSizes.h2 * 2,
        }),
      ],
      spacing: { before: 400 },
    })
  );

  const headerRow = new TableRow({
    children: ['按鈕名稱', '標籤', '說明'].map((header) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
        shading: { fill: config.tableHeaderBgColor, type: ShadingType.SOLID },
      })
    ),
    tableHeader: true,
  });

  const dataRows = buttons.map((btn) =>
    new TableRow({
      children: [
        createTextCell(btn.name, true),
        createTextCell(btn.label),
        createTextCell(btn.description || '-'),
      ],
    })
  );

  children.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
    })
  );

  return children;
}

/**
 * Generate LOV section with column mappings
 */
function generateLovsSection(lovs: LovSpec[], config: WordStyleConfig, includeSql: boolean): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: '(3) LOV 與資料來源',
          bold: true,
          size: config.headingSizes.h2 * 2,
        }),
      ],
      spacing: { before: 400 },
    })
  );

  // Legend
  const legendItems = [
    'A. Name：List of Value 名稱',
    'B. Record Group Name：LOV 的資料來源',
    'C. LOV Column Name：LOV 顯示的欄位',
    'D. Return Item：點選 LOV 後回傳至畫面對應的欄位',
    'E. SQL Query：資料查詢語句',
  ];

  legendItems.forEach((item) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: item, size: 20 })],
      })
    );
  });

  children.push(new Paragraph({ children: [] })); // Spacer

  for (const lov of lovs) {
    // LOV heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun({
            text: `${lov.no}. ${lov.name}`,
            bold: true,
            size: config.headingSizes.h3 * 2,
          }),
        ],
        spacing: { before: 200 },
      })
    );

    // Record Group Name
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Record Group: ', bold: true }),
          new TextRun({ text: lov.recordGroupName || '-', font: 'Consolas' }),
        ],
      })
    );

    // Column mappings table
    if (lov.columns.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '欄位對應:', bold: true })],
          spacing: { before: 100 },
        })
      );

      const headerRow = new TableRow({
        children: ['LOV Column Name', 'Return Item'].map((header) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
            shading: { fill: config.tableHeaderBgColor, type: ShadingType.SOLID },
          })
        ),
        tableHeader: true,
      });

      const dataRows = lov.columns.map((col) =>
        new TableRow({
          children: [
            createTextCell(col.columnName, true),
            createTextCell(col.returnItem, true),
          ],
        })
      );

      children.push(
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS,
        })
      );
    }

    // SQL Query
    if (includeSql && lov.recordGroupQuery) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'SQL Query:', bold: true })],
          spacing: { before: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: lov.recordGroupQuery,
              font: config.codeFont,
              size: 18,
            }),
          ],
          shading: { fill: config.codeBgColor, type: ShadingType.SOLID },
          spacing: { before: 50, after: 100 },
        })
      );
    }
  }

  return children;
}

/**
 * Generate triggers section with statistics and tables
 */
function generateTriggersSection(
  triggers: TriggerSectionSpec,
  config: WordStyleConfig,
  includeDetails: boolean
): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: '(4) 觸發器規則',
          bold: true,
          size: config.headingSizes.h2 * 2,
        }),
      ],
      spacing: { before: 400 },
    })
  );

  // Statistics table
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [
        new TextRun({
          text: '統計摘要',
          bold: true,
          size: config.headingSizes.h3 * 2,
        }),
      ],
      spacing: { before: 200 },
    })
  );

  const statsHeaderRow = new TableRow({
    children: ['項目', '數量'].map((header) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
        shading: { fill: config.tableHeaderBgColor, type: ShadingType.SOLID },
      })
    ),
    tableHeader: true,
  });

  const statsRows = [
    ['總數', String(triggers.statistics.totalCount)],
    ['Form 層級', String(triggers.statistics.formLevelCount)],
    ['Block 層級', String(triggers.statistics.blockLevelCount)],
  ].map(
    ([label, value]) =>
      new TableRow({
        children: [createTextCell(label), createTextCell(value)],
      })
  );

  children.push(
    new Table({
      rows: [statsHeaderRow, ...statsRows],
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
    })
  );

  // Form-level triggers
  if (triggers.formTriggers.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun({
            text: 'Form 層級觸發器',
            bold: true,
            size: config.headingSizes.h3 * 2,
          }),
        ],
        spacing: { before: 200 },
      })
    );

    children.push(generateTriggerTable(triggers.formTriggers, config, false));
  }

  // Block-level triggers
  for (const block of triggers.blockTriggers) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun({
            text: `Block: ${block.blockName}`,
            bold: true,
            size: config.headingSizes.h3 * 2,
          }),
        ],
        spacing: { before: 200 },
      })
    );

    children.push(generateTriggerTable(block.triggers, config, true));
  }

  // Detailed business rules
  if (includeDetails) {
    const allTriggers = [
      ...triggers.formTriggers,
      ...triggers.blockTriggers.flatMap((b) => b.triggers),
    ];
    const triggersWithDetails = allTriggers.filter(
      (t) => t.businessRules.length > 0 || t.sqlStatements.length > 0
    );

    if (triggersWithDetails.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: '詳細業務規則',
              bold: true,
              size: config.headingSizes.h3 * 2,
            }),
          ],
          spacing: { before: 300 },
        })
      );

      for (const t of triggersWithDetails) {
        children.push(...generateTriggerDetail(t, config));
      }
    }
  }

  return children;
}

/**
 * Generate trigger table
 */
function generateTriggerTable(triggers: TriggerSpec[], config: WordStyleConfig, includeBlockColumn: boolean): Table {
  const headers = includeBlockColumn
    ? ['No', '名稱', '事件描述', '業務規則', 'SQL']
    : ['No', '名稱', '事件描述', '業務規則摘要'];

  const headerRow = new TableRow({
    children: headers.map((header) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
        shading: { fill: config.tableHeaderBgColor, type: ShadingType.SOLID },
      })
    ),
    tableHeader: true,
  });

  const dataRows = triggers.map((t) => {
    const cells = includeBlockColumn
      ? [
          createTextCell(String(t.no)),
          createTextCell(t.name, true),
          createTextCell(t.eventDescription),
          createTextCell(t.summary),
          createTextCell(t.sqlStatements.length > 0 ? '✓' : '-'),
        ]
      : [
          createTextCell(String(t.no)),
          createTextCell(t.name, true),
          createTextCell(t.eventDescription),
          createTextCell(t.summary),
        ];

    return new TableRow({ children: cells });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });
}

/**
 * Generate detailed trigger information
 */
function generateTriggerDetail(trigger: TriggerSpec, config: WordStyleConfig): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];
  const blockInfo = trigger.level === 'Block' ? ` (Block: ${trigger.blockName})` : '';

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${trigger.no}. ${trigger.name}${blockInfo}`,
          bold: true,
          size: 24,
        }),
      ],
      spacing: { before: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '事件描述: ', bold: true }),
        new TextRun({ text: trigger.eventDescription }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Java 用途: ', bold: true }),
        new TextRun({ text: trigger.javaUse }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Maximo Java 位置: ', bold: true }),
        new TextRun({ text: trigger.maximoLocation, font: config.codeFont }),
      ],
    })
  );

  // Business rules
  if (trigger.businessRules.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '業務規則:', bold: true })],
        spacing: { before: 100 },
      })
    );

    for (const rule of trigger.businessRules) {
      const affectedFieldsText =
        rule.affectedFields.length > 0 ? ` (影響欄位: ${rule.affectedFields.join(', ')})` : '';

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• [${rule.type}] ` }),
            new TextRun({ text: rule.description }),
            new TextRun({ text: affectedFieldsText, italics: true }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
        })
      );
    }
  }

  // SQL statements
  if (trigger.sqlStatements.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'SQL 語句:', bold: true })],
        spacing: { before: 100 },
      })
    );

    for (const sql of trigger.sqlStatements) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `-- ${sql.type}`, font: config.codeFont, size: 18 })],
        })
      );

      children.push(
        new Paragraph({
          children: [new TextRun({ text: sql.statement, font: config.codeFont, size: 18 })],
          shading: { fill: config.codeBgColor, type: ShadingType.SOLID },
        })
      );
    }
  }

  return children;
}
