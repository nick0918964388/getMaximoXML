import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MasImportSection } from '../mas-import-section';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MasImportSection', () => {
  const defaultProps = {
    dbcContent: '<dbc>test content</dbc>',
    dbcFilename: 'ZZ_TEST_dbc.dbc',
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('when no configuration exists', () => {
    it('should show configuration prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: '',
            encryptedToken: '',
          },
        }),
      });

      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/尚未配置/i)).toBeInTheDocument();
      });
    });
  });

  describe('when configuration exists', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: 'https://api.ocp.example.com:6443',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '***configured***',
          },
        }),
      });
    });

    it('should display OCP cluster URL', async () => {
      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/api.ocp.example.com/i)).toBeInTheDocument();
      });
    });

    it('should show import and test buttons', async () => {
      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /測試連線/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /匯入/i })).toBeInTheDocument();
      });
    });

    it('should show settings button', async () => {
      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /設定/i })).toBeInTheDocument();
      });
    });

    it('should disable import button when disabled prop is true', async () => {
      render(<MasImportSection {...defaultProps} disabled={true} />);

      await waitFor(() => {
        const importButton = screen.getByRole('button', { name: /匯入/i });
        expect(importButton).toBeDisabled();
      });
    });
  });

  describe('test connection', () => {
    it('should test connection and show success', async () => {
      // Initial config load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: 'https://api.ocp.example.com:6443',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '***configured***',
          },
        }),
      });

      // Test connection response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            success: true,
            message: 'Connected successfully!',
            podName: 'mas-masw-manage-maxinst-abc123',
          },
        }),
      });

      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /測試連線/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /測試連線/i });
      await userEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/連線成功|Connected/i)).toBeInTheDocument();
      });
    });

    it('should show error on connection failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: 'https://api.ocp.example.com:6443',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '***configured***',
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Connection refused',
        }),
      });

      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /測試連線/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /測試連線/i });
      await userEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Connection refused|失敗/i)).toBeInTheDocument();
      });
    });
  });

  describe('import', () => {
    it('should start import when button clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: 'https://api.ocp.example.com:6443',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '***configured***',
          },
        }),
      });

      // Mock SSE response
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"status","data":{"status":"connecting","message":"Connecting..."}}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"complete","data":{"status":"completed","message":"Done!"}}\n\n'),
          })
          .mockResolvedValueOnce({ done: true }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /匯入/i })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: /匯入/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/mas/import', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('ZZ_TEST_dbc.dbc'),
        }));
      });
    });
  });

  describe('warning message', () => {
    it('should show warning about runscriptfile.sh execution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: 'https://api.ocp.example.com:6443',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '***configured***',
          },
        }),
      });

      render(<MasImportSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/runscriptfile.sh/i)).toBeInTheDocument();
      });
    });
  });
});
