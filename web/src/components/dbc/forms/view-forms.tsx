'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TableTypeSelect } from './shared/table-type-select';
import type { DefineViewOp, ModifyViewOp, DropViewOp, AddViewAttributeOp, DropViewAttributeOp, ModifyViewAttributesOp } from '@/lib/dbc/types';

const VIEW_TYPES = [
  'system', 'site', 'companyset', 'itemset', 'org', 'orgappfilter',
  'orgsite', 'siteappfilter', 'systemappfilter', 'systemorg', 'systemorgsite', 'systemsite',
] as const;

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function DefineViewForm({ value, onChange }: FormProps<DefineViewOp>) {
  const u = (p: Partial<DefineViewOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
        <div><Label className="text-xs">Service *</Label><Input value={value.service} onChange={(e) => u({ service: e.target.value })} /></div>
        <div><Label className="text-xs">Classname *</Label><Input value={value.classname} onChange={(e) => u({ classname: e.target.value })} /></div>
        <div><Label className="text-xs">Type *</Label><TableTypeSelect value={value.viewType} onValueChange={(v) => u({ viewType: v as DefineViewOp['viewType'] })} types={VIEW_TYPES} /></div>
      </div>
      <div><Label className="text-xs">View Where *</Label><Textarea value={value.view_where} onChange={(e) => u({ view_where: e.target.value })} rows={2} /></div>
    </div>
  );
}

export function ModifyViewForm({ value, onChange }: FormProps<ModifyViewOp>) {
  const u = (p: Partial<ModifyViewOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
      </div>
      <div><Label className="text-xs">View Where</Label><Textarea value={value.view_where || ''} onChange={(e) => u({ view_where: e.target.value || undefined })} rows={2} /></div>
    </div>
  );
}

export function DropViewForm({ value, onChange }: FormProps<DropViewOp>) {
  return (<div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>);
}

export function AddViewAttributeForm({ value, onChange }: FormProps<AddViewAttributeOp>) {
  const u = (p: Partial<AddViewAttributeOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">View *</Label><Input value={value.view} onChange={(e) => u({ view: e.target.value })} /></div>
      <div><Label className="text-xs">View Column *</Label><Input value={value.view_column} onChange={(e) => u({ view_column: e.target.value })} /></div>
      <div><Label className="text-xs">Table *</Label><Input value={value.table} onChange={(e) => u({ table: e.target.value })} /></div>
      <div><Label className="text-xs">Column *</Label><Input value={value.column} onChange={(e) => u({ column: e.target.value })} /></div>
    </div>
  );
}

export function DropViewAttributeForm({ value, onChange }: FormProps<DropViewAttributeOp>) {
  const u = (p: Partial<DropViewAttributeOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">View *</Label><Input value={value.view} onChange={(e) => u({ view: e.target.value })} /></div>
      <div><Label className="text-xs">Attribute *</Label><Input value={value.attribute} onChange={(e) => u({ attribute: e.target.value })} /></div>
    </div>
  );
}

export function ModifyViewAttributesForm({ value, onChange }: FormProps<ModifyViewAttributesOp>) {
  const u = (p: Partial<ModifyViewAttributesOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">View *</Label><Input value={value.view} onChange={(e) => u({ view: e.target.value })} /></div>
      <p className="text-xs text-muted-foreground">View data modifications can be edited via the XML preview.</p>
    </div>
  );
}
