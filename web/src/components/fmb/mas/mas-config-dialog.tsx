'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  Plug,
} from 'lucide-react';
import type { MasApiResponse, MasTestConnectionResult } from '@/lib/mas/types';

interface MasConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}

interface FormData {
  ocpClusterUrl: string;
  namespace: string;
  token: string;
  podPrefix: string;
  dbcTargetPath: string;
}

interface FormErrors {
  ocpClusterUrl?: string;
  namespace?: string;
  token?: string;
  podPrefix?: string;
  dbcTargetPath?: string;
}

export function MasConfigDialog({
  open,
  onOpenChange,
  onConfigSaved,
}: MasConfigDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    ocpClusterUrl: '',
    namespace: 'mas-inst1-manage',
    token: '',
    podPrefix: 'mas-masw-manage-maxinst-',
    dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<MasTestConnectionResult | null>(null);
  const [hasExistingToken, setHasExistingToken] = useState(false);

  // Load existing configuration when dialog opens
  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    setIsLoading(true);
    setSaveError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/mas/config');
      const data: MasApiResponse<{
        ocpClusterUrl: string;
        namespace: string;
        podPrefix: string;
        dbcTargetPath: string;
        encryptedToken: string;
      }> = await response.json();

      if (data.success && data.data) {
        setFormData({
          ocpClusterUrl: data.data.ocpClusterUrl || '',
          namespace: data.data.namespace || 'mas-inst1-manage',
          token: '', // Don't show encrypted token
          podPrefix: data.data.podPrefix || 'mas-masw-manage-maxinst-',
          dbcTargetPath: data.data.dbcTargetPath || '/opt/IBM/SMP/maximo/tools/maximo/dbc',
        });
        setHasExistingToken(data.data.encryptedToken === '***configured***');
      }
    } catch {
      setSaveError('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.ocpClusterUrl) {
      newErrors.ocpClusterUrl = 'OCP Cluster URL is required';
    } else if (!formData.ocpClusterUrl.startsWith('https://')) {
      newErrors.ocpClusterUrl = 'URL must start with https://';
    }

    if (!formData.namespace) {
      newErrors.namespace = 'Namespace is required';
    }

    // Token is required if not already configured
    if (!hasExistingToken && !formData.token) {
      newErrors.token = 'Token is required';
    }

    if (!formData.podPrefix) {
      newErrors.podPrefix = 'Pod prefix is required';
    }

    if (!formData.dbcTargetPath) {
      newErrors.dbcTargetPath = 'DBC target path is required';
    } else if (!formData.dbcTargetPath.startsWith('/')) {
      newErrors.dbcTargetPath = 'Path must be absolute (start with /)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        ocpClusterUrl: formData.ocpClusterUrl,
        namespace: formData.namespace,
        token: formData.token || '__KEEP_EXISTING__', // Special value to keep existing token
        podPrefix: formData.podPrefix,
        dbcTargetPath: formData.dbcTargetPath,
      };

      // If token is empty but we have existing token, don't send the payload
      if (!formData.token && hasExistingToken) {
        // Don't update token - but we need to send something
        // The API should handle keeping the existing token
        payload.token = '__KEEP_EXISTING__';
      }

      // Actually, for simplicity, require new token if user is changing config
      if (!formData.token && !hasExistingToken) {
        setErrors({ ...errors, token: 'Token is required' });
        setIsSaving(false);
        return;
      }

      // If we have existing token and no new one, just update other fields
      if (!formData.token && hasExistingToken) {
        // For now, require user to re-enter token if they want to change other settings
        // This is more secure
        setErrors({ ...errors, token: 'Please re-enter your token to update configuration' });
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/mas/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocpClusterUrl: formData.ocpClusterUrl,
          namespace: formData.namespace,
          token: formData.token,
          podPrefix: formData.podPrefix,
          dbcTargetPath: formData.dbcTargetPath,
        }),
      });

      const data: MasApiResponse<{ message: string }> = await response.json();

      if (!response.ok || !data.success) {
        setSaveError(data.error || 'Failed to save configuration');
        return;
      }

      setHasExistingToken(true);
      setFormData((prev) => ({ ...prev, token: '' })); // Clear token from form
      onConfigSaved?.();
      onOpenChange(false);
    } catch {
      setSaveError('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            MAS 環境設定
          </DialogTitle>
          <DialogDescription>
            配置 IBM MAS (Maximo Application Suite) 的 OCP 連線設定
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* OCP Cluster URL */}
            <div className="grid gap-2">
              <Label htmlFor="ocpClusterUrl">OCP Cluster URL</Label>
              <Input
                id="ocpClusterUrl"
                placeholder="https://api.ocp.example.com:6443"
                value={formData.ocpClusterUrl}
                onChange={handleInputChange('ocpClusterUrl')}
                className={errors.ocpClusterUrl ? 'border-destructive' : ''}
              />
              {errors.ocpClusterUrl && (
                <p className="text-sm text-destructive">{errors.ocpClusterUrl}</p>
              )}
            </div>

            {/* Namespace */}
            <div className="grid gap-2">
              <Label htmlFor="namespace">Namespace</Label>
              <Input
                id="namespace"
                placeholder="mas-inst1-manage"
                value={formData.namespace}
                onChange={handleInputChange('namespace')}
                className={errors.namespace ? 'border-destructive' : ''}
              />
              {errors.namespace && (
                <p className="text-sm text-destructive">{errors.namespace}</p>
              )}
            </div>

            {/* Service Account Token */}
            <div className="grid gap-2">
              <Label htmlFor="token">
                Service Account Token
                {hasExistingToken && (
                  <span className="ml-2 text-xs text-muted-foreground">(已設定)</span>
                )}
              </Label>
              <Input
                id="token"
                type="password"
                placeholder={hasExistingToken ? '輸入新 Token 以更新' : 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'}
                value={formData.token}
                onChange={handleInputChange('token')}
                className={errors.token ? 'border-destructive' : ''}
              />
              {errors.token && (
                <p className="text-sm text-destructive">{errors.token}</p>
              )}
            </div>

            {/* Pod Prefix */}
            <div className="grid gap-2">
              <Label htmlFor="podPrefix">Pod 名稱前綴</Label>
              <Input
                id="podPrefix"
                placeholder="mas-masw-manage-maxinst-"
                value={formData.podPrefix}
                onChange={handleInputChange('podPrefix')}
                className={errors.podPrefix ? 'border-destructive' : ''}
              />
              {errors.podPrefix && (
                <p className="text-sm text-destructive">{errors.podPrefix}</p>
              )}
            </div>

            {/* DBC Target Path */}
            <div className="grid gap-2">
              <Label htmlFor="dbcTargetPath">DBC 目標路徑</Label>
              <Input
                id="dbcTargetPath"
                placeholder="/opt/IBM/SMP/maximo/tools/maximo/dbc"
                value={formData.dbcTargetPath}
                onChange={handleInputChange('dbcTargetPath')}
                className={errors.dbcTargetPath ? 'border-destructive' : ''}
              />
              {errors.dbcTargetPath && (
                <p className="text-sm text-destructive">{errors.dbcTargetPath}</p>
              )}
            </div>

            {/* Error Alert */}
            {saveError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {/* Test Connection Result */}
            {testResult && (
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
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !hasExistingToken}
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plug className="mr-2 h-4 w-4" />
            )}
            測試連線
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              儲存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
