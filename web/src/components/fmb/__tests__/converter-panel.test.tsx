import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConverterPanel } from '../converter-panel';
import type { FmbModule } from '@/lib/fmb/types';

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
  configurable: true,
});

const mockModule: FmbModule = {
  name: 'TEST_APP',
  title: 'Test Application',
  blocks: [
    {
      name: 'BLOCK1',
      singleRecord: true,
      queryDataSource: '',
      items: [
        {
          name: 'FIELD1',
          itemType: 'TEXT_ITEM',
          prompt: 'Field One',
          canvas: 'CVS1',
          tabPage: 'TP1',
          required: false,
          enabled: true,
          visible: true,
          attributes: {},
        },
      ],
      triggers: [],
      attributes: {},
    },
  ],
  canvases: [
    {
      name: 'CVS1',
      canvasType: 'TAB',
      tabPages: [{ name: 'TP1', label: 'Main Tab', attributes: {} }],
      attributes: {},
    },
  ],
  lovs: [],
  triggers: [],
  attributes: {},
};

describe('ConverterPanel', () => {
  it('renders conversion results table', () => {
    render(<ConverterPanel module={mockModule} />);
    // FIELD1 appears in both header and auto-generated list rows
    expect(screen.getAllByText('FIELD1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Field One').length).toBeGreaterThanOrEqual(1);
  });

  it('shows XML preview section', () => {
    render(<ConverterPanel module={mockModule} />);
    expect(screen.getByText(/XML 預覽/)).toBeInTheDocument();
  });

  it('renders XML content in preview', () => {
    render(<ConverterPanel module={mockModule} />);
    const pre = document.querySelector('pre');
    expect(pre?.textContent).toContain('presentation');
  });

  it('has a copy button', () => {
    render(<ConverterPanel module={mockModule} />);
    const buttons = screen.getAllByRole('button');
    const copyButton = buttons.find(b => b.textContent?.includes('複製'));
    expect(copyButton).toBeDefined();
  });
});
