'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  OslcMaxObject, OslcMaxAttribute, OslcMaxRelationship, OslcMaxIndex,
  SelectedObject,
} from '@/lib/oslc/types';

interface ObjectBrowserProps {
  selectedObjects: Map<string, SelectedObject>;
  onToggleObject: (obj: SelectedObject) => void;
}

interface ObjectDetail {
  attributes: OslcMaxAttribute[];
  relationships: OslcMaxRelationship[];
  indexes: OslcMaxIndex[];
}

export function ObjectBrowser({ selectedObjects, onToggleObject }: ObjectBrowserProps) {
  const [search, setSearch] = useState('');
  const [objects, setObjects] = useState<OslcMaxObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedObject, setExpandedObject] = useState<string | null>(null);
  const [detail, setDetail] = useState<ObjectDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 50;

  const loadObjects = useCallback(async (searchTerm: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: String(pageSize), pageNum: String(page) });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/oslc/objects?${params}`);
      const data = await res.json();
      if (data.success) {
        setObjects(data.data.member);
        setTotalCount(data.data.totalCount);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load objects');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (objectName: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/oslc/objects/${encodeURIComponent(objectName)}`);
      const data = await res.json();
      if (data.success) {
        setDetail(data.data);
      }
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObjects(search, pageNum);
  }, [loadObjects, search, pageNum]);

  const handleExpand = (objectName: string) => {
    if (expandedObject === objectName) {
      setExpandedObject(null);
      setDetail(null);
    } else {
      setExpandedObject(objectName);
      loadDetail(objectName);
    }
  };

  const handleSelect = (obj: OslcMaxObject) => {
    if (selectedObjects.has(obj.objectname)) {
      // Deselect by passing with empty arrays
      onToggleObject({
        object: obj,
        attributes: [],
        relationships: [],
        indexes: [],
      });
    } else {
      // If we have detail loaded, use it; otherwise use empty
      const attrs = expandedObject === obj.objectname && detail ? detail.attributes : [];
      const rels = expandedObject === obj.objectname && detail ? detail.relationships : [];
      const idxs = expandedObject === obj.objectname && detail ? detail.indexes : [];
      onToggleObject({
        object: obj,
        attributes: attrs,
        relationships: rels,
        indexes: idxs,
      });
    }
  };

  const handleSelectWithDetail = () => {
    if (!expandedObject || !detail) return;
    const obj = objects.find((o) => o.objectname === expandedObject);
    if (!obj) return;
    onToggleObject({
      object: obj,
      attributes: detail.attributes,
      relationships: detail.relationships,
      indexes: detail.indexes,
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜尋物件名稱..."
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
            {objects.map((obj) => (
              <div key={obj.objectname} className="border rounded">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Checkbox
                    checked={selectedObjects.has(obj.objectname)}
                    onCheckedChange={() => handleSelect(obj)}
                  />
                  <button
                    className="flex items-center gap-1 flex-1 text-left"
                    onClick={() => handleExpand(obj.objectname)}
                  >
                    {expandedObject === obj.objectname ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span className="font-mono text-sm font-medium">{obj.objectname}</span>
                  </button>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {obj.description}
                  </span>
                  {obj.isview && <Badge variant="outline" className="text-xs">View</Badge>}
                </div>

                {expandedObject === obj.objectname && (
                  <div className="border-t px-3 py-2 bg-muted/30">
                    {detailLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : detail ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{detail.attributes.length} 屬性</span>
                          <span>{detail.relationships.length} 關聯</span>
                          <span>{detail.indexes.length} 索引</span>
                        </div>
                        {!selectedObjects.has(obj.objectname) && (
                          <Button size="sm" variant="outline" onClick={handleSelectWithDetail}>
                            選取 (含所有屬性/關聯/索引)
                          </Button>
                        )}
                        <div className="max-h-[200px] overflow-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1">屬性</th>
                                <th className="text-left py-1">類型</th>
                                <th className="text-left py-1">長度</th>
                                <th className="text-left py-1">Domain</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.attributes.slice(0, 50).map((attr) => (
                                <tr key={attr.attributename} className="border-b border-muted">
                                  <td className="py-1 font-mono">{attr.attributename}</td>
                                  <td className="py-1">{attr.maxtype}</td>
                                  <td className="py-1">{attr.length}</td>
                                  <td className="py-1">{attr.domainid || '-'}</td>
                                </tr>
                              ))}
                              {detail.attributes.length > 50 && (
                                <tr>
                                  <td colSpan={4} className="py-1 text-muted-foreground">
                                    ... 還有 {detail.attributes.length - 50} 個屬性
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            第 {pageNum} 頁，共 {Math.ceil(totalCount / pageSize)} 頁 ({totalCount} 項)
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
