'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import type { OslcMaxDomain, OslcDomainWithValues } from '@/lib/oslc/types';

interface DomainBrowserProps {
  selectedDomains: Map<string, OslcDomainWithValues>;
  onToggleDomain: (domain: OslcDomainWithValues) => void;
}

export function DomainBrowser({ selectedDomains, onToggleDomain }: DomainBrowserProps) {
  const [search, setSearch] = useState('');
  const [domains, setDomains] = useState<OslcMaxDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loadingDomain, setLoadingDomain] = useState<string | null>(null);
  const pageSize = 50;

  const loadDomains = useCallback(async (searchTerm: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: String(pageSize), pageNum: String(page) });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/oslc/domains?${params}`);
      const data = await res.json();
      if (data.success) {
        setDomains(data.data.member);
        setTotalCount(data.data.totalCount);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomains(search, pageNum);
  }, [loadDomains, search, pageNum]);

  const handleToggle = async (domain: OslcMaxDomain) => {
    if (selectedDomains.has(domain.domainid)) {
      // Deselect
      onToggleDomain(domain as OslcDomainWithValues);
      return;
    }

    // Select: load domain values first
    setLoadingDomain(domain.domainid);
    try {
      const res = await fetch(`/api/oslc/domains/${encodeURIComponent(domain.domainid)}`);
      const data = await res.json();
      if (data.success) {
        onToggleDomain(data.data);
      }
    } catch {
      // Fall back to domain without values
      onToggleDomain(domain as OslcDomainWithValues);
    } finally {
      setLoadingDomain(null);
    }
  };

  const domainTypeColor = (type: string) => {
    switch (type) {
      case 'SYNONYM': return 'bg-blue-100 text-blue-800';
      case 'ALN': return 'bg-green-100 text-green-800';
      case 'NUMERIC': return 'bg-yellow-100 text-yellow-800';
      case 'TABLE': return 'bg-purple-100 text-purple-800';
      case 'CROSSOVER': return 'bg-orange-100 text-orange-800';
      default: return '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜尋 Domain..."
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
            {domains.map((dom) => (
              <div key={dom.domainid} className="flex items-center gap-2 px-3 py-2 border rounded">
                {loadingDomain === dom.domainid ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Checkbox
                    checked={selectedDomains.has(dom.domainid)}
                    onCheckedChange={() => handleToggle(dom)}
                  />
                )}
                <span className="font-mono text-sm font-medium">{dom.domainid}</span>
                <Badge className={`text-xs ${domainTypeColor(dom.domaintype)}`} variant="outline">
                  {dom.domaintype}
                </Badge>
                <span className="text-xs text-muted-foreground truncate flex-1">{dom.description}</span>
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
