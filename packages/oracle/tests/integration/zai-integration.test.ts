/**
 * Z.ai Integration Test
 *
 * Tests the Claude Agent SDK integration with Z.ai Anthropic-compatible endpoint.
 *
 * @see packages/oracle/src/lib/claudeAgentClient.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ClaudeAgentClient } from '@coreto/oracle';
import { GeneratePromptOptionsFakeBuilder } from '../fakes/GeneratePromptOptionsFakeBuilder.js';

describe('Z.ai Integration', () => {
  let client: ClaudeAgentClient;

  beforeAll(async () => {
    client = new ClaudeAgentClient();
    await client.init();
  });

  it('should pass health check', async () => {
    const result = await client.healthCheck();

    console.log('[Health Check Result]', {
      healthy: result.healthy,
      message: result.message,
      timestamp: result.timestamp,
    });

    // Health check should pass if environment is configured
    if (process.env.ANTHROPIC_AUTH_TOKEN) {
      expect(result.healthy).toBe(true);
      expect(result.message).toContain('model:');
    } else {
      console.warn('[Test] Skipping health check assertion - ANTHROPIC_AUTH_TOKEN not set');
    }
  });

  it('should generate NSD prompt', { timeout: 30000 }, async () => {
    const testOptions = new GeneratePromptOptionsFakeBuilder()
      .withNsdContent(`# NSD de Teste

## Cena Olá Mundo

Esta é uma cena de teste simples para validar a integração com Z.ai.

### Beats
1. Jogador entra na cena
2. Mensagem exibida
3. Jogador pode mover-se
`)
      .withSceneName('Cena Olá Mundo')
      .withProjectPath('/tmp/test-project')
      .withQuestVariable('Test Quest Progress')
      .build();

    const result = await client.generateNsdPrompt(testOptions);

    console.log('[Generated Prompt Preview]', result.slice(0, 500) + '...');

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);

    // Verify prompt contains expected elements
    expect(result.toLowerCase()).toContain('rpg maker');
    expect(result.toLowerCase()).toContain('olá mundo' || 'hello world');
  });

  it('should extract scenes from NSD', { timeout: 30000 }, async () => {
    const nsdContent = `# NSD Test

## Scene Structure

#### Cena 1 – Primeira Cena
Conteúdo da primeira cena com diálogos e ações.

#### Cena 2 – Segunda Cena
Conteúdo da segunda cena com mais detalhes.
`;

    const result = await client.extractScenes({ nsdContent });

    console.log('[Extracted Scenes]', {
      totalScenes: result.totalScenes,
      scenes: result.scenes.map((s) => ({ title: s.title, contentLength: s.content.length })),
    });

    expect(result).toBeDefined();
    expect(result.totalScenes).toBe(2);
    expect(result.scenes).toHaveLength(2);
    expect(result.scenes[0].title).toContain('Cena 1');
    expect(result.scenes[1].title).toContain('Cena 2');
  });
});
