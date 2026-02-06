# Tasks: FMB 轉 DBC 檔案產生器

**Input**: Design documents from `/specs/003-fmb-dbc-generator/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: TDD approach enabled (per project constitution)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` for source code, `web/src/lib/fmb/__tests__/` for tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add DBC type definitions to existing type system

- [X] T001 [P] Add DBC type definitions (DbcScript, DbcTableDefinition, DbcAttributeDefinition, DbcDataType) to `web/src/lib/fmb/types.ts`
- [X] T002 [P] Add DBC constants (DEFAULT_DBC_CONFIG, DEFAULT_DBC_METADATA) to `web/src/lib/fmb/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core DBC generator infrastructure that MUST be complete before UI integration

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (TDD - Write First)

- [X] T003 [P] Write unit tests for `mapMaximoTypeToDbcType()` type mapping function in `web/src/lib/fmb/__tests__/dbc-generator.test.ts`
- [X] T004 [P] Write unit tests for `extractMboDefinitions()` MBO extraction function in `web/src/lib/fmb/__tests__/dbc-generator.test.ts`
- [X] T005 [P] Write unit tests for `generateDbcXml()` XML generation function in `web/src/lib/fmb/__tests__/dbc-generator.test.ts`

### Implementation

- [X] T006 Implement `mapMaximoTypeToDbcType()` in `web/src/lib/fmb/dbc-generator.ts` (make T003 pass)
- [X] T007 Implement `extractMboDefinitions()` in `web/src/lib/fmb/dbc-generator.ts` (make T004 pass)
- [X] T008 Implement `generateDbcXml()` in `web/src/lib/fmb/dbc-generator.ts` (make T005 pass)
- [X] T009 Implement `generateDbc()` main entry function combining all above in `web/src/lib/fmb/dbc-generator.ts`
- [X] T010 Export all DBC generator functions from `web/src/lib/fmb/dbc-generator.ts`

**Checkpoint**: Foundation ready - DBC generator core logic complete and tested

---

## Phase 3: User Story 1 - 上傳 FMB XML 並預覽 DBC 內容 (Priority: P1) 🎯 MVP

**Goal**: 使用者上傳 FMB XML 後，可在「DBC 產生器」分頁看到 DBC 預覽內容

**Independent Test**: 上傳測試 XML 檔案，驗證系統正確顯示 DBC 預覽（包含 define_table 與 attrdef）

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Write component test: DbcPanel shows upload prompt when fmbModule is null in `web/src/components/fmb/__tests__/dbc-panel.test.tsx`
- [X] T012 [P] [US1] Write component test: DbcPanel renders DBC preview content when fmbModule exists in `web/src/components/fmb/__tests__/dbc-panel.test.tsx`
- [X] T013 [P] [US1] Write component test: DbcPanel shows error message when no valid MBO data in `web/src/components/fmb/__tests__/dbc-panel.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Create DbcPanel component scaffold with props interface in `web/src/components/fmb/dbc-panel.tsx` (make T011 pass)
- [X] T015 [US1] Implement DBC preview display with syntax highlighting in `web/src/components/fmb/dbc-panel.tsx` (make T012 pass)
- [X] T016 [US1] Implement empty state and error handling UI in `web/src/components/fmb/dbc-panel.tsx` (make T013 pass)
- [X] T017 [US1] Add "DBC 產生器" tab to FmbConverterPage TabGroup in `web/src/app/tools/fmb-converter/page.tsx`
- [X] T018 [US1] Integrate DbcPanel with existing FmbConverterPage state (fmbModule, fields, metadata) in `web/src/app/tools/fmb-converter/page.tsx`

**Checkpoint**: User Story 1 complete - 使用者可在 DBC 分頁看到預覽內容

---

## Phase 4: User Story 2 - 下載 DBC 檔案 (Priority: P1)

**Goal**: 使用者可點擊下載按鈕將 DBC 檔案下載到本機

**Independent Test**: 點擊下載按鈕，驗證瀏覽器下載正確格式的 .dbc 檔案

### Tests for User Story 2 ⚠️

- [X] T019 [P] [US2] Write unit test: downloadDbc() creates correct Blob and triggers download in `web/src/lib/fmb/__tests__/dbc-generator.test.ts`
- [X] T020 [P] [US2] Write component test: DbcPanel download button triggers file download in `web/src/components/fmb/__tests__/dbc-panel.test.tsx`

### Implementation for User Story 2

- [X] T021 [US2] Implement `downloadDbc()` utility function in `web/src/lib/fmb/dbc-generator.ts` (make T019 pass)
- [X] T022 [US2] Add download button to DbcPanel with click handler in `web/src/components/fmb/dbc-panel.tsx` (make T020 pass)
- [X] T023 [US2] Implement suggested filename generation (模組名稱_dbc.dbc) in `web/src/lib/fmb/dbc-generator.ts`

**Checkpoint**: User Story 2 complete - 使用者可下載 DBC 檔案

---

## Phase 5: User Story 3 - 自訂 DBC 腳本屬性 (Priority: P2)

**Goal**: 使用者可修改 author、scriptname、description 屬性

**Independent Test**: 修改設定表單後查看預覽，驗證 DBC 內容反映使用者輸入

### Tests for User Story 3 ⚠️

- [X] T024 [P] [US3] Write component test: DbcPanel renders settings form with author, scriptname, description fields in `web/src/components/fmb/__tests__/dbc-panel.test.tsx`
- [X] T025 [P] [US3] Write component test: DbcPanel updates preview when settings change in `web/src/components/fmb/__tests__/dbc-panel.test.tsx`

### Implementation for User Story 3

- [X] T026 [US3] Add settings form state management (author, scriptname, description) to DbcPanel in `web/src/components/fmb/dbc-panel.tsx` (make T024 pass)
- [X] T027 [US3] Implement real-time preview update when settings change in `web/src/components/fmb/dbc-panel.tsx` (make T025 pass)
- [X] T028 [US3] Add default value generation logic (scriptname from MBO name) in `web/src/components/fmb/dbc-panel.tsx`

**Checkpoint**: User Story 3 complete - 使用者可自訂腳本屬性

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling and quality improvements

- [X] T029 [P] Add edge case handling: XML with no valid MBO definitions shows "無可轉換的 MBO 資料" in `web/src/components/fmb/dbc-panel.tsx`
- [X] T030 [P] Add edge case handling: Special characters in MBO/attribute names in `web/src/lib/fmb/dbc-generator.ts`
- [X] T031 Run all tests and ensure 100% pass rate: `cd web && npm test`
- [ ] T032 Manual validation: Test with sample FMB XML files following quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different concerns)
  - US3 depends on US1 (needs preview UI to show settings effect)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core preview functionality
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent download feature
- **User Story 3 (P2)**: Depends on User Story 1 (needs preview to show customization effect)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Component tests before component implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002 can run in parallel (different type additions)
- T003, T004, T005 can run in parallel (different test files/functions)
- T011, T012, T013 can run in parallel (different test cases)
- T019, T020 can run in parallel (different test files)
- T024, T025 can run in parallel (different test cases)
- T029, T030 can run in parallel (different files)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all tests together (TDD - write failing tests first):
Task: "Write unit tests for mapMaximoTypeToDbcType() in web/src/lib/fmb/__tests__/dbc-generator.test.ts"
Task: "Write unit tests for extractMboDefinitions() in web/src/lib/fmb/__tests__/dbc-generator.test.ts"
Task: "Write unit tests for generateDbcXml() in web/src/lib/fmb/__tests__/dbc-generator.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (core generator logic with TDD)
3. Complete Phase 3: User Story 1 (preview)
4. Complete Phase 4: User Story 2 (download)
5. **STOP and VALIDATE**: Test preview and download independently
6. Deploy/demo if ready - users can now generate and download DBC files

### Incremental Delivery

1. Complete Setup + Foundational → Core DBC generator ready
2. Add User Story 1 → Test preview → Demo (can see DBC!)
3. Add User Story 2 → Test download → Demo (can download DBC!)
4. Add User Story 3 → Test customization → Demo (full feature!)
5. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths are relative to repository root
