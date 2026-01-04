# ADR-004: Considerar Apenas HP e MP na Escolha de Skills (MVP v1)

**Status:** Decidido para MVP v1, Expansão Futura
**Data:** 2026-01-04
**Contexto:** Reduzir complexidade inicial e ainda capturar principal impacto em rotações básicas

## Contexto e Problema

Durante a simulação de combate, o sistema precisa decidir qual skill cada personagem deve usar. As restrições possíveis incluem:

- **HP/MP**: Custos básicos de recursos
- **TP**: Tension Points acumulados durante combate
- **Cooldowns**: Skills com tempo de recarga
- **AP**: Action Points (mecânicas VisuStella)
- **Custos múltiplos**: Combinações de recursos

Modelar todas essas restrições desde o MVP aumentaria significativamente a complexidade.

## Decisão

### MVP v1 (Atual)

Algoritmo de escolha de skill **filtra apenas por HP e MP disponível**. Ignora cooldowns, TP, AP, custos múltiplos, e outras restrições.

### Algoritmo de Escolha

```
1. Listar skills liberadas do personagem
2. Filtrar skills que não podem ser usadas por falta de HP ou MP
3. Estimar dano esperado por ação usando cálculo da engine
4. Escolher skill com maior dano esperado
5. Se nenhuma skill disponível, usar ataque básico
```

### Futuro (Pós MVP)

Expandir para considerar **TP, cooldowns e custos múltiplos** quando mecânicas forem críticas para balanceamento.

## Consequências

### Positivas

- ✅ Simplicidade de implementação no MVP
- ✅ Captura 80% dos casos de uso (rotações básicas)
- ✅ Suficiente para validar progressão de dano e TTK
- ✅ Algoritmo determinístico e reproduzível

### Negativas

- ❌ Pode divergir do jogo em cenários com cooldowns/TP/AP
- ❌ Não valida builds otimizadas que dependem de TP ou burst damage
- ⚠️ Deve ser documentado como **limitação conhecida** nos relatórios

## Alternativas Consideradas

**Modelar todas restrições desde MVP**
Rejeitado por complexidade vs valor. A maioria dos trechos do jogo não depende criticamente de TP ou cooldowns, então o ganho de fidelidade não justifica o esforço adicional no MVP.

**Usar IA de inimigos configurável**
Rejeitado para MVP. A IA de inimigos segue o comportamento nativo da engine, sem configuração customizada no wrapper.

## Escopo Incremental

- **MVP v1**: HP/MP apenas
- **Futuro v1.x**: Adicionar TP e cooldowns básicos
- **Futuro v2.x**: Suporte completo a AP e custos múltiplos

## Referências

- PRD FR-005: Escolha de skill por melhor dano esperado
- HLD Seção 3.5: Simulation Layer
