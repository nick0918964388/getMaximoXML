/**
 * Trigger event descriptions mapping
 * Based on Oracle Forms trigger events - spec/xml/trigger_spec.md
 */

export interface TriggerEventInfo {
  description: string;
  javaUse: string;
  maximoLocation: string;  // Maximo Java 代碼位置
}

export const TRIGGER_EVENT_MAP: Record<string, TriggerEventInfo> = {
  'WHEN-NEW-FORM-INSTANCE': {
    description: '當一個新的表單實例被創建時',
    javaUse: '表單初始化時，進行資料預設值設定等',
    maximoLocation: 'AppBean.initialize() 或 DataBean.initialize() - 應用程式/區塊初始化',
  },
  'WHEN-NEW-ITEM-INSTANCE': {
    description: '當項目獲得焦點時觸發',
    javaUse: '設定焦點後的事件處理，如資料驗證',
    maximoLocation: 'AppBean 自訂方法 - 前端事件處理（通常不需轉換）',
  },
  'WHEN-BUTTON-PRESSED': {
    description: '當按鈕被按下時觸發',
    javaUse: '處理按鈕點擊事件，進行資料提交或其他操作',
    maximoLocation: 'AppBean.EVENTNAME() - 按鈕事件方法，方法名對應 sigevent',
  },
  'WHEN-VALIDATE-ITEM': {
    description: '當項目驗證完成後觸發',
    javaUse: '用於表單提交前的資料檢查或處理',
    maximoLocation: 'Mbo.validateField(String attrName) 或 FldClass.validate() - 單一欄位驗證',
  },
  'WHEN-NEW-RECORD-INSTANCE': {
    description: '當表單進入新記錄時觸發',
    javaUse: '用於記錄新增操作時的數據初始化',
    maximoLocation: 'Mbo.add() 或 Mbo.init() - 新增記錄初始化',
  },
  'PRE-QUERY': {
    description: '查詢之前觸發',
    javaUse: '在發送查詢請求前，進行資料過濾或準備',
    maximoLocation: 'MboSet.setWhere() 或 AppBean 覆寫查詢方法',
  },
  'POST-QUERY': {
    description: '查詢之後觸發',
    javaUse: '查詢完成後進行資料後處理',
    maximoLocation: 'MboSet.fetchMbos() 或 Mbo.init() - 查詢後處理',
  },
  'PRE-INSERT': {
    description: '插入之前觸發',
    javaUse: '在插入資料之前進行前置操作',
    maximoLocation: 'Mbo.add() - 新增前初始化欄位預設值',
  },
  'POST-INSERT': {
    description: '插入之後觸發',
    javaUse: '資料插入後進行後置操作',
    maximoLocation: 'Mbo.save() 內或 MboSet.save() 後 - 新增後處理',
  },
  'PRE-UPDATE': {
    description: '更新之前觸發',
    javaUse: '更新資料之前進行檢查或準備',
    maximoLocation: 'Mbo.modify() - 更新前檢查',
  },
  'POST-UPDATE': {
    description: '更新之後觸發',
    javaUse: '資料更新後進行後置處理',
    maximoLocation: 'Mbo.save() 內 - 更新後處理',
  },
  'PRE-DELETE': {
    description: '刪除之前觸發',
    javaUse: '在刪除資料之前進行檢查或處理',
    maximoLocation: 'Mbo.delete() 或 Mbo.canDelete() - 刪除前檢查',
  },
  'POST-DELETE': {
    description: '刪除之後觸發',
    javaUse: '資料刪除後進行後置操作',
    maximoLocation: 'Mbo.delete() 內或 MboSet.save() 後 - 刪除後處理',
  },
  'WHEN-TIMER-EXPIRED': {
    description: '計時器到期時觸發',
    javaUse: '計時事件完成後觸發相應處理',
    maximoLocation: 'Crontask 或 Escalation - 排程/定時任務',
  },
  'WHEN-VALIDATE-RECORD': {
    description: '當整個記錄被驗證時觸發',
    javaUse: '在記錄提交前進行最後的驗證',
    maximoLocation: 'Mbo.appValidate() - 存檔前整筆記錄驗證',
  },
  'PRE-FORM': {
    description: '表單創建前觸發',
    javaUse: '初始化資料，配置表單屬性',
    maximoLocation: 'AppBean.initialize() - 應用程式初始化前',
  },
  'POST-FORM': {
    description: '表單創建後觸發',
    javaUse: '完成資料加載後的後處理',
    maximoLocation: 'AppBean.initialize() 結束後 - 表單載入完成',
  },
  'WHEN-LOV-IS-OPEN': {
    description: '當 LOV 打開時觸發',
    javaUse: '處理 LOV 彈出視窗的邏輯',
    maximoLocation: 'FldClass 或 lookupfilter - Domain/Lookup 過濾',
  },
  'WHEN-LOV-IS-CLOSED': {
    description: '當 LOV 關閉時觸發',
    javaUse: '處理 LOV 關閉後的後續操作',
    maximoLocation: 'Mbo.action() 或 FldClass.action() - LOV 選擇後觸發',
  },
  'WHEN-NEW-BLOCK-INSTANCE': {
    description: '當新的區塊實例被創建時觸發',
    javaUse: '初始化區塊中的資料',
    maximoLocation: 'DataBean.initialize() - 子區塊/Table 初始化',
  },
  'WHEN-MOUSE-CLICKED': {
    description: '當鼠標點擊時觸發',
    javaUse: '處理用戶點擊事件',
    maximoLocation: '前端 JavaScript 或 AppBean 方法 - 通常不需轉換',
  },
  'WHEN-MOUSE-DOUBLE-CLICKED': {
    description: '當鼠標雙擊時觸發',
    javaUse: '處理用戶的雙擊事件',
    maximoLocation: '前端 JavaScript 或 AppBean 方法 - 通常不需轉換',
  },
  'WHEN-KEY-PRESSED': {
    description: '當按鍵被按下時觸發',
    javaUse: '處理按鍵事件',
    maximoLocation: '前端 JavaScript - 通常不需轉換',
  },
  'WHEN-KEY-RELEASED': {
    description: '當按鍵被釋放時觸發',
    javaUse: '針對按鍵釋放後執行的處理',
    maximoLocation: '前端 JavaScript - 通常不需轉換',
  },
  'PRE-COMMIT': {
    description: '在提交資料之前觸發',
    javaUse: '在提交資料前進行最後的資料驗證',
    maximoLocation: 'Mbo.appValidate() - 存檔前最終驗證',
  },
  'POST-COMMIT': {
    description: '資料提交之後觸發',
    javaUse: '提交資料後進行後續操作',
    maximoLocation: 'Mbo.save() 結束後或 EventAction - 存檔後處理',
  },
  'WHEN-NEW-NAVIGATION-INSTANCE': {
    description: '當新的導航實例被創建時觸發',
    javaUse: '用於更新導航視圖或重新整理',
    maximoLocation: 'AppBean 導航方法 - 頁籤切換處理',
  },
  'WHEN-MOUSE-ENTERED': {
    description: '當鼠標進入區域時觸發',
    javaUse: '處理鼠標進入區域的操作',
    maximoLocation: '前端 CSS/JavaScript - 不需轉換',
  },
  'WHEN-MOUSE-EXITED': {
    description: '當鼠標離開區域時觸發',
    javaUse: '處理鼠標離開區域的操作',
    maximoLocation: '前端 CSS/JavaScript - 不需轉換',
  },
  'ON-ERROR': {
    description: '當錯誤發生時觸發',
    javaUse: '統一錯誤處理',
    maximoLocation: 'MXException 或 MboSetInfo - 錯誤訊息設定',
  },
  'ON-MESSAGE': {
    description: '當訊息產生時觸發',
    javaUse: '自訂訊息處理',
    maximoLocation: 'MXException 或 messages.xml - 訊息定義',
  },
  'KEY-COMMIT': {
    description: '當提交鍵被按下時觸發',
    javaUse: '處理提交動作',
    maximoLocation: 'Toolbar SAVE 按鈕 - 預設行為不需轉換',
  },
  'KEY-EXIT': {
    description: '當退出鍵被按下時觸發',
    javaUse: '處理退出動作',
    maximoLocation: '前端導航 - 不需轉換',
  },
  'KEY-DELREC': {
    description: '當刪除記錄鍵被按下時觸發',
    javaUse: '處理刪除記錄動作',
    maximoLocation: 'Mbo.delete() + Mbo.canDelete()',
  },
  'KEY-ENTQRY': {
    description: '當進入查詢模式鍵被按下時觸發',
    javaUse: '處理進入查詢模式動作',
    maximoLocation: '前端 List Tab 或 Filter - 不需轉換',
  },
  'KEY-EXEQRY': {
    description: '當執行查詢鍵被按下時觸發',
    javaUse: '處理執行查詢動作',
    maximoLocation: 'MboSet.setWhere() - 查詢條件設定',
  },
  'KEY-NXTREC': {
    description: '當下一筆記錄鍵被按下時觸發',
    javaUse: '處理移動至下一筆記錄',
    maximoLocation: '前端導航 - 不需轉換',
  },
  'KEY-PRVREC': {
    description: '當上一筆記錄鍵被按下時觸發',
    javaUse: '處理移動至上一筆記錄',
    maximoLocation: '前端導航 - 不需轉換',
  },
  'KEY-CREREC': {
    description: '當新增記錄鍵被按下時觸發',
    javaUse: '處理新增記錄動作',
    maximoLocation: 'Mbo.add() + Mbo.init()',
  },
  'KEY-CLRFRM': {
    description: '當清除表單鍵被按下時觸發',
    javaUse: '處理清除表單動作',
    maximoLocation: '前端 Clear 按鈕 - 不需轉換',
  },
};

/**
 * Get trigger event info by name
 */
export function getTriggerEventInfo(triggerName: string): TriggerEventInfo {
  const upperName = triggerName.toUpperCase();
  return TRIGGER_EVENT_MAP[upperName] ?? {
    description: `${upperName} 觸發器`,
    javaUse: '自定義邏輯處理',
    maximoLocation: '依據業務邏輯選擇適當的 Mbo/AppBean 方法',
  };
}
