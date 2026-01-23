'use client';

import { useState } from 'react';
import { DialogDetailTable, SAFieldDefinition, DEFAULT_FIELD } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, Trash2, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FieldForm } from '@/components/field-editor/field-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface DialogDetailTableEditorProps {
  table: DialogDetailTable;
  index: number;
  onUpdate: (table: DialogDetailTable) => void;
  onDelete: () => void;
}

export function DialogDetailTableEditor({
  table,
  index,
  onUpdate,
  onDelete,
}: DialogDetailTableEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  const handleChange = (updates: Partial<DialogDetailTable>) => {
    onUpdate({ ...table, ...updates });
  };

  const handleAddField = () => {
    const newField: SAFieldDefinition = {
      ...DEFAULT_FIELD,
      area: 'detail',
      type: 'tablecol',
    };
    handleChange({ fields: [...table.fields, newField] });
  };

  const handleUpdateField = (fieldIndex: number, updates: Partial<SAFieldDefinition>) => {
    const newFields = [...table.fields];
    newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
    handleChange({ fields: newFields });
  };

  const handleDeleteField = (fieldIndex: number) => {
    handleChange({ fields: table.fields.filter((_, i) => i !== fieldIndex) });
  };

  const handleSaveField = (field: SAFieldDefinition) => {
    if (editingFieldIndex !== null) {
      handleUpdateField(editingFieldIndex, field);
    }
    setEditingFieldIndex(null);
  };

  return (
    <div className="border rounded-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50">
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {table.label || table.relationship || `明細表格 ${index + 1}`}
              </span>
              <Badge variant="secondary" className="text-xs">
                {table.fields.length} 欄位
              </Badge>
              {table.beanclass && (
                <Badge variant="outline" className="text-xs">
                  Bean
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {/* Table Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`table-${index}-relationship`}>關聯 *</Label>
                <Input
                  id={`table-${index}-relationship`}
                  value={table.relationship}
                  onChange={(e) => handleChange({ relationship: e.target.value })}
                  placeholder="例如：WORKORDERSPEC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`table-${index}-label`}>表格標題</Label>
                <Input
                  id={`table-${index}-label`}
                  value={table.label}
                  onChange={(e) => handleChange({ label: e.target.value })}
                  placeholder="例如：工單明細"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`table-${index}-orderby`}>排序方式</Label>
                <Input
                  id={`table-${index}-orderby`}
                  value={table.orderBy}
                  onChange={(e) => handleChange({ orderBy: e.target.value })}
                  placeholder="例如：LINENUM ASC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`table-${index}-beanclass`}>Bean Class</Label>
                <Input
                  id={`table-${index}-beanclass`}
                  value={table.beanclass}
                  onChange={(e) => handleChange({ beanclass: e.target.value })}
                  placeholder="例如：psdi.webclient.beans.MyTableBean"
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>欄位</Label>
                <Button size="sm" variant="outline" onClick={handleAddField}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增欄位
                </Button>
              </div>

              {table.fields.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
                  尚無欄位
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>標籤</TableHead>
                      <TableHead>欄位名稱</TableHead>
                      <TableHead>模式</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.fields.map((field, fieldIndex) => (
                      <TableRow key={fieldIndex}>
                        <TableCell className="text-muted-foreground">{fieldIndex + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={field.label}
                            onChange={(e) => handleUpdateField(fieldIndex, { label: e.target.value })}
                            className="h-8"
                            placeholder="標籤"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={field.fieldName}
                            onChange={(e) => handleUpdateField(fieldIndex, { fieldName: e.target.value })}
                            className="h-8"
                            placeholder="欄位名稱"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={field.inputMode}
                            onValueChange={(value) => handleUpdateField(fieldIndex, { inputMode: value as SAFieldDefinition['inputMode'] })}
                          >
                            <SelectTrigger className="h-8 w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="optional">optional</SelectItem>
                              <SelectItem value="required">required</SelectItem>
                              <SelectItem value="readonly">readonly</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingFieldIndex(fieldIndex)}
                              title="詳細設定"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteField(fieldIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除明細表格？</AlertDialogTitle>
            <AlertDialogDescription>
              這將刪除明細表格「{table.label || table.relationship}」及其所有欄位。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Field Edit Form */}
      <FieldForm
        field={editingFieldIndex !== null ? table.fields[editingFieldIndex] : null}
        open={editingFieldIndex !== null}
        onClose={() => setEditingFieldIndex(null)}
        onSave={handleSaveField}
      />
    </div>
  );
}
