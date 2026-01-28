import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FmbConverterPage from '../page';

vi.mock('@/lib/fmb/parser', () => ({
  parseFmbXml: vi.fn(() => ({
    name: 'TEST',
    title: 'Test',
    blocks: [],
    canvases: [],
    lovs: [],
    triggers: [],
    attributes: {},
  })),
}));

describe('FmbConverterPage', () => {
  it('does not show loading spinner initially', () => {
    render(<FmbConverterPage />);
    expect(screen.queryByText(/解析中/)).not.toBeInTheDocument();
  });
});
