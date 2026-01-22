# Tasks: Add Menu System

**Input**: Design documents from `/specs/001-add-menu-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: TDD approach required (per project constitution) - write tests first, ensure they fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/`, `web/tests/` based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shadcn/ui component installation

- [X] T001 Install shadcn/ui sidebar component via `npx shadcn-ui@latest add sidebar` in web/
- [X] T002 [P] Install shadcn/ui sheet component via `npx shadcn-ui@latest add sheet` in web/
- [X] T003 [P] Install shadcn/ui skeleton component via `npx shadcn-ui@latest add skeleton` in web/
- [X] T004 [P] Install shadcn/ui tooltip component via `npx shadcn-ui@latest add tooltip` in web/
- [X] T005 Create menu configuration directory structure at web/src/config/
- [X] T006 Create hooks directory structure at web/src/hooks/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create ToolConfig and MenuConfig TypeScript interfaces in web/src/config/menu.ts
- [X] T008 Create use-mobile hook for responsive detection in web/src/hooks/use-mobile.ts
- [X] T009 Create tests directory structure at web/tests/unit/ and web/tests/integration/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Access Different Tools via Menu (Priority: P1) MVP

**Goal**: Enable users to access different tools via a sidebar menu with navigation capability

**Independent Test**: Click menu items and verify navigation to correct tool pages (e.g., /tools/xml-generator)

### Tests for User Story 1 (TDD - Write First, Ensure Fail)

- [X] T010 [P] [US1] Unit test for menu configuration exports in web/tests/unit/menu-config.test.ts
- [X] T011 [P] [US1] Integration test for sidebar navigation in web/tests/integration/sidebar.test.tsx

### Implementation for User Story 1

- [X] T012 [US1] Implement menuConfig with initial XML generator tool in web/src/config/menu.ts
- [X] T013 [US1] Create AppSidebar component with SidebarMenu in web/src/components/app-sidebar.tsx
- [X] T014 [US1] Create NavMain component for tool list rendering in web/src/components/nav-main.tsx
- [X] T015 [US1] Update root layout.tsx to wrap with SidebarProvider in web/src/app/layout.tsx
- [X] T016 [US1] Create tools directory structure at web/src/app/tools/
- [X] T017 [US1] Move existing XML generator content to web/src/app/tools/xml-generator/page.tsx
- [X] T018 [US1] Update root page.tsx to redirect to /tools/xml-generator in web/src/app/page.tsx

**Checkpoint**: User Story 1 complete - sidebar displays and navigates to XML generator tool

---

## Phase 4: User Story 2 - Visual Indication of Current Tool (Priority: P2)

**Goal**: Highlight the currently active tool in the menu for user orientation

**Independent Test**: Navigate to different tools and verify the active tool is visually highlighted in the sidebar

### Tests for User Story 2 (TDD - Write First, Ensure Fail)

- [X] T019 [P] [US2] Unit test for getToolByPath helper function in web/tests/unit/menu-config.test.ts
- [X] T020 [P] [US2] Integration test for active state highlighting in web/tests/integration/sidebar.test.tsx

### Implementation for User Story 2

- [X] T021 [US2] Implement getToolByPath helper function in web/src/config/menu.ts
- [X] T022 [US2] Add usePathname hook integration to NavMain in web/src/components/nav-main.tsx
- [X] T023 [US2] Add isActive prop logic to SidebarMenuButton in web/src/components/nav-main.tsx

**Checkpoint**: User Story 2 complete - current tool shows active state in sidebar

---

## Phase 5: User Story 3 - Extensible Menu Structure (Priority: P3)

**Goal**: Provide config-driven menu that auto-updates when new tools are added or disabled

**Independent Test**: Add a test tool to config and verify it appears in menu; disable it and verify it disappears

### Tests for User Story 3 (TDD - Write First, Ensure Fail)

- [X] T024 [P] [US3] Unit test for getEnabledTools filtering in web/tests/unit/menu-config.test.ts
- [X] T025 [P] [US3] Unit test for getToolById lookup in web/tests/unit/menu-config.test.ts
- [X] T026 [P] [US3] Integration test for disabled tool hiding in web/tests/integration/sidebar.test.tsx

### Implementation for User Story 3

- [X] T027 [US3] Implement getEnabledTools helper function in web/src/config/menu.ts
- [X] T028 [US3] Implement getToolById helper function in web/src/config/menu.ts
- [X] T029 [US3] Update NavMain to use getEnabledTools for rendering in web/src/components/nav-main.tsx
- [X] T030 [US3] Add validation for ToolConfig fields (id format, path prefix) in web/src/config/menu.ts

**Checkpoint**: User Story 3 complete - menu auto-updates based on configuration

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Responsive design, edge cases, and final validation

- [X] T031 [P] Add mobile responsive behavior using Sheet component in web/src/components/app-sidebar.tsx
- [X] T032 [P] Add keyboard shortcut (Ctrl+B) for sidebar toggle in web/src/app/layout.tsx
- [X] T033 Handle edge case: long tool names with truncation in web/src/components/nav-main.tsx
- [X] T034 Handle edge case: single tool menu display in web/src/components/nav-main.tsx
- [X] T035 Run all tests and verify pass with `npm test` in web/
- [X] T036 Run quickstart.md validation steps manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories should proceed sequentially (P1 → P2 → P3) for TDD flow
  - Or in parallel if different developers work on each
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 components but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1 architecture but independently testable

### Within Each User Story (TDD Flow)

1. Tests MUST be written and FAIL before implementation
2. Configuration/interfaces before components
3. Components before layout integration
4. Core implementation before edge cases

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004 can run in parallel (different shadcn/ui components)

**Phase 2 (Foundational)**:
- T007, T008 can run in parallel (different files)

**Phase 3 (US1)**:
- T010, T011 can run in parallel (different test files)

**Phase 4 (US2)**:
- T019, T020 can run in parallel (different test scopes)

**Phase 5 (US3)**:
- T024, T025, T026 can run in parallel (different test cases)

**Phase 6 (Polish)**:
- T031, T032 can run in parallel (different concerns)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all shadcn/ui component installs together:
Task: "Install shadcn/ui sheet component via npx shadcn-ui@latest add sheet in web/"
Task: "Install shadcn/ui skeleton component via npx shadcn-ui@latest add skeleton in web/"
Task: "Install shadcn/ui tooltip component via npx shadcn-ui@latest add tooltip in web/"
```

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 tests together (TDD - should fail initially):
Task: "Unit test for menu configuration exports in web/tests/unit/menu-config.test.ts"
Task: "Integration test for sidebar navigation in web/tests/integration/sidebar.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install shadcn/ui components)
2. Complete Phase 2: Foundational (interfaces, hooks, test structure)
3. Complete Phase 3: User Story 1 (TDD: tests → implementation)
4. **STOP and VALIDATE**: Test sidebar navigation independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (active state highlighting)
4. Add User Story 3 → Test independently → Deploy/Demo (extensible config)
5. Complete Polish → Final validation

### TDD Workflow Per Story

1. Write test file(s) for the story
2. Run tests - verify they FAIL
3. Implement minimum code to pass tests
4. Refactor if needed
5. Commit when tests pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- TDD required: Write tests first, ensure they fail before implementation
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
