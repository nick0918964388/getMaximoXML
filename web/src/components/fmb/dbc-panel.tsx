'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Download, Database, AlertCircle, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FmbModule } from '@/lib/fmb/types';
import type { SAFieldDefinition, ApplicationMetadata } from '@/lib/types';
import { generateDbc, downloadDbc, extractMboDefinitions, validateFieldCoverage } from '@/lib/fmb/dbc-generator';
import { DEFAULT_DBC_METADATA } from '@/lib/fmb/types';
import { MasImportSection } from './mas';

interface DbcPanelProps {
  fmbModule: FmbModule | null;
  fields: SAFieldDefinition[];
  metadata: ApplicationMetadata;
}

export function DbcPanel({ fmbModule, fields, metadata }: DbcPanelProps) {
  // Settings state
  const [author, setAuthor] = useState(DEFAULT_DBC_METADATA.author);
  const [scriptname, setScriptname] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if we have valid MBO data
  const hasValidMboData = useMemo(() => {
    if (!fmbModule) return false;
    if (!fmbModule.blocks || fmbModule.blocks.length === 0) return false;
    if (fields.length === 0) return false;
    if (!metadata.mboName) return false;

    // Check if extractMboDefinitions would return data
    const mboDefinitions = extractMboDefinitions(fmbModule, fields, metadata);
    return mboDefinitions.tables.length > 0 && mboDefinitions.tables[0].attributes.length > 0;
  }, [fmbModule, fields, metadata]);

  // Generate DBC content
  const dbcResult = useMemo(() => {
    if (!fmbModule || !hasValidMboData) return null;

    const effectiveScriptname = scriptname || `${metadata.mboName || fmbModule.name}_SETUP`;

    return generateDbc(fields, fmbModule, metadata, {
      author,
      scriptname: effectiveScriptname,
      description,
    });
  }, [fmbModule, fields, metadata, author, scriptname, description, hasValidMboData]);

  // Validate field coverage
  const validationResult = useMemo(() => {
    if (!dbcResult?.script) return null;
    return validateFieldCoverage(fields, dbcResult.script);
  }, [fields, dbcResult]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!dbcResult) return;
    await navigator.clipboard.writeText(dbcResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle download
  const handleDownload = () => {
    if (!dbcResult) return;
    downloadDbc(dbcResult.content, dbcResult.suggestedFilename);
  };

  // Show upload prompt when no module
  if (!fmbModule) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <Upload className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">請先上傳 FMB XML 檔案</p>
            <p className="text-sm mt-2">上傳後可在此產生 DBC 資料庫配置腳本</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error when no valid MBO data
  if (!hasValidMboData) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              無可轉換的 MBO 資料。請確認 FMB XML 中包含有效的 Block 與欄位定義。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Settings Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            DBC 腳本設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scriptname">Scriptname</Label>
              <Input
                id="scriptname"
                value={scriptname}
                onChange={(e) => setScriptname(e.target.value)}
                placeholder={`${metadata.mboName || fmbModule.name}_SETUP`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              DBC 預覽
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <><Check className="h-4 w-4 mr-1" />已複製</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" />複製</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                下載 DBC
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="rounded-md border bg-muted p-4 overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap">
            {dbcResult?.content}
          </pre>
        </CardContent>
      </Card>

      {/* Field Coverage Validation */}
      {validationResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              欄位覆蓋檢查
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.isValid ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  所有 Maximo XML 欄位都有對應的 DBC 欄位定義（共 {validationResult.expectedFields.length} 個欄位）
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      有 {validationResult.missingFields.length} 個欄位在 Maximo XML 中但缺少 DBC 定義：
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {validationResult.missingFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-mono"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Info */}
      {dbcResult?.script && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">表格數量：</span>
                <span className="font-medium">{dbcResult.script.tables.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">欄位數量：</span>
                <span className="font-medium">
                  {dbcResult.script.tables.reduce((sum, t) => sum + t.attributes.length, 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">檔案名稱：</span>
                <span className="font-mono text-xs">{dbcResult.suggestedFilename}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAS Import Section */}
      {dbcResult && (
        <MasImportSection
          dbcContent={dbcResult.content}
          dbcFilename={dbcResult.suggestedFilename}
          disabled={!hasValidMboData}
        />
      )}
    </div>
  );
}
