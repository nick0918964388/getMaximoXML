'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedProject } from '@/lib/types';
import { getProjects, deleteProject, exportProject, importProject } from '@/lib/supabase/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
import { downloadFile } from './download-buttons';
import { Loader2 } from 'lucide-react';

interface HistoryListProps {
  onLoadProject: (project: SavedProject) => void;
  refreshKey?: number;
}

export function HistoryList({ onLoadProject, refreshKey }: HistoryListProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, refreshKey]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      try {
        await deleteProject(deleteId);
        await loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  const handleExport = (project: SavedProject) => {
    const json = exportProject(project);
    downloadFile(json, `${project.name}.json`, 'application/json');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const imported = await importProject(text);
        if (imported) {
          await loadProjects();
        } else {
          alert('匯入專案失敗，格式無效。');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('匯入專案失敗。');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">已儲存的專案</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                匯入中...
              </>
            ) : (
              '匯入'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              沒有已儲存的專案。儲存您目前的專案後即會顯示在此處。
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">{project.metadata.id || '無 ID'}</Badge>
                      <span>{project.fields.length} 個欄位</span>
                      <span>更新時間：{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadProject(project)}
                    >
                      載入
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(project)}
                    >
                      匯出
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(project.id)}
                    >
                      刪除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除專案？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。專案將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? '刪除中...' : '刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
