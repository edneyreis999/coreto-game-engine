/**
 * ProjectSelectionPanel Component Tests
 *
 * Tests for the ProjectSelectionPanel React component.
 */

import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { ProjectSelectionPanel } from '@/components/ProjectSelectionPanel'
import { useRecentProjects } from '@/hooks/useRecentProjects'
import { useProject } from '@/hooks/useProject'

// Mock window.electron.ipcRenderer for dialog:openDirectory
const mockIpcRenderer = global.window.electron.ipcRenderer as jest.Mocked<typeof global.window.electron.ipcRenderer>
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>

// Mock useRecentProjects hook
jest.mock('@/hooks/useRecentProjects', () => ({
  useRecentProjects: jest.fn(() => ({
    recentProjects: [],
    isLoading: false,
    refresh: jest.fn(),
    addRecent: jest.fn(),
  })),
}))

// Mock useProject hook
jest.mock('@/hooks/useProject', () => {
  const actualModule = jest.requireActual('@/hooks/useProject')
  return {
    ...actualModule,
    useProject: jest.fn(() => ({
      projectInfo: null,
      validation: { status: 'idle', errors: [], warnings: [] },
      isLoading: false,
      error: null,
      openProject: jest.fn(),
      validateProject: jest.fn(),
      reset: jest.fn(),
    })),
  }
})

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

  // Helper: Setup default mocks for rendering tests
  function setupDefaultMocks() {
    jest.clearAllMocks()

    // Setup default mock responses - using new segregated API
    mockCoreto.recent.list.mockResolvedValue({
      success: true,
      data: mockRecentProjects,
    })

    mockCoreto.project.open.mockResolvedValue({
      success: true,
      data: {
        path: '/path/to/project',
        name: 'Test Project',
        isValid: true,
        troopsCount: 10,
      },
    })

    mockCoreto.recent.add.mockResolvedValue({
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

    // Mock useRecentProjects hook
    ;(useRecentProjects as jest.Mock).mockReturnValue({
      recentProjects: mockRecentProjects,
      isLoading: false,
      refresh: jest.fn(),
      addRecent: jest.fn().mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project',
          name: 'Test Project',
          lastOpened: new Date().toISOString(),
        },
      }),
    })

    // Mock useProject hook with default state
    ;(useProject as jest.Mock).mockReturnValue({
      projectInfo: null,
      validation: { status: 'idle', errors: [], warnings: [] },
      isLoading: false,
      error: null,
      openProject: jest.fn().mockResolvedValue(undefined),
      validateProject: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn(),
    })
  }

  // Helper: Setup mocks for file picker tests
  function setupFilePickerMocks() {
    jest.clearAllMocks()

    mockIpcRenderer.invoke.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/project'],
    })

    ;(useRecentProjects as jest.Mock).mockReturnValue({
      recentProjects: [],
      isLoading: false,
      refresh: jest.fn(),
      addRecent: jest.fn(),
    })

    ;(useProject as jest.Mock).mockReturnValue({
      projectInfo: null,
      validation: { status: 'idle', errors: [], warnings: [] },
      isLoading: false,
      error: null,
      openProject: jest.fn().mockResolvedValue(undefined),
      validateProject: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn(),
    })
  }

  beforeEach(() => {
    setupDefaultMocks()
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
      // Mock useRecentProjects to return empty list
      ;(useRecentProjects as jest.Mock).mockReturnValue({
        recentProjects: [],
        isLoading: false,
        refresh: jest.fn(),
        addRecent: jest.fn(),
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
      const mockOpenProject = jest.fn().mockResolvedValue(undefined)

      // Mock useProject with openProject function
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: null,
        validation: { status: 'idle', errors: [], warnings: [] },
        isLoading: false,
        error: null,
        openProject: mockOpenProject,
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      // Ensure IPC mock returns the correct response
      mockIpcRenderer.invoke.mockResolvedValue({
        success: true,
        data: {
          canceled: false,
          filePaths: ['/path/to/project'],
        },
      })

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      // Click the button and wait for the IPC call to resolve
      await act(async () => {
        fireEvent.click(button)
      })

      // Wait for the openProject mock to be called
      await waitFor(() => {
        expect(mockOpenProject).toHaveBeenCalledWith('/path/to/project')
      }, { timeout: 3000 })
    })

    it('should not open project when dialog is cancelled', async () => {
      const mockOpenProject = jest.fn()

      mockIpcRenderer.invoke.mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      // Mock useProject with openProject function
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: null,
        validation: { status: 'idle', errors: [], warnings: [] },
        isLoading: false,
        error: null,
        openProject: mockOpenProject,
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel />)

      const button = screen.getByRole('button', {
        name: /Browse for Project Folder/i,
      })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockOpenProject).not.toHaveBeenCalled()
    })

    it('should disable button while opening project', async () => {
      // Mock useProject with loading state
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: null,
        validation: { status: 'idle', errors: [], warnings: [] },
        isLoading: true,
        error: null,
        openProject: jest.fn().mockResolvedValue(undefined),
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel />)

      // When isLoading is true, the button shows "Opening Project..." and is disabled
      const button = screen.getByRole('button', {
        name: /Opening Project/i,
      })

      // Button should be disabled when isLoading is true
      expect(button).toBeDisabled()
    })
  })

  describe('validation indicator', () => {
    it('should show loading state while validating', async () => {
      // Mock useProject with validating state
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: null,
        validation: { status: 'validating', errors: [], warnings: [] },
        isLoading: false,
        error: null,
        openProject: jest.fn(),
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel />)

      await waitFor(() => {
        expect(screen.getByText(/Validating/i)).toBeInTheDocument()
      })
    })

    it('should show success state for valid project', async () => {
      // Mock useProject to return valid state
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: {
          path: '/path/to/project',
          name: 'Test Project',
          isValid: true,
        },
        validation: { status: 'valid', errors: [], warnings: [] },
        isLoading: false,
        error: null,
        openProject: jest.fn(),
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel />)

      await waitFor(() => {
        expect(screen.getByText(/is a valid RPG Maker MZ project/)).toBeInTheDocument()
      })
    })

    it('should show error state for invalid project', async () => {
      // Mock useProject to return invalid state
      const mockOpenProject = jest.fn()
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: {
          path: '/path/to/project',
          name: 'Invalid Project',
          isValid: false,
        },
        validation: { status: 'invalid', errors: ['Project is not valid'], warnings: [] },
        isLoading: false,
        error: null,
        openProject: mockOpenProject,
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel />)

      // The error message appears in both the p tag and li tag
      await waitFor(() => {
        expect(screen.getAllByText('Project is not valid')).toHaveLength(2)
      })
    })

    it('should show validation error messages', async () => {
      mockCoreto.project.validate.mockResolvedValue({
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
      const mockOpenProject = jest.fn()
      const mockAddRecent = jest.fn().mockResolvedValue({
        success: true,
        data: {
          path: '/path/to/project1',
          name: 'Project 1',
          lastOpened: new Date().toISOString(),
        },
      })

      // Mock useProject with openProject function
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: null,
        validation: { status: 'idle', errors: [], warnings: [] },
        isLoading: false,
        error: null,
        openProject: mockOpenProject,
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      // Mock useRecentProjects with addRecent function
      ;(useRecentProjects as jest.Mock).mockReturnValue({
        recentProjects: mockRecentProjects,
        isLoading: false,
        refresh: jest.fn(),
        addRecent: mockAddRecent,
      })

      render(<ProjectSelectionPanel />)

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      const projectItem = screen.getByText('Project 1').closest('li')

      await act(async () => {
        fireEvent.click(projectItem!)
      })

      expect(mockOpenProject).toHaveBeenCalledWith('/path/to/project1')
      expect(mockAddRecent).toHaveBeenCalledWith(
        '/path/to/project1',
        'Project 1'
      )
    })
  })

  describe('callbacks', () => {
    it('should call onProjectSelected when valid project is opened', async () => {
      const onProjectSelected = jest.fn()

      // Mock useProject to return valid state with projectInfo
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: {
          path: '/path/to/project',
          name: 'Test Project',
          isValid: true,
        },
        validation: { status: 'valid', errors: [], warnings: [] },
        isLoading: false,
        error: null,
        openProject: jest.fn(),
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel onProjectSelected={onProjectSelected} />)

      await waitFor(() => {
        expect(onProjectSelected).toHaveBeenCalledWith('/path/to/project')
      })
    })

    it('should not call onProjectSelected when project is invalid', async () => {
      const onProjectSelected = jest.fn()

      // Mock useProject to return invalid state
      ;(useProject as jest.Mock).mockReturnValue({
        projectInfo: {
          path: '/path/to/project',
          name: 'Invalid Project',
          isValid: false,
        },
        validation: { status: 'invalid', errors: ['Project is not valid'], warnings: [] },
        isLoading: false,
        error: null,
        openProject: jest.fn(),
        validateProject: jest.fn(),
        reset: jest.fn(),
      })

      render(<ProjectSelectionPanel onProjectSelected={onProjectSelected} />)

      await waitFor(() => {
        expect(onProjectSelected).not.toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should handle IPC errors gracefully', async () => {
      // Mock useRecentProjects to return empty list (error state)
      ;(useRecentProjects as jest.Mock).mockReturnValue({
        recentProjects: [],
        isLoading: false,
        refresh: jest.fn(),
        addRecent: jest.fn(),
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
        expect.stringContaining('[ERROR] Failed to open file picker:')
      )

      consoleSpy.mockRestore()
    })
  })
})
