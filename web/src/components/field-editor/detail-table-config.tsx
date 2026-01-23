'use client';

import { useState, useEffect } from 'react';
import { DetailTableConfig, DEFAULT_DETAIL_TABLE_CONFIG } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface DetailTableConfigDialogProps {
  open: boolean;
  onClose: () => void;
  config: DetailTableConfig;
  onSave: (config: DetailTableConfig) => void;
  relationship: string;
}

export function DetailTableConfigDialog({
  open,
  onClose,
  config,
  onSave,
  relationship,
}: DetailTableConfigDialogProps) {
  const [localConfig, setLocalConfig] = useState<DetailTableConfig>(config);

  // Reset local state when dialog opens with new config
  useEffect(() => {
    if (open) {
      setLocalConfig({
        ...DEFAULT_DETAIL_TABLE_CONFIG,
        ...config,
        relationship,
      });
    }
  }, [open, config, relationship]);

  const handleChange = (updates: Partial<DetailTableConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>明細表格設定 - {relationship}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dt-label">表格標題</Label>
            <Input
              id="dt-label"
              value={localConfig.label}
              onChange={(e) => handleChange({ label: e.target.value })}
              placeholder="例如：工單明細"
            />
            <p className="text-xs text-muted-foreground">
              留空則使用關聯名稱作為標題
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dt-orderby">排序方式</Label>
            <Input
              id="dt-orderby"
              value={localConfig.orderBy}
              onChange={(e) => handleChange({ orderBy: e.target.value })}
              placeholder="例如：LINENUM ASC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dt-beanclass">Bean Class</Label>
            <Input
              id="dt-beanclass"
              value={localConfig.beanclass}
              onChange={(e) => handleChange({ beanclass: e.target.value })}
              placeholder="例如：psdi.webclient.beans.MyTableBean"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
