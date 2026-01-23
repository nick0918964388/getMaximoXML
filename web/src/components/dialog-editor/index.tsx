'use client';

import { useState } from 'react';
import { DialogTemplate, DEFAULT_DIALOG_TEMPLATE } from '@/lib/types';
import { DialogList } from './dialog-list';
import { DialogForm } from './dialog-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DialogEditorProps {
  dialogs: DialogTemplate[];
  onDialogsChange: (dialogs: DialogTemplate[]) => void;
}

export function DialogEditor({ dialogs, onDialogsChange }: DialogEditorProps) {
  const [selectedDialogId, setSelectedDialogId] = useState<string | null>(null);

  const selectedDialog = dialogs.find(d => d.id === selectedDialogId) || null;

  const handleAddDialog = () => {
    const newDialog: DialogTemplate = {
      ...DEFAULT_DIALOG_TEMPLATE,
      id: `dialog_${Date.now()}`,
      dialogId: '',
      label: '新增 Dialog',
    };
    onDialogsChange([...dialogs, newDialog]);
    setSelectedDialogId(newDialog.id);
  };

  const handleUpdateDialog = (updatedDialog: DialogTemplate) => {
    onDialogsChange(dialogs.map(d => d.id === updatedDialog.id ? updatedDialog : d));
  };

  const handleDeleteDialog = (dialogId: string) => {
    onDialogsChange(dialogs.filter(d => d.id !== dialogId));
    if (selectedDialogId === dialogId) {
      setSelectedDialogId(null);
    }
  };

  const handleDuplicateDialog = (dialogId: string) => {
    const dialog = dialogs.find(d => d.id === dialogId);
    if (dialog) {
      const newDialog: DialogTemplate = {
        ...JSON.parse(JSON.stringify(dialog)),
        id: `dialog_${Date.now()}`,
        dialogId: `${dialog.dialogId}_copy`,
        label: `${dialog.label} (複製)`,
      };
      onDialogsChange([...dialogs, newDialog]);
      setSelectedDialogId(newDialog.id);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Dialog 設定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-4">
          {/* Dialog List */}
          <div className="col-span-4 border-r pr-4">
            <DialogList
              dialogs={dialogs}
              selectedDialogId={selectedDialogId}
              onSelectDialog={setSelectedDialogId}
              onAddDialog={handleAddDialog}
              onDeleteDialog={handleDeleteDialog}
              onDuplicateDialog={handleDuplicateDialog}
            />
          </div>

          {/* Dialog Form */}
          <div className="col-span-8">
            {selectedDialog ? (
              <DialogForm
                dialog={selectedDialog}
                onDialogChange={handleUpdateDialog}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                {dialogs.length === 0
                  ? '點擊「新增 Dialog」開始建立 Dialog 樣板'
                  : '選擇一個 Dialog 進行編輯'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
