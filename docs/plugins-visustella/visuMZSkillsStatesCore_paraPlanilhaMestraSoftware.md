# VisuMZ_1_SkillsStatesCore — Pontos Relevantes para a Planilha MestraSoftware

Este documento resume o que, no `VisuMZ_1_SkillsStatesCore`, impacta diretamente o desenho e a implementação do software **Planilha MestraSoftware** (stats, fórmulas e TTK), principalmente via **custos**, **cooldowns** e **estados**.

Fonte: `docs/plugins/Guia_VisuMZ_1_SkillsStatesCore.md`.

## 1) Premissas e dependências

- O plugin expande habilidades e estados com:
  - múltiplos custos,
  - cooldowns,
  - efeitos mais complexos.
- **Pré-requisito:** `VisuMZ_0_CoreEngine` posicionado antes do plugin.

Implicação para o tool:
- Mesmo se o MVP focar em “fórmula de dano + stats”, o **dano por turno real** depende do que o jogador consegue usar (custos/cooldowns/condições).

## 2) Parâmetros do plugin (impacto indireto, mas relevante)

O guia cita:

- **Show All Costs:** exibir custos múltiplos (MP+TP etc.) no UI.
- **Cooldowns Globais:** cooldown que afeta grupos de habilidades.
- Configs de display de estado (tamanho/overlap de ícones).

Implicação:
- Não muda o dano diretamente, mas muda a clareza do sistema para o jogador e facilita execução de rotações (impactando TTK “na prática”).
- Para o Planilha MestraSoftware, isso vira:
  - `ProjectConfig.showAllCosts` (opcional, para “UX de leitura”),
  - `ProjectConfig.globalCooldownPolicy` (se usado, entra na simulação).

## 3) Notetags de custos (Skill Costs) — impactam rotação e TTK

Notetags citadas:

- `<HP Cost: x>` / `<HP Cost: x%>`
- `<MP Cost: x>` / `<MP Cost: y%>`
- `<TP Cost: x>`
- `<Item Cost: id, amount>`
- `<Gold Cost: x>`

Implicação para TTK:
- Custos definem quantas vezes uma skill pode ser usada antes de:
  - ficar sem MP/TP,
  - entrar em risco (HP cost),
  - consumir itens (Item Cost) ou recursos econômicos (Gold Cost).
- Para o MVP, recomenda-se que o simulador de TTK tenha pelo menos 2 modos:
  - **TTK “burst”**: assume recursos suficientes (útil para calibrar cap/fórmula).
  - **TTK “sustained”**: impõe limite simples (ex.: MP/TP por N turnos) ou usa “custos percentuais” como teto.

Recomendação de validação:
- Sinalizar skills com `HP Cost` alto (risco de auto-KO) e `Gold/Item Cost` (dependência de economia).

## 4) Notetags de cooldown — impactam frequência de uso

Notetags citadas:

- `<Cooldown: x Turns>`
- `<Skill Cooldown: id, x Turns>`
- `<Global Cooldown: x Turns>`

Implicação:
- Cooldown transforma “melhor skill” em **pico**, não em spam.
- Isso é um dos maiores determinantes de TTK para boss (8–15 turnos), porque a rotação vira um problema de:
  - janela de burst,
  - turnos de filler.

Recomendação para o tool:
- `ScenarioConfig` deve permitir “horizonte de simulação” (ex.: 10 turnos) e calcular:
  - dano total com cooldowns,
  - DPS médio,
  - e variação “pico vs sustentado”.

## 5) Notetags de efeitos/condições de skill (gating de progressão)

Notetags citadas:

- `<Learn Skill: id>` (item ensina skill)
- `<Require Skill: id>` (skill exige outra)
- `<Forbid Skill: id>` (skill bloqueada se usuário conhece outra)

Implicação:
- Isso cria “árvore/combos” e gating de progressão.
- Para o Planilha MestraSoftware, isso afeta o “kit disponível” por nível/ato.

MVP recomendado:
- Não tentar simular árvore completa, mas permitir no “build do cenário” definir um **conjunto de skills ativas** por classe/nível.

## 6) Notetags de estado (stacks, imunidade, quebra) — mudam dano ao longo do tempo

Notetags citadas:

- `<Max Stacks: x>` (stacking, ex.: veneno acumula)
- `<State Immunity: id>`
- `<State Break Chance: x% on Damage>`

Implicação para TTK:
- Estados acumuláveis e DoT alteram o TTK fortemente em encontros longos.
- Imunidades e chance de quebrar estado mudam confiabilidade da estratégia.

Recomendação para o tool:
- No MVP, gerar alertas quando:
  - um cenário depende de estado “stacking” (porque o modelo simplificado pode subestimar DPS),
  - existe imunidade relevante (estratégia inválida),
  - ou “break chance” alta (estratégia inconsistente).

## 7) JavaScript avançado (dinâmico) — custo, enable e efeito por código

Notetags citadas:

- `<JS HP Cost: code>` / `<JS TP Cost: code>` (ex.: custa todo TP `user.tp`)
- `<JS Skill Enable: code>` (condição de uso)
- `<JS State Effect: code>` (efeito por turno, ex.: regen 5% mhp)

Implicação:
- Introduz dependências de runtime que podem invalidar simulações estáticas.
- Para o Planilha MestraSoftware:
  - reforça a necessidade de um **avaliador/sandbox** (AST/whitelist) para qualquer execução de fórmula/código,
  - e a estratégia de MVP: **simular o básico** e emitir alertas quando houver JS custom.

## 8) Script calls (debug / ferramentas de evento)

O guia cita:

- `clearCooldowns()` para zerar cooldowns.
- Ajuste manual de turnos de estado via script.

Implicação:
- Útil para “debug battles” e testes de balanceamento dentro do jogo, mas não essencial para o tool.
- Sugestão: no futuro, documentar “cenário de teste” em eventos para validar as curvas geradas pelo tool.

## 9) Recomendações práticas para o Planilha MestraSoftware (Ato 1, Lv 1–30)

- Guardar em `ProjectConfig`:
  - se cooldowns globais são usados,
  - política de custos múltiplos (MP/TP/HP/%),
  - se estados com stacks/DoT existem no Ato 1.
- Oferecer cenários de TTK em dois modos:
  - **burst** (sem restrições),
  - **sustained** (com cooldown/custos simplificados).
- Validar e alertar:
  - skills com custos por HP/itens/ouro,
  - skills com cooldowns altos (impacto em boss),
  - uso de notetags JS (custo/enable/efeito).

## 10) Pontos em aberto (decisões futuras)

- No Ato 1, haverá cooldowns e múltiplos custos já no kit base?
- Como vamos representar “rotações” no tool (lista de skills com prioridade + restrições)?
- Estados com stacks/DoT entram no MVP (simulação) ou ficam apenas como alerta?

