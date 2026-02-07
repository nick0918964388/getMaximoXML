'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Server, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { MasConfigDialog } from '@/components/fmb/mas/mas-config-dialog';
import { PodsTab } from './pods-tab';
import { DeploymentsTab } from './deployments-tab';
import { LogViewer } from './log-viewer';
import type { MasManagedPodInfo } from '@/lib/mas/pod-manager-types';
import type { MasDeploymentInfo } from '@/lib/mas/pod-manager-types';
import type { MasApiResponse } from '@/lib/mas/types';

/** Pod prefix for MAS management (different from DBC import's "mas-masw-manage-maxinst-") */
const MAS_MGMT_POD_PREFIX = 'mas-masw-all-';

export function MasManagementPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pods');
  const [logPodName, setLogPodName] = useState<string | undefined>(undefined);

  // Pod state
  const [pods, setPods] = useState<MasManagedPodInfo[]>([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [podsError, setPodsError] = useState<string | null>(null);

  // Deployment state
  const [deployments, setDeployments] = useState<MasDeploymentInfo[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);

  // Connection info
  const [namespace, setNamespace] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/mas/config');
      const data = await response.json();
      if (data.success && data.data) {
        setNamespace(data.data.namespace || '');
        setIsConfigured(!!data.data.encryptedToken);
      }
    } catch {
      setIsConfigured(false);
    }
  }, []);

  const loadPods = useCallback(async () => {
    setPodsLoading(true);
    setPodsError(null);
    try {
      const response = await fetch(`/api/mas/pods?podPrefix=${encodeURIComponent(MAS_MGMT_POD_PREFIX)}`);
      const data: MasApiResponse<MasManagedPodInfo[]> = await response.json();
      if (data.success && data.data) {
        setPods(data.data);
      } else {
        setPodsError(data.error || '無法載入 Pod');
      }
    } catch {
      setPodsError('無法連線至 API');
    } finally {
      setPodsLoading(false);
    }
  }, []);

  const loadDeployments = useCallback(async () => {
    setDeploymentsLoading(true);
    setDeploymentsError(null);
    try {
      const response = await fetch(`/api/mas/deployments?podPrefix=${encodeURIComponent(MAS_MGMT_POD_PREFIX)}`);
      const data: MasApiResponse<MasDeploymentInfo[]> = await response.json();
      if (data.success && data.data) {
        setDeployments(data.data);
      } else {
        setDeploymentsError(data.error || '無法載入部署');
      }
    } catch {
      setDeploymentsError('無法連線至 API');
    } finally {
      setDeploymentsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadPods();
    loadDeployments();
  }, [loadPods, loadDeployments]);

  // Initial load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (isConfigured) {
      refreshAll();
    }
  }, [isConfigured, refreshAll]);

  const handleViewLogs = (podName: string) => {
    setLogPodName(podName);
    setActiveTab('logs');
  };

  const handleConfigSaved = () => {
    loadConfig();
    refreshAll();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              MAS 管理
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConfigured && namespace && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {namespace}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
                <Settings className="h-4 w-4 mr-1" />
                設定
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                disabled={!isConfigured || podsLoading || deploymentsLoading}
              >
                {(podsLoading || deploymentsLoading) ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                重新整理
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isConfigured ? (
            <div className="py-8 text-center text-muted-foreground">
              尚未設定 MAS 連線。請點擊右上角「設定」按鈕進行配置。
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pods">
                  Pods
                  {pods.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {pods.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="deployments">
                  部署
                  {deployments.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {deployments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="logs">日誌</TabsTrigger>
              </TabsList>

              <TabsContent value="pods" className="mt-4">
                {podsError && (
                  <div className="mb-4 text-sm text-destructive">{podsError}</div>
                )}
                <PodsTab pods={pods} loading={podsLoading} onViewLogs={handleViewLogs} podPrefix={MAS_MGMT_POD_PREFIX} />
              </TabsContent>

              <TabsContent value="deployments" className="mt-4">
                {deploymentsError && (
                  <div className="mb-4 text-sm text-destructive">{deploymentsError}</div>
                )}
                <DeploymentsTab
                  deployments={deployments}
                  loading={deploymentsLoading}
                  onRefresh={loadDeployments}
                  podPrefix={MAS_MGMT_POD_PREFIX}
                />
              </TabsContent>

              <TabsContent value="logs" className="mt-4">
                <LogViewer pods={pods} initialPodName={logPodName} podPrefix={MAS_MGMT_POD_PREFIX} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <MasConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onConfigSaved={handleConfigSaved}
        hideDbcFields
        defaultPodPrefix="mas-masw-all-"
      />
    </div>
  );
}
