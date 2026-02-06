'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AddPropertyOp, SetPropertyOp, DropPropertyOp, PropertyMaxType, PropertySecureLevel } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function AddPropertyForm({ value, onChange }: FormProps<AddPropertyOp>) {
  const u = (p: Partial<AddPropertyOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
        <div><Label className="text-xs">MaxType *</Label>
          <Select value={value.maxtype} onValueChange={(v) => u({ maxtype: v as PropertyMaxType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALN">ALN</SelectItem><SelectItem value="INTEGER">INTEGER</SelectItem><SelectItem value="YORN">YORN</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Secure Level *</Label>
          <Select value={value.secure_level} onValueChange={(v) => u({ secure_level: v as PropertySecureLevel })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="public">public</SelectItem><SelectItem value="private">private</SelectItem><SelectItem value="secure">secure</SelectItem><SelectItem value="mtsecure">mtsecure</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Default Value</Label><Input value={value.default_value || ''} onChange={(e) => u({ default_value: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Value</Label><Input value={value.value || ''} onChange={(e) => u({ value: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function SetPropertyForm({ value, onChange }: FormProps<SetPropertyOp>) {
  const u = (p: Partial<SetPropertyOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
      <div><Label className="text-xs">Value *</Label><Input value={value.value} onChange={(e) => u({ value: e.target.value })} /></div>
    </div>
  );
}

export function DropPropertyForm({ value, onChange }: FormProps<DropPropertyOp>) {
  return (<div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></div>);
}
