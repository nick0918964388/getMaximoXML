'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import type { SpecifyIndexOp, DropIndexOp, IndexKey } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

function IndexKeysEditor({ keys, onChange }: { keys: IndexKey[]; onChange: (k: IndexKey[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label className="text-sm">Index Keys</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...keys, { column: '' }])}><Plus className="mr-1 h-3 w-3" />Add</Button>
      </div>
      {keys.map((k, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="Column" value={k.column} onChange={(e) => { const n = [...keys]; n[i] = { ...k, column: e.target.value }; onChange(n); }} />
          <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={k.ascending !== false} onCheckedChange={(c) => { const n = [...keys]; n[i] = { ...k, ascending: c === true }; onChange(n); }} />ASC</label>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(keys.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
    </div>
  );
}

export function SpecifyIndexForm({ value, onChange }: FormProps<SpecifyIndexOp>) {
  const u = (p: Partial<SpecifyIndexOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => u({ object: e.target.value })} /></div>
        <div><Label className="text-xs">Name</Label><Input value={value.name || ''} onChange={(e) => u({ name: e.target.value || undefined })} /></div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.primary ?? false} onCheckedChange={(c) => u({ primary: c === true ? true : undefined })} />Primary</label>
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.unique ?? false} onCheckedChange={(c) => u({ unique: c === true ? true : undefined })} />Unique</label>
        <label className="flex items-center gap-1.5 text-xs"><Checkbox checked={value.clustered ?? false} onCheckedChange={(c) => u({ clustered: c === true ? true : undefined })} />Clustered</label>
      </div>
      <IndexKeysEditor keys={value.keys} onChange={(k) => u({ keys: k })} />
    </div>
  );
}

export function DropIndexForm({ value, onChange }: FormProps<DropIndexOp>) {
  const u = (p: Partial<DropIndexOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Object *</Label><Input value={value.object} onChange={(e) => u({ object: e.target.value })} /></div>
        <div><Label className="text-xs">Name</Label><Input value={value.name || ''} onChange={(e) => u({ name: e.target.value || undefined })} /></div>
      </div>
    </div>
  );
}
