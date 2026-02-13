# Implementation Plan: FMB ER Diagram 實體關聯圖

**Branch**: `004-fmb-er-diagram` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-fmb-er-diagram/spec.md`

## Summary

Add an ER Diagram section to the FMB Converter's spec document panel that automatically visualizes entity (table) relationships extracted from parsed Oracle Forms XML. The diagram renders inline within the Preview tab using ReactFlow + ELK.js for interactive auto-layout, exports to PNG for Word documents, and generates Mermaid erDiagram syntax for Markdown files. Header, detail, and LOV external reference entities are visually distinguished with different styles, and LOV references are toggleable to keep the diagram clean.

## Technical Context

**Language/Version**: TypeScript (ES2022) with Next.js 14.2.35 + React 18
**Primary Dependencies**: @xyflow/react (ReactFlow v12), elkjs, html-to-image, existing docx package
**Storage**: N/A (pure client-side, no persistence needed)
**Testing**: Vitest with jsdom environment
**Target Platform**: Browser (client-side rendering)
**Project Type**: Web application (existing Next.js project)
**Performance Goals**: ER Diagram renders within 3 seconds for up to 15 entities
**Constraints**: No server-side dependencies; must integrate into existing spec-panel.tsx
**Scale/Scope**: Typical FMB forms have 1-10 blocks; edge case up to 15+

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is template/placeholder — no project-specific gates defined. Proceeding with project conventions:

- [x] **TDD mandatory**: Tests written first, then implementation (per CLAUDE.md)
- [x] **Existing patterns preserved**: Follows spec-generator → UI component pattern
- [x] **No unnecessary abstractions**: Direct extraction from FormSpec, minimal new types
- [x] **Browser-only**: No new server-side API routes needed

## Project Structure

### Documentation (this feature)

```text
specs/004-fmb-er-diagram/
├── plan.md              # This file
├── research.md          # Phase 0: library research & decisions
├── data-model.md        # Phase 1: ErEntity, ErField, ErRelationship types
├── quickstart.md        # Phase 1: setup & architecture overview
├── contracts/           # Phase 1: internal API contracts
│   └── er-diagram-api.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
web/src/
├── lib/fmb/
│   ├── er-diagram-types.ts        # NEW: ErEntity, ErField, ErRelationship, ErDiagramData
│   ├── er-diagram-extractor.ts    # NEW: FormSpec → ErDiagramData extraction
│   ├── er-diagram-mermaid.ts      # NEW: ErDiagramData → Mermaid syntax string
│   ├── spec-generator.ts          # MODIFIED: add Mermaid ER section to markdown output
│   └── word-generator.ts          # MODIFIED: add ER Diagram image section
├── components/fmb/
│   ├── er-diagram-section.tsx     # NEW: inline ER Diagram with ReactFlow + LOV toggle
│   ├── er-entity-node.tsx         # NEW: custom ReactFlow node for entity boxes
│   └── spec-panel.tsx             # MODIFIED: insert ErDiagramSection in Preview tab

web/src/__tests__/lib/fmb/
├── er-diagram-extractor.test.ts   # NEW: extraction logic tests
├── er-diagram-mermaid.test.ts     # NEW: Mermaid syntax generation tests

web/src/__tests__/components/fmb/
├── er-diagram-section.test.ts     # NEW: component rendering tests
```

**Structure Decision**: Follows existing `web/src/lib/fmb/` pattern for business logic and `web/src/components/fmb/` for UI. New files colocated with existing FMB modules. No new directories needed beyond test files.

## Complexity Tracking

No constitution violations to justify.

## Implementation Phases

### Phase A: Core Data Extraction (P1 — MVP foundation)

**Goal**: Extract ER diagram data from FormSpec, generate Mermaid syntax

| Task | File | Tests |
|------|------|-------|
| Define types | `er-diagram-types.ts` | Type-only, no tests needed |
| Extract entities from blocks | `er-diagram-extractor.ts` | Header/detail classification, field selection |
| Extract relationships | `er-diagram-extractor.ts` | Parent-child detection, LOV external refs |
| Generate Mermaid syntax | `er-diagram-mermaid.ts` | Syntax validity, cardinality notation |

**Key extraction rules**:
- Header entity: items on CANVAS_BODY or singleRecord=true
- Detail entity: items on CANVAS_TAB with tabPage
- Key fields: required=true OR lovName present OR name matches PK pattern (*_ID, *_NO, *_CODE)
- External refs: parse RecordGroup SQL for FROM table name

### Phase B: Visual Rendering (P1 — core feature)

**Goal**: Render interactive ER Diagram in Preview tab

| Task | File | Tests |
|------|------|-------|
| Custom entity node | `er-entity-node.tsx` | Render with correct styles per entityType |
| ER Diagram section | `er-diagram-section.tsx` | ReactFlow + ELK layout, LOV toggle |
| Integrate into spec panel | `spec-panel.tsx` | Insert after 畫面規格, before LOV |

**Visual styling**:
- Header: blue border + blue header bar (`border-blue-600 bg-blue-50`)
- Detail: green border + green header bar (`border-green-600 bg-green-50`)
- External: gray dashed border (`border-gray-400 bg-gray-50 border-dashed`)
- Relationships: solid lines (parent-child), dashed lines (LOV reference)

### Phase C: Export Integration (P2 + P3)

**Goal**: Embed ER Diagram in Word and Markdown exports

| Task | File | Tests |
|------|------|-------|
| Word export: capture diagram as PNG | `word-generator.ts` | Image section generated |
| Markdown export: insert Mermaid block | `spec-generator.ts` | Mermaid syntax in markdown output |

**Word export flow**: `html-to-image.toPng()` → `ArrayBuffer` → `docx.ImageRun`
**Markdown export flow**: `toMermaidErDiagram()` → fenced code block with `mermaid` language tag

### Phase D: Edge Cases & Polish

**Goal**: Handle boundary conditions from spec

| Task | Description |
|------|-------------|
| Empty state | No data blocks → show "無可繪製的實體資料" message |
| No queryDataSource | Block without baseTable → show with "無資料來源" badge |
| Many entities | 10+ entities → verify ELK layout remains readable |
| Multiple children | Multiple detail blocks to same parent → distinct relationship lines |

## Dependencies

```
Phase A (data extraction) → Phase B (visual rendering)
Phase A (Mermaid syntax) → Phase C (markdown export)
Phase B (ReactFlow rendering) → Phase C (Word export — needs DOM for image capture)
Phase B + C → Phase D (polish)
```

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| ELK.js layout quality for large diagrams | Configure spacing parameters; test with 15-entity mock data |
| html-to-image capture reliability | Test across browsers; fallback to SVG if PNG fails |
| RecordGroup SQL parsing for LOV tables | Best-effort regex; gracefully skip unparseable SQL |
| ReactFlow SSR compatibility | Use `'use client'` directive; component is client-only |
