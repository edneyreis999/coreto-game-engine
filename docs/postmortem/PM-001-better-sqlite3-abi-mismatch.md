# PM-001: better-sqlite3 NODE_MODULE_VERSION Mismatch

**Date:** 2026-01-31
**Severity:** High (blocking development workflow)
**Duration:** ~4 hours investigation + resolution
**Status:** Resolved

## Executive Summary

O pacote `better-sqlite3` (native module) não podia ser compartilhado entre dois ambientes de execução: Jest (Node.js 20.x, ABI 115) e Electron 33 (ABI 130 proprietário). A solução implementou hooks npm automáticos (`predev`, `pretest`) que recompilam o módulo nativo para o ambiente correto antes de cada execução.

## Impact

| Área | Impacto |
|------|---------|
| **Testes unitários** | ❌ Bloqueados - 7 suites falhando, 129 testes não executáveis |
| **Electron dev server** | ❌ Bloqueado - Crash na inicialização |
| **CI/CD** | ⚠️ Potencialmente bloqueado (não testado) |
| **Produtividade** | Alta - Desenvolvimento do @coreto/electron paralisado |

## Timeline

```
2026-01-31 ~14:00  Usuário reporta: `pnpm test` falha com NODE_MODULE_VERSION mismatch
2026-01-31 ~14:30  Investigação inicial: better-sqlite3 compilado para Node 22.x (ABI 130)
2026-01-31 ~15:00  Tentativa de fix: `npx node-gyp rebuild` no diretório do better-sqlite3
2026-01-31 ~15:30  Resultado: Tests passam ✅, mas Electron dev quebra ❌
2026-01-31 ~16:00  Nova investigação: Electron 33 usa ABI 130 (não Node.js 20.x ABI 115)
2026-01-31 ~17:00  Solução implementada: hooks predev/pretest com rebuild automático
2026-01-31 ~17:30  Validação: Ambos os ambientes funcionando ✅
```

## Root Cause Analysis

### Causa Raiz

O Electron mantém sua própria numeração de ABI (Application Binary Interface) **independente** do Node.js, mesmo quando usa a mesma versão major do Node internamente. Isso ocorre porque o Electron usa BoringSSL em vez de OpenSSL e possui outras diferenças de linkagem.

| Ambiente | Node.js Version | ABI (NODE_MODULE_VERSION) |
|----------|-----------------|---------------------------|
| Node.js 20.x | 20.20.0 | **115** |
| Node.js 22.x | 22.x | **130** |
| **Electron 33** | 20.18.0 (interno) | **130** (próprio) |

### Sequência de Eventos

1. **Estado inicial:** `postinstall` executa `electron-rebuild -w better-sqlite3`
2. **Resultado:** better-sqlite3 compilado para Electron ABI 130
3. **Problema:** Jest roda em Node.js do sistema (ABI 115) → crash
4. **Fix parcial:** `node-gyp rebuild` recompila para Node.js ABI 115
5. **Novo problema:** Electron espera ABI 130 → crash
6. **Conclusão:** O mesmo binário `.node` **não pode** servir ambos os ambientes

### Diagrama do Conflito

```
┌─────────────────────────────────────────────────────────────────┐
│                     better-sqlite3.node                          │
│                    (ÚNICO binário compilado)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      Jest (Node.js)      │     │      Electron App       │
│                          │     │                         │
│  NODE_MODULE_VERSION:    │     │  NODE_MODULE_VERSION:   │
│         115              │     │         130             │
│                          │     │                         │
│  Se compilado para 130:  │     │  Se compilado para 115: │
│  ❌ ERR_DLOPEN_FAILED    │     │  ❌ ERR_DLOPEN_FAILED   │
└─────────────────────────┘     └─────────────────────────┘
```

## Resolution

### Solução Implementada

Adicionamos hooks npm que recompilam automaticamente o better-sqlite3 para o ambiente correto:

```json
// packages/electron/package.json
{
  "scripts": {
    "rebuild": "electron-rebuild -f -w better-sqlite3",
    "rebuild:electron": "electron-rebuild -f -w better-sqlite3",
    "rebuild:node": "pnpm rebuild better-sqlite3",
    "predev": "pnpm rebuild:electron",
    "pretest": "pnpm rebuild:node"
  }
}
```

### Como Funciona

| Comando | Hook Executado | ABI Resultante | Ambiente |
|---------|----------------|----------------|----------|
| `pnpm --filter @coreto/electron dev` | `predev` → `rebuild:electron` | 130 | Electron |
| `pnpm --filter @coreto/electron test` | `pretest` → `rebuild:node` | 115 | Jest/Node.js |

### Validação

```bash
# Após implementação
$ pnpm --filter @coreto/electron dev
✔ Rebuild Complete
start electron app...
[DI] All dependencies registered  # ✅ App funcionando

$ pnpm --filter @coreto/electron test
✔ Rebuild Complete
Test Suites: 26 passed, 27 total
Tests:       422 passed, 423 total  # ✅ Testes funcionando
```

## Lessons Learned

### O que funcionou bem

1. **Pesquisa web estruturada:** Buscar por "Electron ABI version" revelou que Electron tem numeração própria
2. **Leitura da documentação oficial:** [Native Node Modules | Electron](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) explica claramente o problema
3. **Hooks npm automáticos:** Eliminam a necessidade de rebuild manual

### O que poderia ter sido melhor

1. **Documentação interna:** Não havia registro de que Electron usa ABI diferente do Node.js
2. **Validação de CI:** Um job de CI que testasse ambos os ambientes teria detectado isso antes
3. **Investigação inicial:** A suposição de que "Node 20.x = ABI 115 sempre" estava errada para Electron

### Surpresas

- Electron 33 usa **Node.js 20.18.0 internamente**, mas seu ABI é **130** (mesmo número do Node.js 22.x)
- O `electron-rebuild` existe exatamente para resolver este problema
- A versão do Python (3.12+) removeu `distutils`, quebrando `node-gyp` em alguns casos

## Action Items

| Item | Responsável | Status | Prioridade |
|------|-------------|--------|------------|
| Documentar ABI mismatch no README do @coreto/electron | - | Pendente | Alta |
| Adicionar job de CI que execute `dev` + `test` em sequência | - | Pendente | Média |
| Considerar `jest-electron-runner` para eliminar rebuild | - | Avaliar | Baixa |
| Investigar se sql.js (pure JS) seria alternativa viável | - | Avaliar | Baixa |
| **Migrar SQLite para backend dedicado** | - | Futuro | Estratégica |

## Alternativas Consideradas (Não Implementadas)

### 1. jest-electron-runner

Executa Jest dentro do ambiente Electron, eliminando a necessidade de rebuild.

**Prós:** Ambiente único, sem rebuild
**Contras:** Complexidade adicional, possíveis side effects

### 2. sql.js (Pure JavaScript SQLite)

Substitui better-sqlite3 por implementação 100% JavaScript (WebAssembly).

**Prós:** Sem módulos nativos, sem problemas de ABI
**Contras:** Performance inferior, API diferente, migração complexa

### 3. Duas instalações de better-sqlite3

Manter cópias separadas do módulo compiladas para cada ABI.

**Prós:** Ambos ambientes sempre prontos
**Contras:** Complexidade de build, espaço em disco, manutenção

### 4. Mock de better-sqlite3 nos testes

Usar mocks em vez do banco real nos testes.

**Prós:** Sem dependência de módulo nativo
**Contras:** **Rejeitado pelo usuário** - deseja testar com banco real

## Future Direction

### Solução Definitiva: Migrar SQLite para Backend

A solução de hooks automáticos (`predev`/`pretest`) resolve o problema imediato, mas adiciona overhead de rebuild em cada execução. A **solução arquitetural de longo prazo** é descontinuar o uso de `better-sqlite3` no frontend Electron e migrar a persistência para um backend dedicado.

**Arquitetura Proposta:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     @coreto/electron (Frontend)                  │
│                                                                  │
│  - Renderer process (React)                                     │
│  - Preload scripts                                               │
│  - Sem módulos nativos                                          │
│  - Comunicação via HTTP/WebSocket                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     @coreto/backend (Novo)                       │
│                                                                  │
│  - NestJS ou Fastify                                            │
│  - better-sqlite3 / Prisma                                      │
│  - Node.js puro (sem conflito de ABI)                           │
│  - Testes executam no mesmo ambiente de produção                │
└─────────────────────────────────────────────────────────────────┘
```

**Benefícios:**

- Elimina conflito de ABI permanentemente
- Testes e produção usam o mesmo binário
- Separação clara de responsabilidades (frontend = UI, backend = dados)
- Facilita futura migração para arquitetura cliente-servidor
- Possibilita compartilhar backend entre Electron e potencial web app

**Timeline Estimado:** Pós-MVP, quando houver necessidade de features que justifiquem a complexidade adicional.

**Trigger para Migração:** Se os hooks de rebuild começarem a causar problemas em CI/CD ou se novos módulos nativos forem necessários.

## Technical References

### Documentação

- [Native Node Modules | Electron](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
- [node-abi GitHub](https://github.com/electron/node-abi) - Mapeamento ABI ↔ versões
- [Node.js ABI Registry](https://github.com/nodejs/node/blob/main/doc/abi_version_registry.json)

### Issues Relacionadas

- [better-sqlite3 #1131](https://github.com/WiseLibs/better-sqlite3/issues/1131) - NODE_MODULE_VERSION 115 mismatch
- [electron-react-boilerplate #1465](https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/1465) - Jest + native modules
- [electron #43513](https://github.com/electron/electron/issues/43513) - better-sqlite3 in worker_threads

### Arquivos Modificados

- `packages/electron/package.json` - Scripts de rebuild e hooks

## Appendix: ABI Version Reference

```
ABI 115 = Node.js 20.x
ABI 127 = Electron 32
ABI 128 = Electron 32 (patch)
ABI 130 = Electron 33
ABI 131 = Node.js 23.x
ABI 132 = Electron 34
```

---

**Author:** Claude Code (assistido)
**Reviewed by:** -
**Last Updated:** 2026-01-31
