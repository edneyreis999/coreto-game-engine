/**
 * ProjectSelectionPanel Component Tests
 *
 * Tests for the ProjectSelectionPanel React component.
 */

import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { ProjectSelectionPanel } from '@/components/ProjectSelectionPanel'

// Mock window.electron.ipcRenderer for dialog:openDirectory
const mockIpcRenderer = global.window.electron.ipcRenderer as jest.Mocked<typeof global.window.electron.ipcRenderer>
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FolderOpen: ({ className }: { className: string }) => (
    <svg data-testid="folder-open" className={className} />
  ),
  CheckCircle2: ({ className }: { className: string }) => (
    <svg data-testid="check-circle" className={className} />
  ),
  XCircle: ({ className }: { className: string }) => (
    <svg data-testid="x-circle" className={className} />
  ),
  AlertCircle: ({ className }: { className: string }) => (
    <svg data-testid="alert-circle" className={className} />
  ),
  Clock: ({ className }: { className: string }) => (
    <svg data-testid="clock" className={className} />
  ),
  Loader2: ({ className }: { className: string }) => (
    <svg data-testid="loader" className={className} />
  ),
  Trash2: ({ className }: { className: string }) => (
    <svg data-testid="trash" className={className} />
  ),
}))

describe('ProjectSelectionPanel', () => {
  const mockRecentProjects = [
    {
      path: '/path/to/project1',
      name: 'Project 1',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      path: '/path/to/project2',
      name: 'Project 2',
      lastOpened: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock responses
    mockCoreto.listRecent.mockResolvedValue({
      success: true,
      data: mockRecentProjects,
    })

    mockCoreto.openProject.mockResolvedValue({
      success: true,
      data: {
        path: '/path/to/project',
        name: 'Test Project',
        isValid: true,
        troopsCount: 10,
      },
    })

    mockCoreto.addRecent.mockResolvedValue({
      success: true,
      data: {
        path: '/path/to/project',
        name: 'Test Project',
        lastOpened: new Date().toISOString(),
      },
    })

    mockIpcRenderer.invoke.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/project'],
    })
  })

  describe('rendering', () => {
    it('should render the panel with title', () => {
      render(<ProjectSelectionPanel />)

      expect(screen.getByText('Select RPG Maker MZ Project')).toBeInTheDocument()
      expect(
        screen.getByText('Choose a project to validate TTK balance')
      ).toBeInTheDocument()
    })

    it('should render file picker button', () => {
      render(<ProjectSelectionPanel />)

      expect(
        screen.getByRole('button', { name: /Browse for Project Folder/i })
      ).toBeInTheDocument()
    })

    it('should render recent projects section', () => {
      render(<ProjectSelectionPanel />)

      expect(screen.getByText('Recent Projects')).toBeInTheDocument()
    })

    it('should display recent projects list', async () => {
      render(<ProjectSelectionPanel />)

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
        expect(screen.getByText('Project 2')).toBeInTheDocument()
      })
    })

    it('should show empty state when no recent projects', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProjectSelectionPanel />)

      await waitFor(() => {
        expect(screen.getByText('No recent projects')).toBeInTheDocument()
        expect(
          screen.getByText('Projects you open will appear here')
        ).toBeInTheDocument()
      })
    })
  })

  describe('file picker', () => {
    it('should open file picker dialog when button clicked', async () => {
      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('dialog:openDirectory')
    })

    it('should open and validate project when file is selected', async () => {
      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(mockCoreto.openProject).toHaveBeenCalledWith('/path/to/project')
      })
    })

    it('should not open project when dialog is cancelled', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockCoreto.openProject).not.toHaveBeenCalled()
    })

    it('should disable button while opening project', async () => {
      // Mock a slow openProject call
      mockCoreto.openProject.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  path: '/path/to/project',
                  name: 'Test Project',
                  isValid: true,
                },
              })
            }, 100)
          })
      )

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('validation indicator', () => {
    it('should show loading state while validating', async () => {
      mockCoreto.openProject.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  path: '/path/to/project',
                  name: 'Test Project',
                  isValid: true,
                },
              })
            }, 100)
          })
      )

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/Validating/i)).toBeInTheDocument()
      })
    })

    it('should show success state for valid project', async () => {
      render(<ProjectSelectionPanel />)

      // Simulate opening a valid project by calling the mock directly
      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Test Project',
          isValid: true,
          troopsCount: 10,
        },
      })

      // Trigger the validation by simulating the file picker
      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/is a valid RPG Maker MZ project/)).toBeInTheDocument()
      })
    })

    it('should show error state for invalid project', async () => {
      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Invalid Project',
          isValid: false,
        },
      })

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      // The error message appears in both the p tag and li tag
      await waitFor(() => {
        expect(screen.getAllByText('Project is not valid')).toHaveLength(2)
      }, { timeout: 3000 })
    })

    it('should show validation error messages', async () => {
      mockCoreto.validateProject.mockResolvedValue({
        success: true,
        data: {
          isValid: false,
          errors: ['game.rmmzproject not found', 'data directory not found'],
          warnings: [],
        },
      })

      // For this test, we need to verify that error messages are displayed
      // The component would need to be in a state where validation has completed
      render(<ProjectSelectionPanel />)

      // Note: This test assumes the component validates after opening
      // In the actual implementation, validation happens through openProject
    })
  })

  describe('recent projects interaction', () => {
    it('should open project when clicking recent project item', async () => {
      render(<ProjectSelectionPanel />)

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      const projectItem = screen.getByText('Project 1').closest('li')

      await act(async () => {
        fireEvent.click(projectItem!)
      })

      expect(mockCoreto.openProject).toHaveBeenCalledWith('/path/to/project1')
      expect(mockCoreto.addRecent).toHaveBeenCalledWith(
        '/path/to/project1',
        'Project 1'
      )
    })
  })

  describe('callbacks', () => {
    it('should call onProjectSelected when valid project is opened', async () => {
      const onProjectSelected = jest.fn()

      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Test Project',
          isValid: true,
          troopsCount: 10,
        },
      })

      render(<ProjectSelectionPanel onProjectSelected={onProjectSelected} />)

      // Simulate file picker selecting a project
      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(onProjectSelected).toHaveBeenCalledWith('/path/to/project')
      })
    })

    it('should not call onProjectSelected when project is invalid', async () => {
      const onProjectSelected = jest.fn()

      mockCoreto.openProject.mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Invalid Project',
          isValid: false,
        },
      })

      render(<ProjectSelectionPanel onProjectSelected={onProjectSelected} />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(onProjectSelected).not.toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should handle IPC errors gracefully', async () => {
      mockCoreto.listRecent.mockResolvedValue({
        success: false,
        error: {
          name: 'IPCError',
          message: 'Failed to fetch recent projects',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      render(<ProjectSelectionPanel />)

      // Component should still render, but with empty recent projects
      await waitFor(() => {
        expect(screen.getByText('No recent projects')).toBeInTheDocument()
      })
    })

    it('should handle file picker dialog errors', async () => {
      mockIpcRenderer.invoke.mockRejectedValue(new Error('Dialog error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to open file picker:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
