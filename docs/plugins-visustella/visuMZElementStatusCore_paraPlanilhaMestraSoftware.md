# VisuMZ_1_ElementStatusCore — Pontos Relevantes para a Planilha MestraSoftware

Este documento resume o que, no `VisuMZ_1_ElementStatusCore`, impacta diretamente o desenho e a implementação do software **Planilha MestraSoftware** (stats, fórmulas e TTK), principalmente via **elementos e taxas elementares**.

Fonte: `docs/plugins/Guia_VisuMZ_1_ElementStatusCore.md`.

## 1) Premissas e dependências

- O plugin expande o sistema de **elementos** e **status**, permitindo mais controle sobre:
  - fraquezas/resistências,
  - absorção/reflexão,
  - e como essas informações são exibidas ao jogador.
- **Pré-requisito:** `VisuMZ_0_CoreEngine` instalado e ativo.
- Exibição de fraquezas/resistências no “Enemy Select” em batalha **requer Battle Core**.

Implicação para o tool:
- Mesmo que o MVP foque em stats+fórmulas+TTK, o tool deve prever que o **dano efetivo** pode ser multiplicado por taxas elementares (e até virar cura/reflexo), o que altera TTK.

## 2) Configurações do plugin que alteram leitura de jogo (UI/telemetria mental do jogador)

O guia descreve parâmetros que não mudam o dano em si, mas mudam o quanto o jogador “enxerga” o sistema:

- **Status Menu Settings:** exibição de resistências/ fraquezas do ator no menu.
- **Enemy Select Settings:** exibição de fraquezas/ resistências do inimigo ao selecionar alvo (em batalha).
- **Element Settings:** ícones/cores/textos por elemento.

Implicação:
- Se você habilitar a exibição, o jogador consegue “resolver” o puzzle elemental mais rápido; isso tende a reduzir TTK real em encontros onde explorar fraqueza é a estratégia dominante.
- O Planilha MestraSoftware pode (futuro) ter um parâmetro de “informação disponível” para ajustar dificuldade prevista:
  - fraquezas visíveis (TTK menor),
  - fraquezas ocultas (TTK maior).

## 3) Notetags relevantes (Database) — afetam dano efetivo e TTK

### 3.1 Atores/Classes/Inimigos/Equip/Estados (taxas e comportamentos elementais)

Notetags citadas no guia:

- `<Element Rate: x, y%>`: define multiplicador de dano elemental.
  - Ex.: `200%` = dobra o dano daquele elemento.
- `<Element Absorb: x>`: absorve dano elemental (vira cura).
- `<Element Reflect: x>`: reflete dano elemental para o atacante.

Implicação para TTK:
- O “dano esperado por turno” precisa considerar **pelo menos** um multiplicador elemental (mesmo que simplificado) para encontros onde elemento é central.
- Absorb/Reflect podem inverter o resultado (dano vira cura, ou volta no atacante), então o tool deve:
  - detectar e alertar sobre encontros em que a rotação recomendada é “anti-sinérgica” (ex.: skill de Fogo contra inimigo que absorve Fogo).

### 3.2 Skills/Itens (atribuição de elemento)

Notetags citadas:

- `<Element: x>`: define elemento.
- `<Element: +x>`: adiciona elemento.
- `<Element: -x>`: remove elemento.

Implicação:
- O tool precisa de um conceito claro de “elemento efetivo da ação”:
  - o elemento do próprio skill/item,
  - possivelmente múltiplos elementos (quando há `+x`),
  - e casos onde elementos são removidos.
- MVP recomendado: tratar como “um elemento principal” e registrar “multi-element” como alerta (até o simulador suportar composição).

### 3.3 Ocultar/mostrar informação ao jogador (pacing e design de surpresa)

Notetags citadas:

- `<Hide Element Rate: x>` / `<Show Element Rate: x>`

Implicação:
- Isso não altera o dano, mas altera o **custo de descoberta**. Para boss com “fraqueza secreta”, o TTK real tende a ser maior nas primeiras tentativas.
- Recomendação: o tool pode permitir marcar certas fraquezas como “ocultas”, gerando uma observação no relatório de balanceamento (“TTK na prática maior até o jogador descobrir”).

## 4) JavaScript avançado (dinâmico) — altera taxa elemental em runtime

Notetag citada:

- `<JS Element Rate: x, code>`: taxa elemental via código (ex.: estado Encharcado dobra Trovão).

Implicação:
- Torna o dano dependente de **estado/condição** (ex.: “Encharcado”).
- Para o Planilha MestraSoftware, isso sugere evoluções futuras:
  - simular cenários “com estado” (baseline vs encharcado),
  - validar que o multiplicador máximo não quebra caps/TTK.
- No MVP, isso deve virar pelo menos um **alerta**: “este encontro tem taxas elementais dinâmicas; TTK é apenas aproximado”.

## 5) Script calls (debug/design) — útil para checagens

O guia cita que é possível consultar `elementRate(id)` via script call.

Implicação:
- Ajuda a criar “debug scenes” no jogo, mas para o tool o mais relevante é: existe uma API conceitual (elementRate) que reforça que a taxa final pode ser composta por múltiplas fontes (classe/equip/estado).

## 6) Recomendações práticas para o Planilha MestraSoftware (Ato 1, Lv 1–30)

Como o MVP é stats+fórmulas+TTK, a forma mais eficiente de incorporar ElementStatusCore sem aumentar muito o escopo:

- Adicionar ao `ProjectConfig` do tool:
  - lista de elementos relevantes do projeto (nomes/ids),
  - “fraquezas visíveis?” (status/enemy select on/off) como flag de leitura (opcional),
  - um modo de simulação elemental: `ignore` | `singleMultiplier`.
- Implementar no simulador:
  - `singleMultiplier`: multiplicar dano base por `elementRate` do alvo para o elemento do skill.
- Implementar validações:
  - alertar se o alvo **absorve** ou **reflete** o elemento usado no cenário,
  - alertar se o skill for multi-element (até suportar composição).

## 7) Pontos em aberto (decisões futuras)

- Elementos serão parte do MVP de TTK (mesmo que simplificado) ou ficam para v1?
- Vamos esconder fraquezas de bosses no Ato 1 (usando `<Hide Element Rate: ...>`)?
- Haverá estados com `<JS Element Rate: ...>` ainda no Ato 1 (ex.: “Encharcado”)?

