# Hooks Dependencies: O Perigo de Modificar Código Sem Entender o Contexto

## Data: 2026-02-06

## Impacto: Crítico - Causou OOM em testes

---

## O Erro

**Task P0-2** sugeriu adicionar `ipcFn` às dependências do `useCallback` no `useIpc.ts`:

```typescript
// ❌ ERRADO - Causou loop infinito e OOM
}, [ipcFn]);
```

**Resultado:** Testes renderer consumiram 4GB+ de memória e falharam com `FATAL ERROR: Reached heap limit`.

---

## Por Que o Código Original Estava Correto

O comentário no código original **era preciso**:

> "Note: ipcFn is excluded from deps to prevent infinite loop."

### O Loop Infinito

1. Teste passa função inline: `() => window.coreto.getSomething()`
2. Cada render cria **nova referência** de função
3. `useCallback` vê `ipcFn` mudou → recria `invoke`
4. `useEffect` vê `invoke` mudou → roda efeito
5. Efeito chama `invoke()` → atualiza state
6. State causa re-render → **loop**

---

## A Lição

### 1. Comentários Explicando "Por Que" são Ouro

Quando um comentário diz "X é excluído para evitar Y", **acredite primeiro**. Questione depois se tiver evidência forte.

### 2. Nem Todo `exhaustive-deps` Linter Está Certo

O ESLint `exhaustive-deps` usa heurísticas. Não entende:

- Semântica de negócio
- Intencionalidade arquitetural
- Trade-offs de performance

### 3. Hooks Têm Padrões Diferentes

| Hook | Padrão | Por Quê |
|------|--------|--------|
| `useIpc` | `[]` deps | Aceita qualquer função, caller é responsável |
| `useIpcWithArg` | `[ipcFn]` deps | Encapsula, controla estabilidade |

---

## Validação de Planos de Ação

Antes de implementar sugestões de planos:

1. **Leia os comentários** no código existente
2. **Entenda o contexto** da decisão original
3. **Considere contra-exemplos** (useIpc vs useIpcWithArg)
4. **Teste incrementalmente** - não mude tudo de uma vez

---

## Referência

- **Arquivo:** `packages/electron/src/renderer/src/hooks/useIpc.ts:198`
- **Issue:** Plan item P0-2 estava incorreto
- **Resolução:** Revertido para código original
