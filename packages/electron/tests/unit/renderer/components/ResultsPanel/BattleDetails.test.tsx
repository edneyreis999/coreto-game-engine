/**
 * BattleDetails Component Tests
 *
 * Tests for the BattleDetails React component.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BattleDetails } from '@/components/ResultsPanel'
import type { ReportBattleResult } from '@/types/preload'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'chevron-down'} className={className} />
  ),
  ChevronUp: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'chevron-up'} className={className} />
  ),
  Trophy: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'trophy-icon'} className={className} />
  ),
  XCircle: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'x-circle-icon'} className={className} />
  ),
  Clock: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'clock-icon'} className={className} />
  ),
  Sword: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'sword-icon'} className={className} />
  ),
  Zap: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'zap-icon'} className={className} />
  ),
  Star: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'star-icon'} className={className} />
  ),
}))

const mockBattles: ReportBattleResult[] = [
  {
    troopId: 1,
    troopName: 'Slime',
    outcome: 'victory',
    ttkTurns: 5,
    ttkActions: 8,
    durationMs: 1500,
    seed: 12345,
    expGained: 10,
  },
  {
    troopId: 2,
    troopName: 'Goblin',
    outcome: 'defeat',
    ttkTurns: 12,
    ttkActions: 20,
    durationMs: 3000,
    seed: 12346,
    expGained: 0,
  },
  {
    troopId: 3,
    troopName: 'Dragon',
    outcome: 'timeout',
    ttkTurns: 100,
    ttkActions: 150,
    durationMs: 10000,
    seed: 12347,
    expGained: 0,
  },
]

describe('BattleDetails', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render "No battles recorded" when battles array is empty', () => {
      render(
        <BattleDetails
          battles={[]}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText('No battles recorded')).toBeInTheDocument()
    })

    it('should show battle count in header', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText(/Battle Details \(3\)/)).toBeInTheDocument()
    })

    it('should render chevron-down when collapsed', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument()
    })

    it('should render chevron-up when expanded', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByTestId('chevron-up')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument()
    })
  })

  describe('expand/collapse', () => {
    it('should call onToggle when header clicked', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      const header = screen.getByText(/Battle Details/)
      fireEvent.click(header)

      expect(mockOnToggle).toHaveBeenCalledTimes(1)
    })

    it('should hide battles when collapsed', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.queryByText('Slime')).not.toBeInTheDocument()
    })

    it('should show battles when expanded', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText('Slime')).toBeInTheDocument()
      expect(screen.getByText('Goblin')).toBeInTheDocument()
      expect(screen.getByText('Dragon')).toBeInTheDocument()
    })
  })

  describe('battle outcomes', () => {
    it('should display Victory badge for victory outcome', () => {
      render(
        <BattleDetails
          battles={[mockBattles[0]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText('Victory')).toBeInTheDocument()
    })

    it('should display Defeat badge for defeat outcome', () => {
      render(
        <BattleDetails
          battles={[mockBattles[1]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText('Defeat')).toBeInTheDocument()
    })

    it('should display Timeout badge for timeout outcome', () => {
      render(
        <BattleDetails
          battles={[mockBattles[2]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText('Timeout')).toBeInTheDocument()
    })

    it('should show EXP gained only for victories', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      // Slime (victory) should show EXP
      const expElements = screen.getAllByText(/EXP/)
      expect(expElements.length).toBeGreaterThan(0)
    })
  })

  describe('battle metrics', () => {
    it('should display TTK Turns', () => {
      render(
        <BattleDetails
          battles={[mockBattles[0]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      // Label and value are in separate spans, check for both
      expect(screen.getAllByText(/Turns/).length).toBeGreaterThan(0)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display TTK Actions', () => {
      render(
        <BattleDetails
          battles={[mockBattles[0]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getAllByText(/Actions/).length).toBeGreaterThan(0)
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('should display Duration', () => {
      render(
        <BattleDetails
          battles={[mockBattles[0]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getAllByText(/Duration/).length).toBeGreaterThan(0)
      expect(screen.getByText(/1\.50s/)).toBeInTheDocument()
    })

    it('should display Seed', () => {
      render(
        <BattleDetails
          battles={[mockBattles[0]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getAllByText(/Seed/).length).toBeGreaterThan(0)
      expect(screen.getByText('12345')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
          className="custom-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
