# Data Model: FMB ER Diagram

**Date**: 2026-02-12 | **Branch**: `004-fmb-er-diagram`

## Entities

### ErEntity

Represents a single data block mapped to a database table in the ER diagram.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (block name) |
| blockName | string | FMB block name (e.g., "B1PCS1005") |
| tableName | string | Base table name from queryDataSource (e.g., "PCS1005") |
| entityType | "header" \| "detail" \| "external" | Visual classification |
| fields | ErField[] | Key fields to display (PK, FK, required only) |

### ErField

Represents a key field displayed within an entity box.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Column/field name |
| dataType | string | Data type (Char, Date, Integer, etc.) |
| fieldRole | "pk" \| "fk" \| "required" | Why this field is shown |
| lovName | string? | LOV reference name (present for FK fields) |

### ErRelationship

Represents a connection between two entities.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| sourceEntityId | string | Parent entity ID (header block) |
| targetEntityId | string | Child entity ID (detail block or external) |
| cardinality | "1:N" | Relationship cardinality |
| lineStyle | "solid" \| "dashed" | Solid for parent-child, dashed for LOV reference |
| label | string? | Optional relationship label |

### ErDiagramData

Top-level container for diagram rendering.

| Field | Type | Description |
|-------|------|-------------|
| entities | ErEntity[] | All entities to display |
| relationships | ErRelationship[] | All connections between entities |
| formName | string | Source FMB form name |
| showExternalRefs | boolean | Whether LOV external references are visible |

## Relationships

```
ErDiagramData 1--* ErEntity : contains
ErDiagramData 1--* ErRelationship : contains
ErEntity 1--* ErField : has fields
ErRelationship *--1 ErEntity : source (parent)
ErRelationship *--1 ErEntity : target (child)
```

## Data Flow

```
FmbModule (parsed XML)
    → FormSpec (spec-generator.ts)
        → ErDiagramData (er-diagram-extractor)
            → ReactFlow nodes/edges (er-diagram component)
            → Mermaid syntax string (markdown export)
            → PNG image (Word export)
```

## Extraction Rules

1. **Header entities**: Blocks where items appear on CANVAS_BODY or singleRecord=true
2. **Detail entities**: Blocks where items appear on CANVAS_TAB with tabPage
3. **External entities**: Tables referenced in LOV RecordGroup SQL (FROM clause), only shown when toggle enabled
4. **Key field selection**: Include field if `required=true` OR `lovName` is present OR field name matches common PK patterns (e.g., ends with `_ID`, `_NO`, `_CODE`)
5. **Relationship creation**: Each detail block creates a 1:N relationship from the header block
6. **LOV relationship**: Each LOV with parseable RecordGroup SQL creates a dashed relationship from the entity containing the LOV field to the external table
