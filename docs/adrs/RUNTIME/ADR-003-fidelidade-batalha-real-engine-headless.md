# ADR-003: Fidelidade via Batalha Real na Engine em Headless

**Status:** Decidido
**Data:** 2026-01-04
**Contexto:** Validar balanceamento de forma mais próxima possível ao jogo final, especialmente com plugins VisuStella

## Contexto e Problema

Há duas abordagens principais para simular combate e medir TTK:

1. **Simulador matemático independente**: Reimplementar fórmulas de dano e mecânicas de combate
2. **Engine real em headless**: Executar a própria engine do RPG Maker MZ em ambiente headless

O simulador matemático é mais simples de implementar, mas pode divergir significativamente do jogo final, especialmente quando há plugins customizados (VisuStella) que alteram mecânicas de combate.

## Decisão

Executar **batalhas reais via `BattleManager`** e loop de turnos do RPG Maker MZ em ambiente headless (JSDOM + mocks), ao invés de criar simulador matemático independente.

### Implementação

- Setup JSDOM (simulação de browser)
- Mocks de PIXI.js, Graphics, Effekseer, AudioManager
- Carregamento síncrono da database via `fs.readFileSync`
- Inicialização do RPG Maker MZ core (`rmmz_core.js`, `rmmz_managers.js`, `rmmz_objects.js`)
- Carregamento de plugins VisuStella (Core Engine, Battle Core)
- Execução via `BattleManager.setup()` e loop de turnos nativo

## Consequências

### Positivas

- ✅ Resultados fidedignos ao jogo final (incluindo comportamento de plugins)
- ✅ Captura efeitos colaterais de estados, buffs e mecânicas avançadas
- ✅ Qualquer mudança nas fórmulas no editor MZ reflete automaticamente na validação
- ✅ Suporte nativo a plugins VisuStella e customizações

### Negativas

- ❌ Maior fragilidade e custo de manutenção do harness headless
- ❌ Dependência de mocks (PIXI, Effekseer, Graphics) sincronizados com engine
- ❌ Risco de incompatibilidade com atualizações da engine ou novos plugins
- ❌ Performance potencialmente mais lenta que simulador matemático puro

## Alternativas Consideradas

**Simulador matemático puro**
Rejeitado por divergência com plugins VisuStella e dificuldade de manter fidelidade com mecânicas customizadas. Um simulador precisaria reimplementar toda a lógica de plugins, o que é inviável.

## Mitigação de Riscos

1. **Implementação prioritária de test handlers** conforme pesquisa técnica
2. **Isolamento de mocks** em módulos separados para facilitar ajustes
3. **Modo diagnóstico** (`--diagnostic`) para debug de inicialização
4. **Suite de testes** validando inicialização headless com plugins VisuStella

## Referências

- Pesquisa: `docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`
- HLD Seção 3.4: Headless Runtime
- HLD Seção 10.1: Risco de Harness Headless Incompatível
