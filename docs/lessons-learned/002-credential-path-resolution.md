# Resolução de Caminhos de Credenciais em Monorepo

## Contexto

O projeto usa uma estrutura de **monorepo** com pnpm, onde o pacote `@coreto/electron` fica em `packages/electron/`. As credenciais da API Claude são armazenadas em `.claude/settings.local.json` na raiz do projeto.

## Problema

Ao executar `pnpm --filter @coreto/electron dev`, o comando é executado dentro do diretório `packages/electron/`, fazendo com que:

1. **`process.cwd()`** retorne o diretório de trabalho atual: `/packages/electron/`
2. O código tentava procurar as credenciais em `/packages/electron/.claude/settings.local.json`
3. O arquivo correto está em: `/project-root/.claude/settings.local.json`

### Impacto

- O processo main do Electron não conseguia carregar as credenciais
- Variáveis de ambiente `ANTHROPIC_*` ficavam `undefined`
- O servidor MCP (processo filho) recebia `undefined` e retornava erro -32603

## Solução

### 1. No Electron Main (`packages/electron/src/main/credentials.ts`)

**Problema:** `process.cwd()` retorna o diretório de execução do comando, não a raiz do projeto.

**Solução:** Usar `__dirname` com caminho relativo para resolver a raiz do projeto:

```typescript
// Detectar se estamos em modo compilado (out/main) ou fonte (src/main)
const isCompiled = __dirname.includes('/out/main');

// Níveis relativos dependem do modo
const levelsToProjectRoot = isCompiled ? 4 : 3;
const relativePath = '../'.repeat(levelsToProjectRoot) + '.claude/settings.local.json';

const projectRootPath = path.join(__dirname, relativePath);
const cwdPath = path.join(process.cwd(), '.claude/settings.local.json');
const prodPath = path.join(app.getPath('userData'), '.claude/settings.local.json');

// Ordem de prioridade: project root (mais confiável) → cwd → userData
const settingsPaths = isDev
  ? [projectRootPath, cwdPath, prodPath]
  : [prodPath, projectRootPath, cwdPath];
```

**Por que funciona:**
- `__dirname` é resolvido em tempo de **execução** (não de compilação)
- Código compilado está em `out/main/`, então precisa voltar **4 níveis** para achar a raiz
- Código fonte está em `src/main/`, então precisa voltar **3 níveis** para achar a raiz
- Detecção dinâmica (`__dirname.includes('/out/main')`) ajusta automaticamente

### 2. No Oracle MCP Server (`packages/oracle/src/lib/auth.ts`)

**Problema:** O caminho `../../../` (3 níveis) apontava para `packages/.claude/`, não para a raiz do projeto.

**Solução:** Ajustar para 4 níveis relativos:

```typescript
// De packages/oracle/src/lib/auth.ts até project root = 4 níveis acima
const settingsPaths = [
  path.join(__authDirname, '../../../../.claude/settings.local.json'), // ← raiz do projeto (correto)
  path.join(__authDirname, '../../../.claude/settings.local.json'),  // ← packages/ (fallback)
  path.join(process.env.HOME || '', '.claude/settings.local.json'),
];
```

## Boas Práticas para Monorepos

### 1. Evite `process.cwd()` para resolver arquivos de projeto

**❌ Errado:**
```typescript
const configPath = path.join(process.cwd(), 'config.json');
```

**✅ Correto:**
```typescript
// Resolve relativo à localização do arquivo
const configPath = path.join(__dirname, '../../config.json');
```

### 2. Sempre use caminhos relativos baseados em `__dirname`

| Arquivo | Níveis até raiz | Caminho relativo |
|---------|------------------|----------------|
| `packages/electron/src/main/credentials.ts` | 3 | `../../../` |
| `packages/electron/src/main/index.ts` | 3 | `../../../` |
| `packages/oracle/src/lib/auth.ts` | 4 | `../../../../` |
| `packages/oracle/src/lib/claudeAgentClient.ts` | 4 | `../../../../` |

### 3. Adicione fallbacks para diferentes contextos

```typescript
const settingsPaths = [
  projectRootPath,    // Desenvolvimento (mais confiável)
  cwdPath,            // Fallback para execução local
  prodPath,            // Produção
];
```

## Lições Aprendidas

1. **`process.cwd()` não é confiável em monorepos** - retorna o diretório de execução do comando
2. **Use `__dirname` com caminhos relativos** - garante consistência em diferentes contextos de execução
3. **Documente a estrutura de níveis** - facilita manutenção futura
4. **Adicione logs DEBUG** - essenciais para debug de problemas de caminho
5. **Teste em diferentes contextos** - `pnpm dev` vs `pnpm --filter @pacote dev`
6. **`__dirname` é resolvido em tempo de execução/compilação** - código compilado (`out/main/`) tem caminho diferente do código fonte (`src/main/`)
7. **Detecte modo compilado vs fonte** - use `__dirname.includes('/out/main')` para ajusar níveis relativos dinamicamente

## Referências

- [Node.js: `__dirname`](https://nodejs.org/api/modules.html#__dirname)
- [Node.js: `process.cwd()`](https://nodejs.org/api/process.html#processcwd)
- [pnpm: Workspace structure](https://pnpm.io/workspaces/)
