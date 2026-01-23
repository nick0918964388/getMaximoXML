/**
 * Chinese to English translation dictionary for common Maximo field labels
 * This dictionary is checked first before calling external translation API
 */

export const TRANSLATION_DICTIONARY: Record<string, string> = {
  // Common field labels
  '編號': 'NUMBER',
  '號碼': 'NUMBER',
  '代碼': 'CODE',
  '名稱': 'NAME',
  '說明': 'DESCRIPTION',
  '描述': 'DESCRIPTION',
  '備註': 'REMARKS',
  '註記': 'NOTES',
  '狀態': 'STATUS',
  '類型': 'TYPE',
  '類別': 'CATEGORY',
  '分類': 'CLASSIFICATION',
  '日期': 'DATE',
  '時間': 'TIME',
  '數量': 'QUANTITY',
  '單位': 'UNIT',
  '金額': 'AMOUNT',
  '價格': 'PRICE',
  '成本': 'COST',
  '總計': 'TOTAL',
  '小計': 'SUBTOTAL',

  // Person/Organization related
  '姓名': 'NAME',
  '電話': 'PHONE',
  '手機': 'MOBILE',
  '地址': 'ADDRESS',
  '郵件': 'EMAIL',
  '電子郵件': 'EMAIL',
  '傳真': 'FAX',
  '聯絡人': 'CONTACT',
  '負責人': 'OWNER',
  '建立者': 'CREATEDBY',
  '修改者': 'MODIFIEDBY',
  '核准者': 'APPROVER',
  '申請人': 'REQUESTER',
  '報告人': 'REPORTEDBY',
  '指派人': 'ASSIGNEDTO',
  '客戶': 'CUSTOMER',
  '供應商': 'VENDOR',
  '廠商': 'VENDOR',
  '部門': 'DEPARTMENT',
  '組織': 'ORGANIZATION',
  '站點': 'SITE',
  '地點': 'LOCATION',
  '位置': 'LOCATION',
  '公司': 'COMPANY',

  // Asset related
  '資產': 'ASSET',
  '資產編號': 'ASSETNUM',
  '設備': 'EQUIPMENT',
  '設備編號': 'EQUIPNUM',
  '機器': 'MACHINE',
  '序號': 'SERIALNUM',
  '序列號': 'SERIALNUM',
  '型號': 'MODEL',
  '製造商': 'MANUFACTURER',
  '品牌': 'BRAND',
  '規格': 'SPECIFICATION',
  '容量': 'CAPACITY',
  '功率': 'POWER',
  '電壓': 'VOLTAGE',
  '電流': 'CURRENT',
  '頻率': 'FREQUENCY',
  '重量': 'WEIGHT',
  '尺寸': 'DIMENSION',
  '長度': 'LENGTH',
  '寬度': 'WIDTH',
  '高度': 'HEIGHT',
  '顏色': 'COLOR',
  '材質': 'MATERIAL',

  // Work order related
  '工單': 'WORKORDER',
  '工單編號': 'WONUM',
  '工作單': 'WORKORDER',
  '任務': 'TASK',
  '作業': 'JOB',
  '優先級': 'PRIORITY',
  '優先順序': 'PRIORITY',
  '緊急程度': 'URGENCY',
  '開始日期': 'STARTDATE',
  '結束日期': 'ENDDATE',
  '完成日期': 'FINISHDATE',
  '到期日': 'DUEDATE',
  '預計開始': 'SCHEDSTART',
  '預計結束': 'SCHEDFINISH',
  '實際開始': 'ACTSTART',
  '實際結束': 'ACTFINISH',
  '工時': 'LABORHRS',
  '預估工時': 'ESTLABHRS',
  '實際工時': 'ACTLABHRS',

  // Inventory related
  '庫存': 'INVENTORY',
  '物料': 'ITEM',
  '品項': 'ITEM',
  '物料編號': 'ITEMNUM',
  '品項編號': 'ITEMNUM',
  '倉庫': 'STOREROOM',
  '儲位': 'BINNUM',
  '批號': 'LOTNUM',
  '現有量': 'CURBAL',
  '安全庫存': 'SAFETYSTOCK',
  '再訂購點': 'REORDER',
  '訂購量': 'ORDERQTY',
  '收貨量': 'RECEIPTQTY',
  '發料量': 'ISSUEQTY',

  // Purchase related
  '採購': 'PURCHASE',
  '採購單': 'PO',
  '採購單編號': 'PONUM',
  '請購單': 'PR',
  '請購單編號': 'PRNUM',
  '報價': 'QUOTE',
  '報價單': 'QUOTATION',
  '合約': 'CONTRACT',
  '合約編號': 'CONTRACTNUM',
  '發票': 'INVOICE',
  '發票編號': 'INVOICENUM',
  '付款': 'PAYMENT',
  '稅額': 'TAX',
  '折扣': 'DISCOUNT',
  '運費': 'FREIGHT',
  '幣別': 'CURRENCY',
  '匯率': 'EXCHANGERATE',

  // Date/Time related
  '建立日期': 'CREATEDATE',
  '修改日期': 'MODIFYDATE',
  '變更日期': 'CHANGEDATE',
  '有效日期': 'EFFECTIVEDATE',
  '到期日期': 'EXPIRYDATE',
  '生效日': 'EFFECTIVEDATE',
  '失效日': 'ENDDATE',
  '年': 'YEAR',
  '月': 'MONTH',
  '日': 'DAY',
  '週': 'WEEK',
  '時': 'HOUR',
  '分': 'MINUTE',
  '秒': 'SECOND',

  // Status values
  '啟用': 'ACTIVE',
  '停用': 'INACTIVE',
  '作用中': 'ACTIVE',
  '已完成': 'COMPLETED',
  '進行中': 'INPROGRESS',
  '待處理': 'PENDING',
  '已取消': 'CANCELED',
  '已核准': 'APPROVED',
  '已拒絕': 'REJECTED',
  '草稿': 'DRAFT',
  '已關閉': 'CLOSED',
  '已開啟': 'OPEN',

  // Boolean/Flag
  '是否': 'IS',
  '啟用中': 'ISENABLED',
  '有效': 'ISVALID',
  '必填': 'REQUIRED',
  '唯讀': 'READONLY',
  '隱藏': 'HIDDEN',
  '顯示': 'VISIBLE',
  '鎖定': 'LOCKED',
  '預設': 'DEFAULT',

  // Actions
  '建立': 'CREATE',
  '新增': 'ADD',
  '修改': 'MODIFY',
  '更新': 'UPDATE',
  '刪除': 'DELETE',
  '查詢': 'QUERY',
  '搜尋': 'SEARCH',
  '儲存': 'SAVE',
  '取消': 'CANCEL',
  '確認': 'CONFIRM',
  '核准': 'APPROVE',
  '拒絕': 'REJECT',
  '提交': 'SUBMIT',
  '發送': 'SEND',
  '接收': 'RECEIVE',
  '列印': 'PRINT',
  '匯出': 'EXPORT',
  '匯入': 'IMPORT',

  // Miscellaneous
  '附件': 'ATTACHMENT',
  '檔案': 'FILE',
  '文件': 'DOCUMENT',
  '圖片': 'IMAGE',
  '照片': 'PHOTO',
  '簽名': 'SIGNATURE',
  '版本': 'VERSION',
  '順序': 'SEQUENCE',
  '排序': 'SORTORDER',
  '層級': 'LEVEL',
  '父項': 'PARENT',
  '子項': 'CHILD',
  '標籤': 'TAG',
  '關鍵字': 'KEYWORD',
  '來源': 'SOURCE',
  '目標': 'TARGET',
  '原因': 'REASON',
  '結果': 'RESULT',
  '摘要': 'SUMMARY',
  '詳細': 'DETAIL',
  '內容': 'CONTENT',
  '訊息': 'MESSAGE',
  '通知': 'NOTIFICATION',
  '警告': 'WARNING',
  '錯誤': 'ERROR',
  '成功': 'SUCCESS',
  '失敗': 'FAILURE',

  // Measurements
  '公斤': 'KG',
  '公克': 'G',
  '公尺': 'M',
  '公分': 'CM',
  '毫米': 'MM',
  '公升': 'L',
  '毫升': 'ML',
  '度': 'DEGREE',
  '百分比': 'PERCENT',
  '比率': 'RATIO',
  '指數': 'INDEX',
  '係數': 'COEFFICIENT',
};

/**
 * Lookup translation from dictionary
 * Returns null if not found
 */
export function lookupDictionary(chinese: string): string | null {
  // Direct lookup
  if (TRANSLATION_DICTIONARY[chinese]) {
    return TRANSLATION_DICTIONARY[chinese];
  }

  // Try to find partial matches for compound words
  // Split by common delimiters and translate each part
  const parts: string[] = [];
  let remaining = chinese;

  // Sort dictionary keys by length (longest first) for greedy matching
  const sortedKeys = Object.keys(TRANSLATION_DICTIONARY).sort((a, b) => b.length - a.length);

  while (remaining.length > 0) {
    let found = false;

    for (const key of sortedKeys) {
      if (remaining.startsWith(key)) {
        parts.push(TRANSLATION_DICTIONARY[key]);
        remaining = remaining.slice(key.length);
        found = true;
        break;
      }
    }

    if (!found) {
      // No match found for this character, skip it
      // If there are non-Chinese characters, keep them
      const char = remaining[0];
      if (/[A-Za-z0-9]/.test(char)) {
        parts.push(char.toUpperCase());
      }
      remaining = remaining.slice(1);
    }
  }

  if (parts.length > 0) {
    return parts.join('_');
  }

  return null;
}

/**
 * Add custom translation to dictionary (runtime only)
 */
const customTranslations: Record<string, string> = {};

export function addCustomTranslation(chinese: string, english: string): void {
  customTranslations[chinese] = english.toUpperCase();
}

export function lookupCustomDictionary(chinese: string): string | null {
  return customTranslations[chinese] || null;
}
