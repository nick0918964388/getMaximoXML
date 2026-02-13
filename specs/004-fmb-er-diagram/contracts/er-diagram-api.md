# ER Diagram Internal API Contracts

**Date**: 2026-02-12 | **Branch**: `004-fmb-er-diagram`

> No REST API routes needed — this feature is entirely client-side.
> These contracts define the internal function signatures between modules.

## Extraction Contract

```typescript
// er-diagram-extractor.ts
export function extractErDiagram(spec: FormSpec): ErDiagramData;
```

**Input**: `FormSpec` (from existing `generateFormSpec()`)
**Output**: `ErDiagramData` containing entities, relationships, formName
**Behavior**:
- Returns entities for all blocks with non-empty `baseTable`
- Creates 1:N relationships from header to each detail block
- External references extracted from LOV RecordGroup SQL (best-effort parsing)
- `showExternalRefs` defaults to `false`

## Mermaid Export Contract

```typescript
// er-diagram-mermaid.ts
export function toMermaidErDiagram(data: ErDiagramData): string;
```

**Input**: `ErDiagramData`
**Output**: Valid Mermaid erDiagram syntax string
**Behavior**:
- Includes only entities where `entityType !== 'external'` OR `showExternalRefs === true`
- Uses Mermaid cardinality notation: `||--o{` for 1:N
- Field types mapped to Mermaid-compatible names
- PK/FK annotations included

## Word Export Contract

```typescript
// word-generator.ts (extended)
export function generateErDiagramImage(
  containerElement: HTMLElement
): Promise<{ data: ArrayBuffer; width: number; height: number }>;
```

**Input**: DOM element containing ReactFlow viewport
**Output**: PNG image data with dimensions
**Behavior**:
- Captures current diagram state including all visible entities
- White background (#ffffff)
- Minimum resolution: 1200px width for print quality

## Toggle Contract

```typescript
// er-diagram-section.tsx
interface ErDiagramSectionProps {
  spec: FormSpec;
}
// Internal state: showExternalRefs (boolean toggle)
```

**Behavior**:
- Toggle button labeled "顯示 LOV 外部參照"
- When toggled ON: re-extract with external refs, re-layout
- When toggled OFF: remove external entities and their relationships
