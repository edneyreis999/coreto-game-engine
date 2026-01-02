# VisuMZ_1_BattleCore — Pontos Relevantes para a Planilha MestraSoftware

Este documento resume o que, no `VisuMZ_1_BattleCore`, impacta diretamente o desenho e a implementação do software **Planilha MestraSoftware** (stats, fórmulas e TTK).

Fonte: `docs/plugins/Guia_VisuMZ_1_BattleCore.md`.

## 1) Premissas e dependências

- O Battle Core é base para o ecossistema de batalha VisuStella e moderniza o sistema de combate do MZ.
- **Pré-requisito:** `VisuMZ_0_CoreEngine` deve estar instalado e **acima** do Battle Core na lista de plugins.

Implicação para o tool:
- O tool deve assumir que existirá **camada de processamento** além do MZ vanilla (ou seja: parte do dano/turno/ordem pode ser influenciada pelo plugin).

## 2) Parâmetros do plugin que afetam TTK (o tool precisa “conhecer”)

O guia lista áreas de configuração que mudam o resultado final da simulação. Mesmo que o tool não edite parâmetros do plugin no MVP, ele precisa **modelar** isso como “config do projeto”, porque altera TTK.

### 2.1 Action & Turn Order (economia de turnos)

- Configurações de **velocidade de ação** e **ordem de turno**.
- AGI pode ter influência maior/menor dependendo do setup.

Implicação:
- O simulador de TTK não pode assumir “1 ação por personagem por turno” sem checar o modo configurado.
- O tool deve ter um “modo de simulação” (ex.: **DTB simplificado** vs **AGI-influenciado**) e expor isso como toggle na config.

### 2.2 Damage & Formula Settings (dano efetivo)

O guia sugere que o plugin permite:

- Ajustar **variância de dano** (*Damage Variance*).
- Ajustar **crítico** (*Critical Multiplier* / fórmula de crítico).
- Ajustar (ou influenciar) **fórmula base** e como ela é aplicada.

Implicação:
- O tool deve suportar simulação com:
  - variância = 0% (determinístico) para “planilha mestra”,
  - variância > 0% para “realismo”, com relatório de intervalo (min/max ou percentis).
- O cálculo de DPS/TTK precisa parametrizar crítico (chance e multiplicador), mesmo que inicialmente fique simplificado.

### 2.3 Action Points (AP) System (custo por ação)

- Existe um sistema de **AP** que pode substituir ou complementar TP.
- Ações/habilidades podem ter custo em AP.

Implicação:
- Se o projeto usar AP, o TTK “puro” (dano por turno) pode ficar errado, porque o gargalo vira **economia de AP**.
- Recomendação para o MVP: registrar “AP está ligado?” na config e, se estiver, o tool deve no mínimo:
  - avisar que TTK assume AP infinito, ou
  - modelar “AP por turno” como limite simples.

## 3) Notetags relevantes (Database) — o tool deve respeitar no design

O guia lista notetags que alteram diretamente ações, custos e fórmulas.

### 3.1 Atores/Classes/Inimigos

Exemplos citados:

- `<Action Times: +x>`: mais ações por turno.
- `<Guard Skill: y>`: substitui o comando Guard por uma skill específica.

Implicação:
- Para TTK, `<Action Times: +x>` é crítico: muda o número de ações e invalida simulações simplistas.
- Para o software, isso sugere que “builds” (classes) podem ter **economia de ações** própria (tank com guard especial).

### 3.2 Skills/Itens

Exemplos citados:

- `<AP Cost: x>` e `<TP Cost: y%>`: custos mudam a rotação possível.
- `<Repeat: x>`: multi-hit/repete a ação.
- `<Damage Formula: code>`: define fórmula específica via notetag.

Implicação:
- Para TTK e stress tests, o tool deve tratar “Repeat” como multiplicador de hits (com cautela: multi-hit pode interagir com states/crit).
- Fórmulas podem estar em **dois lugares** (campo de fórmula padrão do MZ e/ou notetag do plugin). O tool precisa decidir “fonte da verdade” para fórmulas:
  - MVP recomendado: editar `frontend/data/Skills.json` (`damage.formula`) e apenas **alertar** quando houver `<Damage Formula: ...>` divergente nas notas.

### 3.3 Estados

Exemplos citados:

- `<Disable Action: Attack>` / `<Disable Action: Magic>`: bloqueios mudam rotação.

Implicação:
- No MVP, o TTK pode ignorar estados; mas o tool deve planejar a evolução para incluir “cenários com estado” (silence/paralysis etc.).

## 4) Hooks JavaScript do Battle Core (avançado, mas importante para a visão do tool)

O guia cita notetags com código:

- `<JS Pre-Damage: code>`
- `<JS Post-Damage: code>`
- `<JS On Add State: code>`

Implicação:
- Esses hooks podem alterar dano, cura, lifesteal, aplicar estados etc. — isso pode invalidar simulações puramente baseadas em fórmula.
- Para o Planilha MestraSoftware, isso reforça a necessidade de:
  - um **avaliador de fórmulas seguro** (sem `eval` livre),
  - e uma estratégia clara: no MVP, simular “fórmula base” e tratar hooks como “efeitos fora do modelo”, gerando alertas.

## 5) Recomendações práticas para o MVP do Planilha MestraSoftware

- Manter a simulação **determinística por padrão**:
  - variância 0%,
  - crítico desligado ou “esperado” (chance × multiplicador).
- Incluir no `ProjectConfig` do tool:
  - modo de ordem de turno (DTB simplificado vs AGI-influenciado),
  - variância de dano (%),
  - multiplicador de crítico,
  - AP ligado/desligado e AP por turno (se aplicável),
  - suporte a “múltiplas ações” (`Action Times`) como fator na simulação.
- Ao aplicar mudanças no MZ:
  - editar stats em `frontend/data/Classes.json` (níveis 1..30 no Ato 1),
  - editar fórmulas em `frontend/data/Skills.json`,
  - gerar relatório de divergências caso encontre notetags de fórmula/hook que o tool não modela (por enquanto).

## 6) Pontos em aberto (decisões futuras)

- O projeto vai usar **AP System** ou não?
- O projeto vai permitir `<Action Times: +x>` em classes/chefes no Ato 1?
- Como vamos padronizar “onde vive a fórmula”: campo `damage.formula` vs notetag `<Damage Formula: ...>`?

