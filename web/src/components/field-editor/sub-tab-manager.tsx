'use client';

import { useState } from 'react';
import { SubTabDefinition, DEFAULT_SUB_TAB } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

interface SubTabManagerProps {
  tabName: string;
  subTabs: SubTabDefinition[];
  onSubTabsChange: (subTabs: SubTabDefinition[]) => void;
  fieldCountBySubTab: Record<string, number>;
}

export function SubTabManager({
  tabName: _tabName,
  subTabs,
  onSubTabsChange,
  fieldCountBySubTab,
}: SubTabManagerProps) {
  // Note: _tabName is reserved for future use (e.g., generating unique IDs)
  void _tabName;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newSubTabLabel, setNewSubTabLabel] = useState('');
  const [editingSubTab, setEditingSubTab] = useState<SubTabDefinition | null>(null);
  const [deletingSubTab, setDeletingSubTab] = useState<SubTabDefinition | null>(null);

  const handleAddSubTab = () => {
    if (!newSubTabLabel.trim()) return;

    const newSubTab: SubTabDefinition = {
      ...DEFAULT_SUB_TAB,
      id: `subtab_${newSubTabLabel.toLowerCase().replace(/\s+/g, '_')}`,
      label: newSubTabLabel.trim(),
      order: subTabs.length,
    };

    onSubTabsChange([...subTabs, newSubTab]);
    setNewSubTabLabel('');
    setAddDialogOpen(false);
  };

  const handleEditSubTab = () => {
    if (!editingSubTab || !editingSubTab.label.trim()) return;

    const updatedSubTabs = subTabs.map(st =>
      st.id === editingSubTab.id ? editingSubTab : st
    );
    onSubTabsChange(updatedSubTabs);
    setEditingSubTab(null);
    setEditDialogOpen(false);
  };

  const handleDeleteSubTab = () => {
    if (!deletingSubTab) return;

    const updatedSubTabs = subTabs.filter(st => st.id !== deletingSubTab.id);
    // Re-order remaining subTabs
    const reorderedSubTabs = updatedSubTabs.map((st, index) => ({
      ...st,
      order: index,
    }));
    onSubTabsChange(reorderedSubTabs);
    setDeletingSubTab(null);
    setDeleteDialogOpen(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSubTabs = [...subTabs];
    [newSubTabs[index - 1], newSubTabs[index]] = [newSubTabs[index], newSubTabs[index - 1]];
    // Update order values
    const reorderedSubTabs = newSubTabs.map((st, i) => ({ ...st, order: i }));
    onSubTabsChange(reorderedSubTabs);
  };

  const handleMoveDown = (index: number) => {
    if (index === subTabs.length - 1) return;
    const newSubTabs = [...subTabs];
    [newSubTabs[index], newSubTabs[index + 1]] = [newSubTabs[index + 1], newSubTabs[index]];
    // Update order values
    const reorderedSubTabs = newSubTabs.map((st, i) => ({ ...st, order: i }));
    onSubTabsChange(reorderedSubTabs);
  };

  const openEditDialog = (subTab: SubTabDefinition) => {
    setEditingSubTab({ ...subTab });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (subTab: SubTabDefinition) => {
    setDeletingSubTab(subTab);
    setDeleteDialogOpen(true);
  };

  // Sort subTabs by order
  const sortedSubTabs = [...subTabs].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-muted-foreground">子頁籤</h5>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          新增子頁籤
        </Button>
      </div>

      {sortedSubTabs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
          尚無子頁籤。新增子頁籤後，可在欄位編輯時選擇子頁籤。
        </p>
      ) : (
        <div className="space-y-2">
          {sortedSubTabs.map((subTab, index) => {
            const fieldCount = fieldCountBySubTab[subTab.label] || 0;
            return (
              <div
                key={subTab.id}
                className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortedSubTabs.length - 1}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                  <span className="font-medium">{subTab.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {fieldCount} 欄位
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(subTab)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(subTab)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add SubTab Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增子頁籤</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subTabLabel">子頁籤名稱</Label>
              <Input
                id="subTabLabel"
                value={newSubTabLabel}
                onChange={(e) => setNewSubTabLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubTab()}
                placeholder="例如：詳細資訊"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddSubTab} disabled={!newSubTabLabel.trim()}>
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit SubTab Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯子頁籤</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editSubTabLabel">子頁籤名稱</Label>
              <Input
                id="editSubTabLabel"
                value={editingSubTab?.label || ''}
                onChange={(e) =>
                  setEditingSubTab(prev =>
                    prev ? { ...prev, label: e.target.value } : null
                  )
                }
                onKeyDown={(e) => e.key === 'Enter' && handleEditSubTab()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleEditSubTab}
              disabled={!editingSubTab?.label.trim()}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SubTab Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除子頁籤？</AlertDialogTitle>
            <AlertDialogDescription>
              這將刪除子頁籤「{deletingSubTab?.label}」。
              {(fieldCountBySubTab[deletingSubTab?.label || ''] || 0) > 0 && (
                <>
                  <br />
                  <span className="text-destructive font-medium">
                    注意：此子頁籤下有 {fieldCountBySubTab[deletingSubTab?.label || '']} 個欄位，這些欄位的子頁籤設定將被清除。
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSubTab}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
