/**
 * MAS Environment Configuration
 * Reads configuration from environment variables
 */

/** Default import timeout: 5 minutes */
const DEFAULT_IMPORT_TIMEOUT = 300000;

/** Default paths */
const DEFAULT_DBC_UPLOAD_PATH = '/opt/IBM/SMP/maximo/tools/maximo/en/script';
const DEFAULT_DBC_SCRIPT_PATH = '/opt/IBM/SMP/maximo/tools/maximo/internal';

/**
 * Get MAS configuration from environment variables
 */
export function getMasEnvConfig() {
  return {
    ocpClusterUrl: process.env.MAS_OCP_CLUSTER_URL || '',
    namespace: process.env.MAS_NAMESPACE || 'mas-inst1-manage',
    podPrefix: process.env.MAS_POD_PREFIX || 'mas-masw-manage-maxinst-',
    // DBC file upload path
    dbcUploadPath: process.env.MAS_DBC_UPLOAD_PATH || process.env.MAS_DBC_TARGET_PATH || DEFAULT_DBC_UPLOAD_PATH,
    // runscriptfile.sh execution path
    dbcScriptPath: process.env.MAS_DBC_SCRIPT_PATH || DEFAULT_DBC_SCRIPT_PATH,
    // Legacy: kept for backward compatibility
    dbcTargetPath: process.env.MAS_DBC_TARGET_PATH || DEFAULT_DBC_UPLOAD_PATH,
    // Credentials for username/password login
    username: process.env.MAS_OCP_USERNAME || '',
    password: process.env.MAS_OCP_PASSWORD || '',
    // Import timeout in milliseconds
    importTimeout: parseInt(process.env.MAS_IMPORT_TIMEOUT || '', 10) || DEFAULT_IMPORT_TIMEOUT,
  };
}

/**
 * Check if encryption key is configured
 */
export function hasEncryptionKey(): boolean {
  return !!process.env.MAS_ENCRYPTION_KEY;
}

/**
 * Check if OCP credentials are configured
 */
export function hasOcpCredentials(): boolean {
  const env = getMasEnvConfig();
  return !!(env.username && env.password);
}
