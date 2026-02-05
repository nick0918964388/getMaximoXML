/**
 * MAS (IBM Maximo Application Suite) Import Types
 * For DBC file import to OCP-based MAS environments
 */

import { z } from 'zod';

// =============================================================================
// MAS Environment Configuration
// =============================================================================

/**
 * MAS environment configuration stored locally
 */
export interface MasConfig {
  /** OCP cluster API URL, e.g., https://api.ocp.example.com:6443 */
  ocpClusterUrl: string;
  /** Kubernetes namespace for MAS Manage, e.g., mas-inst1-manage */
  namespace: string;
  /** AES-256-GCM encrypted Service Account token */
  encryptedToken: string;
  /** Pod name prefix to find mxinst pod, e.g., mas-masw-manage-maxinst- */
  podPrefix: string;
  /** Target path in pod for DBC files, e.g., /opt/IBM/SMP/maximo/tools/maximo/dbc */
  dbcTargetPath: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_MAS_CONFIG: Omit<MasConfig, 'encryptedToken'> = {
  ocpClusterUrl: '',
  namespace: 'mas-inst1-manage',
  podPrefix: 'mas-masw-manage-maxinst-',
  dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
};

/**
 * Zod schema for MAS configuration validation
 */
export const MasConfigSchema = z.object({
  ocpClusterUrl: z
    .string()
    .url({ message: 'Invalid OCP cluster URL' })
    .refine((url) => url.startsWith('https://'), {
      message: 'OCP cluster URL must use HTTPS',
    }),
  namespace: z
    .string()
    .min(1, { message: 'Namespace is required' })
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message: 'Invalid namespace format',
    }),
  encryptedToken: z.string().min(1, { message: 'Token is required' }),
  podPrefix: z.string().min(1, { message: 'Pod prefix is required' }),
  dbcTargetPath: z
    .string()
    .min(1, { message: 'DBC target path is required' })
    .refine((path) => path.startsWith('/'), {
      message: 'Path must be absolute',
    }),
});

/**
 * Input schema for configuration (with plain text token)
 */
export const MasConfigInputSchema = z.object({
  ocpClusterUrl: z
    .string()
    .url({ message: 'Invalid OCP cluster URL' })
    .refine((url) => url.startsWith('https://'), {
      message: 'OCP cluster URL must use HTTPS',
    }),
  namespace: z
    .string()
    .min(1, { message: 'Namespace is required' })
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message: 'Invalid namespace format',
    }),
  token: z.string().min(1, { message: 'Token is required' }),
  podPrefix: z.string().min(1, { message: 'Pod prefix is required' }),
  dbcTargetPath: z
    .string()
    .min(1, { message: 'DBC target path is required' })
    .refine((path) => path.startsWith('/'), {
      message: 'Path must be absolute',
    }),
});

export type MasConfigInput = z.infer<typeof MasConfigInputSchema>;

// =============================================================================
// Import Job Status
// =============================================================================

/**
 * Import job status stages
 */
export type MasImportStatus =
  | 'idle'
  | 'connecting'
  | 'finding-pod'
  | 'uploading'
  | 'executing'
  | 'completed'
  | 'failed';

/**
 * Import job state
 */
export interface MasImportJob {
  /** Unique job identifier */
  id: string;
  /** Current status */
  status: MasImportStatus;
  /** Name of the found mxinst pod */
  podName?: string;
  /** DBC filename being imported */
  dbcFilename?: string;
  /** Command output from runscriptfile.sh */
  output?: string;
  /** Error message if failed */
  error?: string;
  /** Timestamp when job started */
  startedAt?: Date;
  /** Timestamp when job completed */
  completedAt?: Date;
}

/**
 * Import request payload
 */
export interface MasImportRequest {
  /** DBC file content */
  dbcContent: string;
  /** DBC filename (e.g., ZZ_MYFORM_dbc.dbc) */
  dbcFilename: string;
}

export const MasImportRequestSchema = z.object({
  dbcContent: z.string().min(1, { message: 'DBC content is required' }),
  dbcFilename: z
    .string()
    .min(1, { message: 'DBC filename is required' })
    .regex(/\.dbc$/, { message: 'Filename must end with .dbc' }),
});

// =============================================================================
// SSE Event Types
// =============================================================================

/**
 * Server-Sent Event for import progress
 */
export interface MasImportEvent {
  type: 'status' | 'output' | 'error' | 'complete';
  data: {
    status?: MasImportStatus;
    podName?: string;
    message?: string;
    error?: string;
  };
}

// =============================================================================
// Test Connection Types
// =============================================================================

/**
 * Test connection result
 */
export interface MasTestConnectionResult {
  success: boolean;
  message: string;
  podName?: string;
  podStatus?: string;
  error?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface MasApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// K8s Client Types
// =============================================================================

/**
 * Simplified pod info for UI display
 */
export interface MasPodInfo {
  name: string;
  namespace: string;
  status: string;
  containerName: string;
}

/**
 * K8s client connection options
 */
export interface MasK8sConnectionOptions {
  clusterUrl: string;
  token: string;
  namespace: string;
  skipTLSVerify?: boolean;
}
