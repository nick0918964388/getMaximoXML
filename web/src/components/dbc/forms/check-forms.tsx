'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { DbcCheck } from '@/lib/dbc/types';

interface CheckFormProps {
  checks: DbcCheck[];
  onChange: (checks: DbcCheck[]) => void;
}

export function CheckForm({ checks, onChange }: CheckFormProps) {
  const addCheck = () => onChange([...checks, { queries: [{ query: '' }] }]);
  const removeCheck = (i: number) => onChange(checks.filter((_, idx) => idx !== i));
  const updateCheck = (i: number, partial: Partial<DbcCheck>) => {
    const next = [...checks];
    next[i] = { ...next[i], ...partial };
    onChange(next);
  };
  const addQuery = (ci: number) => {
    const next = [...checks];
    next[ci] = { ...next[ci], queries: [...next[ci].queries, { query: '' }] };
    onChange(next);
  };
  const removeQuery = (ci: number, qi: number) => {
    const next = [...checks];
    next[ci] = { ...next[ci], queries: next[ci].queries.filter((_, i) => i !== qi) };
    onChange(next);
  };
  const updateQuery = (ci: number, qi: number, query: string) => {
    const next = [...checks];
    const queries = [...next[ci].queries];
    queries[qi] = { query };
    next[ci] = { ...next[ci], queries };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pre-execution Checks</h3>
        <Button type="button" variant="outline" size="sm" onClick={addCheck}><Plus className="mr-1 h-3 w-3" />Add Check</Button>
      </div>
      {checks.map((check, ci) => (
        <div key={ci} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Check #{ci + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeCheck(ci)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Tag</Label><Input value={check.tag || ''} onChange={(e) => updateCheck(ci, { tag: e.target.value || undefined })} placeholder="INFO" /></div>
            <div><Label className="text-xs">Key</Label><Input value={check.key || ''} onChange={(e) => updateCheck(ci, { key: e.target.value || undefined })} placeholder="ScriptNotNeeded" /></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Queries</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addQuery(ci)}><Plus className="h-3 w-3" /></Button>
            </div>
            {check.queries.map((q, qi) => (
              <div key={qi} className="flex gap-1 items-center">
                <Input value={q.query} onChange={(e) => updateQuery(ci, qi, e.target.value)} placeholder="select 1 from ..." className="font-mono text-xs" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeQuery(ci, qi)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {checks.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No checks configured.</p>}
    </div>
  );
}
