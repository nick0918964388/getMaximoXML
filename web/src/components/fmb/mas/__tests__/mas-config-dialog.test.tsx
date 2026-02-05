import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MasConfigDialog } from '../mas-config-dialog';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MasConfigDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfigSaved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('when dialog opens', () => {
    it('should load existing configuration', async () => {
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

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/mas/config');
      });

      // Check that fields are populated
      expect(screen.getByDisplayValue('https://api.ocp.example.com:6443')).toBeInTheDocument();
      expect(screen.getByDisplayValue('mas-inst1-manage')).toBeInTheDocument();
    });

    it('should show default values when no config exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '',
          },
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('mas-inst1-manage')).toBeInTheDocument();
      });
    });
  });

  describe('form validation', () => {
    it('should require OCP Cluster URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '',
          },
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/OCP Cluster URL/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await userEvent.click(saveButton);

      // Should show validation error for empty URL
      await waitFor(() => {
        expect(screen.getByText(/OCP Cluster URL is required/i)).toBeInTheDocument();
      });
    });

    it('should require token when not configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '',
          },
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Token/i)).toBeInTheDocument();
      });

      // Fill in URL but not token
      const urlInput = screen.getByLabelText(/OCP Cluster URL/i);
      await userEvent.clear(urlInput);
      await userEvent.type(urlInput, 'https://api.ocp.test.com:6443');

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await userEvent.click(saveButton);

      // Should show validation error - look for the specific error message
      await waitFor(() => {
        expect(screen.getByText(/Token is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should save configuration successfully', async () => {
      // First call for loading config
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '',
          },
        }),
      });

      // Second call for saving config
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Configuration saved successfully' },
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/OCP Cluster URL/i)).toBeInTheDocument();
      });

      // Fill in form
      const urlInput = screen.getByLabelText(/OCP Cluster URL/i);
      await userEvent.clear(urlInput);
      await userEvent.type(urlInput, 'https://api.ocp.test.com:6443');

      const tokenInput = screen.getByLabelText(/Token/i);
      await userEvent.type(tokenInput, 'test-token-abc123');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/mas/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test-token-abc123'),
        });
      });

      expect(defaultProps.onConfigSaved).toHaveBeenCalled();
    });

    it('should show error on save failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '',
          },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Failed to save configuration',
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/OCP Cluster URL/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText(/OCP Cluster URL/i);
      await userEvent.clear(urlInput);
      await userEvent.type(urlInput, 'https://api.ocp.test.com:6443');

      const tokenInput = screen.getByLabelText(/Token/i);
      await userEvent.type(tokenInput, 'test-token');

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save/i)).toBeInTheDocument();
      });
    });
  });

  describe('test connection', () => {
    it('should test connection and show success', async () => {
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
          success: true,
          data: {
            success: true,
            message: 'Connected successfully!',
            podName: 'mas-masw-manage-maxinst-abc123',
          },
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /測試連線/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /測試連線/i });
      await userEvent.click(testButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/mas/test-connection', {
          method: 'POST',
        });
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

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /測試連線/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /測試連線/i });
      await userEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Connection refused|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('dialog close', () => {
    it('should call onOpenChange when cancel is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ocpClusterUrl: '',
            namespace: 'mas-inst1-manage',
            podPrefix: 'mas-masw-manage-maxinst-',
            dbcTargetPath: '/opt/IBM/SMP/maximo/tools/maximo/dbc',
            encryptedToken: '',
          },
        }),
      });

      render(<MasConfigDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /取消/i });
      await userEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
