'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SAFieldDefinition, ApplicationMetadata, DetailTableConfig, DialogTemplate, SubTabDefinition } from '@/lib/types';

const DRAFT_KEY = 'maximo-xml-generator-draft';
const DEBOUNCE_MS = 1500; // Auto-save 1.5 seconds after last change

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DraftData {
  fields: SAFieldDefinition[];
  metadata: ApplicationMetadata;
  detailTableConfigs: Record<string, DetailTableConfig>;
  dialogTemplates: DialogTemplate[];
  subTabConfigs: Record<string, SubTabDefinition[]>;
  mainDetailLabels: Record<string, string>;
  projectId: string | null;
  projectName: string;
  savedAt: string;
}

interface UseAutoSaveOptions {
  fields: SAFieldDefinition[];
  metadata: ApplicationMetadata;
  detailTableConfigs: Record<string, DetailTableConfig>;
  dialogTemplates: DialogTemplate[];
  subTabConfigs: Record<string, SubTabDefinition[]>;
  mainDetailLabels?: Record<string, string>;
  projectId: string | null;
  projectName: string;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  lastSavedAt: Date | null;
  clearDraft: () => void;
}

/**
 * Get draft data from localStorage
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
 * Auto-save hook for fields and metadata
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
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Save to localStorage
  const saveDraft = useCallback(() => {
    try {
      const draft: DraftData = {
        fields,
        metadata,
        detailTableConfigs,
        dialogTemplates,
        subTabConfigs,
        mainDetailLabels,
        projectId,
        projectName,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
    }
  }, [fields, metadata, detailTableConfigs, dialogTemplates, subTabConfigs, mainDetailLabels, projectId, projectName]);

  // Debounced auto-save on changes
  useEffect(() => {
    if (!enabled) return;

    // Skip first render (don't save initial empty state)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status to saving (will debounce)
    setStatus('saving');

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fields, metadata, detailTableConfigs, dialogTemplates, subTabConfigs, projectId, projectName, enabled, saveDraft]);

  // Save on window unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Synchronous save on unload
      try {
        const draft: DraftData = {
          fields,
          metadata,
          detailTableConfigs,
          dialogTemplates,
          subTabConfigs,
          mainDetailLabels,
          projectId,
          projectName,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignore errors on unload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fields, metadata, detailTableConfigs, dialogTemplates, subTabConfigs, mainDetailLabels, projectId, projectName, enabled]);

  return {
    status,
    lastSavedAt,
    clearDraft,
  };
}
