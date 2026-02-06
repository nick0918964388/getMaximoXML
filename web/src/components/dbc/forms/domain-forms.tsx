'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MaxTypeSelect } from './shared/maxtype-select';
import { Plus, Trash2 } from 'lucide-react';
import type {
  SpecifySynonymDomainOp, AddSynonymsOp, SpecifyAlnDomainOp,
  SpecifyNumericDomainOp, SpecifyCrossoverDomainOp, SpecifyTableDomainOp,
  ModifyDomainTypeOp, DropDomainOp,
  SynonymValueInfo,
} from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

const DOMAIN_MAX_TYPES = ['ALN', 'LONGALN', 'LOWER', 'UPPER'] as const;
const NUMERIC_MAX_TYPES = ['AMOUNT', 'DECIMAL', 'DURATION', 'FLOAT', 'INTEGER', 'SMALLINT'] as const;
const MODIFY_DOMAIN_MAX_TYPES = [...DOMAIN_MAX_TYPES, ...NUMERIC_MAX_TYPES] as const;

function SynonymValuesEditor({ values, onChange }: { values: SynonymValueInfo[]; onChange: (v: SynonymValueInfo[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label className="text-sm">Values</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, { value: '', maxvalue: '', defaults: false }])}><Plus className="mr-1 h-3 w-3" />Add</Button>
      </div>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="Value" value={v.value} onChange={(e) => { const n = [...values]; n[i] = { ...v, value: e.target.value }; onChange(n); }} />
          <Input placeholder="MaxValue" value={v.maxvalue} onChange={(e) => { const n = [...values]; n[i] = { ...v, maxvalue: e.target.value }; onChange(n); }} />
          <label className="flex items-center gap-1 text-xs whitespace-nowrap"><Checkbox checked={v.defaults} onCheckedChange={(c) => { const n = [...values]; n[i] = { ...v, defaults: c === true }; onChange(n); }} />Default</label>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(values.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
    </div>
  );
}

export function SpecifySynonymDomainForm({ value, onChange }: FormProps<SpecifySynonymDomainOp>) {
  const u = (p: Partial<SpecifySynonymDomainOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => u({ domainid: e.target.value })} /></div>
        <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">MaxType</Label><MaxTypeSelect value={value.maxtype} onValueChange={(v) => u({ maxtype: v as SpecifySynonymDomainOp['maxtype'] })} types={DOMAIN_MAX_TYPES} /></div>
        <div><Label className="text-xs">Length</Label><Input type="number" value={value.length ?? ''} onChange={(e) => u({ length: e.target.value ? Number(e.target.value) : undefined })} /></div>
      </div>
      <SynonymValuesEditor values={value.values} onChange={(v) => u({ values: v })} />
    </div>
  );
}

export function AddSynonymsForm({ value, onChange }: FormProps<AddSynonymsOp>) {
  const u = (p: Partial<AddSynonymsOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => u({ domainid: e.target.value })} /></div>
      <SynonymValuesEditor values={value.values} onChange={(v) => u({ values: v })} />
    </div>
  );
}

export function SpecifyAlnDomainForm({ value, onChange }: FormProps<SpecifyAlnDomainOp>) {
  const u = (p: Partial<SpecifyAlnDomainOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => u({ domainid: e.target.value })} /></div>
        <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">MaxType</Label><MaxTypeSelect value={value.maxtype} onValueChange={(v) => u({ maxtype: v as SpecifyAlnDomainOp['maxtype'] })} types={DOMAIN_MAX_TYPES} /></div>
        <div><Label className="text-xs">Length</Label><Input type="number" value={value.length ?? ''} onChange={(e) => u({ length: e.target.value ? Number(e.target.value) : undefined })} /></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label className="text-sm">Values</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => u({ values: [...value.values, { value: '' }] })}><Plus className="mr-1 h-3 w-3" />Add</Button>
        </div>
        {value.values.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Value" value={v.value} onChange={(e) => { const n = [...value.values]; n[i] = { ...v, value: e.target.value }; u({ values: n }); }} />
            <Input placeholder="Description" value={v.description || ''} onChange={(e) => { const n = [...value.values]; n[i] = { ...v, description: e.target.value || undefined }; u({ values: n }); }} />
            <Button type="button" variant="ghost" size="sm" onClick={() => u({ values: value.values.filter((_, idx) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpecifyNumericDomainForm({ value, onChange }: FormProps<SpecifyNumericDomainOp>) {
  const u = (p: Partial<SpecifyNumericDomainOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => u({ domainid: e.target.value })} /></div>
        <div><Label className="text-xs">MaxType</Label><MaxTypeSelect value={value.maxtype} onValueChange={(v) => u({ maxtype: v as SpecifyNumericDomainOp['maxtype'] })} types={NUMERIC_MAX_TYPES} /></div>
        <div><Label className="text-xs">Length</Label><Input type="number" value={value.length ?? ''} onChange={(e) => u({ length: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><Label className="text-xs">Scale</Label><Input type="number" value={value.scale ?? ''} onChange={(e) => u({ scale: e.target.value ? Number(e.target.value) : undefined })} /></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label className="text-sm">Values</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => u({ values: [...value.values, { value: '' }] })}><Plus className="mr-1 h-3 w-3" />Add</Button>
        </div>
        {value.values.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Value" value={v.value} onChange={(e) => { const n = [...value.values]; n[i] = { ...v, value: e.target.value }; u({ values: n }); }} />
            <Input placeholder="Description" value={v.description || ''} onChange={(e) => { const n = [...value.values]; n[i] = { ...v, description: e.target.value || undefined }; u({ values: n }); }} />
            <Button type="button" variant="ghost" size="sm" onClick={() => u({ values: value.values.filter((_, idx) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpecifyCrossoverDomainForm({ value, onChange }: FormProps<SpecifyCrossoverDomainOp>) {
  const u = (p: Partial<SpecifyCrossoverDomainOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => u({ domainid: e.target.value })} /></div>
        <div><Label className="text-xs">Object Name *</Label><Input value={value.objectname} onChange={(e) => u({ objectname: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Validation Where Clause *</Label><Input value={value.validationwhereclause} onChange={(e) => u({ validationwhereclause: e.target.value })} /></div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label className="text-sm">Crossover Values</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => u({ values: [...value.values, { sourcefield: '' }] })}><Plus className="mr-1 h-3 w-3" />Add</Button>
        </div>
        {value.values.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Source Field" value={v.sourcefield} onChange={(e) => { const n = [...value.values]; n[i] = { ...v, sourcefield: e.target.value }; u({ values: n }); }} />
            <Input placeholder="Dest Field" value={v.destfield || ''} onChange={(e) => { const n = [...value.values]; n[i] = { ...v, destfield: e.target.value || undefined }; u({ values: n }); }} />
            <Button type="button" variant="ghost" size="sm" onClick={() => u({ values: value.values.filter((_, idx) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpecifyTableDomainForm({ value, onChange }: FormProps<SpecifyTableDomainOp>) {
  const u = (p: Partial<SpecifyTableDomainOp>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => u({ domainid: e.target.value })} /></div>
        <div><Label className="text-xs">Object Name *</Label><Input value={value.objectname} onChange={(e) => u({ objectname: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Validation Where Clause *</Label><Input value={value.validationwhereclause} onChange={(e) => u({ validationwhereclause: e.target.value })} /></div>
      <div><Label className="text-xs">Description</Label><Input value={value.description || ''} onChange={(e) => u({ description: e.target.value || undefined })} /></div>
    </div>
  );
}

export function ModifyDomainTypeForm({ value, onChange }: FormProps<ModifyDomainTypeOp>) {
  const u = (p: Partial<ModifyDomainTypeOp>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Domain *</Label><Input value={value.domain} onChange={(e) => u({ domain: e.target.value })} /></div>
      <div><Label className="text-xs">MaxType</Label><MaxTypeSelect value={value.maxtype} onValueChange={(v) => u({ maxtype: v as ModifyDomainTypeOp['maxtype'] })} types={MODIFY_DOMAIN_MAX_TYPES} /></div>
      <div><Label className="text-xs">Length</Label><Input type="number" value={value.length ?? ''} onChange={(e) => u({ length: e.target.value ? Number(e.target.value) : undefined })} /></div>
      <div><Label className="text-xs">Scale</Label><Input type="number" value={value.scale ?? ''} onChange={(e) => u({ scale: e.target.value ? Number(e.target.value) : undefined })} /></div>
    </div>
  );
}

export function DropDomainForm({ value, onChange }: FormProps<DropDomainOp>) {
  return (
    <div><Label className="text-xs">Domain ID *</Label><Input value={value.domainid} onChange={(e) => onChange({ ...value, domainid: e.target.value })} /></div>
  );
}
