# Guia de Testes Manuais de QA - Coreto Game Engine

**Versão:** 2.0
**Data:** 2026-01-04
**Projeto de Teste:** Daratrine - A Origem

---

## Projeto de Referência

Todos os testes usam o projeto real:

```
/Users/edney/projects/coreto/projectX/frontend
```

**Título:** Daratrine - A Origem
**Estatísticas:**

- 8 Classes
- 235 Skills
- 100 Enemies
- 30 Troops
- 12 Actors

---

## Pré-requisitos

### Setup Inicial

```bash
cd /Users/edney/projects/coreto/game-engine
npm install
npm run build
npm test  # 523 testes passando, 6 skipped
```

---

## Seção 1: Validação Rápida via Terminal

### TC-001: Validar Projeto Completo

**Comando:**

```bash
npm run validate -- /Users/edney/projects/coreto/projectX/frontend
```

**Resultado Esperado:**

```
============================================================
🎮 CORETO GAME ENGINE - Validação de Projeto
============================================================

📁 Projeto: /Users/edney/projects/coreto/projectX/frontend

1️⃣  Validando estrutura do projeto...
   ✅ Estrutura válida: true

2️⃣  Carregando database...
   ✅ Database carregado com sucesso!

   📊 Estatísticas do Database:
      Classes:  8
      Skills:   235
      Items:    90
      Weapons:  50
      Armors:   100
      Enemies:  100
      Troops:   30
      States:   50
      Actors:   12

   🎯 Título do Jogo: "Daratrine - A Origem"

3️⃣  Validando integridade das referências...
   ✅ Nenhum problema de integridade encontrado!

4️⃣  Amostra de dados:

   📚 Classes:
      [1] Espadachim
      [2] Mago
      [3] Sacerdote
      [4] Cavaleiro
      [5] Artista Marcial

   👾 Inimigos (primeiros 5):
      [1] Goblin - HP:1 ATK:25 DEF:20
      [2] Gnomo - HP:1 ATK:20 DEF:25
      ...

============================================================
✅ Validação concluída!
============================================================
```

### TC-002: Projeto Inválido (sem game.rmmzproject)

**Comando:**

```bash
npm run validate -- /tmp
```

**Resultado Esperado:**

```
❌ Erro: Invalid RPG Maker MZ project structure: ...
```

### TC-003: Caminho Inexistente

**Comando:**

```bash
npm run validate -- /caminho/que/nao/existe
```

**Resultado Esperado:**

```
❌ Erro: Invalid RPG Maker MZ project structure: ...
```

---

## Seção 2: CLI Base

### TC-CLI-001: Hello Command

```bash
npx coreto-engine hello
```

**Esperado:** `Hello World!`

### TC-CLI-002: Hello com Nome

```bash
npx coreto-engine hello --name=Daratrine
```

**Esperado:** `Hello Daratrine!`

### TC-CLI-003: Help

```bash
npx coreto-engine --help
```

**Esperado:** Lista de comandos disponíveis

---

## Seção 3: Testes Automatizados

### Executar Todos os Testes QA

```bash
npm test -- tests/qa/
```

**Esperado:** 22 testes passando

### Breakdown dos Testes

| Arquivo | Testes | Descrição |
|---------|--------|-----------|
| `manual-data-loading.test.ts` | 5 | Carregamento de dados |
| `manual-integrity.test.ts` | 4 | Validação de referências |
| `manual-security.test.ts` | 9 | Segurança (path traversal) |
| `manual-e2e.test.ts` | 4 | Integração ponta-a-ponta |

---

## Seção 4: Validações de Integridade

O sistema detecta automaticamente:

### Tipos de Warnings

| Tipo | Severidade | Descrição |
|------|------------|-----------|
| `enemy_not_found` | critical | Troop referencia enemyId inexistente |
| `skill_not_found` | critical | Enemy action referencia skillId inexistente |
| `class_not_found` | warning | TestBattler referencia classId inexistente |

### Testar Detecção de Erros

Se você criar um troop com `enemyId: 999` (que não existe), o validador detectará:

```
⚠️  1 problema(s) encontrado(s):

📌 enemy_not_found: 1 ocorrência(s)
   - Enemy ID 999 not found in troop "Troop Name" (ID: X)
```

---

## Seção 5: Segurança

### TC-SEC-001: Path Traversal Bloqueado

O sistema bloqueia tentativas de path traversal:

```bash
npm run validate -- ../../etc/passwd
```

**Esperado:** Erro de validação (path traversal detectado)

---

## Checklist de Regressão

Execute antes de cada release:

```bash
# 1. Testes automatizados
npm test                    # 523+ testes passando

# 2. Verificação de tipos
npm run type-check          # Sem erros

# 3. Lint
npm run lint                # Sem erros

# 4. Validação do projeto real
npm run validate -- /Users/edney/projects/coreto/projectX/frontend

# 5. Testes QA específicos
npm test -- tests/qa/       # 22 testes passando
```

---

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run validate -- <path>` | Valida projeto RPG Maker MZ |
| `npm test` | Executa todos os testes |
| `npm test -- tests/qa/` | Executa apenas testes QA |
| `npm run build` | Compila TypeScript |
| `npm run type-check` | Verifica tipos sem compilar |
| `npm run lint` | Verifica estilo de código |

---

## Funcionalidades Implementadas (FASE 1-4)

| Funcionalidade | Status |
|----------------|--------|
| Validação de estrutura do projeto | ✅ |
| Carregamento de database (10 arquivos JSON) | ✅ |
| Validação de referências cruzadas | ✅ |
| Proteção contra path traversal | ✅ |
| CLI base (Oclif) | ✅ |
| Schemas Zod para configuração | ✅ |

## Próximas Fases (Não Implementadas)

| Funcionalidade | Fase |
|----------------|------|
| Headless Runtime (JSDOM + mocks) | FASE 5 |
| Simulação de batalha (BattleManager) | FASE 6 |
| Medição de TTK (turnos/ações) | FASE 7 |
| Comando `run-ttk` | FASE 8 |
| Geração de relatórios JSON | FASE 8 |

---

## Problemas Conhecidos

1. **ReadOnlyGuard**: 6 testes skipped devido a limitações ESM/Jest
2. **CLI Warning**: MODULE_NOT_FOUND para Symbol(SINGLE_COMMAND_CLI) - não afeta funcionalidade
3. **HP dos Enemies = 1**: Valor base no projeto Daratrine (usa traits para cálculo final)

---

## Contato

Dúvidas: Equipe de Engenharia Coreto

**Próxima Atualização:** Após FASE 5 (Headless Runtime)
