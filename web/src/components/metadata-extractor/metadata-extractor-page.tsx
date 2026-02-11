'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { LoginPage } from '@/components/auth/login-page';
import { OslcConfigDialog } from './oslc-config-dialog';
import { ObjectBrowser } from './object-browser';
import { DomainBrowser } from './domain-browser';
import { AppBrowser } from './app-browser';
import { ModuleBrowser } from './module-browser';
import { SelectionCart } from './selection-cart';
import { ExtractionPreview } from './extraction-preview';
import type {
  MetadataSelection, SelectedObject, OslcDomainWithValues,
  OslcMaxApp, OslcMaxModule, ExtractionResult, SerializableSelection,
} from '@/lib/oslc/types';
import type { DbcOperation } from '@/lib/dbc/types';

function serializeSelection(sel: MetadataSelection): SerializableSelection {
  return {
    objects: Array.from(sel.objects.entries()).map(([key, value]) => ({ key, value })),
    domains: Array.from(sel.domains.entries()).map(([key, value]) => ({ key, value })),
    apps: Array.from(sel.apps.entries()).map(([key, value]) => ({ key, value })),
    modules: Array.from(sel.modules.entries()).map(([key, value]) => ({ key, value })),
  };
}

export function MetadataExtractorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [configOpen, setConfigOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);

  // Selection state
  const [selection, setSelection] = useState<MetadataSelection>({
    objects: new Map(),
    domains: new Map(),
    apps: new Map(),
    modules: new Map(),
  });

  // ─── Selection handlers ──────────────────────────────────────

  const handleToggleObject = useCallback((obj: SelectedObject) => {
    setSelection((prev) => {
      const next = {
        ...prev,
        objects: new Map(prev.objects),
      };
      if (next.objects.has(obj.object.objectname)) {
        next.objects.delete(obj.object.objectname);
      } else {
        next.objects.set(obj.object.objectname, obj);
      }
      return next;
    });
  }, []);

  const handleToggleDomain = useCallback((domain: OslcDomainWithValues) => {
    setSelection((prev) => {
      const next = { ...prev, domains: new Map(prev.domains) };
      if (next.domains.has(domain.domainid)) {
        next.domains.delete(domain.domainid);
      } else {
        next.domains.set(domain.domainid, domain);
      }
      return next;
    });
  }, []);

  const handleToggleApp = useCallback((app: OslcMaxApp) => {
    setSelection((prev) => {
      const next = { ...prev, apps: new Map(prev.apps) };
      if (next.apps.has(app.app)) {
        next.apps.delete(app.app);
      } else {
        next.apps.set(app.app, app);
      }
      return next;
    });
  }, []);

  const handleToggleModule = useCallback((mod: OslcMaxModule) => {
    setSelection((prev) => {
      const next = { ...prev, modules: new Map(prev.modules) };
      if (next.modules.has(mod.module)) {
        next.modules.delete(mod.module);
      } else {
        next.modules.set(mod.module, mod);
      }
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelection({
      objects: new Map(),
      domains: new Map(),
      apps: new Map(),
      modules: new Map(),
    });
  }, []);

  const handleRemoveObject = useCallback((name: string) => {
    setSelection((prev) => {
      const next = { ...prev, objects: new Map(prev.objects) };
      next.objects.delete(name);
      return next;
    });
  }, []);

  const handleRemoveDomain = useCallback((name: string) => {
    setSelection((prev) => {
      const next = { ...prev, domains: new Map(prev.domains) };
      next.domains.delete(name);
      return next;
    });
  }, []);

  const handleRemoveApp = useCallback((name: string) => {
    setSelection((prev) => {
      const next = { ...prev, apps: new Map(prev.apps) };
      next.apps.delete(name);
      return next;
    });
  }, []);

  const handleRemoveModule = useCallback((name: string) => {
    setSelection((prev) => {
      const next = { ...prev, modules: new Map(prev.modules) };
      next.modules.delete(name);
      return next;
    });
  }, []);

  // ─── Extract ─────────────────────────────────────────────────

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const res = await fetch('/api/oslc/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeSelection(selection)),
      });
      const data = await res.json();
      if (data.success) {
        setExtractionResult(data.data);
        setPreviewOpen(true);
      }
    } catch (e) {
      console.error('Extraction failed:', e);
    } finally {
      setExtracting(false);
    }
  };

  const handleOpenInBuilder = (operations: DbcOperation[]) => {
    sessionStorage.setItem('dbc-import-operations', JSON.stringify(operations));
    router.push('/tools/dbc-builder');
  };

  // ─── Auth guard ──────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const totalSelected =
    selection.objects.size +
    selection.domains.size +
    selection.apps.size +
    selection.modules.size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <CardTitle>Metadata 擷取器</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
                <Settings className="h-4 w-4 mr-1" />
                連線設定
              </Button>
              <Button
                size="sm"
                disabled={totalSelected === 0 || extracting}
                onClick={handleExtract}
              >
                {extracting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                擷取 DBC ({totalSelected})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Browser panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="objects">
                <TabsList className="mb-3">
                  <TabsTrigger value="objects">Objects</TabsTrigger>
                  <TabsTrigger value="domains">Domains</TabsTrigger>
                  <TabsTrigger value="apps">Apps</TabsTrigger>
                  <TabsTrigger value="modules">Modules</TabsTrigger>
                </TabsList>

                <TabsContent value="objects">
                  <ObjectBrowser
                    selectedObjects={selection.objects}
                    onToggleObject={handleToggleObject}
                  />
                </TabsContent>

                <TabsContent value="domains">
                  <DomainBrowser
                    selectedDomains={selection.domains}
                    onToggleDomain={handleToggleDomain}
                  />
                </TabsContent>

                <TabsContent value="apps">
                  <AppBrowser
                    selectedApps={selection.apps}
                    onToggleApp={handleToggleApp}
                  />
                </TabsContent>

                <TabsContent value="modules">
                  <ModuleBrowser
                    selectedModules={selection.modules}
                    onToggleModule={handleToggleModule}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Selection cart */}
        <div className="lg:col-span-1">
          <Card className="h-[650px]">
            <SelectionCart
              selection={selection}
              onRemoveObject={handleRemoveObject}
              onRemoveDomain={handleRemoveDomain}
              onRemoveApp={handleRemoveApp}
              onRemoveModule={handleRemoveModule}
              onClearAll={handleClearAll}
            />
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <OslcConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
      />
      <ExtractionPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        result={extractionResult}
        onOpenInBuilder={handleOpenInBuilder}
      />
    </div>
  );
}
