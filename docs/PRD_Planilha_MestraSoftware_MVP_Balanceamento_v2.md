### PRD: coreto game engine Validação determinística de TTK por trechos (read-only)

Versão: 2
Data: 2026-01-02
Responsável: coreto game design (hipótese)

---

### Resumo

Criar o `coreto game engine`, um novo sistema em Node.js que funciona como wrapper read-only sobre um projeto RPG Maker MZ para validar de forma determinística o balanceamento de combate por trechos do jogo. O MVP v1 executa batalhas reais via engine em modo headless, mede TTK em turnos e em ações, gera relatórios em `report/report.json`, e ajuda a preparar contexto para IA ao fazer parse e dividir os JSONs grandes do RPG Maker MZ em arquivos menores. As alterações de fórmulas e dados continuam sendo feitas diretamente no editor do RPG Maker MZ.

---

### Contexto e problema

Público-alvo

- Game designers da Coreto, especialmente responsáveis por combate em turnos e balanceamento

Cenários de uso chave

- Após alterar fórmulas e dados no RPG Maker MZ, rodar testes via CLI para validar TTK por trechos (sem bosses)
- Gerar arquivos menores a partir dos JSONs grandes do MZ para usar como contexto em conversas com IA

Onde essa feature será implantada

- Novo sistema local (CLI) que aponta para um projeto RPG Maker MZ existente via arquivo de configuração JSON

Problemas priorizados

- Validar balanceamento por TTK é lento e exige esforço manual alto, especialmente após mudanças em fórmulas e stats (impacto: hoje o ciclo completo pode levar dias, como referência 2 a 3 dias para testar a progressão) (prioridade alta)
- O banco do RPG Maker MZ é grande e difícil de usar como contexto em IA, gerando retrabalho e erros na análise (prioridade alta)
- Uma ferramenta que escreva no banco do RPG Maker aumenta risco de divergência e corrupção, então o MVP v1 precisa ser read-only (prioridade alta)

---

### Objetivos e métricas

| Objetivo                                                               | Métrica                                                         | Meta                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| Rodar TTK em todos os trechos configurados excluindo bosses            | Tempo total de execução local                                   | Até 10 minutos            |
| Ser fiel ao jogo final na simulação de combate                         | Desvio observado em cenários de referência                       | 0 regressões não detectadas (hipótese) |
| Entregar relatórios úteis por trecho e por troop                        | Presença de `report/report.json` com detalhes por troop          | 100 por cento das execuções |
| Facilitar uso de IA com dados do MZ                                     | Capacidade de exportar JSONs menores para contexto               | Comando funcional no MVP  |

---

### Escopo

Incluso

- Wrapper read-only e IA friendly, sem editar o banco do RPG Maker MZ na v1
- Arquivo `project.config.json` com o caminho do projeto e parâmetros de execução (inclui seed)
- Configurações versionadas no repositório do `coreto game engine` (fora do projeto do jogo)
- Execução via CLI, sem UI, sem integração com CI na v1
- Configuração de trechos com âncoras por nível e alvos de TTK por trecho
- Seleção de troops por trecho por entrada do usuário (lista separada por vírgula), com validação de existência e warnings para inconsistências
- Simulação fiel via engine (BattleManager e loop de turno) em ambiente headless
- Medição de TTK por troop em turnos e em ações
- Geração de `report/report.json` com resultados, warnings e resumo
- Export de contexto para IA, dividindo JSONs grandes do MZ em arquivos menores
- Prioridade para os test handlers descritos em `docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`

Fora de escopo

- UI desktop (Electron) no MVP v1
- Integração com CI no MVP v1
- Qualquer escrita no banco do RPG Maker MZ na v1 (fórmulas, stats, plugins, data)
- Modelagem completa de todas as mecânicas avançadas de plugins, além do necessário para rodar a batalha na engine
- Considerar restrições além de HP e MP para escolha de skills na v1
- Configuração explícita de IA do inimigo via wrapper
- Validação de fórmulas em sandbox separada da simulação

Futuro (pós MVP v1)

- Simular uso de potions e itens de cura por trecho
- Suportar múltiplos perfis de party por execução

---

### Requisitos funcionais

#### FR-001 Configuração do projeto e seed

O sistema deve ler `project.config.json` contendo o caminho do projeto RPG Maker MZ e uma seed padrão para determinismo, com possibilidade de override via CLI.

**Fluxo principal**

- Usuário cria ou atualiza `project.config.json` com `projectPath` e `seed`
- Usuário executa a CLI informando o arquivo de config
- Sistema valida que existe um projeto RPG Maker MZ (exemplo: presença de `game.rmmzproject` e pasta `data/`)
- Sistema aplica a seed e inicializa o ambiente de execução

**Fluxos alternativos e exceções**

- Usuário passa `--seed` na CLI para sobrescrever o valor do config

**Erros previstos**

- Caminho inválido ou inacessível
- Projeto sem estrutura mínima do RPG Maker MZ

**Prioridade:** alta

---

#### FR-002 Definição de trechos com âncoras e alvo de TTK

O sistema deve suportar trechos do jogo com âncoras por nível e configuração de alvo e tolerância de TTK por trecho.

**Fluxo principal**

- Usuário define um trecho com `anchorLevel` e metadados do trecho
- Usuário define alvo e tolerância de TTK do trecho
- Sistema valida estrutura do trecho e usa essas metas na geração de warnings no relatório

**Fluxos alternativos e exceções**

- Permitir adicionar mais trechos além dos âncoras iniciais do Ato 1

**Erros previstos**

- Metas ausentes ou inválidas
- Trecho duplicado ou com ids inválidos

**Prioridade:** alta

---

#### FR-003 Seleção e validação de troops por trecho

O sistema deve permitir que o usuário informe quais troops pertencem a um trecho, separado por vírgula, e validar essas troops e seus inimigos.

**Fluxo principal**

- Usuário informa os `troopIds` do trecho (exemplo: `1, 2, 3`)
- Sistema valida se cada `troopId` existe em `Troops.json`
- Para cada troop, sistema lista os membros e valida se cada `enemyId` existe em `Enemies.json`
- Se estiver consistente, segue a execução

**Fluxos alternativos e exceções**

- Usuário roda somente um trecho específico via flag (hipótese)

**Erros previstos**

- `troopId` inexistente, gerar warning apontando qual id foi digitado
- Troop com membro referenciando `enemyId` inexistente, gerar warning apontando troop e enemy

**Prioridade:** alta

---

#### FR-004 Definição de party por classes e níveis

O sistema deve permitir que o usuário informe a party como lista de `classId level`, separada por vírgula, e derivar as skills liberadas por nível.

**Fluxo principal**

- Usuário informa a party no formato `classId level, classId level, ...`
- Sistema valida se cada `classId` existe em `Classes.json`
- Sistema usa a lista de `learnings` da classe para coletar as `skillIds` cujo level requerido seja menor ou igual ao nível informado
- Sistema monta a party de simulação com classes, níveis e lista de skills liberadas

**Fluxos alternativos e exceções**

- Permitir rodar com menos de 4 membros quando informado (hipótese)

**Erros previstos**

- `classId` inexistente
- Lista vazia de skills liberadas para um membro, gerar warning e ainda executar (hipótese)

**Prioridade:** alta

---

#### FR-005 Escolha de skill por melhor dano esperado por ação (HP e MP)

Durante a simulação, cada personagem deve escolher a skill que maximize dano esperado por ação dentre as skills liberadas, respeitando apenas HP e MP na v1.

**Fluxo principal**

- No turno do personagem, listar skills liberadas
- Filtrar skills que não podem ser usadas por falta de HP ou MP
- Estimar dano esperado por ação usando o cálculo da engine
- Escolher a skill com maior dano esperado e executar a ação

**Fluxos alternativos e exceções**

- Se nenhuma skill puder ser usada, usar ataque básico (hipótese)

**Erros previstos**

- Skill com fórmula inválida ou erro em runtime, registrar no relatório e continuar com fallback (hipótese)

**Prioridade:** alta

---

#### FR-006 Execução de batalha real via engine em headless

O sistema deve executar uma batalha real via engine (BattleManager e loop de turno) em modo headless para medir TTK fiel ao jogo final.

**Fluxo principal**

- Inicializar ambiente headless (JSDOM) e carregar scripts do RPG Maker MZ
- Aplicar mocks necessários para dependências de renderização (exemplo: PIXI, Graphics, Effekseer)
- Carregar database do projeto de forma síncrona via filesystem do Node
- Configurar batalha para a troop e party do trecho
- Executar loop até encerrar, registrando turnos, ações e resultados

**Fluxos alternativos e exceções**

- Modo diagnóstico para imprimir scripts carregados e mocks aplicados (hipótese)

**Erros previstos**

- Falha de inicialização por plugin ou dependência não mockada
- Trava por evento ou comportamento não suportado no headless (hipótese)

**Prioridade:** alta

---

#### FR-007 Medição de TTK por troop em turnos e ações

O sistema deve medir e registrar TTK por troop em turnos e em ações, e comparar com o alvo e tolerância do trecho.

**Fluxo principal**

- Ao final de cada batalha, registrar `ttkTurns` e `ttkActions`
- Comparar `ttkTurns` e `ttkActions` com o alvo do trecho e tolerância configurada
- Marcar como warning quando estiver fora da tolerância, sem parar a execução

**Fluxos alternativos e exceções**

- Permitir calcular também estatísticas agregadas por trecho (média e p95) (hipótese)

**Erros previstos**

- Batalha que não termina em um limite máximo, registrar como erro e seguir para próxima (hipótese)

**Prioridade:** alta

---

#### FR-008 Geração de relatório em JSON

O sistema deve gerar `report/report.json` contendo resultados por trecho e por troop, seed, party, skills escolhidas, warnings e resumo.

**Fluxo principal**

- Criar diretório `report/` se não existir
- Gerar `report/report.json` com:
  - trechos executados
  - por trecho: alvo e tolerância, troops, resultados por troop
  - por troop: TTK em turnos e ações, seed, party, skills escolhidas por personagem
  - warnings (troop inexistente, enemy inexistente, TTK fora da tolerância)
  - agregados por trecho (média e p95) (hipótese)

**Fluxos alternativos e exceções**

- Permitir incluir timestamp e versão do tool no relatório (hipótese)

**Erros previstos**

- Falha de escrita no diretório `report/`

**Prioridade:** alta

---

#### FR-009 Export de contexto para IA a partir dos JSONs do MZ

O sistema deve ajudar no uso de IA ao dividir os JSONs grandes do RPG Maker MZ em arquivos menores para consulta.

**Fluxo principal**

- Usuário executa o comando de export de contexto
- Sistema lê os arquivos grandes em `data/` do projeto
- Sistema gera saídas menores por entidade (exemplo: um arquivo por skill, enemy e troop) em uma pasta dentro de `report/` (hipótese)

**Fluxos alternativos e exceções**

- Export filtrado apenas para ids usados nos trechos configurados (hipótese)

**Erros previstos**

- JSON inválido
- Diretório de saída sem permissão

**Prioridade:** media

---

### Requisitos não funcionais

Performance

- Rodar a suíte completa de TTK localmente em até 10 minutos, excluindo bosses

Disponibilidade

- Não se aplica como serviço. Deve rodar localmente sem dependência de rede

Segurança e autorização

- O wrapper deve ser read-only no MVP v1 e não escrever em `data/` do projeto RPG Maker MZ

Observabilidade

- Logs no terminal com progresso por trecho e por troop
- No relatório, registrar seed, party, skills escolhidas e warnings

Confiabilidade e integridade de dados

- Execuções determinísticas quando seed é fixa
- Falhas de execução de uma troop não devem interromper as demais, apenas registrar no relatório (hipótese)

Compatibilidade e portabilidade

- Executar via Node.js em macOS e Windows (hipótese)
- Compatível com o projeto RPG Maker MZ e plugins VisuStella utilizados no projeto

Compliance

- Não aplicável

Acessibilidade no frontend consumidor

- Não aplicável, pois não há UI no MVP v1

---

### Arquitetura e abordagem

Abordagem

- CLI em Node.js com testes em Jest e ambiente JSDOM, executando batalhas reais via engine em headless para fidelidade ao jogo final

Componentes

- CLI: comandos para rodar TTK por trechos e export de contexto para IA
- Loader de projeto: valida estrutura do projeto e carrega `data/` e scripts necessários
- Harness headless: setup JSDOM, mocks de PIXI e Graphics, mock de Effekseer, e carregamento síncrono da database via filesystem, seguindo `docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`
- Runner de simulação: orquestra a execução por trecho e por troop, registra turnos e ações
- Reporter: gera `report/report.json`
- Exporter IA: transforma JSONs grandes em arquivos menores para consulta
- Config store: arquivos JSON versionados no repositório do `coreto game engine` (exemplo: `config/`)

Integrações

- Projeto RPG Maker MZ apontado por `projectPath` no config
- Plugins VisuStella presentes no projeto, carregados em headless quando possível

### Decisões e trade-offs

#### Decisão: Wrapper read-only e alterações no editor do RPG Maker

- **Justificativa:** reduzir risco e manter o editor como fonte final de alteração de dados
- **Trade-off:** não acelera edição em massa de dados e depende de disciplina no workflow

#### Decisão: Referências ao banco do MZ sempre por `id` numérico

- **Justificativa:** reduz ambiguidade e simplifica validação automática contra `data/*.json`
- **Trade-off:** configs e relatórios ficam menos legíveis sem um passo extra de resolução de nomes

#### Decisão: Sem UI e sem CI no MVP v1

- **Justificativa:** reduzir escopo e focar na execução determinística e nos relatórios
- **Trade-off:** exige configuração manual via arquivos e execução manual dos testes

#### Decisão: Fidelidade via batalha real na engine em headless

- **Justificativa:** resultados mais próximos do jogo final, especialmente com plugins
- **Trade-off:** maior fragilidade e custo de manutenção do harness headless

#### Decisão: Considerar apenas HP e MP na escolha de skills na v1

- **Justificativa:** reduzir complexidade e ainda capturar o principal impacto em rotações básicas
- **Trade-off:** pode divergir do jogo em cenários com cooldowns, TP, AP e custos múltiplos

---

### Dependências

#### technical: Configuração inicial de trechos, troops e metas de TTK

Os game designers precisam definir os trechos do jogo, quais troops pertencem a cada trecho, e o alvo e tolerância de TTK por trecho.

#### technical: Projeto RPG Maker MZ acessível localmente

O projeto alvo deve estar acessível com `data/` e scripts/plugins necessários para inicialização em headless.

---

### Riscos e mitigação

#### O harness headless não roda com alguns plugins ou atualizações

- **Probabilidade:** alta
- **Impacto:** bloqueio do workflow de validação de TTK
- **Mitigação:**
  - Implementar por prioridade os test handlers base (JSDOM, mocks de PIXI e Effekseer, loader síncrono)
  - Isolar mocks e pontos de integração para facilitar ajustes
  - Criar modo diagnóstico com logs de carregamento (hipótese)
- **Plano de contingência:** rodar em modo limitado para detectar somente falhas de carregamento e gerar relatório parcial

#### Simulação determinística diverge do jogo por fatores não modelados

- **Probabilidade:** media
- **Impacto:** warnings falsos ou ausência de warnings em regressões reais
- **Mitigação:**
  - Manter seed fixa e registrar seed e escolhas de skill no relatório
  - Calibrar com cenários de referência no jogo e ajustar regras
- **Plano de contingência:** reduzir o escopo para validações de dano por ação usando a engine e aumentar cobertura gradualmente

#### Performance não atinge o limite de 10 minutos

- **Probabilidade:** media
- **Impacto:** baixa adoção pelos designers
- **Mitigação:**
  - Medir tempo por trecho e identificar gargalos
  - Permitir rodar subset de trechos e troops por flags (hipótese)
- **Plano de contingência:** reduzir número de simulações por trecho e priorizar os trechos críticos

---

### Critérios de aceitação

Checklist objetivo que define se a feature está pronta.

- Rodar TTK para todos os trechos configurados excluindo bosses em até 10 minutos em máquina típica do time
- Executar batalhas reais via engine em headless (BattleManager e loop de turno) para cada troop configurada
- Medir e registrar TTK por troop em turnos e em ações
- Gerar `report/report.json` com resultados por trecho e por troop, seed, party, skills escolhidas, warnings e resumo
- Quando TTK estiver fora do alvo e tolerância, registrar warning no terminal e no relatório sem interromper a execução
- Quando um `troopId` informado não existir ou tiver `enemyId` inválido, registrar warning apontando o troop digitado
- O wrapper não escreve no banco do RPG Maker MZ no MVP v1

---

### Testes e validação

Tipos de teste obrigatórios

- Testes unitários para parsing de configuração (trechos, troops, party) e validações de ids
- Testes de integração para inicialização do harness headless e carregamento da database do projeto
- Testes de integração para gerar `report/report.json` com estrutura esperada

Estratégia de validação

- Evolução incremental, priorizando primeiro o setup headless estável e determinístico, depois a execução por trecho e a geração de relatório, e por fim o export de contexto para IA
