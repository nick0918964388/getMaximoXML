import { describe, it, expect, beforeEach } from 'vitest';
import { generateId, resetIdGenerator } from './id-generator';

describe('ID Generator', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  it('should generate unique IDs when called multiple times', () => {
    const ids = new Set<string>();

    // Generate 100 IDs
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }

    // All should be unique
    expect(ids.size).toBe(100);
  });

  it('should generate IDs that look like timestamps with counters', () => {
    const id = generateId();

    // Should be numeric string (timestamp + counter)
    expect(/^\d+$/.test(id)).toBe(true);

    // Should be longer than a regular timestamp (13 digits + 3 digit counter)
    expect(id.length).toBeGreaterThanOrEqual(16);
  });

  it('should generate sequential IDs in the same millisecond', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    // Extract the counter portion (last 3 digits)
    const counter1 = parseInt(id1.slice(-3));
    const counter2 = parseInt(id2.slice(-3));
    const counter3 = parseInt(id3.slice(-3));

    // Counters should be sequential
    expect(counter2).toBe(counter1 + 1);
    expect(counter3).toBe(counter2 + 1);
  });
});
