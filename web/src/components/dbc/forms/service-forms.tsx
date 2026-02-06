'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { AddServiceOp, ModifyServiceOp, DropServiceOp } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function AddServiceForm({ value, onChange }: FormProps<AddServiceOp>) {
  const u = (p: Partial<AddServiceOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Service Name *</Label><Input value={value.servicename} onChange={(e) => u({ servicename: e.target.value })} /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Classname *</Label><Input value={value.classname} onChange={(e) => u({ classname: e.target.value })} /></div>
      <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.singleton !== false} onCheckedChange={(c) => u({ singleton: c === true ? undefined : false })} />Singleton</label>
    </div>
  );
}

export function ModifyServiceForm({ value, onChange }: FormProps<ModifyServiceOp>) {
  const u = (p: Partial<ModifyServiceOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Service Name *</Label><Input value={value.servicename} onChange={(e) => u({ servicename: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Classname</Label><Input value={value.classname || ''} onChange={(e) => u({ classname: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function DropServiceForm({ value, onChange }: FormProps<DropServiceOp>) {
  return (<div><Label className="text-xs">Service Name *</Label><Input value={value.servicename} onChange={(e) => onChange({ ...value, servicename: e.target.value })} /></div>);
}
