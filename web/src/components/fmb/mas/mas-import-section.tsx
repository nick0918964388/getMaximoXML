'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Settings,
  Plug,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { MasConfigDialog } from './mas-config-dialog';
import { MasImportProgress } from './mas-import-progress';
import type {
  MasApiResponse,
  MasTestConnectionResult,
  MasImportStatus,
  MasImportEvent,
} from '@/lib/mas/types';

interface MasImportSectionProps {
  dbcContent: string;
  dbcFilename: string;
  disabled?: boolean;
}

interface ConfigState {
  isConfigured: boolean;
  ocpClusterUrl: string;
  namespace: string;
}

export function MasImportSection({
  dbcContent,
  dbcFilename,
  disabled = false,
}: MasImportSectionProps) {
  const [configState, setConfigState] = useState<ConfigState>({
    isConfigured: false,
    ocpClusterUrl: '',
    namespace: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [testResult, setTestResult] = useState<MasTestConnectionResult | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<MasImportStatus>('idle');
  const [importOutput, setImportOutput] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPodName, setImportPodName] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mas/config');
      const data: MasApiResponse<{
        ocpClusterUrl: string;
        namespace: string;
        encryptedToken: string;
      }> = await response.json();

      if (data.success && data.data) {
        setConfigState({
          isConfigured: !!data.data.encryptedToken && !!data.data.ocpClusterUrl,
          ocpClusterUrl: data.data.ocpClusterUrl || '',
          namespace: data.data.namespace || '',
        });
      }
    } catch {
      // Configuration doesn't exist or failed to load
      setConfigState({
        isConfigured: false,
        ocpClusterUrl: '',
        namespace: '',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/mas/test-connection', {
        method: 'POST',
      });

      const data: MasApiResponse<MasTestConnectionResult> = await response.json();

      if (data.success && data.data) {
        setTestResult(data.data);
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed',
          error: data.error || 'Unknown error',
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Connection failed',
        error: 'Network error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus('connecting');
    setImportOutput([]);
    setImportError(null);
    setImportPodName(null);

    try {
      const response = await fetch('/api/mas/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbcContent, dbcFilename }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import request failed');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: MasImportEvent = JSON.parse(line.slice(6));
              handleImportEvent(event);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      setImportStatus('failed');
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportEvent = (event: MasImportEvent) => {
    switch (event.type) {
      case 'status':
        if (event.data.status) {
          setImportStatus(event.data.status);
        }
        if (event.data.podName) {
          setImportPodName(event.data.podName);
        }
        if (event.data.message) {
          setImportOutput((prev) => [...prev, event.data.message!]);
        }
        break;
      case 'output':
        if (event.data.message) {
          setImportOutput((prev) => [...prev, event.data.message!]);
        }
        break;
      case 'error':
        setImportStatus('failed');
        setImportError(event.data.error || 'Unknown error');
        break;
      case 'complete':
        setImportStatus('completed');
        if (event.data.message) {
          setImportOutput((prev) => [...prev, event.data.message!]);
        }
        break;
    }
  };

  const handleConfigSaved = () => {
    loadConfig();
  };

  const getHostFromUrl = (url: string): string => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            匯入 IBM MAS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!configState.isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              匯入 IBM MAS
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              配置
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              尚未配置 MAS 連線設定。請點擊「配置」按鈕設定 OCP 叢集連線。
            </AlertDescription>
          </Alert>
        </CardContent>

        <MasConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          onConfigSaved={handleConfigSaved}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            匯入 IBM MAS
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfigDialogOpen(true)}
            aria-label="設定"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            OCP: <span className="font-mono">{getHostFromUrl(configState.ocpClusterUrl)}</span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || isImporting}
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plug className="mr-2 h-4 w-4" />
              )}
              測試連線
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={disabled || isImporting || !dbcContent}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              匯入 MAS
            </Button>
          </div>
        </div>

        {/* Warning */}
        <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            將執行 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">runscriptfile.sh -f{dbcFilename}</code> 於 mxinst pod
          </AlertDescription>
        </Alert>

        {/* Test Connection Result */}
        {testResult && !isImporting && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.success
                ? `連線成功! Pod: ${testResult.podName}`
                : testResult.error || 'Connection failed'}
            </AlertDescription>
          </Alert>
        )}

        {/* Import Progress */}
        {(isImporting || importStatus !== 'idle') && (
          <MasImportProgress
            status={importStatus}
            podName={importPodName}
            output={importOutput}
            error={importError}
            onClose={() => {
              setImportStatus('idle');
              setImportOutput([]);
              setImportError(null);
              setImportPodName(null);
            }}
          />
        )}
      </CardContent>

      <MasConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onConfigSaved={handleConfigSaved}
      />
    </Card>
  );
}
