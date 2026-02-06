'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MaxTypeSelect } from './shared/maxtype-select';
import { AttrDefEditor } from './shared/attrdef-editor';
import { Plus, Trash2 } from 'lucide-react';
import type { AddAttributesOp, ModifyAttributeOp, DropAttributesOp } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function AddAttributesForm({ value, onChange }: FormProps<AddAttributesOp>) {
  const update = (p: Partial<AddAttributesOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => update({ object: e.target.value })} /></div>
      <AttrDefEditor attributes={value.attributes} onChange={(a) => update({ attributes: a })} />
    </div>
  );
}

export function ModifyAttributeForm({ value, onChange }: FormProps<ModifyAttributeOp>) {
  const update = (p: Partial<ModifyAttributeOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => update({ object: e.target.value })} /></div>
        <div><Label className="text-xs">Attribute *</Label><Input value={value.attribute} onChange={(e) => update({ attribute: e.target.value })} /></div>
        <div><Label className="text-xs">MaxType</Label><MaxTypeSelect value={value.maxtype} onValueChange={(v) => update({ maxtype: v as ModifyAttributeOp['maxtype'] })} /></div>
        <div><Label className="text-xs">Length</Label><Input type="number" value={value.length ?? ''} onChange={(e) => update({ length: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><Label className="text-xs">Title</Label><Input value={value.title || ''} onChange={(e) => update({ title: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Domain</Label><Input value={value.domain || ''} onChange={(e) => update({ domain: e.target.value || undefined })} /></div>
      </div>
      <div><Label className="text-xs">Remarks</Label><Input value={value.remarks || ''} onChange={(e) => update({ remarks: e.target.value || undefined })} /></div>
      <div><Label className="text-xs">Default Value</Label><Input value={value.defaultvalue || ''} onChange={(e) => update({ defaultvalue: e.target.value || undefined })} /></div>
    </div>
  );
}

export function DropAttributesForm({ value, onChange }: FormProps<DropAttributesOp>) {
  const update = (p: Partial<DropAttributesOp>) => onChange({ ...value, ...p });
  const addName = () => update({ attributes: [...value.attributes, { name: '' }] });
  const removeName = (i: number) => update({ attributes: value.attributes.filter((_, idx) => idx !== i) });
  const updateName = (i: number, name: string) => {
    const next = [...value.attributes];
    next[i] = { name };
    update({ attributes: next });
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => update({ object: e.target.value })} /></div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Attributes to Drop</Label>
        <Button type="button" variant="outline" size="sm" onClick={addName}><Plus className="mr-1 h-3 w-3" />Add</Button>
      </div>
      {value.attributes.map((attr, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input value={attr.name} onChange={(e) => updateName(i, e.target.value)} placeholder="ATTRNAME" />
          <Button type="button" variant="ghost" size="sm" onClick={() => removeName(i)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
    </div>
  );
}
