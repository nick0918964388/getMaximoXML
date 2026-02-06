/**
 * MAS Pod/Deployment Management Types and Helpers
 */

// =============================================================================
// Constants
// =============================================================================

/**
 * Known MAS Manage resource kinds (the component type in the pod name).
 */
export const MAS_RESOURCE_KINDS = [
  'all',
  'cron',
  'maxinst',
  'mea',
  'report',
  'ui',
] as const;

/** Default stem for backward compatibility */
const DEFAULT_STEM = 'mas-masw-manage-';

/**
 * Legacy constant for backward compatibility.
 * Prefer buildMasPrefixes(podPrefix) for dynamic usage.
 */
export const MAS_MANAGE_PREFIXES = MAS_RESOURCE_KINDS.map(
  (kind) => `${DEFAULT_STEM}${kind}-`
);

/**
 * Derive the common stem from a podPrefix.
 * E.g. "mas-inst2-manage-maxinst-" → "mas-inst2-manage-"
 * If the podPrefix doesn't end with a known kind, returns it as-is.
 */
export function deriveMasStem(podPrefix: string): string {
  const trimmed = podPrefix.replace(/-$/, '');
  for (const kind of MAS_RESOURCE_KINDS) {
    if (trimmed.endsWith(`-${kind}`)) {
      return trimmed.slice(0, trimmed.length - kind.length);
    }
  }
  return podPrefix;
}

/**
 * Build the full set of MAS prefixes from a podPrefix.
 * E.g. "mas-inst2-manage-maxinst-" → ["mas-inst2-manage-all-", "mas-inst2-manage-cron-", ...]
 */
export function buildMasPrefixes(podPrefix: string): string[] {
  const stem = deriveMasStem(podPrefix);
  return MAS_RESOURCE_KINDS.map((kind) => `${stem}${kind}-`);
}

/**
 * Annotation key used to store previous replica count before scaling to 0
 */
export const PREVIOUS_REPLICAS_ANNOTATION = 'mas-tools/previous-replicas';

// =============================================================================
// Types
// =============================================================================

export interface MasManagedPodInfo {
  name: string;
  namespace: string;
  /** Pod phase: Running, Pending, Failed, Succeeded, Unknown */
  status: string;
  ready: boolean;
  restarts: number;
  /** Human-readable age, e.g. "2d", "5h", "3m" */
  age: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  containers: {
    name: string;
    ready: boolean;
    restartCount: number;
    state: string;
  }[];
  labels: Record<string, string>;
}

export interface MasDeploymentInfo {
  name: string;
  namespace: string;
  /** Desired replica count */
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  /** Human-readable age */
  age: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** Previous replica count from annotation, for restore after scale-to-0 */
  previousReplicas?: number;
}

export interface PodLogOptions {
  container?: string;
  follow?: boolean;
  tailLines?: number;
  timestamps?: boolean;
  previous?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a resource name belongs to a known MAS Manage component.
 * Matches both pod names (with hash suffix, e.g. "mas-masw-manage-all-78b578-xgwvn")
 * and deployment names (exact base, e.g. "mas-masw-manage-all").
 * When podPrefix is provided, derives prefixes dynamically from it.
 */
export function isMasResource(name: string, podPrefix?: string): boolean {
  const stem = podPrefix ? deriveMasStem(podPrefix) : DEFAULT_STEM;
  return MAS_RESOURCE_KINDS.some((kind) => {
    const base = `${stem}${kind}`;
    // Exact deployment name OR pod name with hash suffix
    return name === base || name.startsWith(`${base}-`);
  });
}

/**
 * Parse the MAS resource kind from a resource name.
 * E.g. "mas-masw-manage-all-abc123" → "all", "mas-masw-manage-all" → "all"
 * When podPrefix is provided, uses it to derive the stem.
 */
export function parseMasResourceKind(name: string, podPrefix?: string): string {
  const stem = podPrefix ? deriveMasStem(podPrefix) : DEFAULT_STEM;
  for (const kind of MAS_RESOURCE_KINDS) {
    const base = `${stem}${kind}`;
    if (name === base || name.startsWith(`${base}-`)) {
      return kind;
    }
  }
  return 'unknown';
}

/**
 * Format a creation timestamp into a human-readable age string.
 * @param createdAt ISO 8601 timestamp
 * @param now Reference time (defaults to current time)
 */
export function formatAge(createdAt: string, now?: Date): string {
  const created = new Date(createdAt);
  const reference = now ?? new Date();
  const diffMs = reference.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMinutes > 0) return `${diffMinutes}m`;
  return '<1m';
}
