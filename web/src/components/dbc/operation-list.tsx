'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, Trash2, Copy } from 'lucide-react';
import type { DbcOperationEntry, DbcOperationType } from '@/lib/dbc/types';

interface OperationListProps {
  operations: DbcOperationEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function getOperationLabel(type: DbcOperationType): string {
  return type.replace(/_/g, ' ');
}

function getCategoryColor(type: DbcOperationType): string {
  if (type.includes('table')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (type.includes('attribute')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (type.includes('relationship')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (type.includes('domain') || type.includes('synonym')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  if (type.includes('index')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (type.includes('app') || type.includes('sigoption')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (type.includes('module')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
  if (type.includes('view')) return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
  if (type.includes('service')) return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
  if (type.includes('property')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  if (type.includes('maxvar')) return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

function getOperationSummary(op: DbcOperationEntry): string {
  const o = op.operation;
  switch (o.type) {
    case 'define_table': return o.object;
    case 'modify_table': return o.name;
    case 'drop_table': return o.object;
    case 'add_attributes': return `${o.object} (${o.attributes.length})`;
    case 'modify_attribute': return `${o.object}.${o.attribute}`;
    case 'drop_attributes': return `${o.object} (${o.attributes.length})`;
    case 'create_relationship': return `${o.parent}.${o.name}`;
    case 'modify_relationship': return `${o.parent}.${o.name}`;
    case 'drop_relationship': return `${o.parent}.${o.name}`;
    case 'specify_synonym_domain': case 'specify_aln_domain':
    case 'specify_numeric_domain': case 'specify_crossover_domain':
    case 'specify_table_domain': return o.domainid;
    case 'add_synonyms': return o.domainid;
    case 'modify_domain_type': return o.domain;
    case 'drop_domain': return o.domainid;
    case 'specify_index': return o.name || o.object;
    case 'drop_index': return o.name || o.object;
    case 'create_app': case 'modify_app': case 'drop_app': return o.app;
    case 'create_app_menu': case 'additional_app_menu': return o.app;
    case 'add_sigoption': return `${o.app}.${o.optionname}`;
    case 'drop_sigoption': return `${o.app}.${o.optionname}`;
    case 'create_module': case 'modify_module': case 'drop_module': return o.module;
    case 'module_app': return `${o.module}.${o.app}`;
    case 'define_view': case 'modify_view': case 'drop_view': return o.name;
    case 'add_view_attribute': return `${o.view}.${o.view_column}`;
    case 'drop_view_attribute': return `${o.view}.${o.attribute}`;
    case 'modify_view_attributes': return o.view;
    case 'add_service': case 'modify_service': case 'drop_service': return o.servicename;
    case 'add_property': case 'set_property': case 'drop_property': return o.name;
    case 'create_maxvar': case 'modify_maxvar': case 'drop_maxvar': return o.name;
    case 'insert': return o.table;
    case 'freeform': return o.description;
    default: return '';
  }
}

export function OperationList({
  operations, selectedId, onSelect, onReorder, onRemove, onDuplicate,
}: OperationListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-1">
        {operations.map((entry, index) => (
          <div
            key={entry.id}
            className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
              selectedId === entry.id
                ? 'bg-accent border border-accent-foreground/20'
                : 'hover:bg-accent/50'
            }`}
            onClick={() => onSelect(entry.id)}
          >
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{index + 1}</span>
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getCategoryColor(entry.operation.type)}`}>
                {getOperationLabel(entry.operation.type)}
              </Badge>
              <div className="text-xs text-muted-foreground truncate mt-0.5">{getOperationSummary(entry)}</div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); if (index > 0) onReorder(index, index - 1); }} disabled={index === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); if (index < operations.length - 1) onReorder(index, index + 1); }} disabled={index === operations.length - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); onDuplicate(entry.id); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {operations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No operations. Click &quot;Add Operation&quot; to get started.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
