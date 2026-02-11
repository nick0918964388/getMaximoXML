'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Trash2 } from 'lucide-react';
import type { MetadataSelection } from '@/lib/oslc/types';

interface SelectionCartProps {
  selection: MetadataSelection;
  onRemoveObject: (name: string) => void;
  onRemoveDomain: (name: string) => void;
  onRemoveApp: (name: string) => void;
  onRemoveModule: (name: string) => void;
  onClearAll: () => void;
}

export function SelectionCart({
  selection,
  onRemoveObject,
  onRemoveDomain,
  onRemoveApp,
  onRemoveModule,
  onClearAll,
}: SelectionCartProps) {
  const totalCount =
    selection.objects.size +
    selection.domains.size +
    selection.apps.size +
    selection.modules.size;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">已選取項目</span>
          <Badge variant="secondary">{totalCount}</Badge>
        </div>
        {totalCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <Trash2 className="h-3 w-3 mr-1" />
            清除
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {selection.objects.size > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">物件 (Objects)</p>
              {Array.from(selection.objects.entries()).map(([name, sel]) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <div className="min-w-0">
                    <span className="text-sm font-mono">{name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {sel.attributes.length} attrs, {sel.relationships.length} rels, {sel.indexes.length} idx
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemoveObject(name)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selection.domains.size > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Domain</p>
              {Array.from(selection.domains.entries()).map(([name, dom]) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <div className="min-w-0">
                    <span className="text-sm font-mono">{name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{dom.domaintype}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemoveDomain(name)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selection.apps.size > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Applications</p>
              {Array.from(selection.apps.entries()).map(([name]) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <span className="text-sm font-mono">{name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemoveApp(name)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selection.modules.size > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Modules</p>
              {Array.from(selection.modules.entries()).map(([name]) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <span className="text-sm font-mono">{name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemoveModule(name)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {totalCount === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              尚未選取任何項目。從左側瀏覽並選取要擷取的物件。
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
