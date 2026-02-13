/**
 * ER Diagram Export - Capture ReactFlow viewport as PNG for Word export
 */

import { toPng } from 'html-to-image';

/**
 * Capture an ER Diagram container element as PNG image data.
 *
 * @param containerElement - DOM element containing the ReactFlow viewport
 * @returns PNG image data as ArrayBuffer with dimensions, or null if capture fails
 */
export async function generateErDiagramImage(
  containerElement: HTMLElement | null
): Promise<{ data: ArrayBuffer; width: number; height: number } | null> {
  if (!containerElement) return null;

  const viewport = containerElement.querySelector('.react-flow__viewport') as HTMLElement | null;
  if (!viewport) return null;

  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: '#ffffff',
      pixelRatio: 2, // High resolution for print
    });

    // Convert data URL to ArrayBuffer
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Get dimensions from the image
    const img = new Image();
    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.src = dataUrl;
    });

    return {
      data: arrayBuffer,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch {
    console.error('Failed to capture ER Diagram image');
    return null;
  }
}
