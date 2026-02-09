'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { SAFieldDefinition, ApplicationMetadata, DEFAULT_METADATA, SavedProject, DetailTableConfig, DialogTemplate, SubTabDefinition } from '@/lib/types';
import { processFields } from '@/lib/field-processor';
import { generateApplication } from '@/lib/assemblers';
import { generateAllSQL } from '@/lib/generators';
import { saveProject } from '@/lib/supabase/projects';
import { resetIdGenerator } from '@/lib/utils/id-generator';
import { useAutoSave, getDraft, clearDraft } from '@/hooks';
import { useAuth } from '@/lib/supabase/auth-context';
import { LoginPage } from '@/components/auth/login-page';

import { FieldList } from '@/components/field-editor';
import { ConfigForm } from '@/components/config-form';
import { DialogEditor } from '@/components/dialog-editor';
import { PreviewPanel } from '@/components/preview-panel';
import { HistoryList } from '@/components/history-list';
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

export default function XmlGeneratorPage() {
  const { user, loading: authLoading } = useAuth();

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
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Field suggestions for autocomplete
  const fieldSuggestions = useFieldSuggestions(fields);

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
    userId: user?.id ?? null,
    enabled: !!user,
  });

  // Check for draft on mount (after auth loads)
  useEffect(() => {
    if (!authLoading && user) {
      const draft = getDraft();
      if (draft && (draft.fields.length > 0 || draft.metadata.id)) {
        setRestoreDraftDialogOpen(true);
      }
    }
  }, [authLoading, user]);

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
      resetIdGenerator();

      const sanitizedFields = fields.map(f => {
        if (f.subTabName) {
          const tabSubTabs = subTabConfigs[f.tabName || 'Main'] || [];
          const exists = tabSubTabs.some(st => st.label === f.subTabName);
          if (!exists) return { ...f, subTabName: '' };
        }
        return f;
      });

      const appDef = processFields(sanitizedFields);

      for (const [tabName, tab] of appDef.tabs) {
        if (mainDetailLabels[tabName]) {
          tab.mainDetailLabel = mainDetailLabels[tabName];
        }
      }

      const xml = generateApplication(appDef, metadata, detailTableConfigs, dialogTemplates);

      const allProcessedFields = [
        ...appDef.listFields,
        ...Array.from(appDef.tabs.values()).flatMap(tab => [
          ...tab.headerFields,
          ...Array.from(tab.detailTables.values()).flat(),
        ]),
      ];

      const sql = generateAllSQL(allProcessedFields, metadata.mboName);

      return { xmlContent: xml, sqlContent: sql };
    } catch (error) {
      console.error('Generation error:', error);
      return { xmlContent: '', sqlContent: '' };
    }
  }, [fields, metadata, detailTableConfigs, dialogTemplates, mainDetailLabels, subTabConfigs]);

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
    if (xmlContent) files.push({ name: `${filename}.xml`, content: xmlContent });
    if (sqlContent) files.push({ name: `${filename}.sql`, content: sqlContent });

    await downloadAsZip(files, `${filename}.zip`);
  }, [xmlContent, sqlContent, metadata.id]);

  // Save project (Supabase)
  const handleSaveProject = async () => {
    if (!projectName.trim() || !user) return;

    setIsSaving(true);
    try {
      const saved = await saveProject(
        projectName,
        metadata,
        fields,
        currentProjectId || undefined,
        detailTableConfigs,
        dialogTemplates,
        subTabConfigs,
        mainDetailLabels
      );
      if (saved) {
        setCurrentProjectId(saved.id);
        setSaveDialogOpen(false);
        clearDraft();
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

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-full">
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
            <Button variant="outline" onClick={handleNewProject}>
              新專案
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setProjectName(projectName || metadata.id || '未命名');
                setSaveDialogOpen(true);
              }}
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
              <ConfigForm metadata={metadata} onMetadataChange={setMetadata} />
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
                refreshKey={historyRefreshKey}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Save Dialog */}
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

      {/* Restore Draft Dialog */}
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
    </div>
  );
}
