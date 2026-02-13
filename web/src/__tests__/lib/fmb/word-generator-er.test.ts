import { describe, it, expect } from 'vitest';
import { generateErDiagramWordSection } from '@/lib/fmb/er-diagram-word';

describe('generateErDiagramWordSection', () => {
  it('returns heading and image paragraph when image data is provided', () => {
    const imageData = new Uint8Array([137, 80, 78, 71]).buffer; // PNG header bytes
    const result = generateErDiagramWordSection(imageData, 800, 400);

    expect(result.length).toBeGreaterThanOrEqual(2);
    // First element should be the heading paragraph
    // Second should contain the image
  });

  it('returns heading and placeholder text when no image data', () => {
    const result = generateErDiagramWordSection(null, 0, 0);

    expect(result.length).toBe(2);
    // Should have heading + "no diagram" text
  });

  it('returns heading and placeholder for empty ArrayBuffer', () => {
    const result = generateErDiagramWordSection(new ArrayBuffer(0), 0, 0);

    expect(result.length).toBe(2);
  });
});
