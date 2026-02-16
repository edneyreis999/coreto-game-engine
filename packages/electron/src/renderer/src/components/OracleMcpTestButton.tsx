import { useOracleMcpClient } from '@/hooks/useOracleMcpClient'

/**
 * OracleMcpTestButton
 *
 * Test button for Oracle MCP integration.
 * Tests the full flow: Renderer → IPC → MCP Server → Claude Agent SDK
 */
export function OracleMcpTestButton(): React.ReactElement {
  const { generatePrompt, isGenerating, error } = useOracleMcpClient()

  const handleClick = async () => {
    try {
      await generatePrompt({
        nsdContent: '# NSD de Teste\n\n## Cena Olá Mundo\nEsta é uma cena de teste para validar a integração MCP.',
        sceneName: 'Cena Olá Mundo',
        projectPath: '/tmp/test-project',
        model: 'glm-4.5-air', // Faster/cheaper model for testing
      })
    } catch (err) {
      console.error('[Oracle MCP Test] Error:', err)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ marginLeft: 'auto' }}
    >
      {isGenerating ? 'Gerando...' : 'Test Oracle MCP'}
    </button>
  )
}
