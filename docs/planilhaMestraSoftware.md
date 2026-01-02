# Planilha Mestra (Software) — Decisões e Roadmap (Ato 1)

Este documento consolida as decisões tomadas para evoluir o conceito de **“A Planilha Mestra”** (citada em `docs/pesquisas/RPG-Maker-MZ_Design-Combate.md`) de uma planilha para um **software em JavaScript/TypeScript** que governa o balanceamento de combate do projeto.

## Objetivo

Construir um tool (single-user) que seja a **fonte da verdade** de:

- **Stats por nível** (curvas determinísticas baseadas em âncoras).
- **Fórmulas de dano** (presets + custom) com validações.
- **TTK** (Time-to-Kill) e metas por ato/cena.

O tool deve:

- **Escrever diretamente** nos arquivos JSON do RPG Maker MZ do repositório.
- Também oferecer **export** de artefatos (snapshot/relatório) para versionamento e inspeção.

## Escopo do MVP (Ato 1)

- Stats + fórmulas + TTK.
- Operar **somente em Classes** (não em Actors).
- O jogo 1 terá **nível máximo 30** (continuação do jogo/ato posterior sobe o cap).

## “Ragnarok clássico” como referência (1–99), adaptado ao Ato 1 (1–30)

As classes abaixo são referências de “papel de combate” (tank/dps/support) e servem para guiar curvas e kits.

### Classes por personagem (party)

- **Thorin:** *Hunter (Arqueiro)* como base (dano ranged + controle). “Summoner” será um **sub-kit onírico** (“Mana Caller”) que entra no late do Ato 1 e cresce nos atos seguintes.
- **Filena:** *Monk (Acolito → Monge)* (brawler rúnico, técnicas/combos, bridge com espiritual sem roubar o arco do Thorin).
- **Kilin:** *Crusader (Templário)* (protetor/mentor; tank com guard/mitigação e foco em espada + escudo).
- **Mhordred:** *Knight (Cavaleiro)* com ênfase em two-hand / berserk (DPS melee explosivo + modo fúria com tradeoffs).
- **Balastrus (documentado como “Valamir”):** *Alchemist (Alquimista)* (inventor: bombas/ácidos/estimulantes/engenhocas; suporte híbrido com debuffs e dano por itens).

Observação: **Tusk foi removido do jogo**.

## Níveis-âncora do Ato 1 (Lv 1–30) amarrados à história

Âncoras escolhidas para casar progressão com viradas narrativas/jogáveis (timeline/jornada):

- **Lv 1:** Prólogo/mundo comum (Semifinal + Fim de Jogo + Hora de Crescer + saída de Gildrat).
- **Lv 10:** Kravens (dungeon + chefe Cristaleão + descoberta do Sigmetal).
- **Lv 15:** Travessia Perigosa (Mina do Esgoto + chefe Pestesporo).
- **Lv 20:** Corvos de Melios (boss fight “humana”, pico antes do sobrenatural escalar).
- **Lv 25:** Quebra do Selo (primeiros Ignotos + mini-chefe).
- **Lv 30:** Defesa de Gildrat (General Ignoto + Ultimo boss).


## Metas de TTK (heurísticas)

Estas metas orientam a engenharia reversa (dano do jogador → HP/DEF do inimigo) no tool:

- **Inimigos comuns:** 1–2 turnos usando recursos (MP/itens/skills), ou 4–5 turnos usando somente ataques básicos.
- **Chefes:** 8–15 turnos.

## Alvos técnicos no projeto (RPG Maker MZ)

Arquivos do MZ relevantes para o MVP:

- `frontend/data/Classes.json`
  - `params` contém 8 listas (parâmetros), cada uma com 100 posições.
  - Convenção prática: tratar `params[x][L]` como valor do **nível L** (1..99) e considerar `L=0` como dummy.
  - Para Ato 1: gerar e validar de forma explícita **1..30**, mantendo 31..99 como platô/continuação suave (inacessível no jogo 1).
- `frontend/data/Skills.json`
  - Contém `damage.formula` (ex.: skill 1 “Ataque” está `a.atk * 4 - b.def * 2`).
  - O tool deve permitir presets (ex.: fórmula quadrática) + edição manual + validação (dano mínimo, cap, outliers).
- `frontend/data/Enemies.json`
  - Contém os inimigos do jogo.
- `frontend/data/Troops.json`
  - Contem o conjunto de inimigos, as batalhas que o jogador vai enfrentar durante o jogo.
- `System.json` (opcional futuro)
  - Ex.: flags como `optDisplayTp` e termos; não é necessário no MVP.

## Design do software (alto nível)

### Conceito

O tool é um **system-of-record** (“fonte da verdade”), que:

1) define âncoras e curvas determinísticas,  
2) simula cenários (dano/turno, stress tests, TTK),  
3) valida (caps/zero damage/outliers),  
4) aplica no projeto (write direto nos JSON do MZ) e exporta snapshots.

### Componentes (proposta)

- `core/` (puro/testável):
  - Curvas por atributo (Base/Max/P, e opção por estágios).
  - Avaliador de fórmula com contexto restrito (`a`, `b`, `Math`).
  - Simulador de dano/turno e TTK (party vs boss).
  - Validadores (cap, dano mínimo, regressões).
- `io/`:
  - Leitura/escrita de `frontend/data/*.json`.
  - Export (snapshot do “projeto de balanceamento” + relatório).
- `cli/` (primeira entrega):
  - `check` (dry-run + relatório).
  - `apply` (escrever direto nos JSON).
  - `export` (snapshot versionável).
  - `diff` (preview do que mudaria).
- `ui/` (opcional, pós-CLI):
  - Editor de âncoras/curvas + gráfico + cenários/alertas + botão “aplicar”.

## Roadmap (marcos)

- **M1 — Motor + modelo:** curvas, presets de fórmula, simuladores e validadores.
- **M2 — CLI aplicador:** `check/apply/export/diff` operando nos JSON do MZ.
- **M3 — UI leve (opcional):** editor + visualizações + apply/export.
- **M4 — QoL:** presets por estilo, templates por classe (RO-like), histórico de exports, e integração com `npm run format:json` após `apply`.

## Referências internas

- Pesquisa base: `docs/pesquisas/RPG-Maker-MZ_Design-Combate.md`
- História: `/Users/edney/projects/coreto/projectX/docs/GDD/3-historia/timeline-historia-jogo-v5.md`
- Jornada do jogador: `/Users/edney/projects/coreto/projectX/docs/GDD/3-historia/historia-jornada-do-jogador.md`
- Personagens:
  - `/Users/edney/projects/coreto/projectX/docs/GDD/4-personagens-inimigos-criaturas/Kilin v3.md`
  - `/Users/edney/projects/coreto/projectX/docs/GDD/4-personagens-inimigos-criaturas/Mhordred v3.md`
  - `/Users/edney/projects/coreto/projectX/docs/GDD/4-personagens-inimigos-criaturas/Balastrus v3.md`

