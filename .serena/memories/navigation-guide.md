# 🗺️ Guia de Navegação - Coreto Game Engine

## 1) Visão Rápida do Layout

- **Monorepo pnpm**: `packages/core/` (lógica headless) + `packages/electron/` (GUI Dev Portal)
- **Core**: Clean Architecture (`domain/`, `ports/`, `use-cases/`, `infrastructure/`)
- **Electron**: 3 processos (`main/` Node.js, `preload/` bridge, `renderer/` React 18 + shadcn/ui)
- **Build**: electron-vite (`src/` → `out/`), electron-builder (`dist/` apps)
- **Integração**: Electron consome `@coreto/core` via IPC
- **Docs**: `docs/CLAUDE.md` + `docs/adrs/INDEX.md`

---

## 2) Trilha de Investigação (Passos Numerados)

1. **Entrypoints** → Comece em `packages/core/src/index.ts` e `packages/electron/src/main/index.ts`
2. **Contratos IPC** → Veja `packages/electron/src/renderer/src/types/preload.d.ts` → segue para `electron/src/main/ipc/handlers/`
3. **Domain Core** → Explore `packages/core/src/domain/` (entidades puras, sem `types/rmmz-data.ts`)
4. **Ports/Adapters** → Verifique `packages/core/src/ports/` (interfaces) e `infrastructure/adapters/` (implementações)
5. **Mappers** → Ache bridge RMMZ→domain em `packages/core/src/infrastructure/adapters/mappers/`
6. **Database** → SQLite schema em `packages/electron/src/main/database/schema.ts` + migrations/
7. **DI Container** → `packages/core/src/infrastructure/di/` (TSyringe com Symbol tokens)
8. **Testing** → Corra `pnpm --filter @coreto/core test` (1160+ testes, 59 suites)
9. **Logs** → Sempre use ILogger (nunca `console.log`); ConsoleLogger formata `[INFO] ...`
10. **Build Order** → Core deve ser buildado antes: `pnpm --filter @coreto/core build`

---

## 3) Pontos de Integração (Core ↔ Electron)

**Para achar IPC:**
- `electron/src/main/ipc/handlers/*.ts` + `preload.d.ts`

**Para achar core usage:**
- Grep por `from '@coreto/core'` no electron

**Sinais típicos:**
- `ipcMain.handle`, `contextBridge.exposeInMainWorld`, `window.electronAPI`

**Mappers como bridge:**
- `EnemyMapper`, `SkillMapper` convertem RMMZ → domain

**Services orquestram:**
- `electron/src/main/services/` usa core use-cases

---

## 4) Config & Infra: Checklist

| Item | Localização |
|------|-------------|
| **DB** | SQLite (better-sqlite3), schema em `electron/src/main/database/` |
| **Env** | Verificar `.env*` ou config/ (não identificado claramente) |
| **Build** | Root scripts: `build`, `lint`, `type-check`, `test` |
| **CI** | Verificar `.github/workflows/` (não identificado) |
| **Deploy** | `electron-builder` em `packages/electron/package.json` |

---

## 5) Glossário de Sinais

| Sinal | Significado | Onde Encontrar |
|-------|-------------|----------------|
| `preload` | Context bridge, segurança IPC | `src/preload/` |
| `ipc` | Handlers comunicação main↔renderer | `src/main/ipc/` |
| `repository` | Persistência SQLite | `src/main/database/queries/` |
| `adapter` | Conversão infra→domain | `infrastructure/adapters/` |
| `usecase` | Orquestração lógica negócio | `core/use-cases/` |
| `domain` | Entidades puras, sem infra deps | `core/domain/` |
| `port` | Interface para dependency inversion | `core/ports/` |
| `mapper` | Bridge dados externos→domain | `*Mapper` |
| `service` | Lógica backend electron | `main/services/` |
| `handler` | IPC request handlers | `main/ipc/handlers/` |

---

## 6) Princípios Arquiteturais na Prática

### ⚠️ Guardrails (O que NUNCA fazer)

- 🚫 **NUNCA** importe `types/rmmz-data.ts` em `domain/` (use mappers)
- 🚫 **NUNCA** acesse `fs` ou `process` diretamente no renderer (use IPC)
- 🚫 **NUNCA** importe `@coreto/electron` em `@coreto/core` (violClean Architecture)
- 🚫 **NUNCA** chame use-cases diretamente do renderer (sempre via IPC handler)

### ✅ Regras de Ouro

- ✅ IPC **sempre** tipado/centralizado em `handlers/*.ts`
- ✅ Domain entities **sempre** puras, sem dependências de infraestrutura
- ✅ Logs **sempre** via `ILogger`, nunca `console.log` direto
- ✅ Mappers **sempre** em `infrastructure/adapters/mappers/`

### 🔁 Fluxo de Dados Típico

```
User Action (Renderer)
    ↓
IPC Call (via window.electronAPI)
    ↓
Handler (main/ipc/handlers/)
    ↓
Use Case (core/use-cases/) → Domain Logic
    ↓
Mapper (infra/adapters/mappers/) → External Data
    ↓
Response IPC → Renderer Update
```

---

## 7) Receitas de Desenvolvimento

### ➕ Adicionar Novo Use Case

```bash
# 1. Criar use case em packages/core/src/use-cases/
touch packages/core/src/use-cases/MyNewUseCase.ts

# 2. Implementar seguindo padrão:
#    - Input DTO, Output DTO, Result type
#    - Executar apenas com domain entities
#    - Retornar Result<T>

# 3. Exportar em packages/core/src/index.ts
export * from './use-cases/MyNewUseCase';

# 4. Registrar no DI (se necessário)
#    packages/core/src/infrastructure/di/

# 5. Testar
pnpm --filter @coreto/core test
```

### 🖥️ Expor Use Case via IPC

```bash
# 1. Criar handler em packages/electron/src/main/ipc/handlers/
touch packages/electron/src/main/ipc/handlers/my-feature.ts

# 2. Implementar handler:
#    - ipcMain.handle(channel, async (event, dto) => {...})
#    - Resolver use case do DI container
#    - Retornar { isSuccess, data, error }

# 3. Registrar em packages/electron/src/main/ipc/handlers/index.ts

# 4. Atualizar preload types em packages/electron/src/preload/index.ts

# 5. Atualizar types do renderer em packages/electron/src/renderer/src/types/preload.d.ts
```

### 🧪 Rodar Testes Específicos

```bash
# Core package only
pnpm --filter @coreto/core test

# Electron package only
pnpm --filter @coreto/electron test

# Arquivo específico
pnpm --filter @coreto/core test -- MyUseCase.test.ts

# Watch mode
pnpm --filter @coreto/core test -- --watch
```

### 🔍 Debugar IPC

```bash
# 1. Logs do main: use ConsoleLogger (formata [INFO]...)
# 2. Logs do renderer: DevTools Console (Ctrl+Shift+I)
# 3. Trace IPC: procure por ipcMain.handle / ipcRenderer.invoke
# 4. Validar tipos: check preload.d.ts ↔ handlers/
```

---

## 8) Diretórios-Chave: Porquê e Interações

| Diretório | Responsabilidade | Interage Com | ⚠️ Perigos |
|-----------|------------------|--------------|------------|
| `packages/core/src/domain/` | Entidades puras, regras de negócio | use-cases | ❌ Não importar `types/rmmz-data.ts` |
| `packages/core/src/ports/` | Interfaces para dependency inversion | infrastructure/adapters | ❌ Não implementar lógica concreta |
| `packages/core/src/use-cases/` | Orquestração de lógica de negócio | domain, ports | ❌ Não depender de Electron/UI |
| `packages/core/src/infrastructure/adapters/mappers/` | Bridge RMMZ → domain | domain, types/rmmz-data | ⚠️ Único local autorizado para `rmmz-data` |
| `packages/electron/src/main/` | Backend Node.js, orquestrador | core (via import), renderer (via IPC) | ⚠️ Não expor APIs não tipadas |
| `packages/electron/src/preload/` | Context bridge seguro | main, renderer | ❌ Não expor todos os APIs do main |
| `packages/electron/src/renderer/` | UI React, consome APIs | preload (window.electronAPI) | ❌ Não importar `@coreto/core` direto |

---

## Expert Analysis Notes

**Fortalezas identificadas:**
- Código bem estruturado com separação clara de preocupações
- Clean architecture bem aplicada no core
- IPC handlers funcionam como thin adapters corretamente

**Recomendações:**
- Padronizar DTOs retornados via IPC para forma consistente `{ isSuccess, data, error }`
- Confirmar sanitização de paths em `ValidateRMMZProjectUseCase` para evitar directory traversal
- Melhorar logging estruturado em handlers IPC para debugging

---

**Data de criação:** 2026-02-10  
**Versão:** 2.0 (expandido com base em consenso multi-model)  
**Análise via:** PAL MCP thinkdeep + consensus (gpt-5.2, gemini-3-pro-preview, gpt-5.1-codex)

**Maintenance Trigger:** Se estrutura de diretórios mudar, este guia DEVE ser atualizado imediatamente.
