'use client';

import { SAFieldDefinition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FIELD_TYPES, INPUT_MODES, FIELD_AREAS } from '@/lib/constants';

interface FieldRowProps {
  field: SAFieldDefinition;
  index: number;
  onUpdate: (index: number, updates: Partial<SAFieldDefinition>) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onEditDetails: (index: number) => void;
  labelInputRef?: (ref: HTMLInputElement | null) => void;
}

export function FieldRow({
  field,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onEditDetails,
  labelInputRef,
}: FieldRowProps) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md bg-card hover:bg-accent/50 transition-colors">
      {/* Index */}
      <div className="col-span-1 text-center text-muted-foreground text-sm">
        {index + 1}
      </div>

      {/* 標籤 */}
      <div className="col-span-2">
        <Input
          ref={labelInputRef}
          placeholder="標籤"
          value={field.label}
          onChange={(e) => onUpdate(index, { label: e.target.value })}
          className="h-8"
        />
      </div>

      {/* 欄位名稱 */}
      <div className="col-span-2">
        <Input
          placeholder="欄位名稱 (自動)"
          value={field.fieldName}
          onChange={(e) => onUpdate(index, { fieldName: e.target.value })}
          className="h-8"
        />
      </div>

      {/* Type */}
      <div className="col-span-1">
        <Select
          value={field.type}
          onValueChange={(value) => onUpdate(index, { type: value as SAFieldDefinition['type'] })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area */}
      <div className="col-span-1">
        <Select
          value={field.area}
          onValueChange={(value) => onUpdate(index, { area: value as SAFieldDefinition['area'] })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_AREAS.map((area) => (
              <SelectItem key={area.value} value={area.value}>
                {area.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 輸入模式 */}
      <div className="col-span-1">
        <Select
          value={field.inputMode}
          onValueChange={(value) => onUpdate(index, { inputMode: value as SAFieldDefinition['inputMode'] })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="模式" />
          </SelectTrigger>
          <SelectContent>
            {INPUT_MODES.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 關聯 */}
      <div className="col-span-2">
        <Input
          placeholder="關聯"
          value={field.relationship}
          onChange={(e) => onUpdate(index, { relationship: e.target.value })}
          className="h-8"
        />
      </div>

      {/* 操作 */}
      <div className="col-span-2 flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditDetails(index)}
          className="h-7 px-2 text-xs"
        >
          詳細
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(index)}
          className="h-7 px-2 text-xs"
        >
          複製
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
        >
          刪除
        </Button>
      </div>
    </div>
  );
}
