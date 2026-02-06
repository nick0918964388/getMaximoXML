'use client';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const MAX_TYPES = [
  'ALN', 'AMOUNT', 'BIGINT', 'BLOB', 'CLOB', 'CRYPTO', 'CRYPTOX',
  'DATE', 'DATETIME', 'DECIMAL', 'DURATION', 'FLOAT', 'GL',
  'INTEGER', 'LONGALN', 'LOWER', 'SMALLINT', 'TIME', 'UPPER', 'YORN',
] as const;

interface MaxTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  types?: readonly string[];
  placeholder?: string;
}

export function MaxTypeSelect({
  value, onValueChange, types = MAX_TYPES, placeholder = 'Select maxtype',
}: MaxTypeSelectProps) {
  return (
    <Select value={value || ''} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {types.map((t) => (
          <SelectItem key={t} value={t}>{t}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
