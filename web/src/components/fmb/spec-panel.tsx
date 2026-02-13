'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Download, FileText, ChevronDown, ChevronRight, Code, Database } from 'lucide-react';
import type { FmbModule } from '@/lib/fmb/types';
import { generateFormSpec, generateMarkdownSpec, type FormSpec } from '@/lib/fmb/spec-generator';
import { downloadWordDocument } from '@/lib/fmb/word-generator';
import type { TriggerSpec } from '@/lib/fmb/trigger-types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ErDiagramSection } from './er-diagram-section';
import { generateErDiagramImage } from '@/lib/fmb/er-diagram-export';

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

  const handleDownloadWord = async () => {
    try {
      // Capture ER Diagram image from the preview panel
      const erContainer = document.querySelector('.er-diagram-container') as HTMLElement | null;
      const erImage = await generateErDiagramImage(erContainer);
      await downloadWordDocument(spec, spec.formName, { erDiagramImage: erImage });
    } catch (error) {
      console.error('Word generation error:', error);
      // Could add toast notification here if needed
    }
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
                下載 Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadWord}>
                <FileText className="h-4 w-4 mr-1" />
                下載 Word
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

      {/* ER Diagram 實體關聯圖 */}
      <ErDiagramSection spec={spec} />

      {/* LOV 與資料來源 (整合顯示) */}
      {spec.lovs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">(3) LOV 與資料來源</h2>
          <div className="text-sm text-muted-foreground mb-2 space-y-1">
            <p>A. Name：List of Value 名稱</p>
            <p>B. Record Group Name：LOV 的資料來源</p>
            <p>C. LOV Column Name：LOV 顯示的欄位</p>
            <p>D. Return Item：點選 LOV 後回傳至畫面對應的欄位</p>
            <p>E. SQL Query：資料查詢語句</p>
          </div>
          <div className="space-y-4">
            {spec.lovs.map((lov) => (
              <LovCard key={lov.name} lov={lov} />
            ))}
          </div>
        </div>
      )}

      {/* Triggers */}
      {spec.triggers && spec.triggers.statistics.totalCount > 0 && (
        <TriggerSection triggers={spec.triggers} />
      )}
    </div>
  );
}

function LovCard({ lov }: { lov: FormSpec['lovs'][0] }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSql = !!lov.recordGroupQuery;

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            {lov.no}. {lov.name}
            {hasSql && <Badge variant="secondary" className="ml-2 text-xs">有 SQL</Badge>}
          </CardTitle>
          {hasSql && (
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Record Group: <span className="font-mono">{lov.recordGroupName || '-'}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* LOV Column Mappings */}
        {lov.columns.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">欄位對應</div>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">LOV Column Name</TableHead>
                    <TableHead className="text-xs">Return Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lov.columns.map((col, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{col.columnName}</TableCell>
                      <TableCell className="font-mono text-xs">{col.returnItem}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* SQL Query from Record Group */}
        {hasSql && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                <Code className="h-3 w-3 mr-1" />
                {isOpen ? '隱藏' : '查看'} SQL Query
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-auto max-h-[300px] mt-2">
                {lov.recordGroupQuery}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function TriggerSection({ triggers }: { triggers: FormSpec['triggers'] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold border-b pb-1">(4) 觸發器規則</h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{triggers.statistics.totalCount}</div>
            <div className="text-sm text-muted-foreground">總觸發器</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{triggers.statistics.formLevelCount}</div>
            <div className="text-sm text-muted-foreground">Form 層級</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{triggers.statistics.blockLevelCount}</div>
            <div className="text-sm text-muted-foreground">Block 層級</div>
          </CardContent>
        </Card>
      </div>

      {/* Form-level Triggers */}
      {triggers.formTriggers.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-2">Form 層級觸發器</h3>
          <TriggerTable triggers={triggers.formTriggers} />
        </div>
      )}

      {/* Block-level Triggers */}
      {triggers.blockTriggers.map((block) => (
        <div key={block.blockName}>
          <h3 className="text-base font-medium mb-2">Block: {block.blockName}</h3>
          <TriggerTable triggers={block.triggers} />
        </div>
      ))}
    </div>
  );
}

function TriggerTable({ triggers }: { triggers: TriggerSpec[] }) {
  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">No</TableHead>
            <TableHead className="w-[180px]">觸發器名稱</TableHead>
            <TableHead className="w-[200px]">事件描述</TableHead>
            <TableHead>業務規則摘要</TableHead>
            <TableHead className="w-[50px]">SQL</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {triggers.map((trigger) => (
            <TriggerRow key={trigger.no} trigger={trigger} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TriggerRow({ trigger }: { trigger: TriggerSpec }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSql = trigger.sqlStatements.length > 0;
  const hasDetails = trigger.businessRules.length > 0 || hasSql;

  return (
    <>
      <TableRow className={hasDetails ? 'cursor-pointer hover:bg-muted/50' : ''} onClick={() => hasDetails && setIsOpen(!isOpen)}>
        <TableCell className="text-xs">{trigger.no}</TableCell>
        <TableCell className="font-mono text-sm">{trigger.name}</TableCell>
        <TableCell className="text-sm">{trigger.eventDescription}</TableCell>
        <TableCell className="text-sm">{trigger.summary}</TableCell>
        <TableCell>
          {hasSql && <Database className="h-4 w-4 text-blue-500" />}
        </TableCell>
        <TableCell>
          {hasDetails && (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
      </TableRow>
      {isOpen && hasDetails && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-4">
            <TriggerDetail trigger={trigger} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function TriggerDetail({ trigger }: { trigger: TriggerSpec }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="space-y-4">
      {/* Java Use */}
      <div>
        <span className="text-sm font-medium">Java 用途: </span>
        <span className="text-sm text-muted-foreground">{trigger.javaUse}</span>
      </div>

      {/* Maximo Location */}
      <div className="bg-blue-50 border border-blue-200 rounded p-2">
        <span className="text-sm font-medium text-blue-800">Maximo Java 位置: </span>
        <span className="text-sm font-mono text-blue-700">{trigger.maximoLocation}</span>
      </div>

      {/* Business Rules */}
      {trigger.businessRules.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">業務規則:</div>
          <ul className="space-y-2">
            {trigger.businessRules.map((rule, idx) => (
              <li key={idx} className="text-sm">
                <Badge variant="outline" className="mr-2">{rule.type}</Badge>
                {rule.description}
                {rule.affectedFields.length > 0 && (
                  <div className="text-xs text-muted-foreground ml-4 mt-1">
                    影響欄位: {rule.affectedFields.join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SQL Statements */}
      {trigger.sqlStatements.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">SQL 語句:</div>
          {trigger.sqlStatements.map((sql, idx) => (
            <div key={idx} className="mb-2">
              <Badge variant="secondary" className="mb-1">{sql.type}</Badge>
              <pre className="text-xs bg-slate-900 text-slate-100 p-2 rounded overflow-auto">
                {sql.statement}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Show/Hide Code Toggle */}
      {trigger.triggerText && (
        <Collapsible open={showCode} onOpenChange={setShowCode}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              {showCode ? '隱藏' : '查看'}原始 PL/SQL 代碼
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-auto max-h-[300px] mt-2">
              {trigger.triggerText}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
