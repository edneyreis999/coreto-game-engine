# ADR-005: Referências ao Banco MZ por ID Numérico

**Status:** Decidido
**Data:** 2026-01-04
**Contexto:** Reduzir ambiguidade e simplificar validação automática contra `data/*.json`

## Contexto e Problema

O sistema precisa referenciar entidades do banco RPG Maker MZ (classes, skills, enemies, troops). Há duas abordagens:

1. **Por nome**: Usar nomes legíveis (ex: "Espadachim", "Ataque", "Goblin")
2. **Por ID numérico**: Usar IDs do banco (ex: classId=1, skillId=99, enemyId=1)

## Decisão

Configurações e relatórios usam **sempre IDs numéricos** (`classId`, `skillId`, `enemyId`, `troopId`) ao invés de nomes.

### Exemplos

**Configuração de Trecho:**
```json
{
  "troopIds": [1, 2, 3],
  "party": {
    "members": [
      { "classId": 1, "level": 5 },
      { "classId": 2, "level": 5 }
    ]
  }
}
```

**Validação:**
```typescript
// Validar se troopId existe em Troops.json
if (!troops[troopId]) {
  warnings.push({
    type: 'troop_not_found',
    message: `TroopId ${troopId} não encontrado em Troops.json`
  });
}
```

## Consequências

### Positivas

- ✅ Validação automática simples (verificar existência de ID em JSON)
- ✅ Sem ambiguidade (nomes podem duplicar, IDs não)
- ✅ Compatível com estrutura nativa do RPG Maker MZ
- ✅ Permite renomear entidades no editor sem quebrar configs

### Negativas

- ❌ Configs e relatórios menos legíveis sem resolução de nomes
- ⚠️ Pode requerer passo extra de "resolver IDs → nomes" para UI futura
- ❌ Designer precisa consultar banco do MZ para encontrar IDs

## Mitigação

Para melhorar legibilidade dos relatórios, o sistema inclui **tanto ID quanto nome** nas saídas:

```json
{
  "troopId": 1,
  "troopName": "Goblin*2",
  "results": [...]
}
```

## Alternativas Consideradas

**Usar nomes + fallback para ID**
Rejeitado por ambiguidade. Se dois inimigos tiverem o mesmo nome, o sistema não saberia qual usar. Além disso, renomear uma entidade no editor quebraria todas as configurações.

**Usar nomes como primary + validação contra duplicatas**
Rejeitado por complexidade adicional e risco de quebrar configs quando designer renomeia entidades.

## Referências

- PRD: Decisões e trade-offs
- HLD Seção 5.2: Modelo de Dados RPG Maker MZ
