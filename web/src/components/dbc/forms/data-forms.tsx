'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { InsertOp, FreeformOp, ColumnValue, SqlStatement, SqlTarget } from '@/lib/dbc/types';

interface FormProps<T> { value: T; onChange: (v: T) => void; }

const SQL_TARGETS: SqlTarget[] = ['all', 'oracle', 'sqlserver', 'db2', 'not_oracle', 'not_sqlserver', 'not_db2'];

export function InsertForm({ value, onChange }: FormProps<InsertOp>) {
  const u = (p: Partial<InsertOp>) => onChange({ ...value, ...p });

  const addRow = () => u({ rows: [...value.rows, { columns: [{ column: '' }] }] });
  const removeRow = (i: number) => u({ rows: value.rows.filter((_, idx) => idx !== i) });
  const addCol = (rowIdx: number) => {
    const rows = [...value.rows];
    rows[rowIdx] = { columns: [...rows[rowIdx].columns, { column: '' }] };
    u({ rows });
  };
  const removeCol = (rowIdx: number, colIdx: number) => {
    const rows = [...value.rows];
    rows[rowIdx] = { columns: rows[rowIdx].columns.filter((_, i) => i !== colIdx) };
    u({ rows });
  };
  const updateCol = (rowIdx: number, colIdx: number, partial: Partial<ColumnValue>) => {
    const rows = [...value.rows];
    const cols = [...rows[rowIdx].columns];
    cols[colIdx] = { ...cols[colIdx], ...partial };
    rows[rowIdx] = { columns: cols };
    u({ rows });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Table *</Label><Input value={value.table} onChange={(e) => u({ table: e.target.value })} /></div>
        <div className="flex items-end">
          <label className="flex items-center gap-1.5 text-xs pb-2"><Checkbox checked={value.ignore_duplicates ?? false} onCheckedChange={(c) => u({ ignore_duplicates: c === true ? true : undefined })} />Ignore Duplicates</label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm">Rows</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="mr-1 h-3 w-3" />Add Row</Button>
      </div>
      {value.rows.map((row, ri) => (
        <div key={ri} className="rounded-md border p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Row #{ri + 1}</span>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => addCol(ri)}><Plus className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(ri)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          {row.columns.map((col, ci) => (
            <div key={ci} className="flex gap-1 items-center">
              <Input className="w-28" placeholder="Column" value={col.column} onChange={(e) => updateCol(ri, ci, { column: e.target.value })} />
              <Input className="flex-1" placeholder="String value" value={col.string || ''} onChange={(e) => updateCol(ri, ci, { string: e.target.value || undefined })} />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeCol(ri, ci)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function FreeformForm({ value, onChange }: FormProps<FreeformOp>) {
  const u = (p: Partial<FreeformOp>) => onChange({ ...value, ...p });

  const addStmt = () => u({ statements: [...value.statements, { sql: '', target: 'all' }] });
  const removeStmt = (i: number) => u({ statements: value.statements.filter((_, idx) => idx !== i) });
  const updateStmt = (i: number, partial: Partial<SqlStatement>) => {
    const stmts = [...value.statements];
    stmts[i] = { ...stmts[i], ...partial };
    u({ statements: stmts });
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Description *</Label><Input value={value.description} onChange={(e) => u({ description: e.target.value })} /></div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">SQL Statements</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStmt}><Plus className="mr-1 h-3 w-3" />Add</Button>
      </div>
      {value.statements.map((stmt, i) => (
        <div key={i} className="rounded-md border p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Select value={stmt.target || 'all'} onValueChange={(v) => updateStmt(i, { target: v as SqlTarget })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{SQL_TARGETS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeStmt(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <Textarea value={stmt.sql} onChange={(e) => updateStmt(i, { sql: e.target.value })} rows={3} placeholder="SQL statement" className="font-mono text-xs" />
        </div>
      ))}
    </div>
  );
}
