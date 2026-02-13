import { useOracleMcpClient } from '@/hooks/useOracleMcpClient'

/**
 * OracleMcpTestButton
 *
 * Componente de teste para integração Oracle MCP.
 * Testa o fluxo completo: Renderer → IPC → MCP Server → Claude Agent SDK
 */
export function OracleMcpTestButton(): React.ReactElement {
  const { generatePrompt, isGenerating, error } = useOracleMcpClient()

  const handleClick = async () => {
    console.log('[Oracle MCP Test] Iniciando teste...')

    try {
      const prompt = await generatePrompt({
        nsdContent: '# NSD de Teste\n\n## Cena Olá Mundo\nEsta é uma cena de teste para validar a integração MCP.',
        sceneName: 'Cena Olá Mundo',
        projectPath: '/tmp/test-project',
      })

      console.log('[Oracle MCP Test] === RESPOSTA DO MODELO ===')
      console.log(prompt)
      console.log('[Oracle MCP Test] === FIM DA RESPOSTA ===')
    } catch (err) {
      console.error('[Oracle MCP Test] Erro:', err)
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
