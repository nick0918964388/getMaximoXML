import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DbcPanel } from '../dbc-panel';
import type { FmbModule } from '@/lib/fmb/types';
import type { SAFieldDefinition, ApplicationMetadata } from '@/lib/types';
import { DEFAULT_FIELD, DEFAULT_METADATA } from '@/lib/types';

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
  configurable: true,
});

// Mock URL APIs for download
const createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  global.URL.createObjectURL = createObjectURLMock;
  global.URL.revokeObjectURL = revokeObjectURLMock;
  vi.clearAllMocks();
});

// Mock FmbModule
const mockFmbModule: FmbModule = {
  name: 'TEST_MODULE',
  title: 'Test Module',
  blocks: [
    {
      name: 'MAIN_BLOCK',
      queryDataSource: 'ZZ_TEST_TABLE',
      singleRecord: true,
      items: [],
      triggers: [],
      attributes: {},
    },
  ],
  canvases: [],
  lovs: [],
  recordGroups: [],
  triggers: [],
  attributes: {},
};

// Mock fields
const mockFields: SAFieldDefinition[] = [
  {
    ...DEFAULT_FIELD,
    fieldName: 'TEST_ID',
    label: 'Test ID',
    maxType: 'UPPER',
    length: 30,
    title: 'Test ID',
    dbRequired: true,
    area: 'header',
  },
  {
    ...DEFAULT_FIELD,
    fieldName: 'DESCRIPTION',
    label: 'Description',
    maxType: 'ALN',
    length: 100,
    title: 'Description',
    dbRequired: false,
    area: 'header',
  },
];

// Mock metadata
const mockMetadata: ApplicationMetadata = {
  ...DEFAULT_METADATA,
  mboName: 'ZZ_TEST_TABLE',
  id: 'TEST_APP',
};

describe('DbcPanel', () => {

  describe('when fmbModule is null', () => {
    it('should show upload prompt', () => {
      render(
        <DbcPanel
          fmbModule={null}
          fields={[]}
          metadata={mockMetadata}
        />
      );

      expect(screen.getByText(/請先上傳/)).toBeInTheDocument();
    });

    it('should not show preview content', () => {
      render(
        <DbcPanel
          fmbModule={null}
          fields={[]}
          metadata={mockMetadata}
        />
      );

      expect(screen.queryByText(/DBC 預覽/)).not.toBeInTheDocument();
    });

    it('should not show download button', () => {
      render(
        <DbcPanel
          fmbModule={null}
          fields={[]}
          metadata={mockMetadata}
        />
      );

      expect(screen.queryByRole('button', { name: /下載/ })).not.toBeInTheDocument();
    });
  });

  describe('when fmbModule exists with valid data', () => {
    it('should show DBC preview section', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      expect(screen.getByText(/DBC 預覽/)).toBeInTheDocument();
    });

    it('should render XML content with script element', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('<script');
      expect(pre?.textContent).toContain('</script>');
    });

    it('should render XML content with define_table element', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('define_table');
      expect(pre?.textContent).toContain('ZZ_TEST_TABLE');
    });

    it('should render XML content with attrdef elements', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('attrdef');
      expect(pre?.textContent).toContain('TEST_ID');
      expect(pre?.textContent).toContain('DESCRIPTION');
    });

    it('should show download button', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      expect(screen.getByRole('button', { name: /下載/ })).toBeInTheDocument();
    });

    it('should have copy button', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(b => b.textContent?.includes('複製'));
      expect(copyButton).toBeDefined();
    });
  });

  describe('when fmbModule exists but has no valid MBO data', () => {
    it('should show error message when no blocks', () => {
      const emptyModule: FmbModule = {
        ...mockFmbModule,
        blocks: [],
      };

      render(
        <DbcPanel
          fmbModule={emptyModule}
          fields={[]}
          metadata={mockMetadata}
        />
      );

      expect(screen.getByText(/無可轉換的 MBO 資料/)).toBeInTheDocument();
    });

    it('should show error message when no fields', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={[]}
          metadata={mockMetadata}
        />
      );

      expect(screen.getByText(/無可轉換的 MBO 資料/)).toBeInTheDocument();
    });
  });

  describe('download functionality', () => {
    it('should trigger file download when download button is clicked', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /下載/ });
      fireEvent.click(downloadButton);

      expect(createObjectURLMock).toHaveBeenCalled();
    });

    it('should revoke object URL after download', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /下載/ });
      fireEvent.click(downloadButton);

      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test-url');
    });
  });

  describe('copy functionality', () => {
    it('should copy XML content to clipboard when copy button is clicked', async () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const copyButton = screen.getAllByRole('button').find(b => b.textContent?.includes('複製'));
      expect(copyButton).toBeDefined();
      if (copyButton) {
        fireEvent.click(copyButton);
        await waitFor(() => {
          expect(writeTextMock).toHaveBeenCalled();
        });
      }
    });
  });

  describe('settings form (User Story 3)', () => {
    it('should render settings form with author field', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      // Look for author input or label
      const authorInput = screen.getByLabelText(/author/i) || screen.getByPlaceholderText(/author/i);
      expect(authorInput).toBeInTheDocument();
    });

    it('should render settings form with scriptname field', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const scriptnameInput = screen.getByLabelText(/scriptname/i) || screen.getByPlaceholderText(/scriptname/i);
      expect(scriptnameInput).toBeInTheDocument();
    });

    it('should render settings form with description field', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i) || screen.getByPlaceholderText(/description/i);
      expect(descriptionInput).toBeInTheDocument();
    });

    it('should update preview when author changes', async () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const authorInput = screen.getByLabelText(/author/i) || screen.getByPlaceholderText(/author/i);
      fireEvent.change(authorInput, { target: { value: 'CustomAuthor' } });

      await waitFor(() => {
        const pre = document.querySelector('pre');
        expect(pre?.textContent).toContain('author="CustomAuthor"');
      });
    });

    it('should update preview when scriptname changes', async () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const scriptnameInput = screen.getByLabelText(/scriptname/i) || screen.getByPlaceholderText(/scriptname/i);
      fireEvent.change(scriptnameInput, { target: { value: 'CUSTOM_SCRIPT' } });

      await waitFor(() => {
        const pre = document.querySelector('pre');
        expect(pre?.textContent).toContain('scriptname="CUSTOM_SCRIPT"');
      });
    });

    it('should update preview when description changes', async () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i) || screen.getByPlaceholderText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Custom description text' } });

      await waitFor(() => {
        const pre = document.querySelector('pre');
        expect(pre?.textContent).toContain('<description>Custom description text</description>');
      });
    });

    it('should have default scriptname based on MBO name', () => {
      render(
        <DbcPanel
          fmbModule={mockFmbModule}
          fields={mockFields}
          metadata={mockMetadata}
        />
      );

      const pre = document.querySelector('pre');
      expect(pre?.textContent).toContain('scriptname="ZZ_TEST_TABLE_SETUP"');
    });
  });
});
