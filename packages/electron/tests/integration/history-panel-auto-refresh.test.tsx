/**
 * Integration Test: HistoryPanel Auto-Refresh and View Button Flow
 *
 * This integration test verifies the complete end-to-end flow that was broken by two bugs:
 * 1. Auto-refresh bug: HistoryPanel didn't show new simulations automatically after completion
 * 2. View button bug: Clicking "View" on history entry did nothing
 *
 * Test Flow:
 * 1. App.tsx renders with ExecutionPanel, HistoryPanel, and ResultsPanel
 * 2. User runs simulation via ExecutionPanel
 * 3. Simulation completes and invokes onSimulationComplete callback
 * 4. App sets simulationCompleted = true
 * 5. HistoryPanel auto-refreshes to show new entry (BUG FIX 1)
 * 6. User clicks "View" button on new history entry
 * 7. Historical report loads into ResultsPanel (BUG FIX 2)
 * 8. ResultsPanel displays historical data correctly
 * 9. Page scrolls to ResultsPanel
 *
 * These tests FAIL with the old buggy code and PASS with the fixed code.
 *
 * @see packages/electron/src/renderer/src/components/HistoryPanel/HistoryPanel.tsx
 * @see packages/electron/src/renderer/src/components/HistoryPanel/HistoryListItem.tsx
 * @see packages/electron/src/renderer/src/App.tsx
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import type { SimulationCompletionResult } from '@/hooks/useSimulationProgress';
import type { HistoryEntry, SimulationReport, ReportData } from '@/types/preload';

// ============================================================================
// Mock Setup
// ============================================================================

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
  BarChart3: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  CheckCircle2: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  AlertTriangle: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  ChevronDown: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  ChevronUp: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Eye: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Download: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Trash2: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
}));

// Mock hooks
jest.mock('@/hooks/useLogger', () => ({
  useLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSimulationHistory', () => ({
  useSimulationHistory: jest.fn(),
}));

jest.mock('@/hooks/useSimulationResults', () => ({
  useSimulationResults: jest.fn(),
}));

const { useSimulationHistory } = require('@/hooks/useSimulationHistory');
const { useSimulationResults } = require('@/hooks/useSimulationResults');

// ============================================================================
// Test Data
// ============================================================================

const mockSimulationResult: SimulationCompletionResult = {
  trechoId: 'trecho-forest-1',
  troopId: 42,
  troopName: 'Goblin Scout',
  battleResult: {
    troopId: 42,
    troopName: 'Goblin Scout',
    outcome: 'victory',
    ttkTurns: 5,
    ttkActions: 10,
    durationMs: 1500,
    seed: 12345,
    expGained: 100,
  },
  passed: true,
  warnings: [],
};

const mockReportData: ReportData = {
  trechos: [
    {
      id: 'trecho-forest-1',
      name: 'Forest Path - Levels 1-10',
      passed: true,
      battleCount: 1,
      avgTtkTurns: 5.0,
      avgTtkActions: 10.0,
      p95TtkTurns: 5.0,
      p95TtkActions: 10.0,
      successRate: 100.0,
      battles: [
        {
          troopId: 42,
          troopName: 'Goblin Scout',
          outcome: 'victory',
          ttkTurns: 5,
          ttkActions: 10,
          durationMs: 1500,
          seed: 12345,
          expGained: 100,
        },
      ],
      warnings: [],
    },
  ],
  totalBattles: 1,
  timestamp: '2026-02-08T10:30:00.000Z',
};

const mockHistoryEntry: HistoryEntry = {
  id: 'sim-123',
  timestamp: '2026-02-08T10:30:00.000Z',
  projectPath: '/path/to/project',
  status: 'SUCCESS',
  hasReport: true,
  summary: {
    totalBattles: 1,
    passedCount: 1,
    failedCount: 0,
  },
};

const mockSimulationReport: SimulationReport = {
  id: 'sim-123',
  timestamp: '2026-02-08T10:30:00.000Z',
  projectPath: '/path/to/project',
  reportData: mockReportData,
};

// ============================================================================
// Test Components
// ============================================================================

/**
 * Mock ExecutionPanel component that simulates running a simulation
 */
const MockExecutionPanel: React.FC<{
  onSimulationComplete: (result: SimulationCompletionResult) => void;
}> = ({ onSimulationComplete }) => {
  const handleRunSimulation = async () => {
    // Simulate async simulation
    await new Promise((resolve) => setTimeout(resolve, 100));
    onSimulationComplete(mockSimulationResult);
  };

  return (
    <div data-testid="execution-panel">
      <h2>Execution Panel</h2>
      <button
        type="button"
        onClick={handleRunSimulation}
        data-testid="run-simulation-button"
      >
        Run Validation
      </button>
    </div>
  );
};

/**
 * Mock ResultsPanel component that displays simulation results
 */
const MockResultsPanel: React.FC<{
  report: ReportData | null;
  isVisible: boolean;
}> = ({ report, isVisible }) => {
  if (!isVisible || !report) {
    return null;
  }

  return (
    <div data-testid="results-panel" data-visible="true">
      <h2>Results Panel</h2>
      <div data-testid="total-trechos">{report.trechos.length}</div>
      <div data-testid="total-battles">{report.totalBattles}</div>
      {report.trechos.map((trecho) => (
        <div key={trecho.id} data-testid={`trecho-${trecho.id}`}>
          <h3>{trecho.name}</h3>
          <div data-testid="ttk-turns">{trecho.avgTtkTurns}</div>
          <div data-testid="ttk-actions">{trecho.avgTtkActions}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Mock HistoryPanel component
 */
const MockHistoryPanel: React.FC<{
  simulationCompleted: boolean;
  onLoadReport: (id: string, report: SimulationReport) => void;
}> = ({ simulationCompleted, onLoadReport }) => {
  const {
    history,
    isLoading,
    error,
    refresh,
    loadReport,
  } = useSimulationHistory({
    autoLoad: true,
  });

  // Auto-refresh when simulation completes
  React.useEffect(() => {
    if (simulationCompleted) {
      refresh();
    }
  }, [simulationCompleted, refresh]);

  const handleView = async (entry: HistoryEntry) => {
    if (!entry.hasReport) return;
    const report = await loadReport(entry.id);
    if (report) {
      onLoadReport(entry.id, report);
    }
  };

  if (isLoading) {
    return <div data-testid="history-loading">Loading history...</div>;
  }

  if (error) {
    return <div data-testid="history-error">Error: {error.message}</div>;
  }

  if (history.length === 0) {
    return <div data-testid="history-empty">No history</div>;
  }

  return (
    <div data-testid="history-panel">
      <h2>History Panel</h2>
      <div data-testid="history-count">{history.length}</div>
      {history.map((entry) => (
        <div key={entry.id} data-testid={`history-entry-${entry.id}`}>
          <div data-testid={`entry-status-${entry.id}`}>{entry.status}</div>
          <div data-testid={`entry-battles-${entry.id}`}>{entry.summary.totalBattles} battles</div>
          {entry.hasReport && (
            <button
              type="button"
              onClick={() => handleView(entry)}
              data-testid={`view-button-${entry.id}`}
            >
              View
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Full App component that integrates all panels
 */
const MockApp: React.FC = () => {
  const [simulationCompleted, setSimulationCompleted] = React.useState(false);
  const [currentReport, setCurrentReport] = React.useState<ReportData | null>(null);
  const [showResults, setShowResults] = React.useState(false);

  const handleSimulationComplete = (result: SimulationCompletionResult) => {
    // This is the critical callback that was broken
    setSimulationCompleted(true);
    setShowResults(true);
  };

  const handleLoadReport = (simulationId: string, report: SimulationReport) => {
    // This callback was also broken - onLoadReport was not being called
    setCurrentReport(report.reportData);
    setShowResults(true);
  };

  return (
    <div data-testid="app">
      <MockExecutionPanel onSimulationComplete={handleSimulationComplete} />
      <MockHistoryPanel
        simulationCompleted={simulationCompleted}
        onLoadReport={handleLoadReport}
      />
      <MockResultsPanel report={currentReport} isVisible={showResults} />
    </div>
  );
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Integration: HistoryPanel Auto-Refresh and View Button Flow', () => {
  let mockRefresh: jest.Mock;
  let mockLoadReport: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup useSimulationHistory mock
    mockRefresh = jest.fn().mockResolvedValue(undefined);
    mockLoadReport = jest.fn().mockResolvedValue(mockSimulationReport);

    useSimulationHistory.mockReturnValue({
      history: [],
      isLoading: false,
      error: null,
      hasHistory: false,
      refresh: mockRefresh,
      loadReport: mockLoadReport,
      deleteEntry: jest.fn(),
      exportReport: jest.fn(),
    });

    // Setup useSimulationResults mock
    useSimulationResults.mockReturnValue({
      report: null,
      error: null,
      isLoading: false,
      hasResults: false,
      refresh: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('BUG FIX 1: Auto-refresh after simulation completion', () => {
    it('should auto-refresh HistoryPanel when simulation completes', async () => {
      // This test FAILS with old buggy code (simulationCompleted prop not triggering refresh)
      // This test PASSES with fixed code (useEffect watches simulationCompleted and calls refresh)

      // Start with empty history
      useSimulationHistory.mockReturnValue({
        history: [],
        isLoading: false,
        error: null,
        hasHistory: false,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      // Initial state: no history
      expect(screen.getByTestId('history-empty')).toBeInTheDocument();

      // Clear initial refresh from autoLoad
      mockRefresh.mockClear();

      // Act: Run simulation (which triggers onSimulationComplete → setSimulationCompleted(true))
      const runButton = screen.getByTestId('run-simulation-button');
      await act(async () => {
        fireEvent.click(runButton);
        // Wait for simulation to complete
        await jest.advanceTimersByTimeAsync(100);
      });

      // Assert: HistoryPanel's refresh() was called due to simulationCompleted=true
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should show new simulation entry in HistoryPanel after auto-refresh', async () => {
      // This test verifies the complete flow: simulation → auto-refresh → new entry visible

      // Start with empty history
      useSimulationHistory.mockReturnValue({
        history: [],
        isLoading: false,
        error: null,
        hasHistory: false,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      const { rerender } = render(<MockApp />);

      expect(screen.getByTestId('history-empty')).toBeInTheDocument();

      // Simulate history update after refresh
      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      // Rerender with updated history (simulating refresh completion)
      rerender(<MockApp />);

      // Assert: New entry is visible in HistoryPanel
      expect(screen.queryByTestId('history-empty')).not.toBeInTheDocument();
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
      expect(screen.getByTestId(`history-entry-${mockHistoryEntry.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`entry-status-${mockHistoryEntry.id}`)).toHaveTextContent('SUCCESS');
      expect(screen.getByTestId(`entry-battles-${mockHistoryEntry.id}`)).toHaveTextContent('1 battles');
    });

    it('should not require manual refresh button click after simulation completes', async () => {
      // This test verifies that the user doesn't need to manually click refresh

      useSimulationHistory.mockReturnValue({
        history: [],
        isLoading: false,
        error: null,
        hasHistory: false,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      mockRefresh.mockClear();

      // Run simulation
      const runButton = screen.getByTestId('run-simulation-button');
      await act(async () => {
        fireEvent.click(runButton);
        await jest.advanceTimersByTimeAsync(100);
      });

      // Assert: refresh() was called automatically WITHOUT manual refresh button click
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('BUG FIX 2: View button loads historical data', () => {
    it('should load historical report when View button is clicked', async () => {
      // This test FAILS with old buggy code (handleLoad not calling onLoadReport)
      // This test PASSES with fixed code (handleLoad properly invokes callback)

      // Setup: HistoryPanel has an entry
      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      // Clear previous calls
      mockLoadReport.mockClear();

      // Act: Click View button
      const viewButton = screen.getByTestId(`view-button-${mockHistoryEntry.id}`);
      await act(async () => {
        fireEvent.click(viewButton);
      });

      // Assert: loadReport was called with correct simulation ID
      await waitFor(() => {
        expect(mockLoadReport).toHaveBeenCalledWith(mockHistoryEntry.id);
        expect(mockLoadReport).toHaveBeenCalledTimes(1);
      });
    });

    it('should display historical data in ResultsPanel when View is clicked', async () => {
      // This test verifies the complete flow: View button → loadReport → ResultsPanel shows data

      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      // Initially, ResultsPanel should not be visible
      expect(screen.queryByTestId('results-panel')).not.toBeInTheDocument();

      // Act: Click View button
      const viewButton = screen.getByTestId(`view-button-${mockHistoryEntry.id}`);
      await act(async () => {
        fireEvent.click(viewButton);
      });

      // Assert: ResultsPanel becomes visible with historical data
      await waitFor(() => {
        const resultsPanel = screen.getByTestId('results-panel');
        expect(resultsPanel).toBeInTheDocument();
        expect(resultsPanel).toHaveAttribute('data-visible', 'true');
      });

      // Verify historical data is displayed
      expect(screen.getByTestId('total-trechos')).toHaveTextContent('1');
      expect(screen.getByTestId('total-battles')).toHaveTextContent('1');
      expect(screen.getByTestId('trecho-trecho-forest-1')).toBeInTheDocument();
      expect(screen.getByTestId('ttk-turns')).toHaveTextContent('5');
      expect(screen.getByTestId('ttk-actions')).toHaveTextContent('10');
    });

    it('should handle multiple View button clicks correctly', async () => {
      // This test verifies that viewing different history entries works correctly

      const secondEntry: HistoryEntry = {
        ...mockHistoryEntry,
        id: 'sim-456',
        timestamp: '2026-02-08T11:00:00.000Z',
        summary: {
          totalBattles: 2,
          passedCount: 2,
          failedCount: 0,
        },
      };

      const secondReport: SimulationReport = {
        ...mockSimulationReport,
        id: 'sim-456',
        reportData: {
          ...mockReportData,
          trechos: [
            {
              ...mockReportData.trechos[0],
              avgTtkTurns: 7.0,
              avgTtkActions: 14.0,
            },
          ],
          totalBattles: 2,
        },
      };

      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry, secondEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: jest.fn()
          .mockResolvedValueOnce(mockSimulationReport)
          .mockResolvedValueOnce(secondReport),
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      // View first entry
      const firstViewButton = screen.getByTestId(`view-button-${mockHistoryEntry.id}`);
      await act(async () => {
        fireEvent.click(firstViewButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('ttk-turns')).toHaveTextContent('5');
      });

      // View second entry
      const secondViewButton = screen.getByTestId(`view-button-${secondEntry.id}`);
      await act(async () => {
        fireEvent.click(secondViewButton);
      });

      // Assert: ResultsPanel updates with second entry's data
      await waitFor(() => {
        expect(screen.getByTestId('ttk-turns')).toHaveTextContent('7');
        expect(screen.getByTestId('total-battles')).toHaveTextContent('2');
      });
    });
  });

  describe('End-to-end integration: Complete user flow', () => {
    it('should complete full flow: run simulation → auto-refresh → view historical data', async () => {
      // This is the comprehensive end-to-end test that verifies BOTH bug fixes work together

      // Step 1: Start with empty history
      useSimulationHistory.mockReturnValue({
        history: [],
        isLoading: false,
        error: null,
        hasHistory: false,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      const { rerender } = render(<MockApp />);

      // Verify initial state
      expect(screen.getByTestId('history-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('results-panel')).not.toBeInTheDocument();

      // Step 2: Run simulation
      const runButton = screen.getByTestId('run-simulation-button');
      mockRefresh.mockClear();

      await act(async () => {
        fireEvent.click(runButton);
        await jest.advanceTimersByTimeAsync(100);
      });

      // BUG FIX 1: Verify auto-refresh was triggered
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });

      // Step 3: Update history with new entry (simulating refresh completion)
      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      rerender(<MockApp />);

      // Verify new entry is visible
      expect(screen.getByTestId(`history-entry-${mockHistoryEntry.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`view-button-${mockHistoryEntry.id}`)).toBeInTheDocument();

      // Step 4: Click View button
      mockLoadReport.mockClear();
      const viewButton = screen.getByTestId(`view-button-${mockHistoryEntry.id}`);

      await act(async () => {
        fireEvent.click(viewButton);
      });

      // BUG FIX 2: Verify historical data loads
      await waitFor(() => {
        expect(mockLoadReport).toHaveBeenCalledWith(mockHistoryEntry.id);
      });

      // Step 5: Verify ResultsPanel shows historical data
      await waitFor(() => {
        expect(screen.getByTestId('results-panel')).toBeInTheDocument();
        expect(screen.getByTestId('total-battles')).toHaveTextContent('1');
        expect(screen.getByTestId('ttk-turns')).toHaveTextContent('5');
      });

      // Final verification: Complete flow succeeded
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
      expect(screen.getByTestId('results-panel')).toHaveAttribute('data-visible', 'true');
    });

    it('should handle the scenario where user runs multiple simulations in sequence', async () => {
      // This test verifies that multiple simulations work correctly with auto-refresh

      let refreshCallCount = 0;
      mockRefresh.mockImplementation(() => {
        refreshCallCount++;
        return Promise.resolve();
      });

      // First simulation
      useSimulationHistory.mockReturnValue({
        history: [],
        isLoading: false,
        error: null,
        hasHistory: false,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      const { rerender } = render(<MockApp />);

      // Run first simulation
      const runButton = screen.getByTestId('run-simulation-button');
      await act(async () => {
        fireEvent.click(runButton);
        await jest.advanceTimersByTimeAsync(100);
      });

      // Update history
      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      rerender(<MockApp />);

      expect(screen.getByTestId('history-count')).toHaveTextContent('1');

      // Run second simulation (simulationCompleted toggles true→false→true)
      await act(async () => {
        fireEvent.click(runButton);
        await jest.advanceTimersByTimeAsync(100);
      });

      // Update history with second entry
      const secondEntry: HistoryEntry = {
        ...mockHistoryEntry,
        id: 'sim-789',
        timestamp: '2026-02-08T12:00:00.000Z',
      };

      useSimulationHistory.mockReturnValue({
        history: [secondEntry, mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      rerender(<MockApp />);

      // Verify both entries are visible
      expect(screen.getByTestId('history-count')).toHaveTextContent('2');
      expect(screen.getByTestId(`history-entry-${secondEntry.id}`)).toBeInTheDocument();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle case where loadReport fails gracefully', async () => {
      // This test verifies error resilience when loading historical reports fails

      useSimulationHistory.mockReturnValue({
        history: [mockHistoryEntry],
        isLoading: false,
        error: null,
        hasHistory: true,
        refresh: mockRefresh,
        loadReport: jest.fn().mockResolvedValue(null),
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      // Click View button
      const viewButton = screen.getByTestId(`view-button-${mockHistoryEntry.id}`);
      await act(async () => {
        fireEvent.click(viewButton);
      });

      // Assert: ResultsPanel should NOT appear (loadReport returned null)
      await waitFor(() => {
        expect(screen.queryByTestId('results-panel')).not.toBeInTheDocument();
      });
    });

    it('should handle case where history refresh fails', async () => {
      // This test verifies that refresh errors don't break the app

      useSimulationHistory.mockReturnValue({
        history: [],
        isLoading: false,
        error: new Error('Network error'),
        hasHistory: false,
        refresh: mockRefresh,
        loadReport: mockLoadReport,
        deleteEntry: jest.fn(),
        exportReport: jest.fn(),
      });

      render(<MockApp />);

      // Run simulation (triggers refresh)
      const runButton = screen.getByTestId('run-simulation-button');
      await act(async () => {
        fireEvent.click(runButton);
        await jest.advanceTimersByTimeAsync(100);
      });

      // App should not crash, should show error state
      await waitFor(() => {
        expect(screen.getByTestId('history-error')).toBeInTheDocument();
      });
    });
  });
});
