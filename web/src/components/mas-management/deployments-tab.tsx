'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Square, Play } from 'lucide-react';
import type { MasDeploymentInfo } from '@/lib/mas/pod-manager-types';
import { parseMasResourceKind } from '@/lib/mas/pod-manager-types';

interface DeploymentsTabProps {
  deployments: MasDeploymentInfo[];
  loading: boolean;
  onRefresh: () => void;
  podPrefix?: string;
}

export function DeploymentsTab({ deployments, loading, onRefresh, podPrefix }: DeploymentsTabProps) {
  const [scalingName, setScalingName] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    name: string;
    action: 'stop' | 'start';
    replicas: number;
  } | null>(null);

  const handleScale = async (name: string, replicas: number) => {
    setScalingName(name);
    setConfirmDialog(null);

    try {
      const response = await fetch(`/api/mas/deployments/${name}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replicas }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || '縮放失敗');
      }
    } catch {
      alert('縮放請求失敗');
    } finally {
      setScalingName(null);
      onRefresh();
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">載入中...</div>;
  }

  if (deployments.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        未找到 MAS Manage 部署。請確認連線設定和命名空間是否正確。
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>類型</TableHead>
            <TableHead>副本數</TableHead>
            <TableHead>就緒</TableHead>
            <TableHead>存活時間</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((dep) => {
            const isScaling = scalingName === dep.name;
            const isStopped = dep.replicas === 0;

            return (
              <TableRow key={dep.name}>
                <TableCell className="font-mono text-xs max-w-[300px] truncate" title={dep.name}>
                  {dep.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{parseMasResourceKind(dep.name, podPrefix)}</Badge>
                </TableCell>
                <TableCell>
                  {dep.readyReplicas}/{dep.replicas}
                </TableCell>
                <TableCell>
                  {dep.replicas === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : dep.readyReplicas === dep.replicas ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-yellow-500">⏳</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{dep.age}</TableCell>
                <TableCell>
                  {isScaling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isStopped ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirmDialog({
                          name: dep.name,
                          action: 'start',
                          replicas: dep.previousReplicas ?? 1,
                        })
                      }
                    >
                      <Play className="h-4 w-4 mr-1" />
                      啟動
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirmDialog({
                          name: dep.name,
                          action: 'stop',
                          replicas: 0,
                        })
                      }
                    >
                      <Square className="h-4 w-4 mr-1" />
                      停止
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Confirmation dialog */}
      <AlertDialog
        open={confirmDialog !== null}
        onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'stop' ? '停止部署' : '啟動部署'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'stop'
                ? `確定要將 ${confirmDialog?.name} 的副本數設為 0 嗎？這將停止所有 Pod。`
                : `確定要將 ${confirmDialog?.name} 的副本數恢復為 ${confirmDialog?.replicas} 嗎？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleScale(confirmDialog.name, confirmDialog.replicas);
                }
              }}
            >
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
