'use client';

import { useReducer, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { saveDbcState, getDbcState } from '@/lib/supabase/dbc-state';
import { LoginPage } from '@/components/auth/login-page';
import { OperationPalette } from './operation-palette';
import { OperationList } from './operation-list';
import { OperationForm } from './operation-form';
import { XmlPreview } from './xml-preview';
import { ScriptForm } from './forms/script-form';
import { CheckForm } from './forms/check-forms';
import { buildDbcScript } from '@/lib/dbc/dbc-script-builder';
import { parseDbcXml } from '@/lib/dbc/dbc-parser';
import { MasImportSection } from '@/components/fmb/mas/mas-import-section';
import type {
  DbcBuilderState, DbcOperation,
  DbcOperationType, DbcScriptConfig, DbcCheck,
} from '@/lib/dbc/types';
import { createDefaultOperation } from './default-operations';

// ─── Reducer ─────────────────────────────────────────────────────

type Action =
  | { type: 'SET_SCRIPT'; config: DbcScriptConfig }
  | { type: 'SET_CHECKS'; checks: DbcCheck[] }
  | { type: 'ADD_OP'; opType: DbcOperationType }
  | { type: 'UPDATE_OP'; id: string; operation: DbcOperation }
  | { type: 'REMOVE_OP'; id: string }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'SELECT'; id: string | null }
  | { type: 'DUPLICATE'; id: string }
  | { type: 'LOAD'; state: DbcBuilderState }
  | { type: 'CLEAR' };

let idCounter = 0;
function nextId(): string {
  return `op-${++idCounter}-${Date.now()}`;
}

function reducer(state: DbcBuilderState, action: Action): DbcBuilderState {
  switch (action.type) {
    case 'SET_SCRIPT':
      return { ...state, script: action.config };
    case 'SET_CHECKS':
      return { ...state, checks: action.checks };
    case 'ADD_OP': {
      const id = nextId();
      const operation = createDefaultOperation(action.opType);
      return {
        ...state,
        operations: [...state.operations, { id, operation }],
        selectedId: id,
      };
    }
    case 'UPDATE_OP':
      return {
        ...state,
        operations: state.operations.map((e) =>
          e.id === action.id ? { ...e, operation: action.operation } : e
        ),
      };
    case 'REMOVE_OP': {
      const ops = state.operations.filter((e) => e.id !== action.id);
      return {
        ...state,
        operations: ops,
        selectedId: state.selectedId === action.id
          ? (ops.length > 0 ? ops[0].id : null)
          : state.selectedId,
      };
    }
    case 'REORDER': {
      const ops = [...state.operations];
      const [moved] = ops.splice(action.fromIndex, 1);
      ops.splice(action.toIndex, 0, moved);
      return { ...state, operations: ops };
    }
    case 'SELECT':
      return { ...state, selectedId: action.id };
    case 'DUPLICATE': {
      const source = state.operations.find((e) => e.id === action.id);
      if (!source) return state;
      const id = nextId();
      const idx = state.operations.findIndex((e) => e.id === action.id);
      const ops = [...state.operations];
      ops.splice(idx + 1, 0, { id, operation: JSON.parse(JSON.stringify(source.operation)) });
      return { ...state, operations: ops, selectedId: id };
    }
    case 'LOAD':
      return action.state;
    case 'CLEAR':
      return {
        script: { author: '', scriptname: '' },
        checks: [],
        operations: [],
        selectedId: null,
      };
  }
}

const STORAGE_KEY = 'dbc-builder-state';

function loadSavedState(): DbcBuilderState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

const defaultState: DbcBuilderState = {
  script: { author: '', scriptname: '' },
  checks: [],
  operations: [],
  selectedId: null,
};

export function DbcBuilderPage() {
  const { user, loading: authLoading } = useAuth();

  const [state, dispatch] = useReducer(
    reducer,
    defaultState,
    (init) => loadSavedState() || init
  );

  // Load from Supabase on auth ready
  useEffect(() => {
    if (!user) return;
    getDbcState(user.id).then((saved) => {
      if (saved) dispatch({ type: 'LOAD', state: saved });
    });
  }, [user]);

  // Import operations from Metadata Extractor via sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('dbc-import-operations');
    if (!raw) return;
    sessionStorage.removeItem('dbc-import-operations');
    try {
      const operations = JSON.parse(raw) as DbcOperation[];
      if (Array.isArray(operations) && operations.length > 0) {
        const newState: DbcBuilderState = {
          script: { author: 'metadata-extractor', scriptname: 'extracted_metadata', description: 'Extracted from MAS OSLC' },
          checks: [],
          operations: operations.map((op) => ({ id: nextId(), operation: op })),
          selectedId: null,
        };
        dispatch({ type: 'LOAD', state: newState });
      }
    } catch { /* ignore invalid data */ }
  }, []);

  // Autosave: localStorage (sync) + Supabase (async)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (user) saveDbcState(user.id, state);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, user]);

  const xml = useMemo(() => buildDbcScript(state), [state]);
  const filename = state.script.scriptname || 'script';

  const selectedOp = state.operations.find((e) => e.id === state.selectedId);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseDbcXml(text);
      dispatch({ type: 'LOAD', state: parsed });
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleClear = useCallback(() => {
    if (state.operations.length > 0 && !confirm('Clear all operations?')) return;
    dispatch({ type: 'CLEAR' });
  }, [state.operations.length]);

  if (authLoading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">載入中...</p></div>;
  }
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h1 className="text-lg font-semibold">DBC 建構器</h1>
        </div>
        <div className="flex items-center gap-2">
          <OperationPalette onSelect={(type) => dispatch({ type: 'ADD_OP', opType: type })} />
          <label>
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="mr-1 h-4 w-4" /> Import DBC</span>
            </Button>
            <input type="file" accept=".dbc,.xml" onChange={handleImportFile} className="hidden" />
          </label>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="mr-1 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: operation list */}
        <div className="w-72 border-r flex flex-col">
          <div className="px-3 py-2 border-b">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Operations ({state.operations.length})
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <OperationList
              operations={state.operations}
              selectedId={state.selectedId}
              onSelect={(id) => dispatch({ type: 'SELECT', id })}
              onReorder={(from, to) => dispatch({ type: 'REORDER', fromIndex: from, toIndex: to })}
              onRemove={(id) => dispatch({ type: 'REMOVE_OP', id })}
              onDuplicate={(id) => dispatch({ type: 'DUPLICATE', id })}
            />
          </div>
        </div>

        {/* Right panel: form + preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="form" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2 self-start">
              <TabsTrigger value="form">Edit</TabsTrigger>
              <TabsTrigger value="script">Script Config</TabsTrigger>
              <TabsTrigger value="checks">Checks</TabsTrigger>
              <TabsTrigger value="preview">XML Preview</TabsTrigger>
              <TabsTrigger value="mas">MAS Import</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 overflow-auto px-4 pb-4">
              {selectedOp ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {selectedOp.operation.type.replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OperationForm
                      operation={selectedOp.operation}
                      onChange={(op) => dispatch({ type: 'UPDATE_OP', id: selectedOp.id, operation: op })}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select an operation from the list or add a new one</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="script" className="flex-1 overflow-auto px-4 pb-4">
              <Card>
                <CardContent className="pt-6">
                  <ScriptForm
                    config={state.script}
                    onChange={(config) => dispatch({ type: 'SET_SCRIPT', config })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checks" className="flex-1 overflow-auto px-4 pb-4">
              <Card>
                <CardContent className="pt-6">
                  <CheckForm
                    checks={state.checks}
                    onChange={(checks) => dispatch({ type: 'SET_CHECKS', checks })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden">
              <XmlPreview xml={xml} filename={filename} />
            </TabsContent>

            <TabsContent value="mas" className="flex-1 overflow-auto px-4 pb-4">
              <MasImportSection
                dbcContent={xml}
                dbcFilename={`${filename}.dbc`}
                disabled={!xml || xml.includes('<statements>\n  </statements>')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
