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
