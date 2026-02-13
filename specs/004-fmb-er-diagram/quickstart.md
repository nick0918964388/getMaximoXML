# Quickstart: FMB ER Diagram

**Date**: 2026-02-12 | **Branch**: `004-fmb-er-diagram`

## Prerequisites

```bash
cd web
npm install @xyflow/react elkjs html-to-image
```

## New Files

### Business Logic (`web/src/lib/fmb/`)

| File | Purpose |
|------|---------|
| `er-diagram-types.ts` | ErEntity, ErField, ErRelationship, ErDiagramData types |
| `er-diagram-extractor.ts` | Extract ErDiagramData from FormSpec |
| `er-diagram-mermaid.ts` | Generate Mermaid erDiagram syntax string |

### UI Components (`web/src/components/fmb/`)

| File | Purpose |
|------|---------|
| `er-diagram-section.tsx` | Inline section in spec preview — renders ReactFlow diagram |
| `er-entity-node.tsx` | Custom ReactFlow node for entity boxes |

### Modified Files

| File | Change |
|------|--------|
| `spec-panel.tsx` | Add ER Diagram section within Preview tab content |
| `spec-generator.ts` | No change — FormSpec already has all needed data |
| `word-generator.ts` | Add `generateErDiagramSection()` for Word export |
| `spec-generator.ts` (markdown) | Add Mermaid erDiagram block in `generateMarkdownSpec()` |

## Architecture

```
FormSpec (existing)
    │
    ├── er-diagram-extractor.ts ──→ ErDiagramData
    │       │
    │       ├── er-diagram-section.tsx ──→ ReactFlow + ELK.js ──→ Visual Preview
    │       │                                                  └──→ html-to-image ──→ PNG ──→ Word
    │       │
    │       └── er-diagram-mermaid.ts ──→ Mermaid syntax ──→ Markdown
    │
    └── (existing spec sections unchanged)
```

## TDD Workflow

1. Write tests for `er-diagram-extractor.ts` — extraction logic from FormSpec to ErDiagramData
2. Write tests for `er-diagram-mermaid.ts` — Mermaid syntax generation
3. Write tests for entity classification (header/detail/external)
4. Write tests for key field selection logic
5. Implement business logic to pass tests
6. Build UI components with visual verification

## Key Patterns

- **Entity node styling**: Use Tailwind classes — `border-blue-600 bg-blue-50` (header), `border-green-600 bg-green-50` (detail), `border-gray-400 bg-gray-50 border-dashed` (external)
- **ReactFlow read-only**: Set `nodesDraggable={false}`, `nodesConnectable={false}`, `panOnDrag={true}`, `zoomOnScroll={true}`
- **ELK layout**: Algorithm `layered`, direction `DOWN`, spacing 50px node-node, 80px between layers
- **Word image**: Capture `.react-flow__viewport` via `toPng()`, embed with `docx.ImageRun`
