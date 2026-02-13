'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import type { ErEntityType, ErField } from '@/lib/fmb/er-diagram-types';

export interface ErEntityNodeData {
  blockName: string;
  tableName: string;
  entityType: ErEntityType;
  fields: ErField[];
  [key: string]: unknown;
}

const ENTITY_STYLES: Record<ErEntityType, { border: string; headerBg: string; bodyBg: string }> = {
  header: {
    border: 'border-blue-600',
    headerBg: 'bg-blue-600 text-white',
    bodyBg: 'bg-blue-50',
  },
  detail: {
    border: 'border-green-600',
    headerBg: 'bg-green-600 text-white',
    bodyBg: 'bg-green-50',
  },
  external: {
    border: 'border-gray-400 border-dashed',
    headerBg: 'bg-gray-500 text-white',
    bodyBg: 'bg-gray-50',
  },
};

const ROLE_LABELS: Record<string, string> = {
  pk: 'PK',
  fk: 'FK',
  required: 'REQ',
};

function ErEntityNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as ErEntityNodeData;
  const { blockName, tableName, entityType, fields } = nodeData;
  const styles = ENTITY_STYLES[entityType];

  return (
    <div className={`rounded border-2 min-w-[200px] max-w-[280px] shadow-sm ${styles.border} ${styles.bodyBg}`}>
      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />

      {/* Header */}
      <div className={`px-3 py-1.5 font-bold text-sm rounded-t ${styles.headerBg}`}>
        {tableName || '(no table)'}
      </div>

      {/* Block name subtitle */}
      <div className="px-3 py-0.5 text-xs text-muted-foreground border-b">
        {blockName}
        {!tableName && (
          <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
            無資料來源
          </Badge>
        )}
      </div>

      {/* Fields */}
      {fields.length > 0 && (
        <div className="px-3 py-1 space-y-0.5">
          {fields.map(field => (
            <div key={field.name} className="flex items-center gap-1 text-xs font-mono">
              <span className="text-muted-foreground w-6 text-right text-[10px]">
                {ROLE_LABELS[field.fieldRole] || ''}
              </span>
              <span className="truncate">{field.name}</span>
              <span className="text-muted-foreground ml-auto text-[10px]">{field.dataType}</span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

export const ErEntityNode = memo(ErEntityNodeComponent);
