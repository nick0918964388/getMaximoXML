'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  X,
} from 'lucide-react';
import type { MasImportStatus } from '@/lib/mas/types';

interface MasImportProgressProps {
  status: MasImportStatus;
  podName: string | null;
  output: string[];
  error: string | null;
  onClose: () => void;
}

const STEPS: { status: MasImportStatus; label: string }[] = [
  { status: 'connecting', label: '連接 OCP 叢集' },
  { status: 'finding-pod', label: '尋找 mxinst pod' },
  { status: 'uploading', label: '上傳 DBC 檔案' },
  { status: 'executing', label: '執行 runscriptfile.sh' },
];

function getStepIndex(status: MasImportStatus): number {
  const index = STEPS.findIndex((s) => s.status === status);
  return index >= 0 ? index : -1;
}

export function MasImportProgress({
  status,
  podName,
  output,
  error,
  onClose,
}: MasImportProgressProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const currentStepIndex = getStepIndex(status);
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';
  const isRunning = !isComplete && !isFailed && status !== 'idle';

  return (
    <Card className="border-2">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">
            {isComplete
              ? '匯入完成'
              : isFailed
                ? '匯入失敗'
                : '正在匯入 DBC...'}
          </h4>
          {(isComplete || isFailed) && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="space-y-2 mb-4">
          {STEPS.map((step, index) => {
            const isCurrentStep = index === currentStepIndex;
            const isCompleted = isComplete || index < currentStepIndex;
            const isStepFailed = isFailed && index === currentStepIndex;

            return (
              <div
                key={step.status}
                className="flex items-center gap-2 text-sm"
              >
                {isStepFailed ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isCurrentStep && isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={
                    isCompleted
                      ? 'text-green-600'
                      : isStepFailed
                        ? 'text-destructive'
                        : isCurrentStep
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                  }
                >
                  {step.label}
                  {step.status === 'finding-pod' && podName && isCompleted && (
                    <span className="ml-2 font-mono text-xs">
                      ({podName})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Output Log */}
        {output.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-1">輸出:</div>
            <ScrollArea className="h-32 w-full rounded border bg-muted/50">
              <div
                ref={outputRef}
                className="p-2 font-mono text-xs whitespace-pre-wrap"
              >
                {output.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-2 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {isComplete && (
          <div className="mt-4 p-2 rounded bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              DBC 檔案已成功匯入! 請在 Maximo 中確認表格已建立。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
