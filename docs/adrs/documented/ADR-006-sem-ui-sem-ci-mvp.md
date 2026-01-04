# ADR-006: Sem UI e Sem CI no MVP v1

**Status:** Decidido para MVP v1
**Data:** 2026-01-04
**Contexto:** Reduzir escopo e focar na execução determinística e nos relatórios

## Contexto e Problema

O sistema poderia incluir desde o início:

1. **Interface gráfica (Electron)**: Editor visual de configs, visualização de gráficos TTK, etc.
2. **Integração com CI**: Executar validações automaticamente em PRs, bloquear merges com regressões
3. **CLI puro**: Apenas linha de comando, configs manuais

A questão é: qual superfície de interface entregar no MVP?

## Decisão

### MVP v1 (Atual)

MVP v1 é **CLI puro** (Node.js), sem interface gráfica e sem integração com CI.

```bash
# Execução manual via CLI
node cli.js run-ttk --config project.config.json --seed 42
node cli.js export-context --config project.config.json
```

### Futuro (Pós MVP)

Adicionar **UI Electron e integração com CI** após validação do core.

#### UI Electron (Planejado)
- Editor visual de configurações (trechos, troops, parties, alvos de TTK)
- Visualização gráfica de resultados (gráficos de TTK, warnings destacados)
- Execução de validações com feedback em tempo real
- Histórico de execuções e comparação de relatórios

#### CI Integration (Planejado)
- GitHub Actions workflow
- Execução automática em PRs
- Bloquear merge se TTK regredir além da tolerância

## Consequências

### Positivas

- ✅ Desenvolvimento mais rápido (menor superfície de código)
- ✅ Foco em core value (validação determinística)
- ✅ Arquitetura core será reutilizada pela UI futura
- ✅ Permite validar valor da ferramenta antes de investir em UI

### Negativas

- ❌ Exige configuração manual via arquivos JSON
- ❌ Execução manual dos testes (sem automação em CI)
- ❌ Curva de aprendizado maior para designers não técnicos
- ❌ Relatórios em JSON são menos acessíveis que visualizações gráficas

## Priorização

**Por que MVP v1 é CLI?**

1. **Time-to-value**: CLI entrega validação determinística em 4-6 semanas vs 12+ semanas com UI
2. **Validação de conceito**: Provar que harness headless funciona antes de investir em UX
3. **Arquitetura reutilizável**: Core engine CLI será backend da UI Electron futura

## Próximos Passos

### Pós MVP v1 (Roadmap)

**Interface Electron (Prioridade Alta)**
- Estimativa: 4-6 semanas
- Meta: User-friendly para designers não técnicos
- Recursos: Editor visual, gráficos, histórico

**CI Integration (Prioridade Média)**
- Estimativa: 2-3 semanas
- Meta: Automação em PRs, detecção de regressões
- Recursos: GitHub Actions, comentários em PR

## Referências

- HLD Seção 7.4: Estratégias de Escalabilidade Futuras
- HLD Seção 11.2: Próximos Passos - Fase 5
- PRD: Fora de escopo (MVP v1)
