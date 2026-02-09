'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SAFieldDefinition, ApplicationMetadata, DetailTableConfig, DialogTemplate, SubTabDefinition } from '@/lib/types';
import { saveDraft as saveDraftToSupabase } from '@/lib/supabase/drafts';
import type { DraftData } from '@/lib/supabase/drafts';

const DRAFT_KEY = 'maximo-xml-generator-draft';
const DEBOUNCE_MS = 1500;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  fields: SAFieldDefinition[];
  metadata: ApplicationMetadata;
  detailTableConfigs: Record<string, DetailTableConfig>;
  dialogTemplates: DialogTemplate[];
  subTabConfigs: Record<string, SubTabDefinition[]>;
  mainDetailLabels?: Record<string, string>;
  projectId: string | null;
  projectName: string;
  userId: string | null;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  lastSavedAt: Date | null;
  clearDraft: () => void;
}

/**
 * Get draft data from localStorage (fallback / offline support)
 */
export function getDraft(): DraftData | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if draft exists
 */
export function hasDraft(): boolean {
  return getDraft() !== null;
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

/**
 * Auto-save hook — saves to Supabase with localStorage as synchronous fallback
 */
export function useAutoSave({
  fields,
  metadata,
  detailTableConfigs,
  dialogTemplates,
  subTabConfigs,
  mainDetailLabels = {},
  projectId,
  projectName,
  userId,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const buildDraft = useCallback((): DraftData => ({
    fields,
    metadata,
    detailTableConfigs,
    dialogTemplates,
    subTabConfigs,
    mainDetailLabels,
    projectId,
    projectName,
    savedAt: new Date().toISOString(),
  }), [fields, metadata, detailTableConfigs, dialogTemplates, subTabConfigs, mainDetailLabels, projectId, projectName]);

  // Save to localStorage (sync) + Supabase (async)
  const saveDraft = useCallback(async () => {
    const draft = buildDraft();

    // Always save to localStorage as immediate backup
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }

    // Save to Supabase if authenticated
    if (userId) {
      try {
        const ok = await saveDraftToSupabase(userId, draft);
        if (ok) {
          setStatus('saved');
          setLastSavedAt(new Date());
          return;
        }
      } catch { /* fall through */ }
    }

    // Fallback: still mark as saved (localStorage worked)
    setStatus('saved');
    setLastSavedAt(new Date());
  }, [buildDraft, userId]);

  // Debounced auto-save on changes
  useEffect(() => {
    if (!enabled) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setStatus('saving');

    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fields, metadata, detailTableConfigs, dialogTemplates, subTabConfigs, projectId, projectName, enabled, saveDraft]);

  // Save on window unload (synchronous localStorage only)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));
      } catch { /* ignore */ }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [buildDraft, enabled]);

  return { status, lastSavedAt, clearDraft };
}
