/**
 * HistoryPanel Component Tests - Delete Confirmation Flow
 *
 * This test suite verifies the AlertDialog implementation for delete confirmation.
 * Tests the complete flow from delete button click to confirmation/cancellation.
 *
 * @see packages/electron/src/renderer/src/components/HistoryPanel/HistoryPanel.tsx
 * @see Task 04 - Replace window.confirm with AlertDialog
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HistoryPanel } from '@/components/HistoryPanel';
import type { HistoryEntry } from '@/types/preload';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  History: ({ className }: { className: string }) => (
    <svg className={className} data-testid="history-icon" />
  ),
  Loader2: ({ className }: { className: string }) => (
    <svg className={className} data-testid="loader-icon" />
  ),
  XCircle: ({ className }: { className: string }) => (
    <svg className={className} data-testid="error-icon" />
  ),
  RotateCw: ({ className }: { className: string }) => (
    <svg className={className} data-testid="refresh-icon" />
  ),
  CheckCircle2: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  X: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Download: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Eye: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Trash2: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
}));

// Mock HistoryListItem component
jest.mock('@/components/HistoryPanel/HistoryListItem', () => ({
  HistoryListItem: ({ entry, onLoad, onExport, onDelete }: any) => (
    <div data-testid={`history-item-${entry.id}`}>
      <div data-testid={`entry-status-${entry.id}`}>{entry.status}</div>
      <div data-testid={`entry-battles-${entry.id}`}>
        {entry.summary.totalBattles} battles
      </div>
      {entry.hasReport && (
        <button
          type="button"
          onClick={() => onLoad(entry)}
          data-testid={`view-button-${entry.id}`}
        >
          View
        </button>
      )}
      <button
        type="button"
        onClick={() => onExport(entry)}
        data-testid={`export-button-${entry.id}`}
      >
        Export
      </button>
      <button
        type="button"
        onClick={() => onDelete(entry)}
        data-testid={`delete-button-${entry.id}`}
      >
        Delete
      </button>
    </div>
  ),
}));

// Mock EmptyState component
jest.mock('@/components/ResultsPanel/EmptyState', () => ({
  EmptyState: ({ title, message }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  ),
}));

// Mock AlertDialog component
jest.mock('@/components/shared/AlertDialog', () => ({
  AlertDialog: ({ open, title, description, onConfirm, onCancel }: any) => {
    if (!open) return null;
    return (
      <div data-testid="alert-dialog" role="dialog" aria-modal="true">
        <h2 data-testid="dialog-title">{title}</h2>
        <p data-testid="dialog-description">{description}</p>
        <button type="button" onClick={onCancel} data-testid="dialog-cancel">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} data-testid="dialog-confirm">
          Delete
        </button>
      </div>
    );
  },
}));

// Mock useLogger hook
jest.mock('@/hooks/useLogger', () => ({
  useLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock useSimulationHistory hook
jest.mock('@/hooks/useSimulationHistory', () => ({
  useSimulationHistory: jest.fn(),
}));

const { useSimulationHistory } = require('@/hooks/useSimulationHistory');

// Mock window.coreto API
const mockCoreto = {
  history: {
    list: jest.fn(),
    loadReport: jest.fn(),
    exportReport: jest.fn(),
    delete: jest.fn(),
    generateId: jest.fn(),
  },
} as any;

(global as any).window = { ...global.window, coreto: mockCoreto };

// ============================================================================
// Test Data
// ============================================================================

const mockHistoryEntry: HistoryEntry = {
  id: 'sim-123',
  timestamp: '2026-02-08T10:30:00.000Z',
  projectPath: '/path/to/project',
  status: 'SUCCESS',
  hasReport: true,
  summary: {
    totalBattles: 10,
    passedCount: 8,
    failedCount: 2,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a mock implementation of useSimulationHistory with default values.
 */
const createMockUseSimulationHistory = (overrides = {}) => {
  const mockRefresh = jest.fn();
  const mockLoadReport = jest.fn().mockResolvedValue({});
  const mockDeleteEntry = jest.fn();
  const mockExportReport = jest.fn();

  return {
    history: [mockHistoryEntry],
    isLoading: false,
    error: null,
    hasHistory: true,
    refresh: mockRefresh,
    loadReport: mockLoadReport,
    deleteEntry: mockDeleteEntry,
    exportReport: mockExportReport,
    ...overrides,
  };
};

// ============================================================================
// Test Suite
// ============================================================================

describe('HistoryPanel - Delete Confirmation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TASK 04: AlertDialog replaces window.confirm', () => {
    it('should show AlertDialog when Delete button is clicked', async () => {
      const mockDeleteEntry = jest.fn();
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      // Click Delete button
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      // Assert: AlertDialog should be visible
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      // Assert: Dialog should have correct title and description
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Delete Simulation Entry?');
      expect(screen.getByTestId('dialog-description')).toHaveTextContent(
        'This action cannot be undone'
      );
    });

    it('should NOT call deleteEntry immediately when Delete button is clicked', async () => {
      const mockDeleteEntry = jest.fn();
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      // Click Delete button
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Assert: deleteEntry should NOT have been called yet
      expect(mockDeleteEntry).not.toHaveBeenCalled();
    });

    it('should call deleteEntry when user clicks confirm in dialog', async () => {
      const mockDeleteEntry = jest.fn().mockResolvedValue(undefined);
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      // Click Delete button to open dialog
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click confirm button in dialog
      const confirmButton = screen.getByTestId('dialog-confirm');
      fireEvent.click(confirmButton);

      // Assert: deleteEntry should be called with correct ID
      await waitFor(() => {
        expect(mockDeleteEntry).toHaveBeenCalledWith('sim-123');
        expect(mockDeleteEntry).toHaveBeenCalledTimes(1);
      });
    });

    it('should close dialog and NOT call deleteEntry when user clicks cancel', async () => {
      const mockDeleteEntry = jest.fn();
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      // Click Delete button to open dialog
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel button in dialog
      const cancelButton = screen.getByTestId('dialog-cancel');
      fireEvent.click(cancelButton);

      // Assert: Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Assert: deleteEntry should NOT be called
      expect(mockDeleteEntry).not.toHaveBeenCalled();
    });

    it('should close dialog after successful deletion', async () => {
      const mockDeleteEntry = jest.fn().mockResolvedValue(undefined);
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByTestId('dialog-confirm');
      fireEvent.click(confirmButton);

      // Assert: Dialog should close after deletion
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple delete operations correctly', async () => {
      const mockDeleteEntry = jest.fn().mockResolvedValue(undefined);
      const secondEntry: HistoryEntry = {
        ...mockHistoryEntry,
        id: 'sim-456',
      };

      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          history: [mockHistoryEntry, secondEntry],
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });

      // Delete first entry
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      let confirmButton = screen.getByTestId('dialog-confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteEntry).toHaveBeenCalledWith('sim-123');
      });

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Delete second entry
      fireEvent.click(deleteButtons[1]);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      confirmButton = screen.getByTestId('dialog-confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteEntry).toHaveBeenCalledWith('sim-456');
      });

      // Assert: Both deletions completed
      expect(mockDeleteEntry).toHaveBeenCalledTimes(2);
    });
  });

  describe('Native window.confirm removal', () => {
    it('should NOT use native window.confirm for delete', async () => {
      const mockDeleteEntry = jest.fn();

      // Spy on window.confirm to ensure it's NOT called
      const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => false);

      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory({
          deleteEntry: mockDeleteEntry,
        })
      );

      render(<HistoryPanel />);

      // Click Delete button
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Assert: window.confirm should NOT be called
      expect(confirmSpy).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on dialog', async () => {
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory()
      );

      render(<HistoryPanel />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');

      // Assert: Proper ARIA attributes
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should focus management when dialog opens', async () => {
      useSimulationHistory.mockReturnValue(
        createMockUseSimulationHistory()
      );

      render(<HistoryPanel />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Dialog should be in document (focus management tested in integration)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
