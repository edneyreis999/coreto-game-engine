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
  ChevronDown: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  ChevronUp: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Trophy: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  XCircle: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Clock: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Sword: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Zap: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Star: ({ className }: { className: string }) => (
    <svg className={className} />
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

    it('should render expand indicator when collapsed', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button', { name: /expand battle details/i })).toBeInTheDocument()
    })

    it('should render collapse indicator when expanded', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByRole('button', { name: /collapse battle details/i })).toBeInTheDocument()
    })
  })

  describe('expand/collapse', () => {
    it('should call onToggle when button clicked', () => {
      render(
        <BattleDetails
          battles={mockBattles}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      )

      // Button has aria-label that changes based on isExpanded state
      const toggleButton = screen.getByRole('button', { name: /expand battle details/i })
      fireEvent.click(toggleButton)

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
      expect(screen.getByText(/EXP/i)).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
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
      // EXP section only shows for victories with expGained > 0
      expect(screen.queryByText(/EXP/i)).not.toBeInTheDocument()
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
      // EXP section only shows for victories with expGained > 0
      expect(screen.queryByText(/EXP/i)).not.toBeInTheDocument()
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

      expect(screen.getByText(/turns/i)).toBeInTheDocument()
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

      expect(screen.getByText(/actions/i)).toBeInTheDocument()
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

      expect(screen.getByText(/duration/i)).toBeInTheDocument()
      expect(screen.getByText('1.50s')).toBeInTheDocument()
    })

    it('should display Seed', () => {
      render(
        <BattleDetails
          battles={[mockBattles[0]]}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      )

      expect(screen.getByText(/seed/i)).toBeInTheDocument()
      expect(screen.getByText('12345')).toBeInTheDocument()
    })
  })
})
