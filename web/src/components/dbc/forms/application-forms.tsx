'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  CreateAppOp, ModifyAppOp, DropAppOp,
  AddSigOptionOp, DropSigOptionOp,
} from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function CreateAppForm({ value, onChange }: FormProps<CreateAppOp>) {
  const u = (p: Partial<CreateAppOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">App *</Label><Input value={value.app} onChange={(e) => u({ app: e.target.value })} /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
        <div><Label className="text-xs">Main Table</Label><Input value={value.maintbname || ''} onChange={(e) => u({ maintbname: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Order By</Label><Input value={value.orderby || ''} onChange={(e) => u({ orderby: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function ModifyAppForm({ value, onChange }: FormProps<ModifyAppOp>) {
  const u = (p: Partial<ModifyAppOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">App *</Label><Input value={value.app} onChange={(e) => u({ app: e.target.value })} /></div>
        <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Main Table</Label><Input value={value.maintbname || ''} onChange={(e) => u({ maintbname: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function DropAppForm({ value, onChange }: FormProps<DropAppOp>) {
  return (
    <div><Label className="text-xs">App *</Label><Input value={value.app} onChange={(e) => onChange({ ...value, app: e.target.value })} /></div>
  );
}

export function AddSigOptionForm({ value, onChange }: FormProps<AddSigOptionOp>) {
  const u = (p: Partial<AddSigOptionOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">App *</Label><Input value={value.app} onChange={(e) => u({ app: e.target.value })} /></div>
        <div><Label className="text-xs">Option Name *</Label><Input value={value.optionname} onChange={(e) => u({ optionname: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.granteveryone ?? false} onCheckedChange={(c) => u({ granteveryone: c === true ? true : undefined })} />Grant Everyone</label>
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.visible !== false} onCheckedChange={(c) => u({ visible: c === true ? undefined : false })} />Visible</label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Grant App</Label><Input value={value.grantapp || ''} onChange={(e) => u({ grantapp: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Grant Option</Label><Input value={value.grantoption || ''} onChange={(e) => u({ grantoption: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}

export function DropSigOptionForm({ value, onChange }: FormProps<DropSigOptionOp>) {
  const u = (p: Partial<DropSigOptionOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">App *</Label><Input value={value.app} onChange={(e) => u({ app: e.target.value })} /></div>
      <div><Label className="text-xs">Option Name *</Label><Input value={value.optionname} onChange={(e) => u({ optionname: e.target.value })} /></div>
    </div>
  );
}
