'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { SAFieldDefinition, DEFAULT_FIELD, DetailTableConfig, DEFAULT_DETAIL_TABLE_CONFIG } from '@/lib/types';
import { DetailTableConfigDialog } from './detail-table-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldRow } from './field-row';
import { FieldForm } from './field-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronLeft, ChevronRight, Copy, Pencil, MoreVertical, Settings } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FieldListProps {
  fields: SAFieldDefinition[];
  onFieldsChange: (fields: SAFieldDefinition[]) => void;
  activeTab?: string;
  onActiveTabChange?: (tab: string) => void;
  detailTableConfigs?: Record<string, DetailTableConfig>;
  onDetailTableConfigsChange?: (configs: Record<string, DetailTableConfig>) => void;
}

interface GroupedFields {
  list: { field: SAFieldDefinition; originalIndex: number }[];
  tabs: Map<string, {
    header: { field: SAFieldDefinition; originalIndex: number }[];
    detail: Map<string, { field: SAFieldDefinition; originalIndex: number }[]>;
  }>;
}

export function FieldList({
  fields,
  onFieldsChange,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  detailTableConfigs = {},
  onDetailTableConfigsChange,
}: FieldListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState('_list');

  // Detail table config dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogTabName, setConfigDialogTabName] = useState('');
  const [configDialogRelationship, setConfigDialogRelationship] = useState('');

  // Use controlled or internal state
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: string) => {
    if (onActiveTabChange) {
      onActiveTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [newTabName, setNewTabName] = useState('');
  const [showNewTabInput, setShowNewTabInput] = useState(false);
  const [deleteTabName, setDeleteTabName] = useState<string | null>(null);

  // Tab rename state
  const [renameTabName, setRenameTabName] = useState<string | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  // Track newly added field for auto-focus
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);
  const fieldInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Auto-focus on newly added field
  useEffect(() => {
    if (newlyAddedIndex !== null) {
      const input = fieldInputRefs.current.get(newlyAddedIndex);
      if (input) {
        input.focus();
        // Scroll into view
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setNewlyAddedIndex(null);
    }
  }, [newlyAddedIndex, fields.length]);

  // Group fields by area and tabName
  const groupedFields = useMemo<GroupedFields>(() => {
    const result: GroupedFields = {
      list: [],
      tabs: new Map(),
    };

    fields.forEach((field, index) => {
      if (field.area === 'list') {
        result.list.push({ field, originalIndex: index });
      } else {
        const tabName = field.tabName || 'Main';

        if (!result.tabs.has(tabName)) {
          result.tabs.set(tabName, { header: [], detail: new Map() });
        }

        const tab = result.tabs.get(tabName)!;

        if (field.area === 'header') {
          tab.header.push({ field, originalIndex: index });
        } else if (field.area === 'detail') {
          const relationship = field.relationship || 'default';
          if (!tab.detail.has(relationship)) {
            tab.detail.set(relationship, []);
          }
          tab.detail.get(relationship)!.push({ field, originalIndex: index });
        }
      }
    });

    return result;
  }, [fields]);

  // Get all tab names in order (based on first appearance in fields array)
  const tabNames = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    fields.forEach((field) => {
      if (field.area !== 'list') {
        const tabName = field.tabName || 'Main';
        if (!seen.has(tabName)) {
          seen.add(tabName);
          ordered.push(tabName);
        }
      }
    });
    return ordered;
  }, [fields]);

  const handleAdd = (area: SAFieldDefinition['area'], tabName?: string, relationship?: string) => {
    const newField: SAFieldDefinition = {
      ...DEFAULT_FIELD,
      area,
      tabName: tabName || '',
      relationship: relationship || '',
    };
    const newIndex = fields.length;
    onFieldsChange([...fields, newField]);
    setNewlyAddedIndex(newIndex);
  };

  const handleUpdate = (index: number, updates: Partial<SAFieldDefinition>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onFieldsChange(newFields);
  };

  const handleDelete = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onFieldsChange(newFields);
  };

  const handleDuplicate = (index: number) => {
    // Deep copy all properties
    const newField: SAFieldDefinition = JSON.parse(JSON.stringify(fields[index]));
    const newFields = [...fields];
    newFields.splice(index + 1, 0, newField);
    onFieldsChange(newFields);
  };

  const handleCopyToTab = (index: number, targetTab: string) => {
    // Deep copy the field and change its tabName
    const newField: SAFieldDefinition = JSON.parse(JSON.stringify(fields[index]));
    newField.tabName = targetTab;
    // If it's a list field being copied to a tab, change area to header
    if (newField.area === 'list') {
      newField.area = 'header';
    }
    onFieldsChange([...fields, newField]);
  };

  const handleEditDetails = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveField = (field: SAFieldDefinition) => {
    if (editingIndex !== null) {
      handleUpdate(editingIndex, field);
    }
  };

  const handleCloseForm = () => {
    setEditingIndex(null);
  };

  const handleAddTab = () => {
    if (newTabName.trim()) {
      // Add a placeholder header field to create the tab
      const newField: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        area: 'header',
        tabName: newTabName.trim(),
      };
      onFieldsChange([...fields, newField]);
      setActiveTab(newTabName.trim());
      setNewTabName('');
      setShowNewTabInput(false);
    }
  };

  const handleDeleteTab = (tabName: string) => {
    // Remove all fields belonging to this tab
    const newFields = fields.filter(f => f.tabName !== tabName);
    onFieldsChange(newFields);
    setDeleteTabName(null);
    setActiveTab('_list');
  };

  // Rename tab
  const handleRenameTab = () => {
    if (renameTabName && renameNewName.trim() && renameNewName !== renameTabName) {
      const newFields = fields.map(f => {
        if (f.tabName === renameTabName) {
          return { ...f, tabName: renameNewName.trim() };
        }
        return f;
      });
      onFieldsChange(newFields);
      setActiveTab(renameNewName.trim());
    }
    setRenameTabName(null);
    setRenameNewName('');
  };

  // Move tab left/right
  const handleMoveTab = (tabName: string, direction: 'left' | 'right') => {
    const currentIndex = tabNames.indexOf(tabName);
    if (currentIndex === -1) return;

    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tabNames.length) return;

    const targetTabName = tabNames[newIndex];

    // Find the first field index of the target tab
    let targetFirstIndex = -1;
    let currentFirstIndex = -1;

    fields.forEach((f, i) => {
      if (f.area !== 'list') {
        const fTabName = f.tabName || 'Main';
        if (fTabName === targetTabName && targetFirstIndex === -1) {
          targetFirstIndex = i;
        }
        if (fTabName === tabName && currentFirstIndex === -1) {
          currentFirstIndex = i;
        }
      }
    });

    // Reorder fields: extract current tab fields and insert at target position
    const currentTabFields = fields.filter(f => (f.tabName || 'Main') === tabName && f.area !== 'list');
    const otherFields = fields.filter(f => !((f.tabName || 'Main') === tabName && f.area !== 'list'));

    // Find where to insert in otherFields
    let insertIndex = 0;
    if (direction === 'left') {
      // Insert before target tab
      for (let i = 0; i < otherFields.length; i++) {
        if ((otherFields[i].tabName || 'Main') === targetTabName && otherFields[i].area !== 'list') {
          insertIndex = i;
          break;
        }
      }
    } else {
      // Insert after target tab
      for (let i = otherFields.length - 1; i >= 0; i--) {
        if ((otherFields[i].tabName || 'Main') === targetTabName && otherFields[i].area !== 'list') {
          insertIndex = i + 1;
          break;
        }
      }
    }

    const newFields = [
      ...otherFields.slice(0, insertIndex),
      ...currentTabFields,
      ...otherFields.slice(insertIndex),
    ];

    onFieldsChange(newFields);
  };

  // Duplicate tab
  const handleDuplicateTab = (tabName: string) => {
    // Find a unique name for the new tab
    let newName = `${tabName} (複製)`;
    let counter = 1;
    while (tabNames.includes(newName)) {
      counter++;
      newName = `${tabName} (複製 ${counter})`;
    }

    // Deep copy all fields from the tab
    const tabFields = fields.filter(f => (f.tabName || 'Main') === tabName && f.area !== 'list');
    const copiedFields = tabFields.map(f => ({
      ...JSON.parse(JSON.stringify(f)),
      tabName: newName,
    }));

    onFieldsChange([...fields, ...copiedFields]);
    setActiveTab(newName);
  };

  // Detail table config handlers
  const getDetailTableConfigKey = (tabName: string, relationship: string) => `${tabName}:${relationship}`;

  const handleOpenDetailTableConfig = (tabName: string, relationship: string) => {
    setConfigDialogTabName(tabName);
    setConfigDialogRelationship(relationship);
    setConfigDialogOpen(true);
  };

  const handleSaveDetailTableConfig = (config: DetailTableConfig) => {
    if (onDetailTableConfigsChange) {
      const key = getDetailTableConfigKey(configDialogTabName, configDialogRelationship);
      onDetailTableConfigsChange({
        ...detailTableConfigs,
        [key]: config,
      });
    }
  };

  const getDetailTableConfig = (tabName: string, relationship: string): DetailTableConfig => {
    const key = getDetailTableConfigKey(tabName, relationship);
    return detailTableConfigs[key] || { ...DEFAULT_DETAIL_TABLE_CONFIG, relationship };
  };

  const renderFieldHeader = () => (
    <div className="grid grid-cols-12 gap-2 px-2 text-sm font-medium text-muted-foreground mb-2">
      <div className="col-span-1 text-center">#</div>
      <div className="col-span-2">標籤</div>
      <div className="col-span-2">欄位名稱</div>
      <div className="col-span-1">類型</div>
      <div className="col-span-1">區域</div>
      <div className="col-span-1">模式</div>
      <div className="col-span-2">關聯</div>
      <div className="col-span-2 text-right">操作</div>
    </div>
  );

  const registerFieldInputRef = (index: number, ref: HTMLInputElement | null) => {
    if (ref) {
      fieldInputRefs.current.set(index, ref);
    } else {
      fieldInputRefs.current.delete(index);
    }
  };

  const renderFieldList = (
    items: { field: SAFieldDefinition; originalIndex: number }[],
    currentTab: string
  ) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          尚無欄位
        </div>
      ) : (
        items.map(({ field, originalIndex }) => (
          <FieldRow
            key={originalIndex}
            field={field}
            index={originalIndex}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onCopyToTab={handleCopyToTab}
            onEditDetails={handleEditDetails}
            tabNames={tabNames}
            currentTab={currentTab}
            labelInputRef={(ref) => registerFieldInputRef(originalIndex, ref)}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="_list" className="flex items-center gap-1">
              清單
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {groupedFields.list.length}
              </Badge>
            </TabsTrigger>
            {tabNames.map((tabName, index) => {
              const tab = groupedFields.tabs.get(tabName)!;
              const count = tab.header.length +
                Array.from(tab.detail.values()).reduce((sum, arr) => sum + arr.length, 0);
              return (
                <div key={tabName} className="flex items-center">
                  <TabsTrigger value={tabName} className="flex items-center gap-1 pr-1">
                    {tabName}
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {count}
                    </Badge>
                  </TabsTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-0.5 hover:bg-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => {
                        setRenameTabName(tabName);
                        setRenameNewName(tabName);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        重新命名
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTab(tabName)}>
                        <Copy className="h-4 w-4 mr-2" />
                        複製頁籤
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleMoveTab(tabName, 'left')}
                        disabled={index === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        往左移動
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleMoveTab(tabName, 'right')}
                        disabled={index === tabNames.length - 1}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        往右移動
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTabName(tabName)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        刪除頁籤
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </TabsList>

          {showNewTabInput ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="頁籤名稱"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
                className="h-8 w-32"
                autoFocus
              />
              <Button size="sm" onClick={handleAddTab} disabled={!newTabName.trim()}>
                確定
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setShowNewTabInput(false);
                setNewTabName('');
              }}>
                取消
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewTabInput(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              新增頁籤
            </Button>
          )}
        </div>

        {/* 清單欄位 */}
        <TabsContent value="_list" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">清單欄位（顯示在主列表中）</h3>
            <Button size="sm" onClick={() => handleAdd('list')}>
              新增清單欄位
            </Button>
          </div>
          {renderFieldHeader()}
          <ScrollArea className="h-[300px] pr-4">
            {renderFieldList(groupedFields.list, '_list')}
          </ScrollArea>
        </TabsContent>

        {/* 各頁籤 */}
        {tabNames.map((tabName) => {
          const tab = groupedFields.tabs.get(tabName)!;
          const relationships = Array.from(tab.detail.keys());

          return (
            <TabsContent key={tabName} value={tabName} className="space-y-6">
              {/* 頁籤標頭操作 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{tabName}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRenameTabName(tabName);
                      setRenameNewName(tabName);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateTab(tabName)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    複製頁籤
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTabName(tabName)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    刪除頁籤
                  </Button>
                </div>
              </div>

              {/* Header 欄位 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">表頭欄位</h4>
                  <Button size="sm" variant="outline" onClick={() => handleAdd('header', tabName)}>
                    新增表頭欄位
                  </Button>
                </div>
                {renderFieldHeader()}
                <ScrollArea className="h-[200px] pr-4">
                  {renderFieldList(tab.header, tabName)}
                </ScrollArea>
              </div>

              {/* Detail 明細表格 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">明細表格</h4>
                  <Button size="sm" variant="outline" onClick={() => handleAdd('detail', tabName)}>
                    新增明細欄位
                  </Button>
                </div>

                {relationships.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
                    尚無明細表格。新增明細欄位並設定「關聯」來建立表格。
                  </div>
                ) : (
                  relationships.map((relationship) => {
                    const config = getDetailTableConfig(tabName, relationship);
                    const hasConfig = config.label || config.orderBy || config.beanclass;
                    return (
                      <div key={relationship} className="border rounded-md p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              關聯: {relationship}
                            </Badge>
                            {config.label && (
                              <Badge variant="secondary" className="text-xs">
                                標題: {config.label}
                              </Badge>
                            )}
                            {config.beanclass && (
                              <Badge variant="secondary" className="text-xs">
                                Bean
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDetailTableConfig(tabName, relationship)}
                              title="表格設定"
                            >
                              <Settings className={`h-4 w-4 ${hasConfig ? 'text-primary' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAdd('detail', tabName, relationship)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              新增欄位
                            </Button>
                          </div>
                        </div>
                        {renderFieldHeader()}
                        {renderFieldList(tab.detail.get(relationship)!, tabName)}
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* 欄位總數 */}
      <div className="pt-2 border-t">
        <span className="text-sm text-muted-foreground">
          共 {fields.length} 個欄位
        </span>
      </div>

      {/* Field Edit Form */}
      <FieldForm
        field={editingIndex !== null ? fields[editingIndex] : null}
        open={editingIndex !== null}
        onClose={handleCloseForm}
        onSave={handleSaveField}
      />

      {/* Rename Tab Dialog */}
      <Dialog open={renameTabName !== null} onOpenChange={() => {
        setRenameTabName(null);
        setRenameNewName('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新命名頁籤</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newTabName">新名稱</Label>
              <Input
                id="newTabName"
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameTab()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRenameTabName(null);
              setRenameNewName('');
            }}>
              取消
            </Button>
            <Button
              onClick={handleRenameTab}
              disabled={!renameNewName.trim() || renameNewName === renameTabName}
            >
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tab Confirmation */}
      <AlertDialog open={deleteTabName !== null} onOpenChange={() => setDeleteTabName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除頁籤？</AlertDialogTitle>
            <AlertDialogDescription>
              這將刪除頁籤「{deleteTabName}」及其所有欄位。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTabName && handleDeleteTab(deleteTabName)}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Table Config Dialog */}
      <DetailTableConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        config={getDetailTableConfig(configDialogTabName, configDialogRelationship)}
        onSave={handleSaveDetailTableConfig}
        relationship={configDialogRelationship}
      />
    </div>
  );
}
