# Tasks: FMB Word Export

**Input**: Design documents from `/specs/002-fmb-word-export/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD approach - tests MUST be written first and FAIL before implementation (as per CLAUDE.md guidelines).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` for source code
- Paths follow Next.js App Router structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [X] T001 Install docx npm package in web/package.json
- [X] T002 Verify docx package works with browser build (no SSR issues)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create word-generator module skeleton in web/src/lib/fmb/word-generator.ts with exported function signatures
- [X] T004 Define WordDocumentOptions and WordStyleConfig interfaces in web/src/lib/fmb/word-generator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Download Spec as Word Document (Priority: P1) 🎯 MVP

**Goal**: 使用者可以將 FMB 規格文檔下載為 Word (.docx) 格式

**Independent Test**: 上傳 FMB XML 後點擊「下載 Word」按鈕，驗證是否成功下載可開啟的 .docx 檔案

### Tests for User Story 1 (TDD - Write FIRST, verify FAIL)

- [X] T005 [P] [US1] Unit test: generateWordDocument returns valid Document object in web/src/lib/fmb/word-generator.test.ts
- [X] T006 [P] [US1] Unit test: downloadWordDocument triggers browser download in web/src/lib/fmb/word-generator.test.ts
- [X] T007 [P] [US1] Unit test: minimal FormSpec generates valid document in web/src/lib/fmb/word-generator.test.ts

### Implementation for User Story 1

- [X] T008 [US1] Implement document header generation (H1 title, form name) in web/src/lib/fmb/word-generator.ts
- [X] T009 [US1] Implement block info table generation (Block Name, Base Table, etc.) in web/src/lib/fmb/word-generator.ts
- [X] T010 [US1] Implement field list table generation (12 columns) in web/src/lib/fmb/word-generator.ts
- [X] T011 [US1] Implement buttons section table generation in web/src/lib/fmb/word-generator.ts
- [X] T012 [US1] Implement LOV section with column mappings table in web/src/lib/fmb/word-generator.ts
- [X] T013 [US1] Implement SQL code block formatting (monospace font) in web/src/lib/fmb/word-generator.ts
- [X] T014 [US1] Implement triggers section with statistics and tables in web/src/lib/fmb/word-generator.ts
- [X] T015 [US1] Implement generateWordDocument main function combining all sections in web/src/lib/fmb/word-generator.ts
- [X] T016 [US1] Implement downloadWordDocument function with Blob download in web/src/lib/fmb/word-generator.ts
- [X] T017 [US1] Add "下載 Word" button to SpecPanel in web/src/components/fmb/spec-panel.tsx
- [X] T018 [US1] Wire button click to downloadWordDocument function in web/src/components/fmb/spec-panel.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can download Word files

---

## Phase 4: User Story 2 - Consistent Formatting (Priority: P1)

**Goal**: Word 文件的格式與網頁預覽版本保持一致

**Independent Test**: 比對網頁預覽和 Word 文件的標題結構、表格格式、代碼區塊樣式

### Tests for User Story 2 (TDD - Write FIRST, verify FAIL)

- [X] T019 [P] [US2] Unit test: heading levels match preview (H1, H2, H3) in web/src/lib/fmb/word-generator.test.ts
- [X] T020 [P] [US2] Unit test: table borders and header styling applied in web/src/lib/fmb/word-generator.test.ts
- [X] T021 [P] [US2] Unit test: code blocks use monospace font in web/src/lib/fmb/word-generator.test.ts

### Implementation for User Story 2

- [X] T022 [US2] Define table border styles (BorderStyle.SINGLE) in web/src/lib/fmb/word-generator.ts
- [X] T023 [US2] Apply table header background color (#E0E0E0) in web/src/lib/fmb/word-generator.ts
- [X] T024 [US2] Apply header row bold text styling in web/src/lib/fmb/word-generator.ts
- [X] T025 [US2] Configure heading font sizes (H1: 24pt, H2: 18pt, H3: 14pt) in web/src/lib/fmb/word-generator.ts
- [X] T026 [US2] Apply Consolas font family to SQL code blocks in web/src/lib/fmb/word-generator.ts
- [X] T027 [US2] Add code block background shading (#F5F5F5) in web/src/lib/fmb/word-generator.ts

**Checkpoint**: Word documents now have consistent formatting with web preview

---

## Phase 5: User Story 3 - Error Handling (Priority: P2)

**Goal**: 匯出失敗時顯示明確的錯誤訊息

**Independent Test**: 模擬錯誤情境驗證錯誤訊息是否正確顯示

### Tests for User Story 3 (TDD - Write FIRST, verify FAIL)

- [X] T028 [P] [US3] Unit test: generation error shows user-friendly message in web/src/lib/fmb/word-generator.test.ts
- [X] T029 [P] [US3] Unit test: error does not expose technical details in web/src/lib/fmb/word-generator.test.ts

### Implementation for User Story 3

- [X] T030 [US3] Add try-catch wrapper in downloadWordDocument in web/src/lib/fmb/word-generator.ts
- [X] T031 [US3] Implement WordGenerationError custom error class in web/src/lib/fmb/word-generator.ts
- [X] T032 [US3] Add error state and toast notification in SpecPanel in web/src/components/fmb/spec-panel.tsx
- [X] T033 [US3] Log detailed error to console for debugging in web/src/components/fmb/spec-panel.tsx

**Checkpoint**: Error handling complete - users see friendly error messages

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and improvements that affect multiple user stories

- [X] T034 [P] Handle empty FormSpec (generate minimal valid document) in web/src/lib/fmb/word-generator.ts
- [X] T035 [P] Handle special characters in file name (sanitize for download) in web/src/lib/fmb/word-generator.ts
- [X] T036 [P] Handle long SQL code with proper text wrapping in web/src/lib/fmb/word-generator.ts
- [X] T037 Verify existing Markdown download still works (regression test) in web/src/components/fmb/spec-panel.tsx
- [X] T038 Run quickstart.md validation - test with real FMB XML file (manual: upload web/test-fmb.xml to http://localhost:3000/tools/fmb-converter and click "下載 Word")

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority but can proceed sequentially
  - US2 builds on US1 styling (recommend completing US1 first)
  - US3 (P2) can be done after US1+US2 or in parallel
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Should start after US1 basic implementation (T008-T018) - Builds on styling
- **User Story 3 (P2)**: Can start after US1 (T017-T018 provides button to wrap with error handling)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core functions before UI integration
- Complete before moving to next story

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001, T002 are sequential (dependency check needs package first)

**Phase 2 (Foundational)**:
- T003, T004 can run in parallel (different concerns)

**Phase 3 (US1 Tests)**:
```bash
# Launch all US1 tests together:
Task: T005 Unit test: generateWordDocument returns valid Document
Task: T006 Unit test: downloadWordDocument triggers browser download
Task: T007 Unit test: minimal FormSpec generates valid document
```

**Phase 4 (US2 Tests)**:
```bash
# Launch all US2 tests together:
Task: T019 Unit test: heading levels match preview
Task: T020 Unit test: table borders and header styling
Task: T021 Unit test: code blocks use monospace font
```

**Phase 5 (US3 Tests)**:
```bash
# Launch all US3 tests together:
Task: T028 Unit test: generation error shows user-friendly message
Task: T029 Unit test: error does not expose technical details
```

**Phase 6 (Polish)**:
```bash
# Launch edge case handlers together:
Task: T034 Handle empty FormSpec
Task: T035 Handle special characters in file name
Task: T036 Handle long SQL code with proper text wrapping
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 (T005-T018)
4. **STOP and VALIDATE**: Test Word download with real FMB XML
5. Deploy/demo if ready - users can download Word files!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test download → Deploy/Demo (MVP!)
3. Add User Story 2 → Test formatting → Deploy/Demo (polished Word output)
4. Add User Story 3 → Test error cases → Deploy/Demo (production ready)
5. Add Polish → Handle edge cases → Final release

### Recommended Execution Order

```
T001 → T002 → T003 → T004 (Setup + Foundation)
         ↓
T005, T006, T007 (US1 Tests - parallel, verify FAIL)
         ↓
T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 (US1 Core)
         ↓
T017 → T018 (US1 UI Integration)
         ↓
      [MVP CHECKPOINT]
         ↓
T019, T020, T021 (US2 Tests - parallel, verify FAIL)
         ↓
T022 → T023 → T024 → T025 → T026 → T027 (US2 Styling)
         ↓
T028, T029 (US3 Tests - parallel, verify FAIL)
         ↓
T030 → T031 → T032 → T033 (US3 Error Handling)
         ↓
T034, T035, T036 (Polish - parallel)
         ↓
T037 → T038 (Final validation)
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
