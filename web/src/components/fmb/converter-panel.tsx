'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import type { FmbModule } from '@/lib/fmb/types';
import type { SAFieldDefinition, ApplicationMetadata } from '@/lib/types';
import { DEFAULT_METADATA } from '@/lib/types';
import { convertFmbToMaximo } from '@/lib/fmb/converter';
import { processFields } from '@/lib/field-processor';
import { generateApplication } from '@/lib/assemblers';

interface ConverterPanelProps {
  module: FmbModule;
}

export function ConverterPanel({ module }: ConverterPanelProps) {
  const result = useMemo(() => convertFmbToMaximo(module), [module]);
  const [copied, setCopied] = useState(false);

  const xml = useMemo(() => {
    const appDef = processFields(result.fields);
    const metadata: ApplicationMetadata = {
      ...DEFAULT_METADATA,
      id: result.metadata.appName,
      mboName: result.metadata.mboName,
      keyAttribute: `${result.metadata.mboName}ID`,
    };
    return generateApplication(appDef, metadata);
  }, [result]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            轉換結果 — {result.metadata.appName}
            <span className="ml-2 text-muted-foreground font-normal text-sm">
              ({result.fields.length} 個欄位)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">欄位名稱</TableHead>
                  <TableHead>標籤</TableHead>
                  <TableHead className="w-[100px]">類型</TableHead>
                  <TableHead className="w-[80px]">區域</TableHead>
                  <TableHead className="w-[80px]">模式</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Tab</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.fields.map((f, i) => (
                  <FieldRow key={i} field={f} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">XML 預覽</CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <><Check className="h-4 w-4 mr-1" />已複製</>
              ) : (
                <><Copy className="h-4 w-4 mr-1" />複製</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="rounded-md border bg-muted p-4 overflow-auto max-h-[500px] text-xs font-mono whitespace-pre">
            {xml}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldRow({ field }: { field: SAFieldDefinition }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{field.fieldName}</TableCell>
      <TableCell>{field.label}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {field.type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={field.area === 'header' ? 'default' : 'secondary'} className="text-xs">
          {field.area}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">{field.inputMode}</TableCell>
      <TableCell className="font-mono text-xs">{field.relationship}</TableCell>
      <TableCell className="text-xs">{field.tabName}</TableCell>
    </TableRow>
  );
}
