/**
 * LogExportButton Component Tests
 *
 * Tests for the LogExportButton React component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { LogExportButton } from '@/components/LogExportButton';
import {
  TEST_TIMEOUT_MS,
  MESSAGE_CHECK_DELAY_MS,
  MESSAGE_CLEARED_CHECK_DELAY_MS,
  SUCCESS_MESSAGE_AUTO_CLEAR_MS,
} from '@/tests/constants/test-timeouts';

// Mock window.coreto.logs.export and flushRendererLogs
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>;

describe('LogExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock flushRendererLogs to resolve immediately
    mockCoreto.logs.flushRendererLogs.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    // Run all pending timers to prevent memory leaks
    jest.runAllTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the button with default label', () => {
      render(<LogExportButton />);

      expect(screen.getByRole('button', { name: /Export Logs/i })).toBeInTheDocument();
    });

    it('should render the button with custom label', () => {
      render(<LogExportButton label="Download Logs" />);

      expect(screen.getByRole('button', { name: /Download Logs/i })).toBeInTheDocument();
    });

    it('should render with download icon', () => {
      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });
      // Button should contain the icon and label
      expect(button).not.toBeEmptyDOMElement();
    });

    it('should apply custom className', () => {
      render(<LogExportButton className="custom-class" />);

      const button = screen.getByRole('button', { name: /Export Logs/i });
      expect(button).toHaveClass('custom-class');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<LogExportButton disabled />);

      const button = screen.getByRole('button', { name: /Export Logs/i });
      expect(button).toBeDisabled();
    });

    it('should show loading state while exporting', async () => {
      // Mock a slow export
      mockCoreto.logs.export.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  downloadPath: '/path/to/logs.txt',
                  mainLogCount: 100,
                  rendererLogCount: 50,
                  totalCount: 150,
                },
              });
            }, TEST_TIMEOUT_MS);
          })
      );

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      // Click to start export
      await act(async () => {
        fireEvent.click(button);
      });

      // Should show loading state
      expect(screen.getByText(/Exporting\.\.\./i)).toBeInTheDocument();

      // Wait for export to complete
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Exporting\.\.\./i)).not.toBeInTheDocument();
      });
    });
  });

  describe('export functionality', () => {
    it('should call window.coreto.logs.export when clicked', async () => {
      mockCoreto.logs.export.mockResolvedValue({
        success: true,
        data: {
          downloadPath: '/path/to/logs.txt',
          mainLogCount: 100,
          rendererLogCount: 50,
          totalCount: 150,
        },
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockCoreto.logs.export).toHaveBeenCalledTimes(1);
    });

    it('should call onExportSuccess callback when export succeeds', async () => {
      const onExportSuccess = jest.fn();
      const downloadPath = '/path/to/logs.txt';

      mockCoreto.logs.export.mockResolvedValue({
        success: true,
        data: { downloadPath },
      });

      render(<LogExportButton onExportSuccess={onExportSuccess} />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(onExportSuccess).toHaveBeenCalledWith(downloadPath);
      });
    });

    it('should display success message with file path and counts', async () => {
      const downloadPath = '/path/to/logs.txt';

      mockCoreto.logs.export.mockResolvedValue({
        success: true,
        data: {
          downloadPath,
          mainLogCount: 100,
          rendererLogCount: 50,
          totalCount: 150,
        },
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/Logs exported to:/i)).toBeInTheDocument();
        expect(screen.getByText(/Main: 100/i)).toBeInTheDocument();
        expect(screen.getByText(/Renderer: 50/i)).toBeInTheDocument();
        expect(screen.getByText(/Total: 150/i)).toBeInTheDocument();
      });
    });

    it('should auto-clear success message after 5 seconds', async () => {
      const downloadPath = '/path/to/logs.txt';

      mockCoreto.logs.export.mockResolvedValue({
        success: true,
        data: {
          downloadPath,
          mainLogCount: 100,
          rendererLogCount: 50,
          totalCount: 150,
        },
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/Logs exported to:/i)).toBeInTheDocument();
      });

      // Fast-forward 4 seconds - message should still be there
      act(() => {
        jest.advanceTimersByTime(MESSAGE_CHECK_DELAY_MS);
      });

      expect(screen.getByText(/Logs exported to:/i)).toBeInTheDocument();

      // Fast-forward another 2 seconds (total 6 seconds) - message should be gone
      act(() => {
        jest.advanceTimersByTime(MESSAGE_CLEARED_CHECK_DELAY_MS);
      });

      expect(screen.queryByText(/Logs exported to:/i)).not.toBeInTheDocument();
    });

    it('should call onExportError callback when export fails', async () => {
      const onExportError = jest.fn();
      const errorMessage = 'Failed to write log file';

      mockCoreto.logs.export.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      render(<LogExportButton onExportError={onExportError} />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should display error message when export fails', async () => {
      const errorMessage = 'Failed to write log file';

      mockCoreto.logs.export.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Export Failed')).toBeInTheDocument();
      });
    });

    it('should handle unknown error when export fails without error message', async () => {
      const onExportError = jest.fn();

      mockCoreto.logs.export.mockResolvedValue({
        success: false,
      });

      render(<LogExportButton onExportError={onExportError} />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith('Unknown error occurred');
      });
    });

    it('should handle export promise rejection', async () => {
      const onExportError = jest.fn();
      const error = new Error('Network error');

      mockCoreto.logs.export.mockRejectedValue(error);

      render(<LogExportButton onExportError={onExportError} />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should handle non-Error rejection objects', async () => {
      const onExportError = jest.fn();

      mockCoreto.logs.export.mockRejectedValue('String error');

      render(<LogExportButton onExportError={onExportError} />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(onExportError).toHaveBeenCalledWith('Failed to export logs');
      });
    });
  });

  describe('state management', () => {
    it('should reset previous success/error state on new export', async () => {
      // First export - success
      mockCoreto.logs.export.mockResolvedValueOnce({
        success: true,
        data: {
          downloadPath: '/path/to/logs1.txt',
          mainLogCount: 100,
          rendererLogCount: 50,
          totalCount: 150,
        },
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/Logs exported to:/i)).toBeInTheDocument();
      });

      // Second export - error (mock now returns error)
      mockCoreto.logs.export.mockResolvedValueOnce({
        success: false,
        error: 'Second export failed',
      });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Second export failed')).toBeInTheDocument();
        // First success message should be gone
        expect(screen.queryByText(/logs1\.txt/i)).not.toBeInTheDocument();
      });
    });

    it('should disable button while exporting', async () => {
      let resolveExport: (value: any) => void;

      mockCoreto.logs.export.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExport = resolve;
          })
      );

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      // Button should be disabled while loading
      expect(button).toBeDisabled();

      // Resolve the export
      await act(async () => {
        resolveExport!({
          success: true,
          data: {
            downloadPath: '/path/to/logs.txt',
            mainLogCount: 100,
            rendererLogCount: 50,
            totalCount: 150,
          },
        });
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should remain disabled when disabled prop is true during loading', async () => {
      mockCoreto.logs.export.mockResolvedValue({
        success: true,
        data: {
          downloadPath: '/path/to/logs.txt',
          mainLogCount: 100,
          rendererLogCount: 50,
          totalCount: 150,
        },
      });

      render(<LogExportButton disabled />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      // Button should be disabled from the start
      expect(button).toBeDisabled();

      // Click should not trigger export
      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockCoreto.logs.export).not.toHaveBeenCalled();
    });
  });

  describe('dismissible messages', () => {
    it('should dismiss success message when dismiss button clicked', async () => {
      mockCoreto.logs.export.mockResolvedValue({
        success: true,
        data: {
          downloadPath: '/path/to/logs.txt',
          mainLogCount: 100,
          rendererLogCount: 50,
          totalCount: 150,
        },
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/Logs exported to:/i)).toBeInTheDocument();
      });

      // Find and click dismiss button
      const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
      expect(dismissButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(dismissButton);
      });

      expect(screen.queryByText(/Logs exported to:/i)).not.toBeInTheDocument();
    });

    it('should dismiss error message when dismiss button clicked', async () => {
      const errorMessage = 'Export failed';

      mockCoreto.logs.export.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Find and click dismiss button
      const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
      expect(dismissButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(dismissButton);
      });

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  describe('multiple exports', () => {
    it('should handle multiple sequential exports', async () => {
      mockCoreto.logs.export
        .mockResolvedValueOnce({
          success: true,
          data: {
            downloadPath: '/path/to/logs1.txt',
            mainLogCount: 100,
            rendererLogCount: 50,
            totalCount: 150,
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            downloadPath: '/path/to/logs2.txt',
            mainLogCount: 200,
            rendererLogCount: 75,
            totalCount: 275,
          },
        });

      render(<LogExportButton />);

      const button = screen.getByRole('button', { name: /Export Logs/i });

      // First export
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/logs1\.txt/i)).toBeInTheDocument();
      });

      // Clear first message
      act(() => {
        jest.advanceTimersByTime(SUCCESS_MESSAGE_AUTO_CLEAR_MS);
      });

      // Second export
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/logs2\.txt/i)).toBeInTheDocument();
      });

      expect(mockCoreto.logs.export).toHaveBeenCalledTimes(2);
    });
  });
});
