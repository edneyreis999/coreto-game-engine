# Postmortems

Registro de incidentes, problemas técnicos e suas resoluções documentadas para aprendizado futuro.

## Índice

| ID | Título | Severidade | Data | Status |
|----|--------|------------|------|--------|
| [PM-001](./PM-001-better-sqlite3-abi-mismatch.md) | better-sqlite3 NODE_MODULE_VERSION Mismatch | High | 2026-01-31 | Resolved |

## Formato

Cada postmortem segue a estrutura:

1. **Executive Summary** - Resumo executivo do problema e solução
2. **Impact** - Áreas afetadas e severidade
3. **Timeline** - Sequência cronológica dos eventos
4. **Root Cause Analysis** - Análise técnica da causa raiz
5. **Resolution** - Solução implementada com detalhes técnicos
6. **Lessons Learned** - Aprendizados para evitar recorrência
7. **Action Items** - Tarefas pendentes decorrentes do incidente
8. **References** - Links para documentação e issues relacionadas

## Quando Criar um Postmortem

- Incidentes que bloqueiam desenvolvimento por mais de 2 horas
- Problemas que afetam múltiplos desenvolvedores
- Bugs em produção com impacto em usuários
- Descobertas técnicas não-óbvias que merecem documentação
- Qualquer situação onde "eu gostaria de ter sabido disso antes"
