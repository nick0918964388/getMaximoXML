/**
 * ER Diagram Word Export - Generate Word section for ER Diagram
 */

import {
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
} from 'docx';

/**
 * Generate Word document section for ER Diagram.
 *
 * @param imageData - PNG image data as ArrayBuffer, or null if no diagram
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Array of Paragraph elements for the Word document
 */
export function generateErDiagramWordSection(
  imageData: ArrayBuffer | null,
  width: number,
  height: number
): Paragraph[] {
  const elements: Paragraph[] = [];

  // Section heading
  elements.push(
    new Paragraph({
      text: 'ER Diagram 實體關聯圖',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  // Image or placeholder
  if (!imageData || imageData.byteLength === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '（無可繪製的實體資料）',
            italics: true,
            color: '999999',
          }),
        ],
      })
    );
    return elements;
  }

  // Scale image to fit page width (max ~6 inches = 576pt at 96 DPI)
  const maxWidth = 576;
  const scale = Math.min(1, maxWidth / width);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  elements.push(
    new Paragraph({
      children: [
        new ImageRun({
          data: imageData,
          transformation: {
            width: scaledWidth,
            height: scaledHeight,
          },
          type: 'png',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  return elements;
}
