# Feature Specification: FMB Word Export

**Feature Branch**: `002-fmb-word-export`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "我想要加入目前fmb的規格文檔產出後 可以下載成格式相同的word檔案"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download Spec as Word Document (Priority: P1)

作為一個 Maximo 開發者，我想要將 FMB 規格文檔下載為 Word (.docx) 格式，這樣我可以在沒有網路的環境下閱讀，或將文件分享給其他不使用此工具的同事。

**Why this priority**: 這是功能的核心需求。使用者需要能夠匯出規格文檔為 Word 格式，以便離線閱讀和分享。

**Independent Test**: 可以透過上傳 FMB XML 後點擊「下載 Word」按鈕，驗證是否成功下載 .docx 檔案來測試。

**Acceptance Scenarios**:

1. **Given** 使用者已載入 FMB XML 並生成規格文檔, **When** 使用者點擊「下載 Word」按鈕, **Then** 瀏覽器下載一個 .docx 檔案，檔名為 `{formName}_spec.docx`
2. **Given** 使用者下載了 Word 檔案, **When** 使用者用 Microsoft Word 或其他相容軟體開啟檔案, **Then** 檔案能正常開啟且內容可讀
3. **Given** 規格文檔包含表格（欄位清單、LOV 等）, **When** 使用者下載 Word 檔案, **Then** 所有表格在 Word 中正確呈現，包含正確的欄位和格式

---

### User Story 2 - Consistent Formatting Between Preview and Word (Priority: P1)

作為一個使用者，我期望 Word 文件的格式與網頁預覽版本保持一致，這樣我不需要在匯出後重新調整格式。

**Why this priority**: 格式一致性是使用者信任此功能的關鍵，不一致的格式會導致使用者需要手動修正。

**Independent Test**: 可以比對網頁預覽和 Word 文件的內容結構和格式是否一致。

**Acceptance Scenarios**:

1. **Given** 規格文檔在網頁顯示標題和表格, **When** 下載為 Word, **Then** Word 文件包含相同的標題結構（H1、H2、H3）
2. **Given** 規格文檔包含欄位清單表格, **When** 下載為 Word, **Then** 表格包含相同的欄標題和資料，表格有邊框且易於閱讀
3. **Given** 規格文檔包含 SQL 代碼區塊, **When** 下載為 Word, **Then** SQL 代碼以等寬字體顯示，並有明顯的區隔（如底色或邊框）

---

### User Story 3 - Word Export Error Handling (Priority: P2)

作為一個使用者，如果 Word 匯出失敗，我想要看到明確的錯誤訊息，讓我知道發生了什麼問題。

**Why this priority**: 良好的錯誤處理提升使用體驗，但不是核心功能。

**Independent Test**: 可以透過模擬各種錯誤情境來驗證錯誤訊息是否正確顯示。

**Acceptance Scenarios**:

1. **Given** 匯出過程中發生錯誤, **When** Word 生成失敗, **Then** 顯示使用者友善的錯誤訊息，而不是技術性錯誤
2. **Given** 瀏覽器不支援下載功能, **When** 使用者嘗試下載, **Then** 顯示適當的提示訊息

---

### Edge Cases

- 當規格文檔為空或只有表單名稱時，仍應能下載有效的 Word 文件
- 當表格內容包含特殊字元（如 `<`、`>`、`&`）時，應正確轉義
- 當 SQL 代碼很長時，應在 Word 中適當換行或可捲動
- 檔案名稱應處理特殊字元，避免下載失敗

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統必須在規格文檔頁面提供「下載 Word」按鈕
- **FR-002**: 點擊「下載 Word」按鈕後必須下載一個有效的 .docx 檔案
- **FR-003**: Word 文件必須包含與 Markdown 相同的內容結構（標題、表格、代碼區塊）
- **FR-004**: Word 文件的檔案名稱必須為 `{formName}_spec.docx`
- **FR-005**: Word 文件必須能在 Microsoft Word、LibreOffice、Google Docs 等軟體中正常開啟
- **FR-006**: 表格必須有可見的邊框和表頭樣式
- **FR-007**: 代碼區塊必須使用等寬字體

### Non-Functional Requirements

- **NFR-001**: Word 生成必須在瀏覽器端完成（client-side），不需要伺服器端處理
- **NFR-002**: 生成和下載過程應在 3 秒內完成（對於一般大小的規格文檔）

### Key Entities

- **FormSpec**: 已存在的規格資料結構，包含表單名稱、區塊、欄位、LOV、觸發器等
- **WordDocument**: 生成的 Word 文件物件，需要包含樣式設定和內容

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者可以成功下載 Word 文件，且檔案可在主流辦公軟體中開啟
- **SC-002**: Word 文件的內容結構與網頁預覽一致（標題層級、表格結構、代碼區塊）
- **SC-003**: 現有的 Markdown 下載功能不受影響

## Assumptions

- 將使用 `docx` npm 套件在瀏覽器端生成 Word 文件
- Word 文件樣式將盡量簡潔，優先考慮可讀性和相容性
- 暫不支援 Word 文件中嵌入圖片（如截圖）
- 觸發器的 PL/SQL 代碼會以純文字形式呈現在 Word 中
