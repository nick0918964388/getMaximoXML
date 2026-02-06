'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pause, Play, Trash2, Download, ArrowDown } from 'lucide-react';
import type { MasManagedPodInfo } from '@/lib/mas/pod-manager-types';

const MAX_LOG_LINES = 5000;

interface LogViewerProps {
  pods: MasManagedPodInfo[];
  /** Initially selected pod name */
  initialPodName?: string;
}

export function LogViewer({ pods, initialPodName }: LogViewerProps) {
  const [selectedPod, setSelectedPod] = useState<string>(initialPodName ?? '');
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [lines, setLines] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pausedLinesRef = useRef<string[]>([]);

  // Find the pod object for the selected pod
  const pod = pods.find((p) => p.name === selectedPod);
  const containers = useMemo(() => pod?.containers ?? [], [pod]);

  // Auto-select first container when pod changes
  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].name);
    }
  }, [containers, selectedContainer]);

  // Connect to SSE log stream
  const connect = useCallback(() => {
    if (!selectedPod) return;

    // Cleanup previous connection
    eventSourceRef.current?.close();
    setLines([]);
    pausedLinesRef.current = [];
    setConnected(false);

    const params = new URLSearchParams({
      tailLines: '200',
      timestamps: 'true',
    });
    if (selectedContainer) {
      params.set('container', selectedContainer);
    }

    const es = new EventSource(`/api/mas/pods/${selectedPod}/logs?${params}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'log') {
          const newLine = parsed.data as string;
          setLines((prev) => {
            const updated = [...prev, newLine];
            if (updated.length > MAX_LOG_LINES) {
              return updated.slice(updated.length - MAX_LOG_LINES);
            }
            return updated;
          });
        } else if (parsed.type === 'error') {
          setLines((prev) => [...prev, `[ERROR] ${parsed.data}`]);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
    };
  }, [selectedPod, selectedContainer]);

  // Disconnect on unmount or pod change
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // Auto-reconnect when pod/container selection changes
  useEffect(() => {
    if (selectedPod && selectedContainer) {
      connect();
    }
    return () => {
      eventSourceRef.current?.close();
    };
  }, [selectedPod, selectedContainer, connect]);

  // Auto-scroll to bottom using sentinel element
  useEffect(() => {
    if (autoScroll && !paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [lines, autoScroll, paused]);

  const handlePause = () => {
    if (!paused) {
      pausedLinesRef.current = [...lines];
    }
    setPaused(!paused);
  };

  const handleClear = () => {
    setLines([]);
    pausedLinesRef.current = [];
  };

  const handleDownload = () => {
    const content = (paused ? pausedLinesRef.current : lines).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPod}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayLines = paused ? pausedLinesRef.current : lines;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={selectedPod} onValueChange={(v) => { setSelectedPod(v); setSelectedContainer(''); }}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="選擇 Pod" />
          </SelectTrigger>
          <SelectContent>
            {pods.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {containers.length > 1 && (
          <Select value={selectedContainer} onValueChange={setSelectedContainer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Container" />
            </SelectTrigger>
            <SelectContent>
              {containers.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-muted-foreground">
            {connected ? '串流中' : '未連線'}
          </span>
        </div>
      </div>

      {/* Log output */}
      <ScrollArea className="h-[500px] rounded-md border bg-zinc-950 text-zinc-200">
        <div className="p-3 font-mono text-xs leading-5 whitespace-pre-wrap">
          {displayLines.length === 0 ? (
            <span className="text-zinc-500">
              {selectedPod ? '等待日誌...' : '請選擇一個 Pod 以檢視日誌'}
            </span>
          ) : (
            displayLines.map((line, i) => (
              <div key={i} className="hover:bg-zinc-800/50">
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Bottom toolbar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePause} disabled={!selectedPod}>
          {paused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
          {paused ? '繼續' : '暫停'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear} disabled={!selectedPod}>
          <Trash2 className="h-4 w-4 mr-1" />
          清除
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={displayLines.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          下載
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoScroll(!autoScroll)}
          className={autoScroll ? 'bg-accent' : ''}
        >
          <ArrowDown className="h-4 w-4 mr-1" />
          自動捲動
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {displayLines.length} 行
        </span>
      </div>
    </div>
  );
}
