'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateRelationshipOp, ModifyRelationshipOp, DropRelationshipOp } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

export function CreateRelationshipForm({ value, onChange }: FormProps<CreateRelationshipOp>) {
  const u = (p: Partial<CreateRelationshipOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Parent *</Label><Input value={value.parent} onChange={(e) => u({ parent: e.target.value })} /></div>
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Child *</Label><Input value={value.child} onChange={(e) => u({ child: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Where Clause *</Label><Input value={value.whereclause} onChange={(e) => u({ whereclause: e.target.value })} placeholder="wonum=:wonum and siteid=:siteid" /></div>
      <div><Label className="text-xs">Remarks *</Label><Input value={value.remarks} onChange={(e) => u({ remarks: e.target.value })} /></div>
    </div>
  );
}

export function ModifyRelationshipForm({ value, onChange }: FormProps<ModifyRelationshipOp>) {
  const u = (p: Partial<ModifyRelationshipOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Parent *</Label><Input value={value.parent} onChange={(e) => u({ parent: e.target.value })} /></div>
        <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
        <div><Label className="text-xs">Child</Label><Input value={value.child || ''} onChange={(e) => u({ child: e.target.value || undefined })} /></div>
      </div>
      <div><Label className="text-xs">Where Clause</Label><Input value={value.whereclause || ''} onChange={(e) => u({ whereclause: e.target.value || undefined })} /></div>
      <div><Label className="text-xs">Remarks</Label><Input value={value.remarks || ''} onChange={(e) => u({ remarks: e.target.value || undefined })} /></div>
    </div>
  );
}

export function DropRelationshipForm({ value, onChange }: FormProps<DropRelationshipOp>) {
  const u = (p: Partial<DropRelationshipOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Parent *</Label><Input value={value.parent} onChange={(e) => u({ parent: e.target.value })} /></div>
      <div><Label className="text-xs">Name *</Label><Input value={value.name} onChange={(e) => u({ name: e.target.value })} /></div>
    </div>
  );
}
