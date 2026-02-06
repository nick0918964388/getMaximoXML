'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Check } from 'lucide-react';

interface XmlPreviewProps {
  xml: string;
  filename: string;
}

export function XmlPreview({ xml, filename }: XmlPreviewProps) {
  const [copied, setCopied] = useState(false);

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
    a.download = filename.endsWith('.dbc') ? filename : `${filename}.dbc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground">XML Preview</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="mr-1 h-3 w-3" /> Download
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto leading-relaxed">
          {xml || '<!-- Empty script -->'}
        </pre>
      </ScrollArea>
    </div>
  );
}
