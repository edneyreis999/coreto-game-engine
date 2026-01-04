# Architecture Decision Records (ADRs)

Este diretório contém todas as decisões arquiteturais do projeto Coreto Game Engine, documentadas usando o formato MADR (Markdown Architecture Decision Records).

## Navegação Rápida

- **[INDEX.md](INDEX.md)** - Índice completo de todas as 28 ADRs com resumos e cross-references

## Estrutura

```
docs/adrs/
├── README.md              # Este arquivo
├── INDEX.md              # Índice completo com tabelas e cross-references
├── CLI/                  # 1 ADR - Command-line interface
├── CONFIG/               # 3 ADRs - Configuration, validation, type system
├── DOCS/                 # 4 ADRs - Documentation standards
├── FOUNDATION/           # 3 ADRs - Core architectural principles
├── REPORTER/             # 4 ADRs - Report generation
├── RUNTIME/              # 6 ADRs - Headless runtime environment
└── SIMULATION/           # 7 ADRs - Battle simulation mechanics
```

**Total: 28 ADRs** organizadas por módulo do sistema.

## ADRs por Módulo

### CLI (1 ADR)
- **ADR-007**: Oclif CLI Framework

### CONFIG (3 ADRs)
- **ADR-008**: Schema Validation Library - Zod
- **ADR-021**: JSON-Based Configuration Format
- **ADR-028**: TypeScript as Primary Implementation Language

### DOCS (4 ADRs)
- **ADR-009**: Markdown as Primary Documentation Format
- **ADR-010**: Three-Layer Documentation Architecture
- **ADR-022**: Documentation-Before-Implementation Greenfield Approach
- **ADR-023**: MADR-Inspired Lightweight ADR Format

### FOUNDATION (3 ADRs)
Princípios arquiteturais fundamentais do projeto:
- **ADR-001**: Wrapper Read-Only (nunca escreve em data/ do RPG Maker MZ)
- **ADR-005**: Referências ao Banco MZ por ID
- **ADR-006**: Sem UI e Sem CI no MVP

### REPORTER (4 ADRs)
- **ADR-011**: JSON File-Based Report Output Format
- **ADR-012**: Statistical Aggregation Metrics
- **ADR-013**: Typed Warning System with Severity Levels
- **ADR-024**: Synchronous File Write Strategy for Report Output

### RUNTIME (6 ADRs)
Ambiente de execução headless:
- **ADR-003**: Fidelidade Batalha Real Engine Headless
- **ADR-014**: JSDOM Browser Emulation for Headless Runtime
- **ADR-015**: Graphics Mocking Strategy for Headless Runtime
- **ADR-016**: Synchronous Database Loading Override
- **ADR-025**: Diagnostic Mode for Headless Initialization Troubleshooting
- **ADR-026**: jest-canvas-mock Library for Canvas API Stubbing

### SIMULATION (7 ADRs)
Mecânicas de simulação de batalha:
- **ADR-002**: Progressão de Skills - Automática vs Manual
- **ADR-004**: Escolha de Skills - HP/MP MVP
- **ADR-017**: Battle Termination Conditions with Timeout Safety
- **ADR-018**: Seed-Controlled Determinism for RNG
- **ADR-019**: Damage-Per-Action Maximization for Skill Selection
- **ADR-020**: Dual-Metric TTK Measurement (Turns and Actions)
- **ADR-027**: Level-Based Skill Derivation from Class Learnings

## Formato das ADRs

Todas as ADRs seguem o formato MADR com 7 seções obrigatórias:

1. **Context and Problem Statement** - Contexto e problema
2. **Decision Drivers** - Fatores que influenciam a decisão
3. **Considered Options** - Alternativas consideradas
4. **Decision Outcome** - Decisão escolhida
5. **Pros and Cons of the Options** - Prós e contras de cada opção
6. **Consequences** - Consequências (positivas, negativas, neutras)
7. **References** - Referências a documentação e código

## Como Usar

### Consultar Decisões Existentes
1. Consulte [INDEX.md](INDEX.md) para visão geral
2. Use a seção "Key Cross-References" para entender cadeias de decisões
3. Navegue diretamente para ADRs específicas por número

### Propor Nova ADR
1. Identifique se a decisão é arquitetural (afeta estrutura, padrões, tecnologias)
2. Verifique se já existe ADR relacionada no INDEX.md
3. Determine o módulo apropriado (CLI, CONFIG, DOCS, FOUNDATION, REPORTER, RUNTIME, SIMULATION)
4. Crie nova ADR seguindo numeração sequencial (próxima: ADR-029) no diretório do módulo
5. Siga o formato MADR com todas as 7 seções
6. Atualize INDEX.md e README.md com nova entrada

### Atualizar ADR Existente
- **Mudanças menores**: Edite diretamente e documente no histórico git
- **Mudanças significativas**: Crie nova ADR que "amends" ou "supersedes" a anterior
- **Deprecação**: Marque Status como "Deprecated" e referencie ADR substituta

## Estatísticas

- **Total de ADRs**: 28
- **Status**: 100% Accepted (projeto em fase de design pré-implementação)
- **Módulos Documentados**: 7 (CLI, CONFIG, DOCS, FOUNDATION, REPORTER, RUNTIME, SIMULATION)
- **Período**: 2026-01-04 (criação em lote durante fase de planejamento)

## Processo de Geração

As ADRs foram criadas através de um processo sistemático em 4 fases:

1. **Phase 1 - Mapping**: Análise completa do codebase e documentação
2. **Phase 2 - Identification**: Identificação de 16 potenciais ADRs através de análise modular
3. **Phase 3 - Generation**: Geração de 27 ADRs formais organizadas por prioridade
4. **Phase 4 - Completion**: Entrevista com stakeholders para preencher gaps + refinamento final

Todos os artefatos temporários (mapping.md, potential-adrs/) foram removidos após conclusão.

## Links Úteis

- **Documentação Fonte**:
  - [PRD](../PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md)
  - [HLD](../hld-coreto-game-engine.md)
  - [Research](../pesquisas/)

- **Ferramentas**:
  - Plugin ADR Management (usado para geração)
  - MADR Template (formato padrão)

---

**Última Atualização**: 2026-01-04
**Responsável**: Arquitetura do Projeto Coreto Game Engine
