'use client';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const TABLE_TYPES = [
  'system', 'site', 'org', 'orgsite', 'companyset', 'itemset',
  'orgappfilter', 'siteappfilter', 'systemappfilter',
  'systemorg', 'systemorgsite', 'systemsite',
] as const;

interface TableTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  types?: readonly string[];
  placeholder?: string;
}

export function TableTypeSelect({
  value, onValueChange, types = TABLE_TYPES, placeholder = 'Select type',
}: TableTypeSelectProps) {
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
