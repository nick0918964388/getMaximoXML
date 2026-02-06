# Feature Specification: FMB 轉 DBC 檔案產生器

**Feature Branch**: `003-fmb-dbc-generator`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "建立FMB轉DBC檔案功能，從上傳的XML檔案萃取Maximo XML內容，產生包含mboname與attribute的DBC檔案，支援預覽與下載"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 上傳 FMB XML 並預覽 DBC 內容 (Priority: P1)

使用者上傳 Oracle Forms frmf2xml 匯出的 XML 檔案後，系統從中萃取 Maximo 相關的 MBO 定義與屬性資訊，並在畫面上顯示即將產生的 DBC 檔案內容預覽。

**Why this priority**: 這是核心功能，讓使用者能夠確認產生的 DBC 內容是否符合預期，避免產生錯誤的資料庫腳本。

**Independent Test**: 可透過上傳測試 XML 檔案，驗證系統是否正確解析並顯示 DBC 預覽內容。

**Acceptance Scenarios**:

1. **Given** 使用者已上傳有效的 FMB XML 檔案, **When** 使用者切換到「DBC 產生器」分頁, **Then** 系統顯示該 XML 對應的 DBC 預覽內容，包含 define_table 與 attrdef 結構
2. **Given** 使用者已上傳有效的 FMB XML 檔案, **When** XML 中包含多個 MBO 定義, **Then** 預覽內容包含所有 MBO 的 define_table 區塊
3. **Given** 使用者尚未上傳任何檔案, **When** 使用者進入「DBC 產生器」分頁, **Then** 系統顯示提示訊息引導使用者先上傳檔案

---

### User Story 2 - 下載 DBC 檔案 (Priority: P1)

使用者在確認 DBC 預覽內容後，可以點擊下載按鈕將 DBC 檔案下載到本機，檔案可直接用於 Maximo 系統執行。

**Why this priority**: 下載是使用者最終目標，與預覽同為核心功能。

**Independent Test**: 可透過點擊下載按鈕，驗證瀏覽器是否下載正確格式的 .dbc 檔案。

**Acceptance Scenarios**:

1. **Given** 使用者已看到 DBC 預覽內容, **When** 使用者點擊「下載 DBC」按鈕, **Then** 瀏覽器下載一個 .dbc 檔案，檔名包含原始 XML 的模組名稱
2. **Given** 下載的 DBC 檔案, **When** 以文字編輯器開啟, **Then** 內容格式符合 Maximo DBC script 結構（XML 格式，包含 script、statements、define_table、attrdef 元素）

---

### User Story 3 - 自訂 DBC 腳本屬性 (Priority: P2)

使用者可以修改 DBC 腳本的基本屬性，如 author（作者）、scriptname（腳本名稱）、description（描述），以便產生符合組織命名規範的腳本。

**Why this priority**: 提供客製化能力讓產出的腳本更符合使用者組織的規範，但非核心功能。

**Independent Test**: 可透過修改表單欄位後查看預覽，驗證 DBC 內容是否反映使用者輸入。

**Acceptance Scenarios**:

1. **Given** 使用者已上傳有效的 FMB XML 檔案, **When** 使用者在設定區域輸入自訂的作者名稱, **Then** DBC 預覽中的 author 屬性顯示使用者輸入的值
2. **Given** 使用者已上傳有效的 FMB XML 檔案, **When** 使用者在設定區域輸入自訂的腳本名稱, **Then** DBC 預覽中的 scriptname 屬性顯示使用者輸入的值

---

### Edge Cases

- XML 檔案不包含任何有效的 MBO 定義時，系統應顯示「無可轉換的 MBO 資料」訊息
- XML 檔案格式錯誤或非 FMB 匯出格式時，系統應顯示明確的錯誤訊息
- MBO 名稱或屬性名稱包含特殊字元時，系統應正確處理或提示使用者

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 在 FMB 轉換器頁面新增「DBC 產生器」分頁
- **FR-002**: 系統 MUST 從已上傳的 FMB XML 檔案中萃取 MBO 定義（名稱、描述、主鍵、服務名稱）
- **FR-003**: 系統 MUST 從已上傳的 FMB XML 檔案中萃取各 MBO 的屬性定義（名稱、資料型別、長度、標題、是否必填）
- **FR-004**: 系統 MUST 將萃取的資訊轉換為 Maximo DBC script 格式（符合 Maximo script.dtd 規範）
- **FR-005**: 系統 MUST 在預覽區域顯示完整的 DBC 內容，使用程式碼格式並支援語法高亮
- **FR-006**: 系統 MUST 提供下載功能，將 DBC 內容儲存為 .dbc 檔案
- **FR-007**: 系統 MUST 提供設定表單讓使用者自訂 author、scriptname、description 屬性
- **FR-008**: 系統 MUST 在使用者尚未上傳檔案時顯示引導提示
- **FR-009**: 系統 MUST 在無法萃取有效 MBO 資料時顯示適當的錯誤訊息

### Key Entities

- **MBO 定義 (MBO Definition)**: 代表 Maximo Business Object，包含 object（名稱）、description（描述）、type（類型）、primarykey（主鍵）、service（服務名稱）
- **屬性定義 (Attribute Definition)**: 代表 MBO 的欄位屬性，包含 attribute（名稱）、maxtype（Maximo 資料型別）、length（長度）、title（標題）、remarks（備註）、required（是否必填）
- **DBC 腳本 (DBC Script)**: Maximo 資料庫配置腳本，包含 script 根元素、statements 容器、define_table 與 attrdef 子元素

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者可在 3 次點擊內從上傳 XML 到下載 DBC 檔案（上傳 → 切換分頁 → 下載）
- **SC-002**: 產生的 DBC 檔案可直接在 Maximo 系統執行，無需手動修改格式
- **SC-003**: 預覽畫面載入時間不超過 2 秒（對於包含 50 個欄位以下的 XML）
- **SC-004**: 100% 的有效 FMB XML 欄位資訊可被正確萃取並轉換為 DBC 格式

## Assumptions

- 使用者已熟悉現有的 FMB 轉換器功能，了解如何上傳 XML 檔案
- FMB XML 中的欄位資訊（如資料型別、長度）可對應到 Maximo 的 maxtype 系統
- DBC 檔案格式遵循 Maximo 7.x/8.x 版本的 script.dtd 規範
- 新的「DBC 產生器」分頁將複用現有的 XML 解析結果，無需重新上傳檔案
- 預設的 service 值為 "CUSTAPP"，classname 為 "psdi.mbo.custapp.CustomMboSet"
