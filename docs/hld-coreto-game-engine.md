# HLD - coreto game engine

**Versão:** 1.0
**Data:** 2026-01-04
**Sistema:** coreto game engine - Validação Determinística de TTK

---

## 1. Contexto e Objetivo Técnico

### 1.1 Objetivo

Criar um sistema de validação determinística de balanceamento que executa batalhas reais via engine RPG Maker MZ em modo headless, medindo TTK (Time-to-Kill) por trechos configurados, para acelerar o ciclo de desenvolvimento de game design de dias para minutos, mantendo fidelidade ao jogo final sem modificar o projeto MZ.

### 1.2 Problema Arquitetural

O design de balanceamento de combate em RPGs de turno enfrenta um ciclo lento: designer ajusta dados → playtest manual → identifica problemas → ajusta novamente. Este processo pode levar 2-3 dias para validar a progressão de um único ato. O sistema resolve este problema automatizando a validação de TTK através de simulações headless determinísticas, reduzindo o ciclo para minutos.

### 1.3 Escopo

**Incluso:**

- Wrapper read-only sobre projeto RPG Maker MZ (sem escrita em `data/`)
- Execução de batalhas reais via engine (BattleManager, loop de turnos) em modo headless
- Medição de TTK em turnos e ações por troop
- Configuração de trechos com âncoras de nível e alvos de TTK
- Geração de relatórios detalhados (`report/report.json`)
- Export de contexto para IA (divisão de JSONs grandes)

**Fora de Escopo (MVP v1):**

- UI desktop (Electron) - planejado para pós MVP
- Integração com CI - planejado para pós MVP
- Escrita no banco do RPG Maker MZ
- Modelagem completa de mecânicas avançadas de plugins (além do necessário para batalha)
- Simulação de uso de potions/itens de cura

---

## 2. Arquitetura Geral

### 2.1 Visão de Alto Nível

O sistema segue arquitetura em camadas com wrapper externo Node.js, operando em pipeline sequencial read-only.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│  (Interface de linha de comando, argumentos, orquestração)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Config Layer                            │
│  (Leitura e validação de project.config.json, trechos)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Loader Layer                            │
│  (Validação do projeto MZ, carregamento de data/*.json)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Headless Runtime                           │
│  (JSDOM + mocks PIXI/Effekseer/Graphics, carregamento sync) │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Simulation Layer                           │
│  (BattleManager, loop de turnos, escolha de skills, TTK)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Reporter Layer                            │
│  (Coleta de resultados, agregados, warnings, report.json)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  AI Exporter Layer                           │
│  (Divisão de JSONs grandes para contexto de IA)             │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Comunicação

- **Pipeline Sequencial:** Dados fluem de cima para baixo sem loops
- **Read-Only:** Nenhuma camada escreve no projeto RPG Maker MZ
- **Isolamento:** Headless Runtime isolado do filesystem do projeto

---

## 3. Componentes e Responsabilidades

### 3.1 CLI Layer

**Responsabilidades:**

- Parser de argumentos CLI (`--config`, `--seed`, `--trecho`, `--verbose`, `--diagnostic`)
- Orquestração do pipeline de execução
- Exibição de progresso no terminal
- Gerenciamento de exit codes (0 sucesso, 1 erro)

**Dependências:** Config Layer, Loader Layer, Simulation Layer

**Tecnologias:** Node.js, Commander.js ou Yargs

---

### 3.2 Config Layer

**Responsabilidades:**

- Leitura de `project.config.json`
- Validação de schema (tipos, ranges, obrigatoriedade)
- Carregamento de definições de trechos (âncoras, alvos TTK, tolerâncias)
- Validação de estrutura de troops e parties
- Aplicação de seed padrão (com possibilidade de override via CLI)

**Dependências:** Nenhuma (camada base)

**Tecnologias:** Zod ou Joi para validação de schema

---

### 3.3 Loader Layer

**Responsabilidades:**

- Validar estrutura do projeto MZ (presença de `game.rmmzproject`, pasta `data/`)
- Carregar JSONs do MZ (`Classes.json`, `Enemies.json`, `Troops.json`, `Skills.json`)
- Validar existência de `troopIds` e `enemyIds` referenciados nas configurações
- Gerar warnings para inconsistências (IDs inexistentes, estruturas mal-formadas)
- Fornecer interface de acesso aos dados carregados

**Dependências:** Config Layer

**Tecnologias:** Node.js `fs` (readFileSync), validação de schema JSON

---

### 3.4 Headless Runtime

**Responsabilidades:**

- Setup do ambiente JSDOM (simulação de browser)
- Mock de PIXI.js (Container, Sprite, etc.)
- Mock de Graphics (initialize, render, frameCount)
- Mock de Effekseer (initRuntime, update, release)
- Mock de AudioManager
- Carregamento síncrono da database via `fs.readFileSync` (ao invés de XMLHttpRequest)
- Inicialização do RPG Maker MZ core (`rmmz_core.js`, `rmmz_managers.js`, `rmmz_objects.js`)
- Carregamento de plugins VisuStella (Core Engine, Battle Core)
- Isolamento de contexto global (não poluir `global` do Node.js)

**Dependências:** Loader Layer

**Tecnologias:** JSDOM, jest-canvas-mock, mocks customizados

---

### 3.5 Simulation Layer

**Responsabilidades:**

- Configurar batalhas via `BattleManager.setup(troopId, canEscape, canLose)`
- Montar party com base em `PartyConfig` (classId + level → derivar skills liberadas)
- Executar loop de turnos até vitória/derrota/timeout
- Implementar escolha de skill por melhor dano esperado por ação (filtro HP/MP apenas no MVP v1)
- Aplicar seed para determinismo (controlar `Math.random`)
- Registrar turnos, ações, dano causado
- Medir TTK em turnos e em ações
- Comparar TTK medido vs alvo e tolerância do trecho

**Dependências:** Headless Runtime

**Tecnologias:** Lógica customizada + engine RPG Maker MZ

---

### 3.6 Reporter Layer

**Responsabilidades:**

- Coletar resultados de todas as simulações
- Calcular agregados por trecho (média, p50, p95, max de TTK)
- Gerar warnings (TTK fora da tolerância, troops inexistentes, enemies inválidos)
- Calcular taxa de sucesso (% de troops dentro da tolerância)
- Serializar `report/report.json` com estrutura completa:
  - Metadata (timestamp, seed, projectPath)
  - Summary (tempo execução, warnings, taxa sucesso)
  - Resultados por trecho (TTK, aggregates, warnings)
  - Resultados por troop (TTK, party, skills escolhidas)

**Dependências:** Simulation Layer

**Tecnologias:** Node.js `fs` (writeFileSync), JSON serialization

---

### 3.7 AI Exporter Layer

**Responsabilidades:**

- Dividir JSONs grandes (`Troops.json`, `Enemies.json`, `Skills.json`, `Classes.json`) em arquivos menores por entidade
- Salvar em `report/context/skills/`, `report/context/enemies/`, etc.
- Filtrar apenas IDs usados nos trechos configurados (opcional)
- Organizar em estrutura navegável para ferramentas de IA

**Dependências:** Loader Layer

**Tecnologias:** Node.js `fs`, manipulação de JSON

---

### 3.8 Diagrama de Dependências

```
CLI Layer
  ├─> Config Layer (base)
  ├─> Loader Layer ─> Config Layer
  ├─> Headless Runtime ─> Loader Layer
  ├─> Simulation Layer ─> Headless Runtime
  ├─> Reporter Layer ─> Simulation Layer
  └─> AI Exporter Layer ─> Loader Layer
```

---

## 4. Fluxo de Requisições e de Dados

### 4.1 Fluxo Principal: Validação de TTK

```
1. Usuário executa CLI
   $ node cli.js run-ttk --config project.config.json [--seed 12345]

2. CLI Layer
   - Parse argumentos
   - Aplica seed override (se fornecido)

3. Config Layer
   - Lê project.config.json
   - Valida projectPath, seed, trechos (anchorLevelRange, alvos TTK, tolerâncias)
   - Carrega definições de troops por trecho e party por trecho

4. Loader Layer
   - Valida estrutura do projeto MZ (game.rmmzproject, data/)
   - Carrega data/Classes.json, data/Enemies.json, data/Troops.json, data/Skills.json
   - Valida existência de troopIds e enemyIds
   - Gera warnings para ids inexistentes

5. Headless Runtime
   - Inicializa JSDOM
   - Aplica mocks (PIXI, Graphics, Effekseer, AudioManager)
   - Carrega scripts RPG Maker MZ (rmmz_core.js, rmmz_managers.js, rmmz_objects.js)
   - Carrega plugins VisuStella (Core Engine, Battle Core)
   - Injeta database carregada via fs.readFileSync

6. Simulation Layer (loop por trecho)
   Para cada trecho:
     Para cada troopId no trecho:
       - Configura party (classId + level → deriva skills liberadas via Classes.json learnings)
       - Configura troop (enemyIds do Troops.json)
       - Inicializa batalha (BattleManager.setup)
       - Loop de turnos até vitória/derrota/timeout:
           - Escolhe skill (melhor dano esperado, filtra por HP/MP)
           - Executa ação (Game_Action.apply)
           - Registra turno, ação, dano
       - Calcula TTK em turnos e ações
       - Compara com alvo e tolerância do trecho

7. Reporter Layer
   - Coleta resultados de todas as simulações
   - Calcula agregados por trecho (média, p95 de TTK)
   - Gera warnings (TTK fora da tolerância, troops inexistentes)
   - Serializa report/report.json

8. CLI Layer
   - Exibe resumo no terminal (warnings, trechos validados)
   - Finaliza com exit code 0 (sucesso) ou 1 (warnings críticos)
```

### 4.2 Fluxo Secundário: Export de Contexto para IA

```
1. Usuário executa CLI
   $ node cli.js export-context --config project.config.json

2. Config Layer
   - Lê project.config.json
   - Identifica projectPath

3. Loader Layer
   - Carrega JSONs grandes (Troops.json, Enemies.json, Skills.json, Classes.json)

4. AI Exporter Layer
   - Para cada arquivo grande:
       - Divide em arquivos menores por entidade (um arquivo por skill, enemy, troop)
       - Salva em report/context/skills/, report/context/enemies/, etc.
   - Opcional: filtra apenas ids usados nos trechos configurados

5. CLI Layer
   - Exibe resumo (quantos arquivos gerados, caminho de saída)
```

---

## 5. Modelo de Dados (Alto Nível)

### 5.1 Domínio 1: Configurações (Fonte de Verdade: Repositório do wrapper)

#### ProjectConfig

```json
{
  "projectPath": "/path/to/rpg-maker-mz/project",
  "seed": 12345,
  "trechos": [...]
}
```

**Atributos:**

- `projectPath`: string (caminho absoluto para projeto MZ)
- `seed`: number (seed padrão para determinismo)

**Relações:** 1:N com Trechos

---

#### Trecho

```json
{
  "id": "ato1-nivel1-10",
  "name": "Prólogo e Mundo Comum",
  "anchorLevelRange": { "min": 1, "max": 10 },
  "ttkTarget": { "turns": 3, "actions": 4 },
  "tolerance": { "turns": 1, "actions": 1 },
  "troopIds": [1, 2, 3],
  "party": {...}
}
```

**Atributos:**

- `id`: string (identificador único)
- `name`: string (nome descritivo)
- `anchorLevelRange`: { min: number, max: number } (range de níveis do trecho)
- `ttkTarget`: { turns: number, actions: number } (alvo de TTK)
- `tolerance`: { turns: number, actions: number } (tolerância aceitável)
- `troopIds`: number[] (lista de troops do trecho)
- `party`: PartyConfig

**Relações:** 1:N com TroopIds

---

#### PartyConfig

**MVP v1 (Skills Automáticas por Nível):**

```json
{
  "members": [
    { "classId": 1, "level": 5 },
    { "classId": 2, "level": 5 }
  ]
}
```

**Futuro (Skills Explícitas - Compra em Lojas):**

```json
{
  "members": [
    {
      "classId": 1,
      "level": 5,
      "skillIds": [1, 99, 75, 103]
    }
  ]
}
```

**Atributos (MVP v1):**

- `members`: Array<{ classId: number, level: number }>

**Atributos (Futuro):**

- `members`: Array<{ classId: number, level: number, skillIds?: number[] }>

**Derivação:** No MVP v1, skills liberadas são calculadas em runtime via `Classes.json → learnings` (skills cujo `level ≤ partyMember.level`). No futuro, `skillIds` explícitos permitirão validar diferentes builds de personagens quando skills forem compradas em lojas.

---

### 5.2 Domínio 2: RPG Maker MZ Database (Fonte de Verdade: Projeto MZ, read-only)

#### Class (de Classes.json)

**Estrutura Real:**

```json
{
  "id": 1,
  "name": "Espadachim",
  "note": "",
  "params": [
    [1, 544, 618, ...],  // HP (100 posições)
    [0, 41, 50, ...],    // MP
    [1, 19, 21, ...],    // ATK
    [1, 17, 19, ...],    // DEF
    [1, 15, 17, ...],    // MAT
    [1, 17, 19, ...],    // MDF
    [1, 29, 33, ...],    // AGI
    [1, 27, 31, ...]     // LUK
  ],
  "learnings": [
    { "level": 1, "skillId": 99, "note": "" },
    { "level": 3, "skillId": 75, "note": "" }
  ],
  "traits": [...],
  "expParams": [30, 20, 30, 30]
}
```

**Atributos Principais:**

- `id`: number
- `name`: string
- `note`: string (notetags)
- `params`: number[][] (8 arrays de 100 posições: [HP, MP, ATK, DEF, MAT, MDF, AGI, LUK][0..99])
- `learnings`: Array<{ level: number, skillId: number, note: string }>
- `traits`: Array<{ code: number, dataId: number, value: number }>
- `expParams`: number[4]

---

#### Skill (de Skills.json)

**Estrutura Real:**

```json
{
  "id": 1,
  "name": "Ataque",
  "description": "",
  "note": "",
  "damage": {
    "critical": true,
    "elementId": -1,
    "formula": "a.atk * 4 - b.def * 2",
    "type": 1,
    "variance": 20
  },
  "mpCost": 0,
  "tpCost": 0,
  "tpGain": 5,
  "effects": [
    { "code": 21, "dataId": 0, "value1": 1, "value2": 0 }
  ],
  "animationId": -1,
  "iconIndex": 76,
  "hitType": 1,
  "scope": 1,
  "speed": 0,
  "successRate": 100
}
```

**Atributos Principais:**

- `id`: number
- `name`: string
- `description`: string
- `note`: string (notetags)
- `damage`: { critical: boolean, elementId: number, formula: string, type: number, variance: number }
- `mpCost`: number
- `tpCost`: number
- `tpGain`: number
- `effects`: Array<{ code: number, dataId: number, value1: number, value2: number }>
- Outros: animationId, iconIndex, hitType, scope, speed, successRate

---

#### Enemy (de Enemies.json)

**Estrutura Real:**

```json
{
  "id": 1,
  "name": "Goblin",
  "note": "",
  "battlerName": "Goblin",
  "battlerHue": 0,
  "params": [1, 0, 25, 20, 20, 20, 20, 20],
  "actions": [
    { "skillId": 1, "rating": 5, "conditionType": 0, "conditionParam1": 0, "conditionParam2": 0 },
    { "skillId": 20, "rating": 5, "conditionType": 0, "conditionParam1": 0, "conditionParam2": 0 }
  ],
  "traits": [
    { "code": 22, "dataId": 0, "value": 0.95 }
  ],
  "exp": 10000,
  "gold": 5000,
  "dropItems": [...]
}
```

**Atributos Principais:**

- `id`: number
- `name`: string
- `note`: string
- `battlerName`: string
- `battlerHue`: number
- `params`: number[8] (valores fixos: [HP, MP, ATK, DEF, MAT, MDF, AGI, LUK])
- `actions`: Array<{ skillId: number, rating: number, conditionType: number, conditionParam1: number, conditionParam2: number }>
- `traits`: Array<{ code: number, dataId: number, value: number }>
- `exp`: number
- `gold`: number
- `dropItems`: Array<...>

---

#### Troop (de Troops.json)

**Estrutura Real:**

```json
{
  "id": 1,
  "name": "Goblin*2",
  "members": [
    { "enemyId": 1, "x": 336, "y": 436, "hidden": false },
    { "enemyId": 1, "x": 480, "y": 436, "hidden": false }
  ],
  "pages": [
    {
      "conditions": {...},
      "list": [...],
      "span": 0
    }
  ]
}
```

**Atributos Principais:**

- `id`: number
- `name`: string
- `members`: Array<{ enemyId: number, x: number, y: number, hidden: boolean }>
- `pages`: Array<{ conditions: object, list: array, span: number }> (eventos de batalha)

---

#### Relações no Database MZ

- Troop 1:N Enemy (via `members[].enemyId`)
- Class 1:N Skill (via `learnings[].skillId`)
- Enemy.actions → Skill (via `actions[].skillId`)

---

### 5.3 Domínio 3: Execução e Resultados (Fonte de Verdade: Gerado em runtime)

#### BattleSimulation

```typescript
{
  trecho: Trecho,
  troopId: number,
  seed: number,
  party: Array<{ classId: number, level: number, skills: number[] }>,
  turns: Turn[],
  result: { ttkTurns: number, ttkActions: number, victory: boolean }
}
```

#### Turn

```typescript
{
  turnNumber: number,
  actions: Action[]
}
```

#### Action

```typescript
{
  actor: { type: 'player' | 'enemy', index: number },
  skillId: number,
  target: { type: 'player' | 'enemy', index: number },
  damage: number,
  critical: boolean
}
```

#### TrechoReport

```typescript
{
  trechoId: string,
  results: BattleResult[],
  aggregates: {
    avgTtkTurns: number,
    p95TtkTurns: number,
    avgTtkActions: number,
    p95TtkActions: number
  },
  warnings: Warning[]
}
```

#### Warning

```typescript
{
  type: 'troop_not_found' | 'enemy_not_found' | 'ttk_out_of_tolerance' | 'skill_formula_error' | 'battle_timeout',
  severity: 'critical' | 'warning' | 'info',
  message: string,
  context: object
}
```

#### FinalReport (report.json)

```typescript
{
  timestamp: string,
  seed: number,
  projectPath: string,
  summary: {
    executionTimeMs: number,
    totalTrechos: number,
    totalBattles: number,
    totalWarnings: number,
    warningsByType: object,
    successRate: number,
    peakMemoryMB: number
  },
  trechos: TrechoReport[]
}
```

---

## 6. Interfaces Públicas

### 6.1 Interface CLI - Comando run-ttk

**Protocolo:** Linha de comando (Node.js)
**Exposição:** Local (execução direta no terminal)

```bash
node cli.js run-ttk [options]

Opções:
  --config <path>        Caminho para project.config.json (obrigatório)
  --seed <number>        Override da seed padrão (opcional)
  --trecho <id>          Executar apenas trecho específico (opcional)
  --verbose              Modo verboso com logs detalhados (opcional)
  --diagnostic           Modo diagnóstico para debug (opcional)

Saída:
  - Logs no terminal (progresso, warnings)
  - Arquivo report/report.json
  - Exit code: 0 (sucesso) ou 1 (warnings críticos)
```

**Exemplos:**

```bash
node cli.js run-ttk --config project.config.json --seed 42
node cli.js run-ttk --config project.config.json --trecho ato1-nivel1-10
node cli.js run-ttk --config project.config.json --verbose
```

---

### 6.2 Interface CLI - Comando export-context

**Protocolo:** Linha de comando (Node.js)
**Exposição:** Local

```bash
node cli.js export-context [options]

Opções:
  --config <path>        Caminho para project.config.json (obrigatório)
  --output <path>        Diretório de saída (padrão: report/context/)
  --filter-trechos       Exportar apenas ids usados nos trechos (opcional)

Saída:
  - Arquivos JSON divididos em report/context/skills/, report/context/enemies/, etc.
  - Logs no terminal (quantidade de arquivos gerados)
  - Exit code: 0 (sucesso) ou 1 (erro)
```

**Exemplos:**

```bash
node cli.js export-context --config project.config.json
node cli.js export-context --config project.config.json --filter-trechos
```

---

### 6.3 Interface de Entrada - project.config.json

**Protocolo:** JSON (leitura de arquivo)
**Exposição:** Local (filesystem)

**Estrutura:**

```json
{
  "projectPath": "/Users/edney/projects/coreto/projectX/frontend",
  "seed": 12345,
  "trechos": [
    {
      "id": "ato1-nivel1-10",
      "name": "Prólogo e Mundo Comum",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": { "turns": 1, "actions": 1 },
      "troopIds": [1, 2, 3],
      "party": {
        "members": [
          { "classId": 1, "level": 5 },
          { "classId": 2, "level": 5 }
        ]
      }
    },
    {
      "id": "ato1-nivel10-15",
      "name": "Kravens (dungeon + Cristaleão)",
      "anchorLevelRange": { "min": 10, "max": 15 },
      "ttkTarget": { "turns": 4, "actions": 6 },
      "tolerance": { "turns": 1, "actions": 2 },
      "troopIds": [4, 5, 6, 7],
      "party": {
        "members": [
          { "classId": 1, "level": 12 },
          { "classId": 2, "level": 12 }
        ]
      }
    }
  ]
}
```

---

### 6.4 Interface de Saída - report/report.json

**Protocolo:** JSON (escrita de arquivo)
**Exposição:** Local (filesystem)

**Estrutura (simplificada):**

```json
{
  "timestamp": "2026-01-04T12:00:00Z",
  "seed": 12345,
  "projectPath": "/Users/edney/projects/coreto/projectX/frontend",
  "summary": {
    "executionTimeMs": 589432,
    "totalTrechos": 6,
    "totalBattles": 48,
    "totalWarnings": 3,
    "warningsByType": {
      "ttk_out_of_tolerance": 2,
      "troop_not_found": 1
    },
    "successRate": 93.75,
    "peakMemoryMB": 1024
  },
  "trechos": [
    {
      "trechoId": "ato1-nivel1-10",
      "executionTimeMs": 45230,
      "results": [
        {
          "troopId": 1,
          "troopName": "Goblin*2",
          "ttkTurns": 3,
          "ttkActions": 5,
          "victory": true,
          "party": [
            { "classId": 1, "level": 5, "skills": [1, 99, 75] }
          ],
          "skillsChosen": {
            "0": [1, 1, 99]
          }
        }
      ],
      "aggregates": {
        "avgTtkTurns": 3.2,
        "p95TtkTurns": 4,
        "avgTtkActions": 5.1,
        "p95TtkActions": 7
      },
      "warnings": []
    }
  ]
}
```

---

## 7. Escalabilidade e Disponibilidade

### 7.1 Escalabilidade

#### Escalabilidade de Execução (Horizontal)

**Estratégia:** Paralelização de simulações de batalha por troop usando Node.js Worker Threads ou execução sequencial otimizada

**Justificativa:** Cada simulação de batalha é independente e pode rodar em paralelo

**Limite Esperado:** Até 200 troops por execução (baseado em 6 trechos × ~30-40 troops por trecho estimado)

**Degradação:** Se ultrapassar 10 minutos, permitir execução por subset de trechos via flag `--trecho`

---

#### Escalabilidade de Dados

**Database MZ:**

- Read-only, tamanho típico < 50MB (JSONs)
- Carregado uma única vez no início da execução

**Relatórios:**

- `report.json` pode crescer com histórico
- Estratégia de rotação opcional (manter últimas N execuções)

**Export IA:**

- Arquivos divididos podem chegar a centenas
- Organização por diretórios (skills/, enemies/, troops/)

---

#### Otimizações de Performance

1. **Caching:** Carregar database MZ uma única vez no início da execução
2. **Lazy Loading:** Carregar apenas scripts RPG Maker MZ necessários para simulação (não carregar sistema de mapas, eventos)
3. **Memoization:** Cache de cálculos de dano esperado por skill para evitar reprocessamento

---

### 7.2 Disponibilidade

**Meta de Disponibilidade:** Não aplicável como serviço distribuído

**Características:**

**Execução Local:**

- Sem dependência de rede ou serviços externos
- Roda offline em máquina do designer

**Resiliência:**

- Falha em uma troop não interrompe execução das demais
- Warnings/erros registrados no relatório sem parar o pipeline
- Modo degradado: gerar relatório parcial mesmo com falhas

**Confiabilidade:**

- Execuções determinísticas quando seed fixa (reprodutibilidade 100%)
- Validação de configurações antes de iniciar simulações (fail-fast para erros de config)

---

### 7.3 Metas Quantitativas

| Métrica | Meta | Justificativa |
|---------|------|---------------|
| **Tempo total de execução** | ≤ 10 minutos | Requisito do PRD para ciclo de desenvolvimento rápido |
| **Tempo por batalha** | < 3 segundos | Assumindo ~200 batalhas, 3s × 200 = 600s = 10min |
| **Uso de memória** | < 2GB RAM | Ambiente headless JSDOM + database MZ carregada |
| **Taxa de falha aceitável** | < 5% de troops | Warnings registrados, mas não bloqueiam execução |
| **Reprodutibilidade** | 100% com seed fixa | Determinismo para debug e regressão |

---

### 7.4 Estratégias de Escalabilidade Futuras (Pós MVP v1)

1. **Paralelização:** Worker Threads para simular múltiplas troops simultaneamente
2. **Caching de Resultados:** Cache de TTK por (troopId + partyConfig + seed) para evitar re-simulação
3. **Incremental Execution:** Rodar apenas trechos modificados baseado em diff de configs
4. **CI Integration:** Executar subset de trechos críticos em CI, full suite localmente
5. **Interface Gráfica (Electron):**
   - **Meta:** Criar UI desktop user-friendly com Electron para facilitar configuração de trechos, visualização de relatórios e execução de validações
   - **Recursos planejados:**
     - Editor visual de configurações (trechos, troops, parties, alvos de TTK)
     - Visualização gráfica de resultados (gráficos de TTK, warnings destacados)
     - Execução de validações com feedback em tempo real
     - Histórico de execuções e comparação de relatórios
   - **Arquitetura:** Core engine CLI reutilizado como backend, Electron como frontend
   - **Prioridade:** Pós MVP v1, após validação do core em produção

---

## 8. Segurança

### 8.1 Segurança de Filesystem (Read-Only Enforcement)

**Política:** O sistema NUNCA deve escrever em `data/` do projeto RPG Maker MZ no MVP v1

**Práticas:**

**Validação de Paths:**

- Validar que `projectPath` aponta para diretório válido com estrutura MZ
- Rejeitar paths absolutos que apontem para fora do workspace esperado
- Sanitizar paths para prevenir path traversal (ex: `../../etc/passwd`)

**Read-Only File Operations:**

- Usar apenas `fs.readFileSync()` para arquivos do projeto MZ
- Usar `fs.existsSync()` e `fs.statSync()` para validações
- NUNCA usar `fs.writeFileSync()`, `fs.appendFileSync()`, `fs.unlinkSync()` em `projectPath/data/`

**Write Isolation:**

- Permitir escrita APENAS em `report/` (relatórios e exports)
- Criar `report/` se não existir, mas NUNCA dentro do `projectPath`

---

### 8.2 Validação de Inputs e Configurações

**Política:** Validar rigorosamente todas as entradas antes de processar

**Práticas:**

**project.config.json:**

- Validar schema JSON (usando biblioteca como Joi ou Zod)
- Validar ranges numéricos (seed > 0, levels entre 1-99, troopIds > 0)
- Validar tipos de dados (strings, numbers, arrays)
- Rejeitar configurações com campos desconhecidos (strict mode)

**CLI Arguments:**

- Sanitizar argumentos antes de usar
- Validar que `--seed` é número válido
- Validar que `--trecho` existe nas configurações

**Database MZ:**

- Validar estrutura de JSONs antes de carregar (não assumir formato correto)
- Detectar JSONs corrompidos e reportar erro claro
- Validar ranges de IDs (classId, skillId, enemyId, troopId devem existir)

---

### 8.3 Proteção Contra Code Injection

**Política:** Executar fórmulas de dano em contexto isolado e controlado

**Práticas:**

**Fórmulas de Dano (eval de JavaScript):**

- Executar fórmulas usando contexto limitado (VM2 ou similar para sandbox)
- **MVP v1:** Confiar nas fórmulas do projeto MZ (são do próprio designer)
- **Futuro:** Implementar whitelist de funções permitidas (Math, variáveis `a`, `b`, `v`, `$gameVariables`)
- Detectar timeout em fórmulas que entram em loop infinito (timeout de 100ms por fórmula)

**Plugins VisuStella:**

- Plugins são carregados como-is (confiança no publisher oficial VisuStella)
- Isolar mocks para prevenir que plugins acessem filesystem Node.js
- Plugins não terão acesso a `require()` ou `process` do Node.js

---

### 8.4 Segurança de Dependências

**Política:** Manter dependências atualizadas e auditadas

**Práticas:**

**Auditoria de Dependências:**

- Executar `npm audit` regularmente
- Usar `npm audit fix` para correções automáticas
- Revisar manualmente vulnerabilidades críticas

**Dependências Mínimas:**

- Usar apenas dependências necessárias
- Evitar pacotes abandonados ou sem manutenção
- Preferir bibliotecas nativas do Node.js quando possível

**Lock de Versões:**

- Usar `package-lock.json` para garantir builds determinísticos
- Versionar dependências com ranges conservadores (ex: `^1.2.3` ao invés de `*`)

---

### 8.5 Integridade de Dados

**Política:** Garantir que dados lidos não sejam corrompidos ou manipulados

**Práticas:**

**Checksum/Validação (opcional futuro):**

- Calcular hash (SHA-256) dos arquivos JSON do MZ antes de processar
- Detectar modificações inesperadas durante execução

**Estrutura de Dados:**

- Validar que arrays params em Classes.json têm exatamente 8 elementos
- Validar que learnings contém apenas {level, skillId}
- Reportar warnings para dados mal-formados ao invés de crashar

---

### 8.6 Segurança de Execução Headless

**Política:** Isolar ambiente headless para prevenir side-effects

**Práticas:**

**Isolamento de Globals:**

- Não poluir `global` do Node.js com objetos do RPG Maker
- Usar contextos isolados (JSDOM com sandbox)

**Prevenção de Acesso ao Sistema:**

- Mocks (PIXI, Graphics, Effekseer) não devem permitir acesso a `fs`, `child_process`, `net`
- Plugins carregados não devem ter acesso a APIs sensíveis do Node.js

---

### 8.7 Matriz de Ameaças e Mitigações

| Ameaça | Probabilidade | Impacto | Mitigação |
|--------|---------------|---------|-----------|
| **Escrita acidental em data/ do MZ** | Média | Alto | Read-only enforcement via code review + testes |
| **Path traversal via projectPath** | Baixa | Médio | Validação de paths + sanitização |
| **Code injection via fórmulas** | Baixa | Médio | Timeout + whitelist de funções (futuro) |
| **Dependências vulneráveis** | Média | Médio | npm audit + updates regulares |
| **Corrompimento de JSONs do MZ** | Baixa | Alto | Validação de schema + fail-fast |
| **Loop infinito em fórmulas** | Média | Baixo | Timeout de 100ms por fórmula |

---

## 9. Observabilidade

### 9.1 Logging Estruturado

#### Níveis de Log

- **ERROR:** Falhas críticas (projeto MZ inválido, JSON corrompido, falha de inicialização)
- **WARN:** Warnings de validação (troopId inexistente, TTK fora da tolerância, timeout de fórmula)
- **INFO:** Progresso normal (trecho iniciado, batalha completada, relatório gerado)
- **DEBUG:** Detalhes técnicos (scripts carregados, mocks aplicados, fórmulas avaliadas)
- **TRACE (verbose mode):** Logs extremamente detalhados (cada turno, cada ação, cada cálculo de dano)

#### Formato de Log

```
[TIMESTAMP] [LEVEL] [COMPONENT] Mensagem

Exemplos:
[2026-01-04T12:34:56Z] [INFO] [CLI] Iniciando validação de TTK com seed 12345
[2026-01-04T12:34:57Z] [INFO] [Loader] Carregando projeto de /path/to/project
[2026-01-04T12:34:58Z] [INFO] [Simulation] Trecho: ato1-nivel1-10 (3 troops)
[2026-01-04T12:34:59Z] [INFO] [Simulation]   - Troop 1 (Goblin*2): TTK 3 turnos / 5 ações ✓
[2026-01-04T12:35:00Z] [WARN] [Simulation]   - Troop 2 (Gnomo*2): TTK 5 turnos (alvo: 3±1) ⚠
[2026-01-04T12:35:01Z] [INFO] [Simulation]   - Troop 3 (Corvo*2): TTK 2 turnos / 4 ações ✓
[2026-01-04T12:35:02Z] [INFO] [Reporter] Relatório gerado: report/report.json
```

#### Output

- **Terminal (stdout):** Logs INFO e acima (ERROR, WARN, INFO)
- **Arquivo (opcional futuro):** `logs/validation-{timestamp}.log` com todos os níveis
- **Modo Verbose:** `--verbose` ativa DEBUG e TRACE

---

### 9.2 Métricas de Execução

| Métrica | Descrição | Onde Registrar |
|---------|-----------|----------------|
| **Tempo Total de Execução** | Duração da validação completa | Terminal + report.json (summary.executionTimeMs) |
| **Tempo por Trecho** | Duração de cada trecho | report.json (trechos[].executionTimeMs) |
| **Tempo por Batalha** | Duração de cada simulação de troop | report.json (results[].executionTimeMs) |
| **TTK por Troop** | Turnos e ações para vitória | report.json (results[].ttkTurns, ttkActions) |
| **TTK Agregado** | Média, p50, p95, max por trecho | report.json (trechos[].aggregates) |
| **Warnings Totais** | Quantidade de warnings por tipo | Terminal + report.json (summary.warningsByType) |
| **Taxa de Sucesso** | % de troops dentro da tolerância | report.json (summary.successRate) |
| **Uso de Memória (heap)** | Pico de memória durante execução | report.json (summary.peakMemoryMB) |

#### Formato no report.json

```json
{
  "summary": {
    "executionTimeMs": 589432,
    "totalTrechos": 6,
    "totalBattles": 48,
    "totalWarnings": 3,
    "warningsByType": {
      "ttk_out_of_tolerance": 2,
      "troop_not_found": 1
    },
    "successRate": 93.75,
    "peakMemoryMB": 1024
  }
}
```

---

### 9.3 Tracing de Pipeline

**Pontos de Instrumentação:**

```
1. CLI Start
   └─> 2. Config Load
       └─> 3. Project Validation
           └─> 4. Headless Initialization
               └─> 5. For Each Trecho:
                   └─> 6. For Each Troop:
                       └─> 7. Battle Setup
                           └─> 8. Turn Loop (até vitória/derrota)
                               └─> 9. TTK Calculation
                   └─> 10. Trecho Report
               └─> 11. Final Report Generation
   └─> 12. CLI Exit
```

**Logs de Trace Points:**

```
[INFO] [CLI] [1] Pipeline iniciado
[INFO] [Config] [2] Configuração carregada: 6 trechos
[INFO] [Loader] [3] Projeto validado: /path/to/project
[DEBUG] [Runtime] [4] JSDOM inicializado, mocks aplicados
[INFO] [Simulation] [5] Processando trecho 1/6: ato1-nivel1-10
[DEBUG] [Simulation] [6] Batalha 1/3: Troop 1 (Goblin*2)
[DEBUG] [Simulation] [7] Party: [Espadachim Lv5, Mago Lv5]
[TRACE] [Simulation] [8] Turno 1: Espadachim usa Ataque → Goblin#0 (-42 HP)
[DEBUG] [Simulation] [9] TTK calculado: 3 turnos, 5 ações
[INFO] [Reporter] [11] Relatório final gerado
[INFO] [CLI] [12] Execução concluída em 9m 49s
```

---

### 9.4 Warnings e Alertas

#### Tipos de Warnings

**1. ttk_out_of_tolerance:**

- **Quando:** TTK medido fora do range (target ± tolerance)
- **Severidade:** WARNING
- **Ação:** Registrar no relatório, não bloquear execução
- **Exemplo:** `Troop 2 (Gnomo*2): TTK 5 turnos (esperado: 3±1)`

**2. troop_not_found:**

- **Quando:** troopId configurado não existe em Troops.json
- **Severidade:** CRITICAL
- **Ação:** Registrar no relatório, pular troop
- **Exemplo:** `TroopId 999 não encontrado em Troops.json`

**3. enemy_not_found:**

- **Quando:** enemyId de uma troop não existe em Enemies.json
- **Severidade:** CRITICAL
- **Ação:** Registrar no relatório, pular troop
- **Exemplo:** `Troop 5 referencia EnemyId 88 (não encontrado)`

**4. skill_formula_error:**

- **Quando:** Fórmula de dano causa exceção ou timeout
- **Severidade:** ERROR
- **Ação:** Registrar no relatório, usar dano fallback (0 ou valor fixo)
- **Exemplo:** `Skill 99: Fórmula inválida (ReferenceError: x is not defined)`

**5. battle_timeout:**

- **Quando:** Batalha ultrapassa limite de turnos (ex: 100 turnos)
- **Severidade:** ERROR
- **Ação:** Registrar no relatório, considerar derrota
- **Exemplo:** `Troop 7: Timeout após 100 turnos (possível loop infinito)`

#### Estrutura de Warning no report.json

```json
"warnings": [
  {
    "type": "ttk_out_of_tolerance",
    "severity": "warning",
    "message": "TTK fora da tolerância",
    "context": {
      "trechoId": "ato1-nivel1-10",
      "troopId": 2,
      "troopName": "Gnomo*2",
      "ttkTurns": 5,
      "targetTurns": 3,
      "toleranceTurns": 1
    }
  }
]
```

---

### 9.5 Relatório de Execução (report.json)

**Seções do Relatório:**

1. **Metadata:** timestamp, seed, projectPath, configVersion
2. **Summary:** Métricas agregadas (tempo, warnings, taxa de sucesso)
3. **Trechos:** Detalhes por trecho (resultados, aggregates, warnings)
4. **Results:** Detalhes por batalha (TTK, party, skills escolhidas, turnos)
5. **Diagnostics (modo verbose):** Scripts carregados, mocks aplicados, versões de dependências

---

### 9.6 Modo Diagnóstico

**Flag:** `--diagnostic`

**Objetivo:** Debug de inicialização headless e carregamento de plugins

**Logs adicionais:**

```
[DEBUG] [Runtime] Scripts carregados:
  - rmmz_core.js (v1.8.0)
  - rmmz_managers.js
  - rmmz_objects.js
[DEBUG] [Runtime] Mocks aplicados:
  - PIXI.Container
  - Graphics.initialize
  - Effekseer.initRuntime
[DEBUG] [Runtime] Plugins carregados:
  - VisuMZ_0_CoreEngine (v1.81)
  - VisuMZ_1_BattleCore (v1.81)
[DEBUG] [Runtime] Database carregada:
  - Classes: 10 entradas
  - Skills: 200 entradas
  - Enemies: 50 entradas
  - Troops: 30 entradas
```

---

## 10. Riscos Arquiteturais e Mitigação

### 10.1 Risco 1: Harness Headless Incompatível com Plugins ou Atualizações

**Descrição:** O ambiente headless (JSDOM + mocks) pode falhar ao carregar plugins VisuStella ou versões futuras do RPG Maker MZ devido a dependências não mockadas (PIXI.js, Effekseer, WebGL, Canvas).

**Probabilidade:** Alta
**Impacto:** Bloqueio total do workflow de validação de TTK

**Mitigações:**

1. **Implementação Prioritária de Test Handlers:**
   - Seguir estritamente a pesquisa "Balanceamento Determinístico RPG Maker MZ"
   - Implementar mocks base: JSDOM, PIXI (Container, Sprite), Graphics, Effekseer, AudioManager
   - Usar `jest-canvas-mock` para evitar erros de Canvas

2. **Isolamento de Mocks:**
   - Criar módulos separados para cada mock (PIXI.mock.js, Graphics.mock.js)
   - Facilitar ajustes quando plugins exigirem novos métodos

3. **Modo Diagnóstico:**
   - Flag `--diagnostic` para imprimir scripts carregados e mocks aplicados
   - Logs detalhados de falhas de inicialização

4. **Testes de Integração:**
   - Suite de testes que valida inicialização headless com plugins VisuStella
   - Detectar quebras antes de afetar validação de TTK

**Plano de Contingência:**

- **Curto Prazo:** Rodar em modo limitado detectando apenas falhas de carregamento e gerar relatório parcial
- **Médio Prazo:** Criar versão "sandbox" que roda engine real em modo headless via Electron (sem UI, mas com runtime completo)
- **Longo Prazo:** Isolar simulação de batalha em módulo independente que não depende de renderização

---

### 10.2 Risco 2: Simulação Diverge do Jogo Real por Fatores Não Modelados

**Descrição:** A simulação headless pode divergir do jogo final devido a mecânicas não implementadas (estados, buffs complexos, IA de inimigos avançada, plugins customizados), gerando warnings falsos ou ausência de warnings em regressões reais.

**Probabilidade:** Média
**Impacto:** Warnings falsos ou ausência de detecção de regressões

**Mitigações:**

1. **Seed Fixa e Determinismo:**
   - Aplicar seed ao `Math.random` do ambiente headless
   - Registrar seed no relatório para reprodutibilidade

2. **Registro de Escolhas:**
   - Registrar skills escolhidas por personagem em cada turno
   - Registrar sequência de RNG (hits, críticos, variance)

3. **Calibração com Cenários de Referência:**
   - Criar "batalhas de referência" jogadas manualmente
   - Comparar TTK manual vs TTK headless
   - Ajustar regras de escolha de skill até convergência

4. **Escopo Incremental:**
   - MVP v1: Apenas HP/MP para escolha de skills
   - Futuro: Adicionar restrições de cooldown, TP, AP, custos múltiplos

**Plano de Contingência:**

- **Curto Prazo:** Reduzir escopo para validação de dano por ação (usando engine) sem simular batalha completa
- **Médio Prazo:** Aumentar cobertura gradualmente, adicionando mecânicas conforme validadas
- **Longo Prazo:** Criar modo "playtest assistido" onde designer joga batalhas críticas e wrapper compara com simulação

---

### 10.3 Risco 3: Performance Não Atinge Meta de 10 Minutos

**Descrição:** A execução de simulações pode ultrapassar 10 minutos devido a número elevado de troops, turnos longos, ou overhead de JSDOM, impactando adoção pelos designers.

**Probabilidade:** Média
**Impacto:** Baixa adoção da ferramenta pelo time de game design
**Prioridade:** Baixa (não é prioridade crítica no MVP v1)

**Mitigações:**

1. **Medição e Profiling:**
   - Medir tempo por trecho e por troop
   - Identificar gargalos (carregamento, simulação de turnos, cálculo de dano)

2. **Otimizações de Carregamento:**
   - Carregar database MZ uma única vez no início
   - Lazy loading de scripts RPG Maker (não carregar sistema de mapas/eventos)

3. **Paralelização (Futuro):**
   - Usar Node.js Worker Threads para rodar troops em paralelo
   - Cada worker simula subset de troops

4. **Execução Seletiva:**
   - Flag `--trecho <id>` para rodar apenas subset
   - Permitir rodar trechos críticos em CI, full suite localmente

**Plano de Contingência:**

- **Curto Prazo:** Reduzir número de simulações por troop (ex: 1 simulação ao invés de Monte Carlo com N repetições)
- **Médio Prazo:** Priorizar trechos críticos, executar trechos menos críticos sob demanda
- **Longo Prazo:** Implementar cache de resultados por (troopId + partyConfig + seed) para evitar re-simulação

---

### 10.4 Risco 4: Adição de Novos Plugins VisuStella que Influenciam Batalhas

**Descrição:** Projeto pode adicionar novos plugins VisuStella (ex: Break Shields, Boost Points, State Tooltips) que introduzem mecânicas que afetam TTK mas não são suportadas pelo harness headless, causando divergência entre simulação e jogo real.

**Probabilidade:** Média
**Impacto:** Médio (divergência de resultados, warnings imprecisos)

**Mitigações:**

1. **Documentação de Plugins Suportados:**
   - Manter lista de plugins VisuStella suportados e suas versões
   - Indicar no relatório quais plugins foram detectados e quais são ignorados

2. **Detecção de Plugins Não Suportados:**
   - Ao inicializar, listar plugins carregados do projeto MZ
   - Gerar warning se plugin crítico para batalha não está mockado

3. **Extensibilidade do Harness:**
   - Arquitetura modular permite adicionar suporte a novos plugins
   - Criar guia de "Como adicionar suporte a novo plugin"

4. **Modo de Compatibilidade:**
   - Registrar no relatório quais mecânicas foram ignoradas
   - Permitir que designer aceite divergências conhecidas

**Plano de Contingência:**

- **Curto Prazo:** Documentar limitações conhecidas (quais plugins não são suportados)
- **Médio Prazo:** Adicionar suporte incremental aos plugins mais críticos (ex: Break Shields)
- **Longo Prazo:** Criar framework de "adapters" para plugins customizados

---

### 10.5 Risco 5: Complexidade de Manutenção do Harness Headless

**Descrição:** Manter mocks sincronizados com evolução do RPG Maker MZ e plugins pode consumir esforço desproporcional ao valor entregue.

**Probabilidade:** Média
**Impacto:** Alto custo de manutenção, fragilidade da ferramenta

**Mitigações:**

1. **Arquitetura Modular:**
   - Isolar mocks em módulos separados
   - Facilitar substituição de mocks sem reescrever core

2. **Documentação Técnica:**
   - Documentar cada mock (o que faz, por que existe, quando atualizar)
   - Criar guia de "Como adicionar novo mock"

3. **Automação de Testes:**
   - Testes automatizados validam que mocks funcionam
   - CI detecta quebras antes de afetar designers

**Plano de Contingência:**

- **Curto Prazo:** Aceitar custo de manutenção como investimento no ciclo de desenvolvimento
- **Médio Prazo:** Avaliar adoção de soluções alternativas (Puppeteer com RPG Maker MZ em browser headless)
- **Longo Prazo:** Contribuir com comunidade RPG Maker para criar API oficial de testes headless

---

### 10.6 Matriz de Riscos Consolidada

| Risco | Probabilidade | Impacto | Prioridade | Status Mitigação |
|-------|---------------|---------|------------|------------------|
| Harness headless incompatível | Alta | Bloqueio | Crítica | Implementar mocks base no MVP |
| Simulação diverge do jogo real | Média | Médio | Alta | Seed fixa + calibração |
| Performance > 10 minutos | Média | Médio | Baixa | Medição + otimizações |
| Adição de novos plugins VisuStella | Média | Médio | Média | Documentação + detecção |
| Manutenção complexa | Média | Alto | Média | Modularização + docs |

---

## 11. Próximos Passos

### 11.2 Próximos Passos (Roadmap de Implementação)

#### Fase 1: Foundation (MVP v1 - Core)

**Prioridade:** Crítica
**Estimativa:** 4-6 semanas

1. **Setup de Projeto:**
   - Inicializar repositório Node.js (TypeScript)
   - Configurar Jest + JSDOM
   - Estrutura de diretórios (src/, tests/, config/, report/)

2. **Config Layer:**
   - Parser de `project.config.json`
   - Validação de schema (Zod ou Joi)
   - Testes unitários de validação

3. **Loader Layer:**
   - Carregamento de JSONs do MZ (`Classes.json`, `Skills.json`, `Enemies.json`, `Troops.json`)
   - Validação de existência de IDs
   - Geração de warnings para inconsistências

4. **Headless Runtime (Test Handlers):**
   - Setup JSDOM
   - Mocks base: PIXI, Graphics, Effekseer, AudioManager
   - Carregamento síncrono da database via `fs.readFileSync`
   - Carregamento de scripts RPG Maker MZ (rmmz_core, rmmz_managers, rmmz_objects)
   - Carregamento de plugins VisuStella (Core Engine, Battle Core)
   - Testes de integração: validar que engine inicializa sem erros

---

#### Fase 2: Simulation Engine

**Prioridade:** Crítica
**Estimativa:** 3-4 semanas

1. **Simulation Layer:**
   - Implementar escolha de skill por melhor dano esperado (HP/MP apenas)
   - Orquestrar execução de batalha via `BattleManager.setup` e loop de turnos
   - Aplicar seed para determinismo
   - Medir TTK em turnos e ações
   - Testes unitários de simulação

2. **Reporter Layer:**
   - Coletar resultados por troop e por trecho
   - Calcular agregados (média, p95 de TTK)
   - Comparar TTK vs alvo e tolerância
   - Gerar warnings
   - Serializar `report/report.json`
   - Testes de geração de relatório

---

#### Fase 3: CLI e Export IA

**Prioridade:** Alta
**Estimativa:** 1-2 semanas

1. **CLI Layer:**
   - Comandos: `run-ttk`, `export-context`
   - Flags: `--config`, `--seed`, `--trecho`, `--verbose`, `--diagnostic`
   - Logs estruturados no terminal
   - Exit codes (0 sucesso, 1 erro)

2. **AI Exporter Layer:**
   - Dividir JSONs grandes em arquivos menores por entidade
   - Organização em `report/context/skills/`, `report/context/enemies/`, etc.
   - Filtro opcional por IDs usados nos trechos

---

#### Fase 4: Validação e Calibração

**Prioridade:** Alta
**Estimativa:** 2-3 semanas

1. **Testes de Integração End-to-End:**
   - Cenários de referência (batalhas jogadas manualmente)
   - Comparação TTK manual vs TTK headless
   - Ajustes de algoritmo de escolha de skill

2. **Documentação:**
    - README: Como instalar e executar
    - Guia de configuração de trechos
    - Troubleshooting de erros comuns
    - Documentação de limitações conhecidas

---

#### Fase 5: Pós MVP v1 (Futuro)

**Prioridade:** Média/Baixa

1. **Interface Electron:**
    - Editor visual de configurações
    - Visualização gráfica de relatórios
    - Histórico de execuções

2. **CI Integration:**
    - GitHub Actions workflow
    - Execução automática em PRs
    - Bloquear merge se TTK regredir

3. **Expansão de Mecânicas:**
    - Suporte a TP, cooldowns, custos múltiplos
    - Configuração explícita de `skillIds` (compra de skills em lojas)
    - Simulação de uso de potions e itens de cura

4. **Performance:**
    - Paralelização com Worker Threads
    - Cache de resultados por (troopId + partyConfig + seed)
    - Execução incremental (apenas trechos modificados)

---

## Referências

- **PRD:** `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`
- **Validação Determinística:** `docs/planilhaMestraSoftware.md`
- **Pesquisas:**
  - `docs/pesquisas/Software-Similar-Planilha-Mestra.md`
  - `docs/pesquisas/RPG-Maker-MZ_Design-Combate.md`
  - `docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`

---

**Fim do Documento**
