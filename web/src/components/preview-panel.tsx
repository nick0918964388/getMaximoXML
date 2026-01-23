'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface PreviewPanelProps {
  xmlContent: string;
  sqlContent: string;
  onDownloadXml: () => void;
  onDownloadSql: () => void;
  onDownloadAll: () => void;
}

export function PreviewPanel({
  xmlContent,
  sqlContent,
  onDownloadXml,
  onDownloadSql,
  onDownloadAll,
}: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState('xml');

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已複製到剪貼簿');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">預覽</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(activeTab === 'xml' ? xmlContent : sqlContent)}
            >
              複製
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadXml}>
              下載 XML
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadSql}>
              下載 SQL
            </Button>
            <Button size="sm" onClick={onDownloadAll}>
              全部下載
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xml">XML</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>
          <TabsContent value="xml" className="flex-1 mt-2 overflow-hidden">
            <div className="h-[500px] w-full rounded-md border overflow-auto">
              <pre className="p-4 text-sm font-mono whitespace-pre min-w-max">
                <code className="language-xml">{xmlContent || '尚未產生 XML'}</code>
              </pre>
            </div>
          </TabsContent>
          <TabsContent value="sql" className="flex-1 mt-2 overflow-hidden">
            <div className="h-[500px] w-full rounded-md border overflow-auto">
              <pre className="p-4 text-sm font-mono whitespace-pre min-w-max">
                <code className="language-sql">{sqlContent || '尚未產生 SQL'}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
