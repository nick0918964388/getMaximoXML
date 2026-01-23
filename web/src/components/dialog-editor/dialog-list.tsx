'use client';

import { DialogTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Copy, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DialogListProps {
  dialogs: DialogTemplate[];
  selectedDialogId: string | null;
  onSelectDialog: (dialogId: string | null) => void;
  onAddDialog: () => void;
  onDeleteDialog: (dialogId: string) => void;
  onDuplicateDialog: (dialogId: string) => void;
}

export function DialogList({
  dialogs,
  selectedDialogId,
  onSelectDialog,
  onAddDialog,
  onDeleteDialog,
  onDuplicateDialog,
}: DialogListProps) {
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const dialogToDelete = dialogs.find(d => d.id === deleteDialogId);

  const handleConfirmDelete = () => {
    if (deleteDialogId) {
      onDeleteDialog(deleteDialogId);
      setDeleteDialogId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Dialog 列表</h3>
        <Button size="sm" onClick={onAddDialog}>
          <Plus className="h-4 w-4 mr-1" />
          新增 Dialog
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        {dialogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            尚無 Dialog。點擊「新增 Dialog」開始建立。
          </div>
        ) : (
          <div className="space-y-1">
            {dialogs.map((dialog) => (
              <div
                key={dialog.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent',
                  selectedDialogId === dialog.id && 'bg-accent'
                )}
                onClick={() => onSelectDialog(dialog.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {dialog.label || '(未命名)'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    ID: {dialog.dialogId || '(未設定)'}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDuplicateDialog(dialog.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      複製
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogId(dialog.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      刪除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogId !== null} onOpenChange={() => setDeleteDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除 Dialog？</AlertDialogTitle>
            <AlertDialogDescription>
              這將刪除 Dialog「{dialogToDelete?.label || dialogToDelete?.dialogId}」及其所有欄位設定。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
