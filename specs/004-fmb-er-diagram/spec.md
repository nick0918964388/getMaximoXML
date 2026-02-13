# Feature Specification: FMB ER Diagram 實體關聯圖

**Feature Branch**: `004-fmb-er-diagram`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "在 FMB Converter 規格文檔功能中，新增一個區塊繪製 ER Diagram 圖，描述各實體（表格）間的關聯圖"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 檢視 ER Diagram（實體關聯圖） (Priority: P1)

使用者在 FMB Converter 上傳並解析完 Oracle Forms XML 後，可以在規格文檔面板中看到一個新的「ER Diagram」區塊，自動繪製出該表單所涉及的所有資料表（Block）之間的關聯關係圖。圖中清楚標示每個實體（表格）名稱、主要欄位、以及實體間的父子關聯（一對多）關係線。

**Why this priority**: 這是核心功能，使用者需要的就是看到視覺化的 ER Diagram。沒有此功能，其他匯出功能都無意義。

**Independent Test**: 可以透過上傳一個包含 header block 與多個 detail block 的 FMB XML 檔案，驗證圖中是否正確顯示所有實體及其關聯線。

**Acceptance Scenarios**:

1. **Given** 使用者已上傳並解析一個含有 1 個 header block 和 2 個 detail block 的 FMB XML, **When** 使用者切換到規格文檔面板, **Then** 系統顯示包含 3 個實體方塊的 ER Diagram，且 header 與每個 detail 之間各有一條關聯線標示一對多關係
2. **Given** 使用者已上傳一個含有 LOV 參照外部資料表的 FMB XML, **When** ER Diagram 顯示時, **Then** LOV 所參照的外部資料表也以不同樣式（如虛線框）呈現在圖中，並用虛線連接至參照它的欄位所屬的實體
3. **Given** 使用者已上傳一個僅包含單一 block 且無任何關聯的 FMB XML, **When** ER Diagram 顯示時, **Then** 系統顯示一個獨立的實體方塊，不繪製任何關聯線

---

### User Story 2 - 在 Word 文件中匯出 ER Diagram (Priority: P2)

使用者在匯出 Word 規格文件時，ER Diagram 會自動作為一個新的章節包含在文件中，以圖片形式嵌入，使完整的規格文件包含視覺化的實體關聯圖。

**Why this priority**: 規格文件通常需要離線分享給不同利害關係人，將 ER Diagram 嵌入 Word 文件中提升文件的完整性與專業度。

**Independent Test**: 可以透過匯出 Word 文件後，開啟檢查是否包含 ER Diagram 章節及圖片。

**Acceptance Scenarios**:

1. **Given** 使用者已解析一個包含多個 block 的 FMB XML, **When** 使用者點擊匯出 Word 文件, **Then** 產出的 .docx 文件中包含一個「ER Diagram」章節，內含 ER Diagram 圖片
2. **Given** 使用者已解析 FMB XML 且 ER Diagram 已在預覽中顯示, **When** 匯出 Word 文件, **Then** Word 文件中的 ER Diagram 與預覽中的圖形內容一致

---

### User Story 3 - 在 Markdown 規格文件中包含 ER Diagram (Priority: P3)

使用者匯出 Markdown 格式的規格文件時，ER Diagram 以 Mermaid 語法（或等效的文字描述語法）嵌入，使 Markdown 文件在支援 Mermaid 的工具（如 GitHub、GitLab）中也能自動渲染出 ER Diagram。

**Why this priority**: Markdown 是開發團隊常用的文件格式，嵌入 Mermaid ER 語法可讓圖形在多數開發平台上直接預覽。

**Independent Test**: 可以透過匯出 Markdown 文件，在 GitHub 或 Mermaid Live Editor 中確認 ER Diagram 是否正確渲染。

**Acceptance Scenarios**:

1. **Given** 使用者已解析包含多個關聯 block 的 FMB XML, **When** 使用者點擊匯出 Markdown, **Then** Markdown 文件中包含一個以文字語法描述的 ER Diagram 區塊（如 Mermaid erDiagram）
2. **Given** 匯出的 Markdown 文件包含 ER Diagram 語法, **When** 在支援 Mermaid 的平台（如 GitHub）上檢視, **Then** ER Diagram 自動渲染為視覺化圖形

---

### Edge Cases

- 當 FMB XML 中沒有任何 data block（例如只有 control block 或 button）時，ER Diagram 區塊應顯示提示訊息「無可繪製的實體資料」而非空白
- 當表單含有超過 10 個 block 時，ER Diagram 應仍可閱讀且不會因實體過多而排版混亂
- 當 block 的 queryDataSource 為空值時，該 block 應以不同樣式標示（如「無資料來源」），但仍出現在圖中
- 當多個 detail block 參照同一個 parent table 時，所有關聯線應各自獨立顯示且不重疊

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 從已解析的 FMB Module 中自動提取所有 data block 作為 ER Diagram 中的實體
- **FR-002**: 系統 MUST 以視覺化方塊呈現每個實體，包含實體名稱（block name）與基礎資料表名稱（queryDataSource）
- **FR-003**: 系統 MUST 在每個實體方塊中顯示關鍵欄位（主鍵、外鍵、必填欄位）及其資料型別，非關鍵欄位不顯示於圖中
- **FR-004**: 系統 MUST 根據 header block 與 detail block 的關係自動繪製父子關聯線，並標示一對多（1:N）的基數
- **FR-005**: 系統 MUST 以不同的視覺樣式區分 header 實體、detail 實體、以及 LOV 參照的外部實體
- **FR-006**: 系統 MUST 預設隱藏 LOV 外部參照，並提供切換開關讓使用者選擇是否顯示；當開啟時，LOV 所參照的外部資料表以虛線框呈現，並以虛線連接至參照它的欄位所屬實體
- **FR-007**: 系統 MUST 在規格文檔 Preview tab 內新增一個 inline「ER Diagram」章節，顯示於現有畫面規格之後、LOV 區塊之前，作為規格文件的一部分
- **FR-008**: 系統 MUST 支援將 ER Diagram 以圖片格式嵌入 Word 匯出文件
- **FR-009**: 系統 MUST 支援將 ER Diagram 以文字描述語法（如 Mermaid erDiagram）嵌入 Markdown 匯出文件
- **FR-010**: 當 FMB 中無任何可繪製的 data block 時，系統 MUST 顯示友善的提示訊息而非空白區域
- **FR-011**: 系統 MUST 確保 ER Diagram 在含有超過 10 個實體時仍保持可閱讀的排版

### Key Entities

- **實體（Entity）**: 代表一個 FMB data block 對應的資料表，包含名稱、基礎表名、欄位清單、所屬區域（header/detail）
- **關聯（Relationship）**: 代表兩個實體之間的父子關係，包含父實體、子實體、關聯條件（如 join column）、基數（1:N）
- **外部參照（External Reference）**: 代表 LOV 所參照的外部資料表，包含資料表名稱、被參照的欄位

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者上傳 FMB XML 後，ER Diagram 在 3 秒內自動完成繪製並顯示
- **SC-002**: 100% 的 header-detail 父子關聯能被正確識別並在圖中顯示
- **SC-003**: 匯出的 Word 文件中，ER Diagram 圖片清晰可閱讀，解析度足以列印
- **SC-004**: 匯出的 Markdown 文件中，ER Diagram 文字語法能在 Mermaid 相容平台上正確渲染
- **SC-005**: 含有 10 個以上實體的 ER Diagram 仍可在標準螢幕（1920x1080）上完整閱讀且無需水平捲動

## Clarifications

### Session 2026-02-12

- Q: 實體方塊中應顯示哪些欄位？ → A: 只顯示關鍵欄位（主鍵、外鍵、必填欄位），非關鍵欄位不在圖中呈現
- Q: LOV 外部參照是否預設顯示？ → A: 預設隱藏，提供切換開關讓使用者選擇是否顯示
- Q: ER Diagram 在 UI 中的呈現方式？ → A: 作為 Preview tab 內的 inline 章節，與其他規格內容整合為一份文件

## Assumptions

- ER Diagram 的繪製在瀏覽器端完成，不需要後端服務
- Header block 與 detail block 的判斷依據現有的 canvas 分析邏輯（CANVAS_BODY = header, CANVAS_TAB = detail）
- LOV 外部參照的資料表名稱取自 Record Group 的 SQL 查詢（FROM 子句），若無法解析則不顯示
- 圖形排版採用自動佈局，使用者不需要手動拖拉調整位置
- ER Diagram 區塊的位置固定在規格文檔的畫面規格區塊之後、LOV 區塊之前
