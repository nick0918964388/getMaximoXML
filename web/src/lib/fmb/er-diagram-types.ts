/**
 * ER Diagram types for FMB spec document visualization
 */

/** Why a field is displayed in the ER diagram */
export type ErFieldRole = 'pk' | 'fk' | 'required';

/** Visual classification of an entity */
export type ErEntityType = 'header' | 'detail' | 'external';

/** Line style for relationship connections */
export type ErLineStyle = 'solid' | 'dashed';

/** A key field displayed within an entity box */
export interface ErField {
  /** Column/field name */
  name: string;
  /** Data type (Char, Date, Integer, etc.) */
  dataType: string;
  /** Why this field is shown */
  fieldRole: ErFieldRole;
  /** LOV reference name (present for FK fields) */
  lovName?: string;
}

/** A single entity (data block / table) in the ER diagram */
export interface ErEntity {
  /** Unique identifier (block name) */
  id: string;
  /** FMB block name (e.g., "B1PCS1005") */
  blockName: string;
  /** Base table name from queryDataSource (e.g., "PCS1005") */
  tableName: string;
  /** Visual classification */
  entityType: ErEntityType;
  /** Key fields to display (PK, FK, required only) */
  fields: ErField[];
}

/** A connection between two entities */
export interface ErRelationship {
  /** Unique identifier */
  id: string;
  /** Parent entity ID (header block) */
  sourceEntityId: string;
  /** Child entity ID (detail block or external) */
  targetEntityId: string;
  /** Relationship cardinality */
  cardinality: '1:N';
  /** Solid for parent-child, dashed for LOV reference */
  lineStyle: ErLineStyle;
  /** Optional relationship label */
  label?: string;
}

/** Top-level container for diagram rendering */
export interface ErDiagramData {
  /** All entities to display */
  entities: ErEntity[];
  /** All connections between entities */
  relationships: ErRelationship[];
  /** Source FMB form name */
  formName: string;
  /** Whether LOV external references are visible */
  showExternalRefs: boolean;
}
