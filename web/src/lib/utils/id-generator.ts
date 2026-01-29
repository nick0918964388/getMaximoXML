/**
 * Unique ID Generator for Maximo XML elements
 *
 * Uses a combination of timestamp base and counter to ensure unique IDs
 * even when called multiple times in quick succession.
 */

let counter = 0;
let lastTimestamp = 0;

/**
 * Generate a unique ID for Maximo XML elements
 * Format: timestamp + counter (ensures uniqueness)
 */
export function generateId(): string {
  const now = Date.now();

  // Reset counter if timestamp changed
  if (now !== lastTimestamp) {
    counter = 0;
    lastTimestamp = now;
  }

  // Increment counter for same timestamp
  counter++;

  // Combine timestamp with counter (padded to 3 digits)
  return `${now}${counter.toString().padStart(3, '0')}`;
}

/**
 * Reset the ID generator (useful for testing)
 */
export function resetIdGenerator(): void {
  counter = 0;
  lastTimestamp = 0;
}

/**
 * Generate a semantic, readable ID from prefix and optional suffix
 * Produces IDs like: main_grid, subtab_expense, main_grid_row1_col1
 *
 * @param prefix - The base prefix (e.g., 'main', 'subtab', 'section')
 * @param suffix - Optional suffix to append (e.g., 'grid', 'expense', 'row1')
 * @returns A lowercase, underscore-separated ID
 */
export function generateSemanticId(prefix: string, suffix?: string): string {
  const sanitize = (s: string): string => {
    return s
      .toLowerCase()
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[^a-z0-9_\u4e00-\u9fff]/g, '');  // Keep alphanumeric, underscore, and Chinese chars
  };

  const sanitizedPrefix = sanitize(prefix);

  if (!suffix || suffix === '') {
    return sanitizedPrefix;
  }

  const sanitizedSuffix = sanitize(suffix);
  return `${sanitizedPrefix}_${sanitizedSuffix}`;
}
