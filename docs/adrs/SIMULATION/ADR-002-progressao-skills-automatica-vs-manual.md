# ADR-002: Progressão de Skills - Automática vs Manual

**Status:** Decidido para MVP v1, Evolução Planejada
**Data:** 2026-01-04
**Contexto:** No MVP, skills são aprendidas por nível (via `Classes.json → learnings`). No futuro, o jogo implementará sistema de compra de skills em lojas, exigindo configuração manual de skills por trecho.

## Contexto e Problema

O sistema precisa determinar quais skills cada personagem tem disponível durante a simulação de combate. Há duas abordagens possíveis:

1. **Derivação automática**: calcular skills baseado no nível da classe
2. **Configuração explícita**: designer especifica exatamente quais skills cada personagem possui

## Decisão

### MVP v1 (Atual)

Skills derivadas **automaticamente** do nível da classe. Sistema calcula quais skills estão liberadas baseado em `learnings[].level ≤ partyMember.level`.

```json
"party": {
  "members": [
    { "classId": 1, "level": 5 }  // Skills automáticas
  ]
}
```

### Futuro (Pós MVP)

Permitir configuração **explícita** de `skillIds` por membro da party no config de trecho para validar diferentes builds quando skills forem compradas em lojas.

```json
"party": {
  "members": [
    {
      "classId": 1,
      "level": 5,
      "skillIds": [1, 99, 75, 103]  // Skills explícitas
    }
  ]
}
```

## Consequências

### MVP v1

- ✅ Configuração simples e rápida (apenas classId + level)
- ✅ Alinhado com sistema atual de learnings do RPG Maker
- ✅ Menos chance de erro de configuração

### Futuro

- ✅ Flexibilidade para validar diferentes builds de personagens
- ✅ Suporte para sistemas de compra de skills em lojas
- ⚠️ Mudança no modelo de dados: adicionar campo opcional `skillIds` em `PartyConfig.members`

## Alternativas Consideradas

**Sempre usar configuração explícita desde o MVP**
Rejeitado por aumentar complexidade de configuração sem valor imediato, já que o jogo atual usa learnings automáticas.

## Referências

- HLD Seção 5.1: PartyConfig
- PRD FR-004: Definição de party por classes e níveis
