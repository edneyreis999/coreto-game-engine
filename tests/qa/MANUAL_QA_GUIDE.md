# Guia de Testes Manuais de QA - Coreto Game Engine

**Versao:** 1.0
**Data:** 2026-01-04
**Cobertura:** FASE 1-4 (Foundation, Core Domain, Config & CLI, Data Loading)

---

## Pre-requisitos

### Ambiente

- Node.js >= 20.0.0
- npm >= 10.x
- Terminal (bash/zsh/PowerShell)
- Editor de texto para criar arquivos JSON

### Setup Inicial

```bash
# 1. Clone e instale
cd /path/to/game-engine
npm install

# 2. Compile o projeto
npm run build

# 3. Verifique que testes automatizados passam
npm test
```

**Resultado Esperado:** 501 testes passando, 6 skipped

---

## Secao 1: CLI Base (FASE 3)

### TC-CLI-001: Hello Command Basico

**Objetivo:** Verificar que o CLI responde corretamente

**Passos:**

1. Execute: `npx coreto-engine hello`

**Resultado Esperado:**

```
hello world! (./src/cli/commands/hello.ts)
```

### TC-CLI-002: Hello Command com Flag --name

**Objetivo:** Verificar que flags funcionam

**Passos:**

1. Execute: `npx coreto-engine hello --name=QA`

**Resultado Esperado:**

```
hello QA! (./src/cli/commands/hello.ts)
```

### TC-CLI-003: Hello Command com Flag Abreviada -n

**Objetivo:** Verificar alias de flag

**Passos:**

1. Execute: `npx coreto-engine hello -n Tester`

**Resultado Esperado:**

```
hello Tester! (./src/cli/commands/hello.ts)
```

### TC-CLI-004: Comando Inexistente

**Objetivo:** Verificar tratamento de erro para comando invalido

**Passos:**

1. Execute: `npx coreto-engine comando-invalido`

**Resultado Esperado:**

- Mensagem de erro indicando comando nao encontrado
- Exit code != 0

### TC-CLI-005: Help do CLI

**Objetivo:** Verificar documentacao do CLI

**Passos:**

1. Execute: `npx coreto-engine --help`

**Resultado Esperado:**

- Lista de comandos disponiveis
- Descricao do CLI

---

## Secao 2: Validacao de Configuracao (FASE 3)

### Preparacao: Criar Arquivos de Teste

Crie uma pasta temporaria para testes:

```bash
mkdir -p /tmp/coreto-qa-tests
cd /tmp/coreto-qa-tests
```

### TC-CFG-001: Configuracao Valida

**Objetivo:** Verificar que configuracao valida e aceita

**Preparacao:** Crie `/tmp/coreto-qa-tests/valid-config.json`:

```json
{
  "projectPath": "/tmp/fake-mz-project",
  "seed": 12345,
  "trechos": [
    {
      "id": "trecho-teste",
      "name": "Trecho de Teste",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": 0.15,
      "troopIds": [1, 2],
      "party": {
        "members": [
          { "classId": 1, "level": 5 }
        ]
      }
    }
  ]
}
```

**Passos:**

1. No Node REPL ou script de teste:

```javascript
import { ProjectConfigSchema } from './dist/infrastructure/config/schemas.js';
const config = JSON.parse(fs.readFileSync('/tmp/coreto-qa-tests/valid-config.json'));
const result = ProjectConfigSchema.safeParse(config);
console.log(result.success); // true
```

**Resultado Esperado:** `success: true`

### TC-CFG-002: Path Traversal Rejeitado

**Objetivo:** Verificar seguranca contra path traversal

**Preparacao:** Crie `/tmp/coreto-qa-tests/traversal-config.json`:

```json
{
  "projectPath": "../../../etc/passwd",
  "seed": 12345,
  "trechos": [
    {
      "id": "test",
      "name": "Test",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": 0.15,
      "troopIds": [1],
      "party": { "members": [{ "classId": 1, "level": 1 }] }
    }
  ]
}
```

**Passos:**

1. Valide com Zod schema

**Resultado Esperado:**

- Validacao falha
- Mensagem: "Project path cannot contain '..' (path traversal)"

### TC-CFG-003: Nivel Invalido (> 99)

**Objetivo:** Verificar validacao de range de nivel

**Preparacao:** Config com level 150

**Resultado Esperado:**

- Validacao falha
- Mensagem indicando nivel maximo 99

### TC-CFG-004: Trecho sem ID

**Objetivo:** Verificar campos obrigatorios

**Resultado Esperado:**

- Validacao falha
- Mensagem indicando campo obrigatorio

### TC-CFG-005: Seed Default

**Objetivo:** Verificar valor default de seed

**Preparacao:** Config sem campo "seed"

**Resultado Esperado:**

- Validacao passa
- seed = 12345 (default)

---

## Secao 3: Data Loading (FASE 4)

### Preparacao: Criar Projeto MZ Fake

```bash
# Estrutura minima de projeto RPG Maker MZ
mkdir -p /tmp/fake-mz-project/data
mkdir -p /tmp/fake-mz-project/js
touch /tmp/fake-mz-project/game.rmmzproject
```

Crie arquivos JSON minimos:

**`/tmp/fake-mz-project/data/Classes.json`:**

```json
[
  null,
  {"id": 1, "name": "Guerreiro", "expParams": [30,20,30,30], "traits": [], "learnings": [], "note": "", "params": [[1,1],[450,990],[80,120],[30,50],[30,50],[30,50],[30,50],[30,50]]}
]
```

**`/tmp/fake-mz-project/data/Enemies.json`:**

```json
[
  null,
  {"id": 1, "name": "Slime", "battlerName": "Slime", "battlerHue": 0, "params": [100,0,10,10,10,10,10,10], "exp": 5, "gold": 3, "dropItems": [], "actions": [{"skillId": 1, "conditionType": 0, "conditionParam1": 0, "conditionParam2": 0, "rating": 5}], "traits": [], "note": ""}
]
```

**`/tmp/fake-mz-project/data/Troops.json`:**

```json
[
  null,
  {"id": 1, "name": "Slime*2", "members": [{"enemyId": 1, "x": 400, "y": 400, "hidden": false}, {"enemyId": 1, "x": 450, "y": 400, "hidden": false}], "pages": []}
]
```

**`/tmp/fake-mz-project/data/Skills.json`:**

```json
[
  null,
  {"id": 1, "name": "Ataque", "iconIndex": 76, "description": "", "stypeId": 0, "scope": 1, "mpCost": 0, "tpCost": 0, "message1": "", "message2": "", "messageType": 1, "animationId": 1, "damage": {"type": 1, "elementId": 0, "formula": "a.atk * 4 - b.def * 2", "variance": 20, "critical": false}, "effects": [], "hitType": 1, "occasion": 1, "speed": 0, "successRate": 100, "repeats": 1, "tpGain": 0, "requiredWtypeId1": 0, "requiredWtypeId2": 0, "note": ""}
]
```

**`/tmp/fake-mz-project/data/Items.json`:**

```json
[null]
```

**`/tmp/fake-mz-project/data/System.json`:**

```json
{
  "gameTitle": "QA Test Game",
  "locale": "pt_BR",
  "partyMembers": [1],
  "testBattlers": [{"actorId": 1, "level": 1, "equips": [0,0,0,0,0]}],
  "testTroopId": 1,
  "elements": ["", "Fisico", "Fogo"],
  "skillTypes": ["", "Magia"],
  "weaponTypes": ["", "Espada"],
  "armorTypes": ["", "Armadura"],
  "equipTypes": ["", "Arma", "Escudo"],
  "terms": {},
  "sounds": [],
  "switches": [],
  "variables": [],
  "battleBgm": {},
  "victoryMe": {},
  "defeatMe": {},
  "gameoverMe": {},
  "titleBgm": {},
  "boat": {},
  "ship": {},
  "airship": {},
  "optSideView": true,
  "advanced": {}
}
```

Tambem crie arquivos vazios para completar:

```bash
echo '[null]' > /tmp/fake-mz-project/data/Actors.json
echo '[null]' > /tmp/fake-mz-project/data/Weapons.json
echo '[null]' > /tmp/fake-mz-project/data/Armors.json
echo '[null]' > /tmp/fake-mz-project/data/States.json
```

### TC-DATA-001: Validar Estrutura de Projeto Valido

**Objetivo:** Verificar que projeto MZ valido e aceito

**Passos:**

1. Use RmmzProjectValidator para validar /tmp/fake-mz-project

**Resultado Esperado:**

- Validacao passa (retorna true)
- Sem erros

### TC-DATA-002: Projeto sem game.rmmzproject

**Objetivo:** Verificar rejeicao de projeto invalido

**Passos:**

1. Remova o arquivo marker: `rm /tmp/fake-mz-project/game.rmmzproject`
2. Valide o projeto

**Resultado Esperado:**

- DataLoadError lancado
- Mensagem indicando arquivo marker ausente

**Cleanup:** `touch /tmp/fake-mz-project/game.rmmzproject`

### TC-DATA-003: Projeto sem Diretorio data/

**Objetivo:** Verificar rejeicao sem diretorio data

**Passos:**

1. Renomeie: `mv /tmp/fake-mz-project/data /tmp/fake-mz-project/data-backup`
2. Valide o projeto

**Resultado Esperado:**

- DataLoadError lancado
- Mensagem indicando diretorio data ausente

**Cleanup:** `mv /tmp/fake-mz-project/data-backup /tmp/fake-mz-project/data`

### TC-DATA-004: Carregar Database Completo

**Objetivo:** Verificar carregamento de todos os arquivos

**Passos:**

1. Use RmmzDataLoader.loadDatabase()

**Resultado Esperado:**

- RmmzDatabase retornado com todas as propriedades:
  - $dataClasses (1 classe)
  - $dataEnemies (1 inimigo)
  - $dataTroops (1 troop)
  - $dataSkills (1 skill)
  - $dataSystem (configuracoes)

### TC-DATA-005: Arquivo JSON Corrompido

**Objetivo:** Verificar tratamento de JSON invalido

**Passos:**

1. Corrompa um arquivo: `echo "invalid json{" > /tmp/fake-mz-project/data/Items.json`
2. Tente carregar database

**Resultado Esperado:**

- DataLoadError lancado
- Mensagem indicando erro de parse JSON

**Cleanup:** `echo '[null]' > /tmp/fake-mz-project/data/Items.json`

---

## Secao 4: Validacao de Integridade (FASE 4)

### TC-INT-001: Referencias Validas

**Objetivo:** Verificar que referencias validas nao geram warnings

**Passos:**

1. Carregue database do projeto fake
2. Execute validateReferences()

**Resultado Esperado:**

- Array vazio de warnings (todas referencias validas)

### TC-INT-002: Enemy ID Inexistente em Troop

**Objetivo:** Verificar deteccao de enemyId invalido

**Preparacao:** Modifique Troops.json para referenciar enemyId: 999

**Resultado Esperado:**

- Warning com type: 'enemy_not_found'
- severity: 'critical'
- context contendo enemyId e troopId

### TC-INT-003: Skill ID Inexistente em Enemy Action

**Objetivo:** Verificar deteccao de skillId invalido

**Preparacao:** Modifique Enemies.json para ter action com skillId: 999

**Resultado Esperado:**

- Warning com type: 'skill_not_found'
- severity: 'critical'

### TC-INT-004: Class ID Inexistente em TestBattlers

**Objetivo:** Verificar deteccao de classId invalido no System

**Preparacao:** Modifique System.json testBattlers para ter classId invalido

**Resultado Esperado:**

- Warning com type: 'class_not_found'

---

## Secao 5: Seguranca (FASE 3)

### TC-SEC-001: PathSanitizer - Path Traversal

**Objetivo:** Verificar bloqueio de path traversal

**Passos:**

1. Tente validar path: `../../etc/passwd`

**Resultado Esperado:**

- ConfigError lancado
- Mensagem sobre path traversal

### TC-SEC-002: PathSanitizer - Caminho Absoluto Valido

**Objetivo:** Verificar que caminhos absolutos validos funcionam

**Passos:**

1. Valide path: `/tmp/fake-mz-project`

**Resultado Esperado:**

- Validacao passa

### TC-SEC-003: ReadOnlyGuard - Conceitual

**Objetivo:** Verificar que ReadOnlyGuard existe e pode ser ativado

**Nota:** Testes de integracao do ReadOnlyGuard sao limitados devido a restricoes ESM/Jest. Verificar que a classe existe e metodos estao disponiveis.

**Passos:**

1. Importe ReadOnlyGuard
2. Verifique metodos: protect(), unprotect(), enable(), disable()

**Resultado Esperado:**

- Classe importavel
- Metodos disponiveis

---

## Secao 6: Testes de Integracao Manual

### TC-E2E-001: Fluxo Completo de Validacao de Projeto

**Objetivo:** Testar fluxo completo ate onde foi implementado

**Passos:**

1. Crie projeto MZ fake (conforme Secao 3)
2. Valide estrutura do projeto
3. Carregue database
4. Valide referencias

**Resultado Esperado:**

- Todas etapas completam sem erro
- Database carregado corretamente
- Sem warnings de integridade (se dados consistentes)

### TC-E2E-002: Fluxo com Dados Inconsistentes

**Objetivo:** Verificar que inconsistencias sao detectadas

**Passos:**

1. Crie projeto com referencia invalida
2. Execute fluxo completo

**Resultado Esperado:**

- Warnings coletados (nao exceptions)
- Warnings contem informacao util para debug

---

## Checklist de Regressao

Execute antes de cada release:

- [ ] TC-CLI-001 a TC-CLI-005
- [ ] TC-CFG-001 a TC-CFG-005
- [ ] TC-DATA-001 a TC-DATA-005
- [ ] TC-INT-001 a TC-INT-004
- [ ] TC-SEC-001 a TC-SEC-003
- [ ] TC-E2E-001 e TC-E2E-002
- [ ] `npm test` (501 testes passando)
- [ ] `npm run type-check` (sem erros)
- [ ] `npm run lint` (sem erros)

---

## Problemas Conhecidos

1. **ReadOnlyGuard Integration Tests**: 6 testes skipped devido a limitacoes ESM/Jest na interceptacao de fs.writeFileSync
2. **CLI ainda nao tem comando run-ttk**: Implementacao na FASE 8

---

## Contato

Duvidas sobre este guia: Equipe de Engenharia Coreto

**Proxima Atualizacao:** Apos FASE 5 (Headless Runtime)
