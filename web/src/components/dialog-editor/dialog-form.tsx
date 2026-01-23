'use client';

import { useState } from 'react';
import {
  DialogTemplate,
  SAFieldDefinition,
  DEFAULT_FIELD,
  DialogDetailTable,
  DEFAULT_DIALOG_DETAIL_TABLE,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings } from 'lucide-react';
import { DialogDetailTableEditor } from './dialog-detail-table';
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

interface DialogFormProps {
  dialog: DialogTemplate;
  onDialogChange: (dialog: DialogTemplate) => void;
}

export function DialogForm({ dialog, onDialogChange }: DialogFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [editingFieldType, setEditingFieldType] = useState<'header' | 'detail'>('header');

  const handleChange = (updates: Partial<DialogTemplate>) => {
    onDialogChange({ ...dialog, ...updates });
  };

  // Header field handlers
  const handleAddHeaderField = () => {
    const newField: SAFieldDefinition = {
      ...DEFAULT_FIELD,
      area: 'header',
    };
    handleChange({ headerFields: [...dialog.headerFields, newField] });
  };

  const handleUpdateHeaderField = (index: number, updates: Partial<SAFieldDefinition>) => {
    const newFields = [...dialog.headerFields];
    newFields[index] = { ...newFields[index], ...updates };
    handleChange({ headerFields: newFields });
  };

  const handleDeleteHeaderField = (index: number) => {
    handleChange({ headerFields: dialog.headerFields.filter((_, i) => i !== index) });
  };

  // Detail table handlers
  const handleAddDetailTable = () => {
    const newTable: DialogDetailTable = {
      ...DEFAULT_DIALOG_DETAIL_TABLE,
      relationship: `TABLE${dialog.detailTables.length + 1}`,
    };
    handleChange({ detailTables: [...dialog.detailTables, newTable] });
  };

  const handleUpdateDetailTable = (index: number, table: DialogDetailTable) => {
    const newTables = [...dialog.detailTables];
    newTables[index] = table;
    handleChange({ detailTables: newTables });
  };

  const handleDeleteDetailTable = (index: number) => {
    handleChange({ detailTables: dialog.detailTables.filter((_, i) => i !== index) });
  };

  const handleSaveField = (field: SAFieldDefinition) => {
    if (editingFieldIndex !== null) {
      if (editingFieldType === 'header') {
        handleUpdateHeaderField(editingFieldIndex, field);
      }
    }
    setEditingFieldIndex(null);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">基本設定</TabsTrigger>
          <TabsTrigger value="header">
            表頭欄位
            <Badge variant="secondary" className="ml-1">
              {dialog.headerFields.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="detail">
            明細表格
            <Badge variant="secondary" className="ml-1">
              {dialog.detailTables.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Basic Settings */}
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialogId">Dialog ID *</Label>
              <Input
                id="dialogId"
                value={dialog.dialogId}
                onChange={(e) => handleChange({ dialogId: e.target.value })}
                placeholder="例如：myDialog"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialogLabel">Dialog 標題 *</Label>
              <Input
                id="dialogLabel"
                value={dialog.label}
                onChange={(e) => handleChange({ label: e.target.value })}
                placeholder="例如：我的 Dialog"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialogBeanclass">Bean Class</Label>
              <Input
                id="dialogBeanclass"
                value={dialog.beanclass}
                onChange={(e) => handleChange({ beanclass: e.target.value })}
                placeholder="例如：psdi.webclient.beans.MyDialogBean"
              />
            </div>

            <div className="space-y-2">
              <Label>資料來源</Label>
              <Select
                value={dialog.mboName ? 'mbo' : dialog.relationship ? 'relationship' : 'none'}
                onValueChange={(value) => {
                  if (value === 'mbo') {
                    handleChange({ relationship: '' });
                  } else if (value === 'relationship') {
                    handleChange({ mboName: '' });
                  } else {
                    handleChange({ mboName: '', relationship: '' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇資料來源類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">無（使用主 MBO）</SelectItem>
                  <SelectItem value="mbo">MBO 名稱</SelectItem>
                  <SelectItem value="relationship">關聯</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(dialog.mboName || (!dialog.mboName && !dialog.relationship)) && (
              <div className="space-y-2">
                <Label htmlFor="dialogMbo">MBO 名稱</Label>
                <Input
                  id="dialogMbo"
                  value={dialog.mboName}
                  onChange={(e) => handleChange({ mboName: e.target.value })}
                  placeholder="例如：WORKORDER"
                />
              </div>
            )}

            {dialog.relationship !== undefined && !dialog.mboName && (
              <div className="space-y-2">
                <Label htmlFor="dialogRelationship">關聯</Label>
                <Input
                  id="dialogRelationship"
                  value={dialog.relationship}
                  onChange={(e) => handleChange({ relationship: e.target.value })}
                  placeholder="例如：WORKORDERSPEC"
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Header Fields */}
        <TabsContent value="header" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">表頭欄位</h4>
            <Button size="sm" onClick={handleAddHeaderField}>
              <Plus className="h-4 w-4 mr-1" />
              新增欄位
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            {dialog.headerFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                尚無表頭欄位。點擊「新增欄位」開始建立。
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>標籤</TableHead>
                    <TableHead>欄位名稱</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>模式</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dialog.headerFields.map((field, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={field.label}
                          onChange={(e) => handleUpdateHeaderField(index, { label: e.target.value })}
                          className="h-8"
                          placeholder="標籤"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={field.fieldName}
                          onChange={(e) => handleUpdateHeaderField(index, { fieldName: e.target.value })}
                          className="h-8"
                          placeholder="欄位名稱"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={field.type}
                          onValueChange={(value) => handleUpdateHeaderField(index, { type: value as SAFieldDefinition['type'] })}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="textbox">textbox</SelectItem>
                            <SelectItem value="checkbox">checkbox</SelectItem>
                            <SelectItem value="multiparttextbox">multipart</SelectItem>
                            <SelectItem value="multilinetextbox">multiline</SelectItem>
                            <SelectItem value="statictext">statictext</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={field.inputMode}
                          onValueChange={(value) => handleUpdateHeaderField(index, { inputMode: value as SAFieldDefinition['inputMode'] })}
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
                            onClick={() => {
                              setEditingFieldIndex(index);
                              setEditingFieldType('header');
                            }}
                            title="詳細設定"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteHeaderField(index)}
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
          </ScrollArea>
        </TabsContent>

        {/* Detail Tables */}
        <TabsContent value="detail" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">明細表格</h4>
            <Button size="sm" onClick={handleAddDetailTable}>
              <Plus className="h-4 w-4 mr-1" />
              新增明細表格
            </Button>
          </div>

          <ScrollArea className="h-[350px]">
            {dialog.detailTables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                尚無明細表格。點擊「新增明細表格」開始建立。
              </div>
            ) : (
              <div className="space-y-4">
                {dialog.detailTables.map((table, index) => (
                  <DialogDetailTableEditor
                    key={index}
                    table={table}
                    index={index}
                    onUpdate={(updatedTable) => handleUpdateDetailTable(index, updatedTable)}
                    onDelete={() => handleDeleteDetailTable(index)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Field Edit Form */}
      <FieldForm
        field={editingFieldIndex !== null && editingFieldType === 'header'
          ? dialog.headerFields[editingFieldIndex]
          : null}
        open={editingFieldIndex !== null}
        onClose={() => setEditingFieldIndex(null)}
        onSave={handleSaveField}
      />
    </div>
  );
}
