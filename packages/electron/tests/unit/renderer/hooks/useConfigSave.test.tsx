/**
 * Unit tests for useConfigSave hook
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useConfigSave } from '@/hooks/useConfigSave'
import type { ProjectConfigFormData } from '@/components/ConfigurationPanel'
import type { Logger } from '@/hooks/useLogger'
import type { SimulationConfigData } from '@coreto/electron/domain/services'

// Mock window.coreto.config.save
const mockConfigSave = jest.fn()
global.window.coreto = {
  config: {
    save: mockConfigSave,
  },
} as any

// Mock logger
const mockLogger: Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}

describe('useConfigSave', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveConfig', () => {
    it('should successfully save config and return simulation config', async () => {
      const config: ProjectConfigFormData = {
        projectPath: '/path/to/project',
        trechos: [
          {
            id: 'trecho1',
            name: 'Trecho 1',
            anchorLevelMin: 1,
            anchorLevelMax: 10,
            targetTtkTurns: 5,
            targetTtkActions: 10,
            tolerancePercent: 20,
            troopIds: [1, 2],
            party: {
              members: [
                { classId: 1, level: 5 },
                { classId: 2, level: 5 },
              ],
            },
          },
        ],
        globalSettings: {
          seed: 12345,
          maxBattleTurns: 50,
        },
      }

      mockConfigSave.mockResolvedValue({
        success: true,
        data: { configPath: '/path/to/project/coreto.config.json' },
      })

      const { result } = renderHook(() => useConfigSave())

      let saveResult: Awaited<ReturnType<typeof result.current.saveConfig>>
      await act(async () => {
        saveResult = await result.current.saveConfig({ config, logger: mockLogger })
      })

      expect(mockConfigSave).toHaveBeenCalledWith('/path/to/project', {
        version: '1.0',
        trechos: config.trechos,
        globalSettings: config.globalSettings,
        metadata: {
          projectName: 'project',
          lastModified: expect.any(Number),
        },
      })

      expect(saveResult?.success).toBe(true)
      expect(saveResult?.simConfig).toEqual({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/coreto.config.json',
        trechos: [
          {
            id: 'trecho1',
            name: 'Trecho 1',
            troopIds: [1, 2],
          },
        ],
        globalSettings: {
          seed: 12345,
          maxBattleTurns: 50,
        },
      })
      expect(saveResult?.error).toBeNull()
    })

    it('should handle save failure and return error', async () => {
      const config: ProjectConfigFormData = {
        projectPath: '/path/to/project',
        trechos: [],
        globalSettings: {
          seed: 12345,
        },
      }

      mockConfigSave.mockResolvedValue({
        success: false,
        error: { message: 'Failed to write file', code: 'EIO' },
      })

      const { result } = renderHook(() => useConfigSave())

      let saveResult: Awaited<ReturnType<typeof result.current.saveConfig>>
      await act(async () => {
        saveResult = await result.current.saveConfig({ config, logger: mockLogger })
      })

      expect(saveResult?.success).toBe(false)
      expect(saveResult?.simConfig).toBeNull()
      expect(saveResult?.error).toContain('Failed to save configuration')
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save configuration')
      )
    })

    it('should handle exception during save', async () => {
      const config: ProjectConfigFormData = {
        projectPath: '/path/to/project',
        trechos: [],
        globalSettings: {
          seed: 12345,
        },
      }

      mockConfigSave.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useConfigSave())

      let saveResult: Awaited<ReturnType<typeof result.current.saveConfig>>
      await act(async () => {
        saveResult = await result.current.saveConfig({ config, logger: mockLogger })
      })

      expect(saveResult?.success).toBe(false)
      expect(saveResult?.simConfig).toBeNull()
      expect(saveResult?.error).toContain('Error saving configuration')
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error saving configuration')
      )
    })

    it('should extract project name from path', async () => {
      const config: ProjectConfigFormData = {
        projectPath: '/path/to/my-game',
        trechos: [],
        globalSettings: {
          seed: 12345,
        },
      }

      mockConfigSave.mockResolvedValue({
        success: true,
        data: { configPath: '/path/to/my-game/coreto.config.json' },
      })

      const { result } = renderHook(() => useConfigSave())

      await act(async () => {
        await result.current.saveConfig({ config, logger: mockLogger })
      })

      expect(mockConfigSave).toHaveBeenCalledWith('/path/to/my-game', {
        version: '1.0',
        trechos: [],
        globalSettings: { seed: 12345 },
        metadata: {
          projectName: 'my-game',
          lastModified: expect.any(Number),
        },
      })
    })

    it('should include timestamp in metadata', async () => {
      const beforeTime = Date.now()
      const config: ProjectConfigFormData = {
        projectPath: '/path/to/project',
        trechos: [],
        globalSettings: {
          seed: 12345,
        },
      }

      mockConfigSave.mockResolvedValue({
        success: true,
        data: { configPath: '/path/to/project/coreto.config.json' },
      })

      const { result } = renderHook(() => useConfigSave())

      await act(async () => {
        await result.current.saveConfig({ config, logger: mockLogger })
      })

      const afterTime = Date.now()

      const saveCall = mockConfigSave.mock.calls[0]
      const metadata = saveCall[1].metadata

      expect(metadata.lastModified).toBeGreaterThanOrEqual(beforeTime)
      expect(metadata.lastModified).toBeLessThanOrEqual(afterTime)
    })
  })
})
