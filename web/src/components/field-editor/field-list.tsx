'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { SAFieldDefinition, DEFAULT_FIELD, DetailTableConfig, DEFAULT_DETAIL_TABLE_CONFIG, SubTabDefinition } from '@/lib/types';
import { FieldSuggestions } from '@/hooks/use-field-suggestions';
import { moveFieldUp, moveFieldDown } from '@/lib/field-ordering';
import { DetailTableConfigDialog } from './detail-table-config';
import { SubTabManager, moveSubTabLeft, moveSubTabRight } from './sub-tab-manager';
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
  subTabConfigs?: Record<string, SubTabDefinition[]>;
  onSubTabConfigsChange?: (configs: Record<string, SubTabDefinition[]>) => void;
  mainDetailLabels?: Record<string, string>;
  onMainDetailLabelsChange?: (labels: Record<string, string>) => void;
  fieldSuggestions?: FieldSuggestions;
}

interface SubTabFields {
  header: { field: SAFieldDefinition; originalIndex: number }[];
  detail: Map<string, { field: SAFieldDefinition; originalIndex: number }[]>;
}

interface GroupedFields {
  list: { field: SAFieldDefinition; originalIndex: number }[];
  tabs: Map<string, {
    // Fields without subTabName (main area)
    header: { field: SAFieldDefinition; originalIndex: number }[];
    detail: Map<string, { field: SAFieldDefinition; originalIndex: number }[]>;
    // Fields with subTabName
    subTabs: Map<string, SubTabFields>;
  }>;
}

export function FieldList({
  fields,
  onFieldsChange,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  detailTableConfigs = {},
  onDetailTableConfigsChange,
  subTabConfigs = {},
  onSubTabConfigsChange,
  mainDetailLabels = {},
  onMainDetailLabelsChange,
  fieldSuggestions,
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

  // Active sub-tab per main tab (key = tabName, value = subTabLabel or '_main')
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({});

  // Tab rename state
  const [renameTabName, setRenameTabName] = useState<string | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  // Main detail label rename state
  const [renameMainDetailTab, setRenameMainDetailTab] = useState<string | null>(null);
  const [renameMainDetailLabel, setRenameMainDetailLabel] = useState('');

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

  // Group fields by area, tabName, and subTabName, sorted by order
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
          result.tabs.set(tabName, { header: [], detail: new Map(), subTabs: new Map() });
        }

        const tab = result.tabs.get(tabName)!;
        const subTabName = field.subTabName;

        if (subTabName) {
          // Field belongs to a subTab
          if (!tab.subTabs.has(subTabName)) {
            tab.subTabs.set(subTabName, { header: [], detail: new Map() });
          }
          const subTab = tab.subTabs.get(subTabName)!;

          if (field.area === 'header') {
            subTab.header.push({ field, originalIndex: index });
          } else if (field.area === 'detail') {
            const relationship = field.relationship || 'default';
            if (!subTab.detail.has(relationship)) {
              subTab.detail.set(relationship, []);
            }
            subTab.detail.get(relationship)!.push({ field, originalIndex: index });
          }
        } else {
          // Field belongs to main area (no subTab)
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
      }
    });

    // Sort each group by order
    result.list.sort((a, b) => a.field.order - b.field.order);
    result.tabs.forEach((tab) => {
      tab.header.sort((a, b) => a.field.order - b.field.order);
      tab.detail.forEach((detailFields) => {
        detailFields.sort((a, b) => a.field.order - b.field.order);
      });
      // Sort subTabs fields
      tab.subTabs.forEach((subTab) => {
        subTab.header.sort((a, b) => a.field.order - b.field.order);
        subTab.detail.forEach((detailFields) => {
          detailFields.sort((a, b) => a.field.order - b.field.order);
        });
      });
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

  const handleAdd = (area: SAFieldDefinition['area'], tabName?: string, relationship?: string, subTabName?: string) => {
    // Calculate the next order value for the group
    let maxOrder = -1;
    fields.forEach((f) => {
      if (f.area === area) {
        if (area === 'list') {
          maxOrder = Math.max(maxOrder, f.order);
        } else if (area === 'header' && (f.tabName || 'Main') === (tabName || 'Main') && (f.subTabName || '') === (subTabName || '')) {
          maxOrder = Math.max(maxOrder, f.order);
        } else if (area === 'detail' && (f.tabName || 'Main') === (tabName || 'Main') && (f.relationship || 'default') === (relationship || 'default') && (f.subTabName || '') === (subTabName || '')) {
          maxOrder = Math.max(maxOrder, f.order);
        }
      }
    });

    const newField: SAFieldDefinition = {
      ...DEFAULT_FIELD,
      area,
      tabName: tabName || '',
      relationship: relationship || '',
      subTabName: subTabName || '',
      order: maxOrder + 1,
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

  // Move field up in its group
  const handleMoveUp = useCallback((index: number) => {
    const newFields = moveFieldUp(fields, index);
    if (newFields !== fields) {
      onFieldsChange(newFields);
    }
  }, [fields, onFieldsChange]);

  // Move field down in its group
  const handleMoveDown = useCallback((index: number) => {
    const newFields = moveFieldDown(fields, index);
    if (newFields !== fields) {
      onFieldsChange(newFields);
    }
  }, [fields, onFieldsChange]);

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

  // Sub-tab config handlers
  const getSubTabsForTab = (tabName: string): SubTabDefinition[] => {
    return subTabConfigs[tabName] || [];
  };

  const handleSubTabsChange = (tabName: string, subTabs: SubTabDefinition[]) => {
    if (onSubTabConfigsChange) {
      onSubTabConfigsChange({
        ...subTabConfigs,
        [tabName]: subTabs,
      });
    }

    // Clean up fields referencing deleted sub-tabs
    const currentLabels = getSubTabsForTab(tabName);
    const newLabels = new Set(subTabs.map(st => st.label));
    const removedLabels = currentLabels
      .map(st => st.label)
      .filter(label => !newLabels.has(label));

    if (removedLabels.length > 0) {
      const removedSet = new Set(removedLabels);
      const updatedFields = fields.map(f => {
        if (f.tabName === tabName && f.subTabName && removedSet.has(f.subTabName)) {
          return { ...f, subTabName: '' };
        }
        return f;
      });
      if (updatedFields.some((f, i) => f !== fields[i])) {
        onFieldsChange(updatedFields);
      }
    }
  };

  // Get available subTab labels for a tab
  const getAvailableSubTabLabels = (tabName: string): string[] => {
    const subTabs = getSubTabsForTab(tabName);
    return subTabs.map(st => st.label).sort((a, b) => {
      const subTabA = subTabs.find(st => st.label === a);
      const subTabB = subTabs.find(st => st.label === b);
      return (subTabA?.order || 0) - (subTabB?.order || 0);
    });
  };

  // Count fields by subTabName for a given tab
  const getFieldCountBySubTab = (tabName: string): Record<string, number> => {
    const counts: Record<string, number> = {};
    fields.forEach(f => {
      if ((f.tabName || 'Main') === tabName && f.subTabName) {
        counts[f.subTabName] = (counts[f.subTabName] || 0) + 1;
      }
    });
    return counts;
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
        items.map(({ field, originalIndex }, displayIndex) => (
          <FieldRow
            key={originalIndex}
            field={field}
            index={originalIndex}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onCopyToTab={handleCopyToTab}
            onEditDetails={handleEditDetails}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            isFirst={displayIndex === 0}
            isLast={displayIndex === items.length - 1}
            tabNames={tabNames}
            currentTab={currentTab}
            labelInputRef={(ref) => registerFieldInputRef(originalIndex, ref)}
            fieldSuggestions={fieldSuggestions}
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
          const subTabsConfig = getSubTabsForTab(tabName);
          const sortedSubTabs = [...subTabsConfig].sort((a, b) => a.order - b.order);
          const activeSubTab = activeSubTabs[tabName] || '_main';

          // Helper to render detail tables section only
          const renderDetailSection = (
            detailFields: Map<string, { field: SAFieldDefinition; originalIndex: number }[]>,
            subTabLabel?: string
          ) => {
            const detailRelationships = Array.from(detailFields.keys());
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">明細表格</h4>
                  <Button size="sm" variant="outline" onClick={() => handleAdd('detail', tabName, undefined, subTabLabel)}>
                    新增明細欄位
                  </Button>
                </div>

                {detailRelationships.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
                    尚無明細表格。新增明細欄位並設定「關聯」來建立表格。
                  </div>
                ) : (
                  detailRelationships.map((relationship) => {
                    const configKey = subTabLabel ? `${tabName}:${subTabLabel}:${relationship}` : `${tabName}:${relationship}`;
                    const config = detailTableConfigs[configKey] || getDetailTableConfig(tabName, relationship);
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
                              onClick={() => handleAdd('detail', tabName, relationship, subTabLabel)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              新增欄位
                            </Button>
                          </div>
                        </div>
                        {renderFieldHeader()}
                        {renderFieldList(detailFields.get(relationship)!, tabName)}
                      </div>
                    );
                  })
                )}
              </div>
            );
          };

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

              {/* 表頭欄位 - 共用區域 */}
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

              {/* 子頁籤切換區 - 用於明細表格 */}
              <Tabs
                value={activeSubTab}
                onValueChange={(value) => setActiveSubTabs(prev => ({ ...prev, [tabName]: value }))}
              >
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mr-2">明細區域</h4>
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="_main" className="flex items-center gap-1">
                      {mainDetailLabels[tabName] || '主區域'}
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {Array.from(tab.detail.values()).reduce((sum, arr) => sum + arr.length, 0)}
                      </Badge>
                    </TabsTrigger>
                    {onMainDetailLabelsChange && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 px-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameMainDetailTab(tabName);
                          setRenameMainDetailLabel(mainDetailLabels[tabName] || '主區域');
                        }}
                        title="重新命名主區域"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    {sortedSubTabs.map((subTab, index) => {
                      const subTabFields = tab.subTabs.get(subTab.label);
                      const count = subTabFields
                        ? Array.from(subTabFields.detail.values()).reduce((sum, arr) => sum + arr.length, 0)
                        : 0;
                      const isFirst = index === 0;
                      const isLast = index === sortedSubTabs.length - 1;
                      return (
                        <div key={subTab.id} className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 px-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSubTabs = moveSubTabLeft(subTabsConfig, subTab);
                              handleSubTabsChange(tabName, newSubTabs);
                            }}
                            disabled={isFirst}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <TabsTrigger value={subTab.label} className="flex items-center gap-1">
                            {subTab.label}
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                              {count}
                            </Badge>
                          </TabsTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 px-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSubTabs = moveSubTabRight(subTabsConfig, subTab);
                              handleSubTabsChange(tabName, newSubTabs);
                            }}
                            disabled={isLast}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </TabsList>
                  <SubTabManager
                    tabName={tabName}
                    subTabs={subTabsConfig}
                    onSubTabsChange={(subTabs) => handleSubTabsChange(tabName, subTabs)}
                    fieldCountBySubTab={getFieldCountBySubTab(tabName)}
                  />
                </div>

                {/* 主區域明細 */}
                <TabsContent value="_main" className="space-y-6">
                  {renderDetailSection(tab.detail)}
                </TabsContent>

                {/* 各子頁籤明細 */}
                {sortedSubTabs.map((subTab) => {
                  const subTabFields = tab.subTabs.get(subTab.label) || { header: [], detail: new Map() };
                  return (
                    <TabsContent key={subTab.id} value={subTab.label} className="space-y-6">
                      {renderDetailSection(subTabFields.detail, subTab.label)}
                    </TabsContent>
                  );
                })}
              </Tabs>
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
        availableSubTabs={
          editingIndex !== null && fields[editingIndex]?.tabName
            ? getAvailableSubTabLabels(fields[editingIndex].tabName || 'Main')
            : []
        }
        fieldSuggestions={fieldSuggestions}
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

      {/* Rename Main Detail Label Dialog */}
      <Dialog open={renameMainDetailTab !== null} onOpenChange={() => {
        setRenameMainDetailTab(null);
        setRenameMainDetailLabel('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新命名主區域</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mainDetailLabel">名稱</Label>
              <Input
                id="mainDetailLabel"
                value={renameMainDetailLabel}
                onChange={(e) => setRenameMainDetailLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameMainDetailTab && renameMainDetailLabel.trim()) {
                    onMainDetailLabelsChange?.({
                      ...mainDetailLabels,
                      [renameMainDetailTab]: renameMainDetailLabel.trim(),
                    });
                    setRenameMainDetailTab(null);
                    setRenameMainDetailLabel('');
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRenameMainDetailTab(null);
              setRenameMainDetailLabel('');
            }}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (renameMainDetailTab && renameMainDetailLabel.trim()) {
                  onMainDetailLabelsChange?.({
                    ...mainDetailLabels,
                    [renameMainDetailTab]: renameMainDetailLabel.trim(),
                  });
                  setRenameMainDetailTab(null);
                  setRenameMainDetailLabel('');
                }
              }}
              disabled={!renameMainDetailLabel.trim()}
            >
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
