'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, ArrowRight } from 'lucide-react';
import { buildDbcScript } from '@/lib/dbc/dbc-script-builder';
import type { DbcOperation } from '@/lib/dbc/types';
import type { ExtractionResult } from '@/lib/oslc/types';

interface ExtractionPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ExtractionResult | null;
  onOpenInBuilder: (operations: DbcOperation[]) => void;
}

export function ExtractionPreview({
  open,
  onOpenChange,
  result,
  onOpenInBuilder,
}: ExtractionPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const xml = buildDbcScript({
    script: { author: 'metadata-extractor', scriptname: 'extracted_metadata', description: 'Extracted from MAS OSLC' },
    checks: [],
    operations: result.operations.map((op, i) => ({ id: `ext-${i}`, operation: op })),
    selectedId: null,
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_metadata.dbc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>DBC 擷取結果</DialogTitle>
          <DialogDescription>
            已轉換 {result.operations.length} 個操作
            {result.warnings.length > 0 && (
              <Badge variant="destructive" className="ml-2">{result.warnings.length} 警告</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {result.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <p className="font-medium text-yellow-800 mb-1">警告</p>
            {result.warnings.map((w, i) => (
              <p key={i} className="text-yellow-700 text-xs">{w}</p>
            ))}
          </div>
        )}

        <div className="flex gap-2 text-xs text-muted-foreground">
          {result.operations.map((op) => op.type).filter((v, i, a) => a.indexOf(v) === i).map((type) => (
            <Badge key={type} variant="outline">{type}</Badge>
          ))}
        </div>

        <ScrollArea className="h-[400px] border rounded">
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap">{xml}</pre>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            {copied ? '已複製' : '複製'}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            下載 .dbc
          </Button>
          <Button onClick={() => { onOpenInBuilder(result.operations); onOpenChange(false); }}>
            <ArrowRight className="h-4 w-4 mr-1" />
            在 Builder 中開啟
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
