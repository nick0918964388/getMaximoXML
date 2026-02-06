'use client';

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
import { ScrollText } from 'lucide-react';
import type { MasManagedPodInfo } from '@/lib/mas/pod-manager-types';
import { parseMasResourceKind } from '@/lib/mas/pod-manager-types';

interface PodsTabProps {
  pods: MasManagedPodInfo[];
  loading: boolean;
  onViewLogs: (podName: string) => void;
  podPrefix?: string;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Running':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Failed':
    case 'Unknown':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function PodsTab({ pods, loading, onViewLogs, podPrefix }: PodsTabProps) {
  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">載入中...</div>;
  }

  if (pods.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        未找到 MAS Manage Pod。請確認連線設定和命名空間是否正確。
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名稱</TableHead>
          <TableHead>類型</TableHead>
          <TableHead>狀態</TableHead>
          <TableHead>就緒</TableHead>
          <TableHead>重啟</TableHead>
          <TableHead>存活時間</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pods.map((pod) => (
          <TableRow key={pod.name}>
            <TableCell className="font-mono text-xs max-w-[300px] truncate" title={pod.name}>
              {pod.name}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{parseMasResourceKind(pod.name, podPrefix)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(pod.status)}>{pod.status}</Badge>
            </TableCell>
            <TableCell>
              {pod.ready ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-500">✗</span>
              )}
            </TableCell>
            <TableCell>{pod.restarts}</TableCell>
            <TableCell className="text-muted-foreground">{pod.age}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewLogs(pod.name)}
              >
                <ScrollText className="h-4 w-4 mr-1" />
                日誌
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
