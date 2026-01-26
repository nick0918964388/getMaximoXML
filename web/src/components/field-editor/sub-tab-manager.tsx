'use client';

import { useState } from 'react';
import { SubTabDefinition, DEFAULT_SUB_TAB } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Pencil } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubTabManagerProps {
  tabName: string;
  subTabs: SubTabDefinition[];
  onSubTabsChange: (subTabs: SubTabDefinition[]) => void;
  fieldCountBySubTab: Record<string, number>;
}

/**
 * Move a sub-tab to the left (decrease order)
 */
export function moveSubTabLeft(subTabs: SubTabDefinition[], subTab: SubTabDefinition): SubTabDefinition[] {
  const sortedSubTabs = [...subTabs].sort((a, b) => a.order - b.order);
  const index = sortedSubTabs.findIndex(st => st.id === subTab.id);
  if (index <= 0) return subTabs;

  const newSubTabs = [...sortedSubTabs];
  [newSubTabs[index - 1], newSubTabs[index]] = [newSubTabs[index], newSubTabs[index - 1]];
  return newSubTabs.map((st, i) => ({ ...st, order: i }));
}

/**
 * Move a sub-tab to the right (increase order)
 */
export function moveSubTabRight(subTabs: SubTabDefinition[], subTab: SubTabDefinition): SubTabDefinition[] {
  const sortedSubTabs = [...subTabs].sort((a, b) => a.order - b.order);
  const index = sortedSubTabs.findIndex(st => st.id === subTab.id);
  if (index < 0 || index >= sortedSubTabs.length - 1) return subTabs;

  const newSubTabs = [...sortedSubTabs];
  [newSubTabs[index], newSubTabs[index + 1]] = [newSubTabs[index + 1], newSubTabs[index]];
  return newSubTabs.map((st, i) => ({ ...st, order: i }));
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

  const openEditDialog = (subTab: SubTabDefinition) => {
    setEditingSubTab({ ...subTab });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (subTab: SubTabDefinition) => {
    setDeletingSubTab(subTab);
    setDeleteDialogOpen(true);
  };

  const sortedSubTabs = [...subTabs].sort((a, b) => a.order - b.order);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            管理子頁籤
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增子頁籤
          </DropdownMenuItem>
          {sortedSubTabs.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {sortedSubTabs.map((subTab) => (
                <DropdownMenuItem
                  key={subTab.id}
                  className="flex items-center justify-between"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex-1 truncate">{subTab.label}</span>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(subTab); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); openDeleteDialog(subTab); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
