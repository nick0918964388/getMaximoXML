'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateModuleOp, ModifyModuleOp, DropModuleOp, ModuleAppOp } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function CreateModuleForm({ value, onChange }: FormProps<CreateModuleOp>) {
  const u = (p: Partial<CreateModuleOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Module *</Label><Input value={value.module} onChange={(e) => u({ module: e.target.value })} /></div>
        <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
      </div>
      <p className="text-xs text-muted-foreground">Module menu items can be configured via the XML preview.</p>
    </div>
  );
}

export function ModifyModuleForm({ value, onChange }: FormProps<ModifyModuleOp>) {
  const u = (p: Partial<ModifyModuleOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Module *</Label><Input value={value.module} onChange={(e) => u({ module: e.target.value })} /></div>
      <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
    </div>
  );
}

export function DropModuleForm({ value, onChange }: FormProps<DropModuleOp>) {
  return (<div><Label className="text-xs">Module *</Label><Input value={value.module} onChange={(e) => onChange({ ...value, module: e.target.value })} /></div>);
}

export function ModuleAppForm({ value, onChange }: FormProps<ModuleAppOp>) {
  const u = (p: Partial<ModuleAppOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Module *</Label><Input value={value.module} onChange={(e) => u({ module: e.target.value })} /></div>
      <div><Label className="text-xs">App *</Label><Input value={value.app} onChange={(e) => u({ app: e.target.value })} /></div>
    </div>
  );
}
