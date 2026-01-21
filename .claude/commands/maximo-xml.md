# /maximo-xml - Generate Maximo Presentation XML

Generate complete Maximo presentation XML and database configuration SQL from SA document (Excel) field definitions.

## Usage

```
/maximo-xml <path-to-excel-file> [options]
```

## Arguments

- `<path-to-excel-file>`: Path to the SA document Excel file (.xlsx) containing field definitions

## Options

- `--app-id <id>`: Application ID (e.g., `zz_acceptfactory`)
- `--mbo <name>`: MBO name (default: `SR`)
- `--key <attribute>`: Key attribute (e.g., `zz_imnum`)
- `--output <path>`: Output file path (default: `<app-id>.xml`)
- `--sql`: Generate SQL file for database configuration

## Excel File Format

The SA document should be an Excel file with a sheet named `欄位定義` or `Fields` containing these columns:

### UI Configuration Columns (A-M, Green Header)

| Column | Description | Example | Dropdown |
|--------|-------------|---------|----------|
| 欄位名稱 | Field name (dataattribute) | `ZZ_EQ24`, `status` | No |
| 標籤 | Label | `車號`, `狀態` | No |
| 型別 | Type | `textbox`, `checkbox`, `tablecol` | Yes |
| 輸入模式 | Input mode | `required`, `readonly`, `query` | Yes |
| Lookup | Lookup name | `ASSET`, `DATELOOKUP` | No |
| 關聯 | Relationship (see below) | `ZZ_VEHICLE_DYNAMIC`, `ZZ_JOB_NUMBER` | No |
| 連結應用 | App link | `ZZ_ASSET` | No |
| 寬度 | Width | `12`, `200` | No |
| 可篩選 | Filterable | `TRUE`, `FALSE` | Yes |
| 可排序 | Sortable | `TRUE`, `FALSE` | Yes |
| 區域 | Area | `header`, `detail`, `list` | Yes |
| Tab名稱 | Tab name | `main`, `開工車登錄` | No |
| 欄 | Column number for multi-column layout | `1`, `2`, `3` | No |

### 關聯 (Relationship) Column Usage

The `關聯` column serves different purposes based on the `區域`:

| 區域 | 關聯 用途 | 產出 |
|------|----------|------|
| `header` | 欄位資料來源關聯 | `<textbox dataattribute="關聯.欄位名稱" />` |
| `detail` | 明細表格的 relationship | `<table relationship="關聯">...</table>` |
| `list` | 通常不使用 | - |

**Example:**
- Header field from related object: `關聯=ZZ_VEHICLE_DYNAMIC` → `dataattribute="ZZ_VEHICLE_DYNAMIC.STARTDATE"`
- Detail table column: `關聯=ZZ_JOB_NUMBER` → columns grouped into `<table relationship="ZZ_JOB_NUMBER">`

### 欄 (Column) - Multi-Column Layout

The `欄` column controls how header fields are arranged in the form layout:

| 值 | 說明 |
|----|------|
| 空白或 0 | 自動分欄 (每 4 個欄位一欄) |
| 1, 2, 3... | 手動指定欄位位置 |

**混合模式說明:**
- 如果任何欄位有指定 `欄` 值 (>0)，則所有欄位都會依照 `欄` 值分組
- 未指定 `欄` 值的欄位會被歸類到第 1 欄
- 如果所有欄位都沒有指定 `欄` 值，則自動每 4 個欄位分成一欄

**範例:**
```
欄位 A: 欄=1  ─┐
欄位 B: 欄=1  ─┼─> sectioncol 1
欄位 C: 欄=2  ─┐
欄位 D: 欄=2  ─┼─> sectioncol 2
```

產出 XML:
```xml
<sectionrow>
  <sectioncol>
    <section>
      <textbox dataattribute="A"/>
      <textbox dataattribute="B"/>
    </section>
  </sectioncol>
  <sectioncol>
    <section>
      <textbox dataattribute="C"/>
      <textbox dataattribute="D"/>
    </section>
  </sectioncol>
</sectionrow>
```

### DB Configuration Columns (N-U, Blue Header)

| Column (Excel) | Description | Example | Dropdown |
|----------------|-------------|---------|----------|
| N - 資料類型 | Maximo data type | `ALN`, `INTEGER`, `DATE` | Yes |
| O - 長度 | Field length | `30`, `100` | No |
| P - 小數位數 | Decimal scale | `0`, `2` | No |
| Q - DB必填 | Database required | `TRUE`, `FALSE` | Yes |
| R - 預設值 | Default value | `ACTIVE`, `0` | No |
| S - 持久化 | Persistent field | `TRUE`, `FALSE` | Yes |
| T - 欄位標題 | Field title | `車號`, `狀態` | No |
| U - 所屬物件 | Object name | `SR`, `CHILDOBJ` | No |

### Area Types

- **header**: Form fields in the header section of a tab
- **detail**: Table columns in a detail table within a tab
- **list**: Table columns in the list view (results tab)

### Maximo Data Types

| Type | Description | Oracle Mapping |
|------|-------------|----------------|
| ALN | Alphanumeric | VARCHAR2 |
| UPPER | Uppercase text | VARCHAR2 |
| LOWER | Lowercase text | VARCHAR2 |
| INTEGER | Integer | NUMBER(10) |
| SMALLINT | Small integer | NUMBER(5) |
| DECIMAL | Decimal | NUMBER(p,s) |
| FLOAT | Float | NUMBER |
| DATE | Date only | DATE |
| DATETIME | Date and time | TIMESTAMP |
| TIME | Time only | DATE |
| YORN | Yes/No (boolean) | NUMBER(1) |
| CLOB | Large text | CLOB |
| LONGALN | Long alphanumeric | VARCHAR2(4000) |
| GL | General ledger | VARCHAR2 |

## Example

```bash
# Generate XML from SA document
/maximo-xml ./spec/sa/zz_acceptfactory.xlsx --app-id zz_acceptfactory --mbo SR --key zz_imnum

# Generate both XML and SQL
/maximo-xml ./spec/sa/zz_acceptfactory.xlsx --app-id zz_acceptfactory --mbo SR --key zz_imnum --sql
```

## Output

### Presentation XML

The tool generates a complete Maximo presentation XML file including:

- List tab with results table
- Form tabs with header sections
- Detail tables within tabs
- Search more dialog
- Standard page headers and footers

### Database Configuration SQL (with `--sql` option)

When `--sql` is specified, generates SQL file containing **MAXATTRIBUTECFG INSERT statements** for proper Maximo configuration workflow.

**使用方式:**
1. 執行 SQL 將欄位定義插入 MAXATTRIBUTECFG
2. 登入 Maximo 執行「資料庫配置」應用程式
3. 點選「套用配置變更」讓 Maximo 建立實際的資料庫欄位

Example SQL output:
```sql
-- =============================================
-- Maximo Database Configuration SQL
-- Generated for MBO: SR
-- =============================================

-- MAXATTRIBUTECFG INSERT statements
INSERT INTO MAXATTRIBUTECFG (OBJECTNAME, ATTRIBUTENAME, ATTRIBUTENO, ALIAS, MAXTYPE, LENGTH, SCALE, TITLE, REMARKS, REQUIRED, PERSISTENT, USERDEFINED, DEFAULTVALUE, CHANGED)
VALUES ('SR', 'ZZ_CUSTOMFIELD', 1000, 'ZZ_CUSTOMFIELD', 'ALN', 30, 0, '自訂欄位', '自訂欄位', 0, 1, 1, NULL, 'I');

COMMIT;

-- 下一步: 執行 Maximo 資料庫配置
-- 系統管理 > 配置 > 資料庫配置
-- 選擇物件後點選「套用配置變更」
```

**Note:** The `CHANGED='I'` flag indicates this is a new attribute to be inserted. Maximo's ConfigDB process will handle the actual ALTER TABLE operations.

## Implementation

When this skill is invoked, follow these steps:

1. Read the SA document Excel file
2. Ask for application metadata if not provided:
   - Application ID
   - MBO name
   - Key attribute
3. Generate the XML using the `generateMaximoXml` function
4. If `--sql` is specified, generate SQL using `generateAllSQL`
5. Write the output files to the specified paths

```typescript
import { generateMaximoXml } from './src/index';
import { generateAllSQL } from './src/generators/sql';
import { SAParser, processFields } from './src/parsers/sa-parser';

// Generate XML
const xml = await generateMaximoXml(inputPath, {
  id: appId,
  keyAttribute: keyAttribute,
  mboName: mboName,
  version: '7.1.0.0',
  orderBy: `${keyAttribute} desc`,
  whereClause: '',
});

// Generate SQL (optional)
if (generateSql) {
  const parser = new SAParser();
  const appDef = await parser.parseFile(inputPath);

  // Collect all fields
  const allFields: ProcessedField[] = [
    ...appDef.listFields,
    ...Array.from(appDef.tabs.values()).flatMap(tab => [
      ...tab.headerFields,
      ...Array.from(tab.detailTables.values()).flat()
    ])
  ];

  const sql = generateAllSQL(allFields, mboName);
}
```

## Excel Template

Use the provided template at `src/templates/sa-template.xlsx` which includes:
- 21 columns total: 13 UI columns (A-M) + 8 DB columns (N-U)
- Dropdown menus for: 型別, 輸入模式, 可篩選, 可排序, 區域, 資料類型, DB必填, 持久化
- Color-coded sections (green for UI, blue for DB)
- Sample data demonstrating header, detail, and list field definitions
- Multi-column layout examples using the 欄 column

To create a fresh template programmatically:
```typescript
import { createSATemplate } from './src/utils/create-template';
await createSATemplate('./output/sa-template.xlsx');
```
