'use client';

import * as React from 'react';
import { Info, Plus, Trash2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ReleaseNote,
  getLatestVersion,
  getAllReleaseNotes,
  getChangeTypeLabel,
  saveReleaseNotes,
} from '@/lib/release-notes';
import { toast } from 'sonner';

interface ReleaseNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function ReleaseNotesDialog({
  open,
  onOpenChange,
  isAdmin = false,
}: ReleaseNotesDialogProps) {
  const [editMode, setEditMode] = React.useState(false);
  const [editedNotes, setEditedNotes] = React.useState<ReleaseNote[]>([]);
  const [newVersion, setNewVersion] = React.useState('');
  const [newDate, setNewDate] = React.useState('');
  const [newChanges, setNewChanges] = React.useState<ReleaseNote['changes']>([]);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setEditedNotes(getAllReleaseNotes());
    }
  }, [open]);

  const handleAddChange = () => {
    setNewChanges([...newChanges, { type: 'feature', description: '' }]);
  };

  const handleRemoveChange = (index: number) => {
    setNewChanges(newChanges.filter((_, i) => i !== index));
  };

  const handleChangeUpdate = (
    index: number,
    field: 'type' | 'description',
    value: string
  ) => {
    const updated = [...newChanges];
    if (field === 'type') {
      updated[index].type = value as 'feature' | 'fix' | 'improvement';
    } else {
      updated[index].description = value;
    }
    setNewChanges(updated);
  };

  const handleAddRelease = () => {
    if (!newVersion || !newDate || newChanges.length === 0) return;

    const newNote: ReleaseNote = {
      version: newVersion,
      date: newDate,
      changes: newChanges.filter((c) => c.description.trim() !== ''),
    };

    const updatedNotes = [newNote, ...editedNotes];
    setEditedNotes(updatedNotes);
    setNewVersion('');
    setNewDate('');
    setNewChanges([]);
  };

  const handleSave = () => {
    saveReleaseNotes(editedNotes);
    setEditMode(false);
    toast.success('Release Notes 已儲存');
  };

  const handleCopyJson = async () => {
    const json = JSON.stringify({ notes: editedNotes }, null, 2);
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedNotes(getAllReleaseNotes());
    setNewVersion('');
    setNewDate('');
    setNewChanges([]);
  };

  const notes = editMode ? editedNotes : getAllReleaseNotes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Release Notes</DialogTitle>
            {isAdmin && !editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                編輯
              </Button>
            )}
            {isAdmin && editMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      複製 JSON
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  取消
                </Button>
                <Button size="sm" onClick={handleSave}>
                  儲存
                </Button>
              </div>
            )}
          </div>
          <DialogDescription>查看應用程式的更新記錄</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {/* Add new release form (edit mode only) */}
          {editMode && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">新增版本</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  placeholder="版本號 (如: 1.1.0)"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                />
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="space-y-2 mb-3">
                {newChanges.map((change, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={change.type}
                      onValueChange={(v) => handleChangeUpdate(index, 'type', v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">新功能</SelectItem>
                        <SelectItem value="fix">修復</SelectItem>
                        <SelectItem value="improvement">改進</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="變更說明"
                      value={change.description}
                      onChange={(e) =>
                        handleChangeUpdate(index, 'description', e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveChange(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddChange}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  新增變更項目
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddRelease}
                  disabled={!newVersion || !newDate || newChanges.length === 0}
                >
                  新增此版本
                </Button>
              </div>
            </div>
          )}

          {/* Release notes list */}
          <div className="space-y-6">
            {notes.map((note) => (
              <div key={note.version} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="font-mono">
                    v{note.version}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{note.date}</span>
                </div>
                <ul className="space-y-1">
                  {note.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge
                        variant={
                          change.type === 'feature'
                            ? 'default'
                            : change.type === 'fix'
                              ? 'destructive'
                              : 'outline'
                        }
                        className="text-xs shrink-0"
                      >
                        {getChangeTypeLabel(change.type)}
                      </Badge>
                      <span>{change.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ReleaseNotesButtonProps {
  isAdmin?: boolean;
  className?: string;
}

export function ReleaseNotesButton({
  isAdmin = false,
  className,
}: ReleaseNotesButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [version, setVersion] = React.useState('0.0.0');

  // 在客戶端載入和對話框關閉時更新版本號
  React.useEffect(() => {
    setVersion(getLatestVersion());
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // 對話框關閉時刷新版本號
      setVersion(getLatestVersion());
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 text-muted-foreground hover:text-foreground ${className}`}
      >
        <Info className="h-4 w-4" />
        <span className="text-xs">v{version}</span>
      </Button>

      <ReleaseNotesDialog open={open} onOpenChange={handleOpenChange} isAdmin={isAdmin} />
    </>
  );
}
