'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import type { OslcMaxModule } from '@/lib/oslc/types';

interface ModuleBrowserProps {
  selectedModules: Map<string, OslcMaxModule>;
  onToggleModule: (mod: OslcMaxModule) => void;
}

export function ModuleBrowser({ selectedModules, onToggleModule }: ModuleBrowserProps) {
  const [search, setSearch] = useState('');
  const [modules, setModules] = useState<OslcMaxModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 50;

  const loadModules = useCallback(async (searchTerm: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: String(pageSize), pageNum: String(page) });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/oslc/modules?${params}`);
      const data = await res.json();
      if (data.success) {
        setModules(data.data.member);
        setTotalCount(data.data.totalCount);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules(search, pageNum);
  }, [loadModules, search, pageNum]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜尋 Module..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPageNum(1); }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ScrollArea className="h-[500px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {modules.map((mod) => (
              <div key={mod.module} className="flex items-center gap-2 px-3 py-2 border rounded">
                <Checkbox
                  checked={selectedModules.has(mod.module)}
                  onCheckedChange={() => onToggleModule(mod)}
                />
                <span className="font-mono text-sm font-medium">{mod.module}</span>
                <span className="text-xs text-muted-foreground truncate flex-1">{mod.description}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            第 {pageNum} 頁，共 {Math.ceil(totalCount / pageSize)} 頁
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={pageNum <= 1} onClick={() => setPageNum((p) => p - 1)}>
              上一頁
            </Button>
            <Button size="sm" variant="outline" disabled={pageNum * pageSize >= totalCount} onClick={() => setPageNum((p) => p + 1)}>
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
