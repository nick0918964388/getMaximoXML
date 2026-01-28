'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { SAFieldDefinition, ApplicationMetadata, DEFAULT_METADATA, SavedProject, DetailTableConfig, DialogTemplate, SubTabDefinition } from '@/lib/types';
import { processFields } from '@/lib/field-processor';
import { generateApplication } from '@/lib/assemblers';
import { generateAllSQL } from '@/lib/generators';
import { saveProject, getUsername, setUsername } from '@/lib/storage';
import { hasLegacyData, performMigration, getLegacyProjects } from '@/lib/migration';
import { resetIdGenerator } from '@/lib/utils/id-generator';
import { useAutoSave, getDraft, clearDraft } from '@/hooks';

import { FieldList } from '@/components/field-editor';
import { ConfigForm } from '@/components/config-form';
import { DialogEditor } from '@/components/dialog-editor';
import { PreviewPanel } from '@/components/preview-panel';
import { HistoryList } from '@/components/history-list';
import { UsernameDialog } from '@/components/username-dialog';
import { downloadFile, downloadAsZip } from '@/components/download-buttons';
import { useFieldSuggestions } from '@/hooks/use-field-suggestions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { User } from 'lucide-react';

export default function XmlGeneratorPage() {
  const [fields, setFields] = useState<SAFieldDefinition[]>([]);
  const [metadata, setMetadata] = useState<ApplicationMetadata>(DEFAULT_METADATA);
  const [detailTableConfigs, setDetailTableConfigs] = useState<Record<string, DetailTableConfig>>({});
  const [dialogTemplates, setDialogTemplates] = useState<DialogTemplate[]>([]);
  const [subTabConfigs, setSubTabConfigs] = useState<Record<string, SubTabDefinition[]>>({});
  const [mainDetailLabels, setMainDetailLabels] = useState<Record<string, string>>({});
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [fieldEditorTab, setFieldEditorTab] = useState('_list');
  const [restoreDraftDialogOpen, setRestoreDraftDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Username state
  const [username, setUsernameState] = useState<string | null>(null);
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Field suggestions for autocomplete
  const fieldSuggestions = useFieldSuggestions(fields);

  // Migration state
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ migrated: number; failed: number } | null>(null);
  const [legacyProjectCount, setLegacyProjectCount] = useState(0);

  // Initialize username on mount
  useEffect(() => {
    const storedUsername = getUsername();
    if (storedUsername) {
      setUsernameState(storedUsername);
    } else {
      setUsernameDialogOpen(true);
    }
    setIsLoading(false);
  }, []);

  // Handle username submit
  const handleUsernameSubmit = useCallback((newUsername: string) => {
    setUsername(newUsername);
    setUsernameState(newUsername);
    setUsernameDialogOpen(false);
    // Refresh history list when username changes
    setHistoryRefreshKey(prev => prev + 1);

    // Check for legacy data to migrate
    if (hasLegacyData()) {
      const projects = getLegacyProjects();
      setLegacyProjectCount(projects.length);
      setMigrationDialogOpen(true);
    }
  }, []);

  // Handle migration
  const handleMigrate = useCallback(async () => {
    if (!username) return;

    setIsMigrating(true);
    try {
      const result = await performMigration(username);
      setMigrationResult({ migrated: result.migrated, failed: result.failed });
      if (result.migrated > 0) {
        // Refresh history list after migration
        setHistoryRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResult({ migrated: 0, failed: legacyProjectCount });
    } finally {
      setIsMigrating(false);
    }
  }, [username, legacyProjectCount]);

  // Close migration dialog
  const handleCloseMigrationDialog = useCallback(() => {
    setMigrationDialogOpen(false);
    setMigrationResult(null);
  }, []);

  // Auto-save hook
  const { status: autoSaveStatus, lastSavedAt } = useAutoSave({
    fields,
    metadata,
    detailTableConfigs,
    dialogTemplates,
    subTabConfigs,
    mainDetailLabels,
    projectId: currentProjectId,
    projectName,
    enabled: true,
  });

  // Check for draft on mount
  useEffect(() => {
    if (!isLoading && username) {
      const draft = getDraft();
      if (draft && (draft.fields.length > 0 || draft.metadata.id)) {
        setRestoreDraftDialogOpen(true);
      }
    }
  }, [isLoading, username]);

  // Restore draft
  const handleRestoreDraft = useCallback(() => {
    const draft = getDraft();
    if (draft) {
      setFields(draft.fields);
      setMetadata(draft.metadata);
      setDetailTableConfigs(draft.detailTableConfigs || {});
      setDialogTemplates(draft.dialogTemplates || []);
      setSubTabConfigs(draft.subTabConfigs || {});
      setMainDetailLabels(draft.mainDetailLabels || {});
      setCurrentProjectId(draft.projectId);
      setProjectName(draft.projectName);
    }
    setRestoreDraftDialogOpen(false);
  }, []);

  // Discard draft
  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setRestoreDraftDialogOpen(false);
  }, []);

  // Format auto-save status
  const autoSaveStatusText = useMemo(() => {
    if (autoSaveStatus === 'saving') return '自動儲存中...';
    if (autoSaveStatus === 'saved' && lastSavedAt) {
      const time = lastSavedAt.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `已自動儲存 ${time}`;
    }
    if (autoSaveStatus === 'error') return '自動儲存失敗';
    return '';
  }, [autoSaveStatus, lastSavedAt]);

  // Generate XML and SQL content
  const { xmlContent, sqlContent } = useMemo(() => {
    if (fields.length === 0 || !metadata.id || !metadata.keyAttribute) {
      return { xmlContent: '', sqlContent: '' };
    }

    try {
      // Reset ID generator for consistent output
      resetIdGenerator();

      // Process fields into application definition
      const appDef = processFields(fields);

      // Apply custom mainDetailLabels from state
      for (const [tabName, tab] of appDef.tabs) {
        if (mainDetailLabels[tabName]) {
          tab.mainDetailLabel = mainDetailLabels[tabName];
        }
      }

      // Generate XML with detail table configs and dialog templates
      const xml = generateApplication(appDef, metadata, detailTableConfigs, dialogTemplates);

      // Collect all processed fields for SQL generation
      const allProcessedFields = [
        ...appDef.listFields,
        ...Array.from(appDef.tabs.values()).flatMap(tab => [
          ...tab.headerFields,
          ...Array.from(tab.detailTables.values()).flat(),
        ]),
      ];

      // Generate SQL
      const sql = generateAllSQL(allProcessedFields, metadata.mboName);

      return { xmlContent: xml, sqlContent: sql };
    } catch (error) {
      console.error('Generation error:', error);
      return { xmlContent: '', sqlContent: '' };
    }
  }, [fields, metadata, detailTableConfigs, dialogTemplates, mainDetailLabels]);

  // Download handlers
  const handleDownloadXml = useCallback(() => {
    if (!xmlContent) return;
    const filename = metadata.id.toLowerCase() || 'maximo';
    downloadFile(xmlContent, `${filename}.xml`, 'application/xml');
  }, [xmlContent, metadata.id]);

  const handleDownloadSql = useCallback(() => {
    if (!sqlContent) return;
    const filename = metadata.id.toLowerCase() || 'maximo';
    downloadFile(sqlContent, `${filename}.sql`, 'text/plain');
  }, [sqlContent, metadata.id]);

  const handleDownloadAll = useCallback(async () => {
    if (!xmlContent && !sqlContent) return;
    const filename = metadata.id.toLowerCase() || 'maximo';

    const files = [];
    if (xmlContent) {
      files.push({ name: `${filename}.xml`, content: xmlContent });
    }
    if (sqlContent) {
      files.push({ name: `${filename}.sql`, content: sqlContent });
    }

    await downloadAsZip(files, `${filename}.zip`);
  }, [xmlContent, sqlContent, metadata.id]);

  // Save project (async)
  const handleSaveProject = async () => {
    if (!projectName.trim() || !username) return;

    setIsSaving(true);
    try {
      const saved = await saveProject(
        projectName,
        metadata,
        fields,
        currentProjectId || undefined,
        username,
        detailTableConfigs,
        dialogTemplates,
        subTabConfigs,
        mainDetailLabels
      );
      if (saved) {
        setCurrentProjectId(saved.id);
        setSaveDialogOpen(false);
        clearDraft();
        // Refresh history list after saving
        setHistoryRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load project
  const handleLoadProject = (project: SavedProject) => {
    setFields(project.fields);
    setMetadata(project.metadata);
    setDetailTableConfigs(project.detailTableConfigs || {});
    setDialogTemplates(project.dialogTemplates || []);
    setSubTabConfigs(project.subTabConfigs || {});
    setMainDetailLabels(project.mainDetailLabels || {});
    setCurrentProjectId(project.id);
    setProjectName(project.name);
    setActiveTab('editor');
  };

  // New project
  const handleNewProject = () => {
    setFields([]);
    setMetadata(DEFAULT_METADATA);
    setDetailTableConfigs({});
    setDialogTemplates([]);
    setSubTabConfigs({});
    setMainDetailLabels({});
    setCurrentProjectId(null);
    setProjectName('');
    clearDraft();
  };

  // Show loading state while checking username
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Username Dialog */}
      <UsernameDialog
        open={usernameDialogOpen}
        onSubmit={handleUsernameSubmit}
        currentUsername={username}
      />

      {/* Header */}
      <header className="border-b shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Maximo XML 產生器</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                產生 Maximo 簡報 XML 和 SQL 檔案
              </p>
              {autoSaveStatusText && (
                <span className={`text-xs ${autoSaveStatus === 'saving' ? 'text-muted-foreground' : autoSaveStatus === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                  {autoSaveStatusText}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* User Display */}
            {username && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUsernameDialogOpen(true)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <User className="h-4 w-4" />
                <span>{username}</span>
              </Button>
            )}
            <Button variant="outline" onClick={handleNewProject}>
              新專案
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setProjectName(projectName || metadata.id || '未命名');
                setSaveDialogOpen(true);
              }}
              disabled={!username}
            >
              儲存專案
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="editor">欄位編輯器</TabsTrigger>
              <TabsTrigger value="dialogs">Dialog 設定</TabsTrigger>
              <TabsTrigger value="preview">預覽與下載</TabsTrigger>
              <TabsTrigger value="history">歷史紀錄</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-6">
              {/* Config Form */}
              <ConfigForm metadata={metadata} onMetadataChange={setMetadata} />

              {/* Field Editor */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">欄位定義</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldList
                    fields={fields}
                    onFieldsChange={setFields}
                    activeTab={fieldEditorTab}
                    onActiveTabChange={setFieldEditorTab}
                    detailTableConfigs={detailTableConfigs}
                    onDetailTableConfigsChange={setDetailTableConfigs}
                    subTabConfigs={subTabConfigs}
                    onSubTabConfigsChange={setSubTabConfigs}
                    mainDetailLabels={mainDetailLabels}
                    onMainDetailLabelsChange={setMainDetailLabels}
                    fieldSuggestions={fieldSuggestions}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dialogs">
              <DialogEditor
                dialogs={dialogTemplates}
                onDialogsChange={setDialogTemplates}
              />
            </TabsContent>

            <TabsContent value="preview">
              <PreviewPanel
                xmlContent={xmlContent}
                sqlContent={sqlContent}
                onDownloadXml={handleDownloadXml}
                onDownloadSql={handleDownloadSql}
                onDownloadAll={handleDownloadAll}
              />
            </TabsContent>

            <TabsContent value="history">
              <HistoryList
                onLoadProject={handleLoadProject}
                username={username}
                refreshKey={historyRefreshKey}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 儲存對話框 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>儲存專案</DialogTitle>
            <DialogDescription>
              將目前的設定儲存為專案
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="專案名稱"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveProject} disabled={!projectName.trim() || isSaving}>
              {isSaving ? '儲存中...' : '儲存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 恢復草稿對話框 */}
      <AlertDialog open={restoreDraftDialogOpen} onOpenChange={setRestoreDraftDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>發現未儲存的草稿</AlertDialogTitle>
            <AlertDialogDescription>
              系統發現上次未儲存的工作草稿。您要恢復這份草稿嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              捨棄
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              恢復草稿
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 資料遷移對話框 */}
      <AlertDialog open={migrationDialogOpen} onOpenChange={handleCloseMigrationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {migrationResult ? '遷移完成' : '發現舊版資料'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {migrationResult ? (
                <>
                  成功遷移 {migrationResult.migrated} 個專案
                  {migrationResult.failed > 0 && (
                    <>，{migrationResult.failed} 個專案遷移失敗</>
                  )}
                  。
                </>
              ) : (
                <>
                  系統發現 {legacyProjectCount} 個儲存在瀏覽器中的舊版專案。
                  是否要將這些專案遷移到新的儲存系統？遷移後，您的專案將與使用者名稱「{username}」關聯。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {migrationResult ? (
              <AlertDialogAction onClick={handleCloseMigrationDialog}>
                確定
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={isMigrating}>
                  稍後再說
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleMigrate} disabled={isMigrating}>
                  {isMigrating ? '遷移中...' : '開始遷移'}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
