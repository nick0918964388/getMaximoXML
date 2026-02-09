'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadPanel } from '@/components/fmb/upload-panel';
import { TreeViewer } from '@/components/fmb/tree-viewer';
import { ConverterPanel } from '@/components/fmb/converter-panel';
import { SpecPanel } from '@/components/fmb/spec-panel';
import { DbcPanel } from '@/components/fmb/dbc-panel';
import { UploadHistory } from '@/components/fmb/upload-history';
import { parseFmbXml } from '@/lib/fmb/parser';
import { addUploadHistory } from '@/lib/fmb/history';
import { convertFmbToMaximo, type FmbConversionResult } from '@/lib/fmb/converter';
import type { FmbModule } from '@/lib/fmb/types';
import { DEFAULT_METADATA } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { LoginPage } from '@/components/auth/login-page';

export default function FmbConverterPage() {
  const { user, loading: authLoading } = useAuth();
  const [module, setModule] = useState<FmbModule | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [conversionResult, setConversionResult] = useState<FmbConversionResult | null>(null);

  const loadXml = useCallback((content: string, name: string, saveHistory: boolean) => {
    setError('');
    setParsing(true);
    setTimeout(() => {
      try {
        const parsed = parseFmbXml(content);
        setModule(parsed);
        setFileName(name);

        try {
          const result = convertFmbToMaximo(parsed);
          setConversionResult(result);

          if (saveHistory && user) {
            addUploadHistory(user.id, {
              fileName: name,
              moduleName: parsed.name,
              fieldCount: result.fields.filter((f) => f.area !== 'list').length,
              xmlContent: content,
            });
            setHistoryKey((k) => k + 1);
          }
        } catch {
          setConversionResult(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '解析失敗');
        setModule(null);
        setConversionResult(null);
      } finally {
        setParsing(false);
      }
    }, 0);
  }, [user]);

  const handleFileLoaded = useCallback((content: string, name: string) => {
    loadXml(content, name, true);
  }, [loadXml]);

  const handleHistoryLoad = useCallback((content: string, name: string) => {
    loadXml(content, name, false);
  }, [loadXml]);

  if (authLoading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">載入中...</p></div>;
  }
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b shrink-0">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">FMB 轉換器</h1>
          <p className="text-sm text-muted-foreground">
            上傳 Oracle Forms frmf2xml 匯出的 XML，瀏覽結構或轉換為 Maximo XML
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <UploadPanel onFileLoaded={handleFileLoaded} />

          <UploadHistory onLoad={handleHistoryLoad} refreshKey={historyKey} userId={user.id} />

          {parsing && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              解析中...
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {module && (
            <>
              <p className="text-sm text-muted-foreground">
                已載入：<span className="font-mono">{fileName}</span> — Module: {module.name}
              </p>
              <Tabs defaultValue="tree">
                <TabsList className="mb-4">
                  <TabsTrigger value="tree">結構瀏覽</TabsTrigger>
                  <TabsTrigger value="convert">轉換 Maximo</TabsTrigger>
                  <TabsTrigger value="spec">規格文檔</TabsTrigger>
                  <TabsTrigger value="dbc">DBC 產生器</TabsTrigger>
                </TabsList>
                <TabsContent value="tree">
                  <TreeViewer module={module} />
                </TabsContent>
                <TabsContent value="convert">
                  <ConverterPanel module={module} />
                </TabsContent>
                <TabsContent value="spec">
                  <SpecPanel module={module} />
                </TabsContent>
                <TabsContent value="dbc">
                  <DbcPanel
                    fmbModule={module}
                    fields={conversionResult?.fields ?? []}
                    metadata={{
                      ...DEFAULT_METADATA,
                      id: module.name,
                      mboName: conversionResult?.metadata.mboName ?? `ZZ_${module.name}`,
                    }}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
