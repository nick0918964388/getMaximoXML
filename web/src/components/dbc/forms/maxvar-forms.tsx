'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateMaxvarOp, ModifyMaxvarOp, DropMaxvarOp, MaxvarType } from '@/lib/dbc/types';

const MAXVAR_TYPES: MaxvarType[] = ['system', 'site', 'organization', 'system_tenant'];

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function CreateMaxvarForm({ value, onChange }: FormProps<CreateMaxvarOp>) {
  const u = (p: Partial<CreateMaxvarOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
        <div><Label className="text-xs">Type *</Label>
          <Select value={value.maxvarType} onValueChange={(v) => u({ maxvarType: v as MaxvarType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MAXVAR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Default</Label><Input value={value.default || ''} onChange={(e) => u({ default: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function ModifyMaxvarForm({ value, onChange }: FormProps<ModifyMaxvarOp>) {
  const u = (p: Partial<ModifyMaxvarOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
      <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
      <div><Label className="text-xs">Default</Label><Input value={value.default || ''} onChange={(e) => u({ default: e.target.value || undefined })} /></div>
    </div>
  );
}

export function DropMaxvarForm({ value, onChange }: FormProps<DropMaxvarOp>) {
  return (<div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>);
}
