import ExcelJS from 'exceljs';

/**
 * 下拉選單選項定義
 */
const DROPDOWN_OPTIONS = {
  // UI 欄位
  type: ['textbox', 'checkbox', 'tablecol', 'multiparttextbox', 'multilinetextbox', 'statictext', 'pushbutton'],
  inputMode: ['', 'required', 'readonly', 'query'],
  filterable: ['', 'TRUE', 'FALSE'],
  sortable: ['', 'TRUE', 'FALSE'],
  area: ['header', 'detail', 'list'],
  // DB 欄位
  maxType: ['ALN', 'UPPER', 'LOWER', 'INTEGER', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DATE', 'DATETIME', 'TIME', 'YORN', 'CLOB', 'LONGALN', 'GL'],
  dbRequired: ['', 'TRUE', 'FALSE'],
  persistent: ['TRUE', 'FALSE'],
};

/**
 * Create the SA Excel template file with dropdown menus
 */
export async function createSATemplate(outputPath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Maximo XML Generator';
  workbook.created = new Date();

  // ===== 欄位定義 Sheet =====
  const fieldSheet = workbook.addWorksheet('欄位定義');

  // Define headers - UI fields (green) + DB fields (blue)
  // 「明細表格」欄位已移除，改用「關聯」欄位來指定 detail 區域的 table relationship
  const headers = [
    // UI Configuration (A-L)
    '欄位名稱',    // A
    '標籤',        // B
    '型別',        // C - dropdown
    '輸入模式',    // D - dropdown
    'Lookup',      // E
    '關聯',        // F - 用於 header 的資料來源關聯，或 detail 的 table relationship
    '連結應用',    // G
    '寬度',        // H
    '可篩選',      // I - dropdown
    '可排序',      // J - dropdown
    '區域',        // K - dropdown
    'Tab名稱',     // L
    // DB Configuration (M-T)
    '資料類型',    // M - dropdown (maxType)
    '長度',        // N (length)
    '小數位數',    // O (scale)
    'DB必填',      // P - dropdown (dbRequired)
    '預設值',      // Q (defaultValue)
    '持久化',      // R - dropdown (persistent)
    '欄位標題',    // S (title)
    '所屬物件',    // T (objectName)
  ];

  // Add header row with styling
  const headerRow = fieldSheet.addRow(headers);
  headerRow.font = { bold: true };

  // Style UI columns (A-L) with green background
  for (let col = 1; col <= 12; col++) {
    headerRow.getCell(col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAD3' }, // Light green
    };
  }

  // Style DB columns (M-T) with blue background
  for (let col = 13; col <= 20; col++) {
    headerRow.getCell(col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCFE2F3' }, // Light blue
    };
  }

  // Set column widths
  fieldSheet.columns = [
    // UI columns (A-L)
    { width: 25 }, // A - 欄位名稱
    { width: 15 }, // B - 標籤
    { width: 18 }, // C - 型別
    { width: 12 }, // D - 輸入模式
    { width: 15 }, // E - Lookup
    { width: 22 }, // F - 關聯 (header 用於資料來源關聯，detail 用於 table relationship)
    { width: 20 }, // G - 連結應用
    { width: 8 },  // H - 寬度
    { width: 10 }, // I - 可篩選
    { width: 10 }, // J - 可排序
    { width: 10 }, // K - 區域
    { width: 15 }, // L - Tab名稱
    // DB columns (M-T)
    { width: 12 }, // M - 資料類型
    { width: 8 },  // N - 長度
    { width: 10 }, // O - 小數位數
    { width: 10 }, // P - DB必填
    { width: 15 }, // Q - 預設值
    { width: 10 }, // R - 持久化
    { width: 15 }, // S - 欄位標題
    { width: 15 }, // T - 所屬物件
  ];

  // Sample data with DB configuration
  // [UI fields: 欄位名稱, 標籤, 型別, 輸入模式, Lookup, 關聯, 連結應用, 寬度, 可篩選, 可排序, 區域, Tab名稱]
  // [DB fields: 資料類型, 長度, 小數位數, DB必填, 預設值, 持久化, 欄位標題, 所屬物件]
  // 注意: detail 區域的欄位使用「關聯」欄位來指定 table relationship
  const sampleData = [
    // List fields (通常不需要 DB 設定，因為是顯示已有欄位)
    ['zz_eq24', '車號', 'tablecol', '', 'asset', '', 'zz_asset', '', 'TRUE', 'TRUE', 'list', '', '', '', '', '', '', '', '', ''],
    ['status', '狀態', 'tablecol', '', '', '', '', '45', 'TRUE', 'TRUE', 'list', '', '', '', '', '', '', '', '', ''],
    ['zz_imnum', '進廠申請編號', 'tablecol', '', '', '', '', '', 'TRUE', 'TRUE', 'list', '', '', '', '', '', '', '', '', ''],

    // Header fields - main tab (包含 DB 設定範例)
    ['ZZ_EQ24', '車號', 'textbox', 'required', 'ASSET', '', 'ZZ_ASSET', '12', '', '', 'header', 'main', 'ALN', '30', '', 'TRUE', '', 'TRUE', '車號', ''],
    ['ZZ_TYPE', '檢修級別', 'textbox', 'required', 'worktype', '', '', '12', '', '', 'header', 'main', 'ALN', '20', '', 'TRUE', '', 'TRUE', '檢修級別', ''],
    ['asset.description', '車輛說明', 'textbox', 'readonly', '', '', '', '30', '', '', 'header', 'main', '', '', '', '', '', 'FALSE', '', ''],
    ['ZZ_IMNUM', '進廠申請編號', 'textbox', 'readonly', '', '', '', '12', '', '', 'header', 'main', 'ALN', '20', '', '', '', 'TRUE', '進廠申請編號', ''],

    // Header fields - 收容車登錄 tab (使用「關聯」指定資料來源，這些欄位屬於其他物件)
    ['CONTAINMENTDATE', '收容日期', 'textbox', '', 'DATELOOKUP', 'ZZ_VEHICLE_DYNAMIC', '', '14', '', '', 'header', '收容車登錄', 'DATE', '', '', '', '', 'TRUE', '收容日期', 'ZZ_VEHICLE_DYNAMIC'],
    ['CONTAINMENTUNIT', '收容單位', 'textbox', '', 'zz_dept', 'ZZ_VEHICLE_DYNAMIC', '', '14', '', '', 'header', '收容車登錄', 'ALN', '30', '', '', '', 'TRUE', '收容單位', 'ZZ_VEHICLE_DYNAMIC'],
    ['REPAIRSITE', '送修廠段', 'textbox', '', 'ZZ_DEPT', 'ZZ_VEHICLE_DYNAMIC', '', '14', '', '', 'header', '收容車登錄', 'ALN', '30', '', '', '', 'TRUE', '送修廠段', 'ZZ_VEHICLE_DYNAMIC'],

    // Header fields - 開工車登錄 tab
    ['STARTDATE', '開工日期', 'textbox', '', 'DATELOOKUP', 'ZZ_VEHICLE_DYNAMIC', '', '12', '', '', 'header', '開工車登錄', 'DATE', '', '', '', '', 'TRUE', '開工日期', 'ZZ_VEHICLE_DYNAMIC'],
    ['FINISHDATE', '預完日期', 'textbox', '', 'DATELOOKUP', 'ZZ_VEHICLE_DYNAMIC', '', '12', '', '', 'header', '開工車登錄', 'DATE', '', '', '', '', 'TRUE', '預完日期', 'ZZ_VEHICLE_DYNAMIC'],
    ['ZZ_PAINT', '油漆', 'checkbox', '', '', 'workorder', '', '', '', '', 'header', '開工車登錄', 'YORN', '', '', '', '0', 'TRUE', '油漆', ''],

    // Detail fields - 開工車登錄 tab (使用「關聯」指定 table relationship = ZZ_JOB_NUMBER)
    ['eq24', '車號', 'tablecol', 'readonly', '', 'ZZ_JOB_NUMBER', '', '120', '', '', 'detail', '開工車登錄', '', '', '', '', '', '', '', ''],
    ['jobnum', '工作號', 'tablecol', 'readonly', '', 'ZZ_JOB_NUMBER', 'ZZ_JOBNUM', '200', '', '', 'detail', '開工車登錄', '', '', '', '', '', '', '', ''],
    ['ACTWORK', '實際工時', 'tablecol', 'readonly', '', 'ZZ_JOB_NUMBER', '', '', '', '', 'detail', '開工車登錄', '', '', '', '', '', '', '', ''],

    // Detail fields - 檢修進度 tab (使用「關聯」指定 table relationship = ZZ_WOLISTS)
    ['assetnum', '資產編號', 'tablecol', 'readonly', '', 'ZZ_WOLISTS', '', '120', '', '', 'detail', '檢修進度', '', '', '', '', '', '', '', ''],
    ['WOJP3', '工單編號', 'tablecol', '', '', 'ZZ_WOLISTS', 'ZZ_PMWO,ZZ_PMWOTF', '200', '', '', 'detail', '檢修進度', '', '', '', '', '', '', '', ''],
    ['DESCRIPTION', '說明', 'tablecol', 'readonly', '', 'ZZ_WOLISTS', '', '350', '', '', 'detail', '檢修進度', '', '', '', '', '', '', '', ''],
    ['STATUS', '狀態', 'tablecol', 'readonly', '', 'ZZ_WOLISTS', '', '', '', '', 'detail', '檢修進度', '', '', '', '', '', '', '', ''],
  ];

  // Add sample data rows
  sampleData.forEach(row => {
    fieldSheet.addRow(row);
  });

  // Add data validations (dropdown menus) for rows 2-1000
  const maxRow = 1000;

  // UI dropdowns
  // 型別 (C欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`C${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${DROPDOWN_OPTIONS.type.join(',')}"`],
      showDropDown: false,
    };
  }

  // 輸入模式 (D欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`D${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${DROPDOWN_OPTIONS.inputMode.join(',')}"`],
      showDropDown: false,
    };
  }

  // 可篩選 (I欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`I${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${DROPDOWN_OPTIONS.filterable.join(',')}"`],
      showDropDown: false,
    };
  }

  // 可排序 (J欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`J${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${DROPDOWN_OPTIONS.sortable.join(',')}"`],
      showDropDown: false,
    };
  }

  // 區域 (K欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`K${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${DROPDOWN_OPTIONS.area.join(',')}"`],
      showDropDown: false,
    };
  }

  // DB dropdowns
  // 資料類型 (M欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`M${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${DROPDOWN_OPTIONS.maxType.join(',')}"`],
      showDropDown: false,
    };
  }

  // DB必填 (P欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`P${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${DROPDOWN_OPTIONS.dbRequired.join(',')}"`],
      showDropDown: false,
    };
  }

  // 持久化 (R欄)
  for (let row = 2; row <= maxRow; row++) {
    fieldSheet.getCell(`R${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${DROPDOWN_OPTIONS.persistent.join(',')}"`],
      showDropDown: false,
    };
  }

  // Freeze header row
  fieldSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // ===== 填寫說明 Sheet =====
  const instructionSheet = workbook.addWorksheet('填寫說明');

  const instructions = [
    ['Maximo XML Generator - SA 文件填寫說明'],
    [''],
    ['📋 欄位分類'],
    ['綠色標題欄位 (A-L)', 'UI 配置 - 用於產生 Presentation XML'],
    ['藍色標題欄位 (M-T)', 'DB 配置 - 用於產生 Database SQL'],
    [''],
    ['📋 下拉選單欄位 (UI)'],
    ['欄位', '可選值'],
    ['型別', DROPDOWN_OPTIONS.type.join(', ')],
    ['輸入模式', DROPDOWN_OPTIONS.inputMode.filter(x => x).join(', ') + ' (或空白)'],
    ['可篩選', 'TRUE, FALSE (或空白)'],
    ['可排序', 'TRUE, FALSE (或空白)'],
    ['區域', DROPDOWN_OPTIONS.area.join(', ')],
    [''],
    ['📋 下拉選單欄位 (DB)'],
    ['欄位', '可選值'],
    ['資料類型', DROPDOWN_OPTIONS.maxType.join(', ')],
    ['DB必填', 'TRUE, FALSE (或空白)'],
    ['持久化', 'TRUE=存到資料庫, FALSE=非持久化欄位'],
    [''],
    ['📝 UI 欄位說明'],
    ['欄位名稱', 'dataattribute 值，對應 MBO 的欄位名稱'],
    ['標籤', '欄位的顯示標籤'],
    ['型別', '元件類型 (請使用下拉選單選擇)'],
    ['輸入模式', 'required=必填 / readonly=唯讀 / query=查詢 / 空白=一般'],
    ['Lookup', 'Lookup 名稱，例如 ASSET, DATELOOKUP'],
    ['關聯', '依「區域」不同用途：header=資料來源關聯 / detail=明細表格的 relationship'],
    ['連結應用', '應用連結 (applink)，例如 ZZ_ASSET'],
    ['寬度', '欄位寬度 (size/width)'],
    ['可篩選', '僅用於 list 區域的欄位'],
    ['可排序', '僅用於 list 區域的欄位'],
    ['區域', 'header=表單區 / detail=明細資料表 / list=清單頁'],
    ['Tab名稱', '所屬 Tab 名稱，例如 main, 開工車登錄'],
    [''],
    ['📝 DB 欄位說明'],
    ['資料類型', 'Maximo 資料類型：ALN=文字, INTEGER=整數, DECIMAL=小數, DATE=日期, YORN=是否'],
    ['長度', '欄位長度 (ALN 類型必填)'],
    ['小數位數', 'DECIMAL 類型的小數位數'],
    ['DB必填', '資料庫層級的必填設定'],
    ['預設值', '欄位的預設值'],
    ['持久化', 'TRUE=存到資料庫, FALSE=計算欄位不存庫'],
    ['欄位標題', 'MAXATTRIBUTE.TITLE 欄位標題'],
    ['所屬物件', '如果欄位屬於其他物件 (非主 MBO)，填寫物件名稱'],
    [''],
    ['⚠️ 「關聯」欄位說明'],
    ['區域=header 時', '指定欄位資料來源的關聯物件，例如 ZZ_VEHICLE_DYNAMIC'],
    ['', '產出: <textbox dataattribute="ZZ_VEHICLE_DYNAMIC.STARTDATE" .../>'],
    ['區域=detail 時', '指定明細表格的 relationship 名稱，例如 ZZ_JOB_NUMBER'],
    ['', '產出: <table relationship="ZZ_JOB_NUMBER">...</table>'],
    [''],
    ['⚠️ DB 設定注意事項'],
    ['1. 只有「欄位名稱」以 ZZ_ 開頭的自訂欄位會產生 SQL'],
    ['2. 有填「關聯」的 header 欄位不會產生 ALTER TABLE (因為屬於其他物件)'],
    ['3. 如果要為其他物件新增欄位，請填寫「所屬物件」'],
    ['4. 「持久化」設為 FALSE 的欄位只會產生 MAXATTRIBUTE 設定，不會產生 ALTER TABLE'],
  ];

  instructions.forEach(row => {
    instructionSheet.addRow(row);
  });

  // Style instruction sheet
  instructionSheet.getColumn(1).width = 35;
  instructionSheet.getColumn(2).width = 70;

  // Title styling
  const titleCell = instructionSheet.getCell('A1');
  titleCell.font = { bold: true, size: 14 };

  // Section header styling
  ['A3', 'A7', 'A15', 'A20', 'A34', 'A44', 'A51'].forEach(cell => {
    const c = instructionSheet.getCell(cell);
    c.font = { bold: true, size: 12 };
  });

  // Write file
  await workbook.xlsx.writeFile(outputPath);
}

// Run if executed directly
const outputPath = process.argv[2] || './src/templates/sa-template.xlsx';
createSATemplate(outputPath).then(() => {
  console.log(`✅ SA template created at: ${outputPath}`);
  console.log('📋 UI dropdowns: 型別, 輸入模式, 可篩選, 可排序, 區域');
  console.log('📋 DB dropdowns: 資料類型, DB必填, 持久化');
}).catch(err => {
  console.error('❌ Error creating template:', err);
  process.exit(1);
});
