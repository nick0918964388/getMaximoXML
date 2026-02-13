# Tasks: FMB ER Diagram 實體關聯圖

**Input**: Design documents from `/specs/004-fmb-er-diagram/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD mandatory (per CLAUDE.md). Tests written first, must fail, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (existing Next.js project)
- **Tests**: `web/src/__tests__/` (Vitest with jsdom)
- **Business logic**: `web/src/lib/fmb/`
- **UI components**: `web/src/components/fmb/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create type definitions

- [x] T001 Install new npm dependencies: `@xyflow/react`, `elkjs`, `html-to-image` in `web/`
- [x] T002 [P] Create ER Diagram type definitions in `web/src/lib/fmb/er-diagram-types.ts` (ErEntity, ErField, ErRelationship, ErDiagramData per data-model.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core extraction logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] Write tests for entity extraction (header/detail classification, field selection) in `web/src/__tests__/lib/fmb/er-diagram-extractor.test.ts`
- [x] T004 [P] Write tests for relationship extraction (parent-child detection, LOV external refs) in `web/src/__tests__/lib/fmb/er-diagram-extractor.test.ts`

### Implementation for Foundational

- [x] T005 Implement `extractErDiagram(spec: FormSpec): ErDiagramData` in `web/src/lib/fmb/er-diagram-extractor.ts` — extract entities from blocks, classify as header/detail, select key fields (required, FK/lovName, PK pattern *_ID/*_NO/*_CODE), build parent-child relationships
- [x] T006 Implement LOV external reference extraction in `web/src/lib/fmb/er-diagram-extractor.ts` — parse RecordGroup SQL for FROM table names, create external entities and dashed relationships
- [x] T007 Run tests to verify T003 and T004 pass

**Checkpoint**: `extractErDiagram()` correctly produces ErDiagramData from any FormSpec. All extraction tests pass.

---

## Phase 3: User Story 1 - 檢視 ER Diagram (Priority: P1) 🎯 MVP

**Goal**: Display interactive ER Diagram in spec document Preview tab with auto-layout, visual entity distinction, and LOV toggle

**Independent Test**: Upload FMB XML with header + detail blocks → see ER Diagram in Preview tab with correct entities, relationship lines, and color-coded entity types

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Write tests for Mermaid syntax generation in `web/src/__tests__/lib/fmb/er-diagram-mermaid.test.ts` — verify valid erDiagram syntax, cardinality notation, PK/FK annotations, external ref filtering
- [x] T009 [P] [US1] Write tests for ER Diagram section component in `web/src/__tests__/components/fmb/er-diagram-section.test.ts` — renders entities, shows toggle button, empty state message, handles no-data-source blocks

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement `toMermaidErDiagram(data: ErDiagramData): string` in `web/src/lib/fmb/er-diagram-mermaid.ts` — generate Mermaid erDiagram syntax with entity fields, PK/FK annotations, and 1:N cardinality lines
- [x] T011 [P] [US1] Create custom ReactFlow entity node component in `web/src/components/fmb/er-entity-node.tsx` — header (blue border/header bar), detail (green), external (gray dashed), display key fields with type and role icon
- [x] T012 [US1] Create ER Diagram section component in `web/src/components/fmb/er-diagram-section.tsx` — ReactFlow with ELK.js auto-layout (layered, top-down), LOV toggle switch, empty state "無可繪製的實體資料" message, read-only mode (no drag/connect), "無資料來源" badge for blocks without queryDataSource
- [x] T013 [US1] Integrate ER Diagram section into Preview tab in `web/src/components/fmb/spec-panel.tsx` — insert `<ErDiagramSection spec={spec} />` after 畫面規格 section, before LOV section
- [x] T014 [US1] Run all tests to verify T008 and T009 pass

**Checkpoint**: Upload FMB XML → Preview tab shows ER Diagram with correct entities, relationship lines, LOV toggle works, edge cases handled. User Story 1 is fully functional.

---

## Phase 4: User Story 2 - Word 匯出 ER Diagram (Priority: P2)

**Goal**: Embed ER Diagram as PNG image in exported Word document

**Independent Test**: Upload FMB XML → export Word → open .docx → verify ER Diagram chapter with embedded image

### Tests for User Story 2

- [x] T015 [US2] Write tests for Word ER Diagram section generation in `web/src/__tests__/lib/fmb/word-generator-er.test.ts` — verify section heading, image paragraph creation, empty state handling

### Implementation for User Story 2

- [x] T016 [US2] Implement `generateErDiagramImage(containerElement: HTMLElement): Promise<{data: ArrayBuffer, width: number, height: number}>` utility in `web/src/lib/fmb/er-diagram-export.ts` — capture ReactFlow viewport via `html-to-image.toPng()`, convert to ArrayBuffer
- [x] T017 [US2] Add `generateErDiagramSection()` to `web/src/lib/fmb/word-generator.ts` — create heading "ER Diagram 實體關聯圖", embed PNG via `docx.ImageRun`, handle empty state (no image, text paragraph instead)
- [x] T018 [US2] Integrate ER Diagram section into Word export flow in `web/src/lib/fmb/word-generator.ts` — call after buttons section, before LOVs section, pass diagram container ref from spec-panel
- [x] T019 [US2] Run tests to verify T015 passes

**Checkpoint**: Word export includes ER Diagram chapter with clear, printable image. User Story 2 works independently.

---

## Phase 5: User Story 3 - Markdown 匯出 ER Diagram (Priority: P3)

**Goal**: Include Mermaid erDiagram syntax block in Markdown export

**Independent Test**: Upload FMB XML → export Markdown → paste into Mermaid Live Editor → verify diagram renders correctly

### Tests for User Story 3

- [x] T020 [US3] Write tests for Markdown ER Diagram section in `web/src/__tests__/lib/fmb/spec-generator-er.test.ts` — verify Mermaid code block present in markdown output, correct syntax, handles empty state

### Implementation for User Story 3

- [x] T021 [US3] Add ER Diagram section to `generateMarkdownSpec()` in `web/src/lib/fmb/spec-generator.ts` — insert fenced Mermaid code block (` ```mermaid ... ``` `) after 畫面規格 section, call `toMermaidErDiagram()`, handle empty state with text note
- [x] T022 [US3] Run tests to verify T020 passes

**Checkpoint**: Markdown export includes valid Mermaid erDiagram block that renders on GitHub/GitLab. User Story 3 works independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling and quality improvements across all stories

- [x] T023 [P] Verify ELK layout readability with 10+ entity mock data — test in `web/src/__tests__/lib/fmb/er-diagram-extractor.test.ts`
- [x] T024 [P] Verify multiple detail blocks referencing same parent produce distinct non-overlapping relationship lines
- [x] T025 Run full test suite (`npm test` in `web/`) to ensure no regressions
- [ ] T026 Manual integration test: upload real FMB XML file → verify Preview, Word export, and Markdown export all produce correct ER Diagrams

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types + npm packages) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (extraction logic)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs ReactFlow rendered in DOM for image capture)
- **User Story 3 (Phase 5)**: Depends on Phase 2 only (uses Mermaid generator, no DOM needed)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — core MVP
- **User Story 2 (P2)**: Depends on User Story 1 (needs ReactFlow DOM container for image capture)
- **User Story 3 (P3)**: Depends on Foundational only (Mermaid syntax is generated from ErDiagramData, no DOM needed) — can run in parallel with US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Utility/logic modules before UI components
- Core implementation before integration into existing files
- Story complete before moving to next priority

### Parallel Opportunities

- T002 (types) can run in parallel with T001 (npm install)
- T003 + T004 (foundational tests) can run in parallel
- T008 + T009 (US1 tests) can run in parallel
- T010 + T011 (Mermaid generator + entity node component) can run in parallel
- US3 (Markdown export) can start in parallel with US1 after Phase 2 completes

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Write Mermaid syntax tests in web/src/__tests__/lib/fmb/er-diagram-mermaid.test.ts"
Task: "Write ER Diagram section tests in web/src/__tests__/components/fmb/er-diagram-section.test.ts"

# Launch US1 parallel implementation:
Task: "Implement Mermaid generator in web/src/lib/fmb/er-diagram-mermaid.ts"
Task: "Create entity node component in web/src/components/fmb/er-entity-node.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps, create types)
2. Complete Phase 2: Foundational (extraction logic + tests)
3. Complete Phase 3: User Story 1 (visual ER Diagram in Preview tab)
4. **STOP and VALIDATE**: Upload FMB XML → verify ER Diagram displays correctly
5. Demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Extraction logic ready
2. Add User Story 1 → ER Diagram visible in Preview tab → Demo (MVP!)
3. Add User Story 3 → Mermaid in Markdown export (can parallelize with US2)
4. Add User Story 2 → PNG image in Word export
5. Polish → edge cases, large diagram testing, full regression

### Note on US2 vs US3 Order

Although US2 (Word export) is higher priority than US3 (Markdown export), US3 has no dependency on US1's DOM rendering and can start earlier. Consider implementing US3 before or in parallel with US2 for efficiency.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD mandatory: write tests → verify they fail → implement → verify they pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
