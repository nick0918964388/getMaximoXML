# Research: FMB ER Diagram

**Date**: 2026-02-12 | **Branch**: `004-fmb-er-diagram`

## Decision 1: Diagram Rendering Library

**Decision**: ReactFlow (`@xyflow/react`) + ELK.js for auto-layout + `html-to-image` for export

**Rationale**:
- Mermaid.js cannot style individual entities differently (no per-entity colors, solid vs dashed borders) — confirmed via GitHub issues #2673 and #3838. This is a hard blocker for FR-005 (different visual styles for header/detail/external).
- ReactFlow provides full custom React node components — complete control over entity box appearance via Tailwind CSS classes.
- ELK.js provides the best auto-layout algorithm (layered/Sugiyama) for hierarchical ER diagrams.
- `html-to-image` (toPng/toSvg) enables export for Word embedding.
- Combined gzipped size ~335 kB — smaller than Mermaid (~800 kB).

**Alternatives Considered**:
| Library | Rejected Because |
|---------|-----------------|
| Mermaid.js | Cannot style individual entities; all entities share same CSS class |
| D3.js | No built-in graph layout; massive implementation effort |
| ELK.js standalone | Layout only — need separate rendering layer |
| JointJS | Commercial license required for full features |
| GoJS | $3,995 per application license |

## Decision 2: Markdown Export Format

**Decision**: Generate Mermaid erDiagram syntax as pure string building (no mermaid library import)

**Rationale**:
- Mermaid erDiagram syntax is widely supported (GitHub, GitLab, Mermaid Live Editor)
- The syntax can be generated from the same data model used for ReactFlow nodes/edges
- No need to import the heavy mermaid library — just produce text output
- Example output:
  ```
  erDiagram
      PCS1005 ||--o{ PCS1006 : "has"
      PCS1005 {
          string SLIP_NO PK
          string SLIP_DATE
      }
  ```

**Alternatives Considered**:
- PlantUML: Less widely supported in Git platforms
- Custom ASCII art: Poor readability

## Decision 3: Word Export Strategy

**Decision**: Render ReactFlow diagram to PNG via `html-to-image`, embed in Word via `docx` `ImageRun`

**Rationale**:
- ReactFlow renders to DOM → `html-to-image` captures `.react-flow__viewport` as PNG
- `docx` npm package already used in project supports `ImageRun` for image embedding
- PNG format ensures compatibility across all Word versions

## Decision 4: Entity Data Extraction

**Decision**: Extract from `FormSpec.blocks[]` using existing classification logic

**Rationale**:
- `BlockSpec.baseTable` = entity/table name
- Header vs detail classification: `singleRecord` flag + canvas analysis (CANVAS_BODY = header, CANVAS_TAB = detail)
- Key fields identified by: `required: true` (mandatory), `lovName` present (foreign key reference)
- LOV external references: parse `RecordGroupSpec.sql` to extract FROM table names

## Decision 5: Auto-Layout Configuration

**Decision**: ELK.js layered algorithm with top-to-bottom direction

**Rationale**:
- `elk.algorithm: 'layered'` provides Sugiyama-style hierarchical layout
- `elk.direction: 'DOWN'` — header entity at top, detail entities below
- `elk.spacing.nodeNode: 50`, `elk.layered.spacing.nodeNodeBetweenLayers: 80` for readability
- LOV external references positioned to the side when toggle is enabled
