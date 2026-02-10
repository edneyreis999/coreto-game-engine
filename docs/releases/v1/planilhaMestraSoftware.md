# coreto game engine — Validação Determinística de TTK (Ato 1)

Este documento consolida as decisões para o **coreto game engine** (citado em `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`), um **wrapper read-only em Node.js** que valida o balanceamento de combate por trechos do jogo.

## Objetivo

Criar o coreto game engine, um sistema que funciona como **wrapper read-only** sobre um projeto RPG Maker MZ para:

- **Validar TTK** (Time-to-Kill) de forma determinística por trechos do jogo.
- **Executar batalhas reais** via engine em modo headless.
- **Medir TTK** em turnos e em ações.
- **Gerar relatórios** em `report/report.json`.
- **Preparar contexto para IA** ao fazer parse e dividir os JSONs grandes do RPG Maker MZ.

O MVP v1:

- **NÃO escreve** nos arquivos JSON do RPG Maker MZ (read-only).
- As alterações de fórmulas e dados continuam sendo feitas diretamente no editor do RPG Maker MZ.

## Escopo do MVP v1

- Wrapper read-only e IA friendly, sem editar o banco do RPG Maker MZ.
- Arquivo `project.config.json` com o caminho do projeto e parâmetros de execução (inclui seed).
- Configurações versionadas no repositório do coreto game engine (fora do projeto do jogo).
- Execução via CLI, sem UI, sem integração com CI na v1.
- Configuração de trechos com âncoras por nível e alvos de TTK por trecho.
- Seleção de troops por trecho por entrada do usuário (lista separada por vírgula).
- Simulação fiel via engine (BattleManager e loop de turno) em ambiente headless.
- Medição de TTK por troop em turnos e em ações.
- Geração de `report/report.json` com resultados, warnings e resumo.
- Export de contexto para IA, dividindo JSONs grandes do MZ em arquivos menores.
- O jogo 1 terá **nível máximo 30** (continuação do jogo/ato posterior sobe o cap).

## “Ragnarok clássico” como referência (1–99), adaptado ao Ato 1 (1–30)

As classes abaixo são referências de “papel de combate” (tank/dps/support) e servem para guiar curvas e kits.

### Classes por personagem (party)

- **Thorin:** *Hunter (Arqueiro)* como base (dano ranged + controle). "Summoner" será um **sub-kit onírico** ("Mana Caller") que entra no late do Ato 1 e cresce nos atos seguintes.
- **Filena:** *Monk (Acolito → Monge)* (brawler rúnico, técnicas/combos, bridge com espiritual sem roubar o arco do Thorin).
- **Kilin:** *Crusader (Templário)* (protetor/mentor; tank com guard/mitigação e foco em espada + escudo).
- **Mhordred:** *Knight (Cavaleiro)* com ênfase em two-hand / berserk (DPS melee explosivo + modo fúria com tradeoffs).
- **Balastrus:** *Alchemist (Alquimista)* (inventor: bombas/ácidos/estimulantes/engenhocas; suporte híbrido com debuffs e dano por itens).

## Níveis-âncora do Ato 1 (Lv 1–30) amarrados à história

Âncoras escolhidas para casar progressão com viradas narrativas/jogáveis (timeline/jornada):

- **Lv 1:** Prólogo/mundo comum (Semifinal + Fim de Jogo + Hora de Crescer + saída de Gildrat).
- **Lv 10:** Kravens (dungeon + chefe Cristaleão + descoberta do Sigmetal).
- **Lv 15:** Travessia Perigosa (Mina do Esgoto + chefe Pestesporo).
- **Lv 20:** Corvos de Melios (boss fight “humana”, pico antes do sobrenatural escalar).
- **Lv 25:** Quebra do Selo (primeiros Ignotos + mini-chefe).
- **Lv 30:** Defesa de Gildrat (General Ignoto + Ultimo boss).


## Metas de TTK (heurísticas)

Estas metas orientam a validação de balanceamento por trechos (configuradas no `project.config.json`):

- **Inimigos comuns (sem bosses):** alvo e tolerância definidos por trecho.
- O sistema valida TTK medido contra o alvo configurado e gera warnings quando estiver fora da tolerância.
- TTK é medido em turnos e em ações durante a simulação de batalha real via engine headless.

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

O coreto game engine é um **wrapper read-only** que:

1) executa batalhas reais via engine em modo headless,
2) mede TTK de forma determinística por trechos,
3) valida contra alvos e tolerâncias configuradas,
4) gera relatórios em `report/report.json` e exporta contexto para IA.

### Componentes (proposta)

- **CLI:** comandos para rodar TTK por trechos e export de contexto para IA.
- **Loader de projeto:** valida estrutura do projeto e carrega `data/` e scripts necessários.
- **Harness headless:** setup JSDOM, mocks de PIXI e Graphics, mock de Effekseer, e carregamento síncrono da database via filesystem.
- **Runner de simulação:** orquestra a execução por trecho e por troop, registra turnos e ações.
- **Reporter:** gera `report/report.json`.
- **Exporter IA:** transforma JSONs grandes em arquivos menores para consulta.
- **Config store:** arquivos JSON versionados no repositório do coreto game engine (exemplo: `config/`).

## Roadmap (marcos)

- **MVP v1 — Validação determinística de TTK:**
  - Configuração de trechos e troops.
  - Execução headless de batalhas via engine.
  - Medição de TTK em turnos e ações.
  - Geração de `report/report.json`.
  - Export de contexto para IA.

- **Pós MVP v1 (futuro):**
  - UI desktop (Electron).
  - Integração com CI.
  - Simular uso de potions e itens de cura por trecho.
  - Suportar múltiplos perfis de party por execução.

## Referências internas

- **PRD (fonte da verdade):** `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`
- Pesquisa base: `docs/pesquisas/RPG-Maker-MZ_Design-Combate.md`
- Pesquisa sobre test handlers: `docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`
- História: `/Users/edney/projects/coreto/projectX/docs/GDD/3-historia/timeline-historia-jogo-v5.md`
- Jornada do jogador: `/Users/edney/projects/coreto/projectX/docs/GDD/3-historia/historia-jornada-do-jogador.md`
- Personagens:
  - `/Users/edney/projects/coreto/projectX/docs/GDD/4-personagens-inimigos-criaturas/Kilin v3.md`
  - `/Users/edney/projects/coreto/projectX/docs/GDD/4-personagens-inimigos-criaturas/Mhordred v3.md`
  - `/Users/edney/projects/coreto/projectX/docs/GDD/4-personagens-inimigos-criaturas/Balastrus v3.md`

