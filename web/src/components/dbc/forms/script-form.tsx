'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { DbcScriptConfig } from '@/lib/dbc/types';

interface ScriptFormProps {
  config: DbcScriptConfig;
  onChange: (config: DbcScriptConfig) => void;
}

export function ScriptForm({ config, onChange }: ScriptFormProps) {
  const update = (partial: Partial<DbcScriptConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Script Metadata</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Author *</Label>
          <Input value={config.author} onChange={(e) => update({ author: e.target.value })} placeholder="ADMIN" />
        </div>
        <div>
          <Label className="text-xs">Script Name *</Label>
          <Input value={config.scriptname} onChange={(e) => update({ scriptname: e.target.value })} placeholder="V1000_01" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea value={config.description || ''} onChange={(e) => update({ description: e.target.value || undefined })} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Context</Label>
          <Select value={config.context || ''} onValueChange={(v) => update({ context: (v || undefined) as DbcScriptConfig['context'] })}>
            <SelectTrigger><SelectValue placeholder="(default)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="master">master</SelectItem>
              <SelectItem value="landlord">landlord</SelectItem>
              <SelectItem value="tenants">tenants</SelectItem>
              <SelectItem value="all">all</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tenant Code</Label>
          <Input value={config.tenantcode || ''} onChange={(e) => update({ tenantcode: e.target.value || undefined })} />
        </div>
      </div>
    </div>
  );
}
