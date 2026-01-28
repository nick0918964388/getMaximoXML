'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Clock } from 'lucide-react';
import {
  getUploadHistory,
  deleteUploadHistory,
  type FmbUploadRecord,
} from '@/lib/fmb/history';

interface UploadHistoryProps {
  onLoad: (xmlContent: string, fileName: string) => void;
  refreshKey?: number;
}

export function UploadHistory({ onLoad, refreshKey }: UploadHistoryProps) {
  const [history, setHistory] = useState<FmbUploadRecord[]>([]);

  useEffect(() => {
    setHistory(getUploadHistory());
  }, [refreshKey]);

  const handleDelete = (id: string) => {
    deleteUploadHistory(id);
    setHistory(getUploadHistory());
  };

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          上傳歷史
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <button
                className="flex items-center gap-2 text-left hover:underline cursor-pointer min-w-0 flex-1"
                onClick={() => onLoad(record.xmlContent, record.fileName)}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono">{record.fileName}</span>
                <span className="text-muted-foreground shrink-0">
                  ({record.moduleName}, {record.fieldCount} 欄位)
                </span>
              </button>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(record.uploadedAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
