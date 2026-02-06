'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TableTypeSelect } from './shared/table-type-select';
import { AttrDefEditor } from './shared/attrdef-editor';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { DefineTableOp, ModifyTableOp, DropTableOp, StorageType } from '@/lib/dbc/types';

const STORAGE_TYPES: StorageType[] = [
  'tenant', 'master', 'system', 'template', 'system_resource',
  'master_with_setup', 'template_with_setup', 'tenant_monitor',
];

interface FormProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export function DefineTableForm({ value, onChange }: FormProps<DefineTableOp>) {
  const update = (p: Partial<DefineTableOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => update({ object: e.target.value })} placeholder="MYOBJECT" /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => update({ description: e.target.value })} /></div>
        <div><Label className="text-xs">Service *</Label><Input value={value.service} onChange={(e) => update({ service: e.target.value })} placeholder="ASSET" /></div>
        <div><Label className="text-xs">Classname *</Label><Input value={value.classname} onChange={(e) => update({ classname: e.target.value })} placeholder="psdi.mbo.custapp.CustomSet" /></div>
        <div><Label className="text-xs">Type *</Label><TableTypeSelect value={value.tableType} onValueChange={(v) => update({ tableType: v as DefineTableOp['tableType'] })} /></div>
        <div><Label className="text-xs">Storage Type</Label>
          <Select value={value.storagetype || ''} onValueChange={(v) => update({ storagetype: (v || undefined) as StorageType })}>
            <SelectTrigger><SelectValue placeholder="(default: tenant)" /></SelectTrigger>
            <SelectContent>{STORAGE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Primary Key</Label><Input value={value.primarykey || ''} onChange={(e) => update({ primarykey: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Trig Root</Label><Input value={value.trigroot || ''} onChange={(e) => update({ trigroot: e.target.value || undefined })} /></div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.mainobject ?? false} onCheckedChange={(c) => update({ mainobject: c === true ? true : undefined })} />Main Object</label>
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.internal ?? false} onCheckedChange={(c) => update({ internal: c === true ? true : undefined })} />Internal</label>
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.persistent !== false} onCheckedChange={(c) => update({ persistent: c === true ? undefined : false })} />Persistent</label>
      </div>
      <AttrDefEditor attributes={value.attributes} onChange={(attrs) => update({ attributes: attrs })} />
    </div>
  );
}

export function ModifyTableForm({ value, onChange }: FormProps<ModifyTableOp>) {
  const update = (p: Partial<ModifyTableOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => update({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => update({ description: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Service</Label><Input value={value.service || ''} onChange={(e) => update({ service: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Classname</Label><Input value={value.classname || ''} onChange={(e) => update({ classname: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Type</Label><TableTypeSelect value={value.tableType || ''} onValueChange={(v) => update({ tableType: (v || undefined) as ModifyTableOp['tableType'] })} /></div>
        <div><Label className="text-xs">Primary Key</Label><Input value={value.primarykey || ''} onChange={(e) => update({ primarykey: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function DropTableForm({ value, onChange }: FormProps<DropTableOp>) {
  return (
    <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => onChange({ ...value, object: e.target.value })} /></div>
  );
}
