'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaxTypeSelect } from './maxtype-select';
import { Plus, Trash2 } from 'lucide-react';
import type { AttrDef } from '@/lib/dbc/types';

interface AttrDefEditorProps {
  attributes: AttrDef[];
  onChange: (attrs: AttrDef[]) => void;
}

function emptyAttr(): AttrDef {
  return { attribute: '', title: '', remarks: '' };
}

export function AttrDefEditor({ attributes, onChange }: AttrDefEditorProps) {
  const updateAttr = (index: number, partial: Partial<AttrDef>) => {
    const next = [...attributes];
    next[index] = { ...next[index], ...partial };
    onChange(next);
  };

  const addAttr = () => onChange([...attributes, emptyAttr()]);

  const removeAttr = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Attributes</Label>
        <Button type="button" variant="outline" size="sm" onClick={addAttr}>
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
      {attributes.map((attr, i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeAttr(i)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Attribute</Label>
              <Input value={attr.attribute} onChange={(e) => updateAttr(i, { attribute: e.target.value })} placeholder="MYATTR" />
            </div>
            <div>
              <Label className="text-xs">MaxType</Label>
              <MaxTypeSelect value={attr.maxtype} onValueChange={(v) => updateAttr(i, { maxtype: v as AttrDef['maxtype'] })} />
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={attr.title} onChange={(e) => updateAttr(i, { title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Length</Label>
              <Input type="number" value={attr.length ?? ''} onChange={(e) => updateAttr(i, { length: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Remarks</Label>
            <Input value={attr.remarks} onChange={(e) => updateAttr(i, { remarks: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Domain</Label>
              <Input value={attr.domain ?? ''} onChange={(e) => updateAttr(i, { domain: e.target.value || undefined })} />
            </div>
            <div>
              <Label className="text-xs">Default Value</Label>
              <Input value={attr.defaultvalue ?? ''} onChange={(e) => updateAttr(i, { defaultvalue: e.target.value || undefined })} />
            </div>
            <div>
              <Label className="text-xs">Search Type</Label>
              <Input value={attr.searchtype ?? ''} onChange={(e) => updateAttr(i, { searchtype: (e.target.value || undefined) as AttrDef['searchtype'] })} placeholder="WILDCARD" />
            </div>
          </div>
        </div>
      ))}
      {attributes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">No attributes. Click &quot;Add&quot; to create one.</p>
      )}
    </div>
  );
}
