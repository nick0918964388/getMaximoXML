'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Download, FileText } from 'lucide-react';
import type { FmbModule } from '@/lib/fmb/types';
import { generateFormSpec, generateMarkdownSpec, type FormSpec } from '@/lib/fmb/spec-generator';

interface SpecPanelProps {
  module: FmbModule;
}

export function SpecPanel({ module }: SpecPanelProps) {
  const spec = useMemo(() => generateFormSpec(module), [module]);
  const markdown = useMemo(() => generateMarkdownSpec(spec), [spec]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec.formName}_spec.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {spec.formName} 功能規格說明
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <><Check className="h-4 w-4 mr-1" />已複製</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" />複製 Markdown</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                下載
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">預覽</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>

            <TabsContent value="preview">
              <SpecPreview spec={spec} />
            </TabsContent>

            <TabsContent value="markdown">
              <pre className="rounded-md border bg-muted p-4 overflow-auto max-h-[600px] text-xs font-mono whitespace-pre-wrap">
                {markdown}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SpecPreview({ spec }: { spec: FormSpec }) {
  return (
    <div className="spec-preview space-y-6 max-h-[700px] overflow-auto p-4 border rounded-md bg-white">
      <div>
        <h1 className="text-xl font-bold">{spec.formName} 功能規格說明</h1>
        <p className="text-muted-foreground">程式名稱: {spec.formTitle}</p>
      </div>

      {/* Blocks (畫面規格) */}
      {spec.blocks.map((block, idx) => (
        <div key={block.name} className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-1">({idx + 1}) 畫面({idx + 1})</h2>

          {/* Block Info */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-[200px] bg-muted">Block Name</TableCell>
                  <TableCell className="font-mono">{block.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium bg-muted">Base Table(表格名稱)</TableCell>
                  <TableCell className="font-mono">{block.baseTable || '-'}</TableCell>
                </TableRow>
                {block.whereCondition && (
                  <TableRow>
                    <TableCell className="font-medium bg-muted align-top">Where Condition(條件)</TableCell>
                    <TableCell>
                      <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-50 p-2 rounded">
                        {block.whereCondition}
                      </pre>
                    </TableCell>
                  </TableRow>
                )}
                {block.orderByClause && (
                  <TableRow>
                    <TableCell className="font-medium bg-muted">Order By Clause(排序)</TableCell>
                    <TableCell className="font-mono">{block.orderByClause}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium bg-muted">Insert Allowed(新增資料否)</TableCell>
                  <TableCell>{block.insertAllowed ? 'true' : 'false'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium bg-muted">Update Allowed(更新資料否)</TableCell>
                  <TableCell>{block.updateAllowed ? 'true' : 'false'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium bg-muted">Delete Allowed(刪除資料否)</TableCell>
                  <TableCell>{block.deleteAllowed ? 'true' : 'false'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Fields Table */}
          {block.fields.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-2">欄位清單</h3>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">No</TableHead>
                      <TableHead className="w-[120px]">Prompt</TableHead>
                      <TableHead className="w-[150px]">DB Column</TableHead>
                      <TableHead className="w-[60px]">Displayed</TableHead>
                      <TableHead className="w-[80px]">Data Type</TableHead>
                      <TableHead className="w-[60px]">Required</TableHead>
                      <TableHead className="w-[80px]">Case</TableHead>
                      <TableHead className="w-[100px]">LOV</TableHead>
                      <TableHead className="w-[100px]">FormatMask</TableHead>
                      <TableHead className="w-[60px]">Update</TableHead>
                      <TableHead className="w-[80px]">Initial</TableHead>
                      <TableHead>Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {block.fields.map((field) => (
                      <TableRow key={field.no}>
                        <TableCell className="text-xs">{field.no}</TableCell>
                        <TableCell className="text-sm">{field.prompt || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{field.dbColumn}</TableCell>
                        <TableCell>
                          <Badge variant={field.displayed ? 'default' : 'secondary'} className="text-xs">
                            {field.displayed ? 'Y' : 'N'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{field.dataType}</TableCell>
                        <TableCell>
                          {field.required && <Badge variant="destructive" className="text-xs">TRUE</Badge>}
                        </TableCell>
                        <TableCell className="text-xs">{field.caseRestriction}</TableCell>
                        <TableCell className="font-mono text-xs">{field.lovName || '-'}</TableCell>
                        <TableCell className="text-xs">{field.formatMask || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={field.updateAllowed ? 'default' : 'secondary'} className="text-xs">
                            {field.updateAllowed ? 'TRUE' : 'FALSE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{field.initialValue || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{field.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Buttons */}
      {spec.buttons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">按鈕</h2>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">按鈕名稱</TableHead>
                  <TableHead className="w-[150px]">標籤</TableHead>
                  <TableHead>說明</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spec.buttons.map((btn, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{btn.name}</TableCell>
                    <TableCell>{btn.label}</TableCell>
                    <TableCell className="text-muted-foreground">{btn.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* LOV */}
      {spec.lovs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">(3) LOV</h2>
          <div className="text-sm text-muted-foreground mb-2 space-y-1">
            <p>A. Name：List of Value 名稱</p>
            <p>B. Record Group Name：LOV 的資料來源</p>
            <p>C. LOV Column Name：LOV 顯示的欄位</p>
            <p>D. Return Item：點選 LOV 後回傳至畫面對應的欄位</p>
          </div>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">No</TableHead>
                  <TableHead className="w-[150px]">Name</TableHead>
                  <TableHead className="w-[150px]">Record Group Name</TableHead>
                  <TableHead className="w-[150px]">LOV Column Name</TableHead>
                  <TableHead>Return Item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let rowNo = 1;
                  return spec.lovs.flatMap((lov) => {
                    if (lov.columns.length > 0) {
                      return lov.columns.map((col, colIdx) => (
                        <TableRow key={`${lov.name}-${colIdx}`}>
                          <TableCell className="text-xs">{rowNo++}</TableCell>
                          <TableCell className="font-mono text-sm">{lov.name}</TableCell>
                          <TableCell className="font-mono text-sm">{lov.recordGroupName}</TableCell>
                          <TableCell className="font-mono text-sm">{col.columnName}</TableCell>
                          <TableCell className="font-mono text-sm">{col.returnItem}</TableCell>
                        </TableRow>
                      ));
                    } else {
                      return (
                        <TableRow key={lov.name}>
                          <TableCell className="text-xs">{rowNo++}</TableCell>
                          <TableCell className="font-mono text-sm">{lov.name}</TableCell>
                          <TableCell className="font-mono text-sm">{lov.recordGroupName}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      );
                    }
                  });
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
