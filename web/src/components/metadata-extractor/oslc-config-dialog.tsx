'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface OslcConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}

export function OslcConfigDialog({ open, onOpenChange, onConfigSaved }: OslcConfigDialogProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [authMethod, setAuthMethod] = useState<'apikey' | 'basic'>('apikey');
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch('/api/oslc/config')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setBaseUrl(data.data.baseUrl || '');
            setAuthMethod(data.data.authMethod || 'apikey');
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { baseUrl, authMethod };
      if (authMethod === 'apikey') body.apiKey = apiKey;
      else { body.username = username; body.password = password; }

      const res = await fetch('/api/oslc/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onConfigSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Save first, then test
      const body: Record<string, string> = { baseUrl, authMethod };
      if (authMethod === 'apikey') body.apiKey = apiKey;
      else { body.username = username; body.password = password; }

      await fetch('/api/oslc/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const res = await fetch('/api/oslc/test-connection', { method: 'POST' });
      const data = await res.json();
      setTestResult(data.success && data.data?.connected);
    } catch {
      setTestResult(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>OSLC 連線設定</DialogTitle>
          <DialogDescription>設定 Maximo OSLC REST API 連線資訊</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oslc-url">Maximo Base URL</Label>
            <Input
              id="oslc-url"
              placeholder="https://maximo.example.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>認證方式</Label>
            <Select value={authMethod} onValueChange={(v) => setAuthMethod(v as 'apikey' | 'basic')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apikey">API Key</SelectItem>
                <SelectItem value="basic">Basic Auth (帳號/密碼)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authMethod === 'apikey' ? (
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="oslc-username">帳號</Label>
                <Input
                  id="oslc-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oslc-password">密碼</Label>
                <Input
                  id="oslc-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {testResult !== null && (
            <div className={`flex items-center gap-2 text-sm ${testResult ? 'text-green-600' : 'text-red-600'}`}>
              {testResult ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult ? '連線成功' : '連線失敗'}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing || !baseUrl}>
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            測試連線
          </Button>
          <Button onClick={handleSave} disabled={saving || !baseUrl}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
