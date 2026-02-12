### PRD: coreto game engine NSD Generator e Portal Evoluído

Versão: 1.0
Data: 2026-02-10
Responsável: coreto game design

---

### Resumo

Evoluir o Coreto Game Engine v1 para v2 adicionando uma Home gamificada estilo Age of Mythology e uma nova ferramenta chamada NSD Generator. O NSD Generator permite que game designers façam upload de arquivos NSD (Narrative Structure Documents) em formato markdown, selecionem uma cena específica e gerem prompts técnicos otimizados para IA criar cenas jogáveis no RPG Maker MZ. A ferramenta analisa o projeto atual, identifica a variável de controle da quest e gera prompts para Event commands e Common Events, reduzindo o tempo de implementação de 3 dias para 0.5 dia por cena e garantindo consistencia de 100 por cento entre NSD e código.

---

### Contexto e problema

Público-alvo
- Game designers da Coreto, responsáveis por implementação de cenas e quests no RPG Maker MZ
- Desenvolvedores que trabalham com eventos e lógica de jogo no editor do RPG Maker MZ

Cenários de uso chave
- Designer precisa implementar uma nova cena baseada em NSD existente no projeto
- Designer quer garantir que a cena implementada bate exatamente com o NSD documentado
- Designer precisa iterar rapidamente em uma cena sem refazer todo o trabalho manual

Onde essa feature será implantada
- Portal Electron existente em packages/electron do Coreto Game Engine

Problemas priorizados
- Implementar cenas manualmente no editor do RPG Maker MZ é lento e trabalhoso, levando em media 3 dias por cena incluindo implementação, testes e ajustes (prioridade alta)
- Existe risco alto de inconsistencia entre o NSD documentado e a implementação final, pois desenvolvedores frequentemente implementam algo mais legal durante o processo e não atualizam o NSD, gerando desincronização (prioridade alta)
- Curva de aprendizado do editor de eventos é alta e iterar em cenas existentes exige retrabalho manual significativo (prioridade media)

---

### Objetivos e métricas

| Objetivo                                                               | Métrica                                                         | Meta                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| Reduzir tempo de implementação de cenas                               | Dias por cena (implementação + testes + ajustes)                | De 3 dias para 0.5 dia    |
| Garantir consistência entre NSD e implementação                        | Percentual de cenas consistentes com NSD documentado            | 100 por cento             |
| Facilitar iterações em cenas existentes                               | Tempo para refazer uma cena com alterações                      | Redução significativa     |
| Aumentar velocidade de entrega                                        | Cenas implementadas por sprint                                  | 5 cenas por sprint        |

---

### Escopo

Incluso
- Home gamificada estilo Age of Mythology com dois portais circulares (TTK Validation e NSD Generator), incluindo ícones, animações hover, descrições e cenário ao fundo
- Upload de arquivos NSD em formato markdown
- Listagem de cenas disponíveis no NSD para referencia do usuario
- Campo de texto para usuario digitar o nome da cena que deseja implementar
- Análise do projeto RPG Maker MZ existente (mapas, database completa, variaveis de quest), reaproveitando infraestrutura do @coreto/core e adicionando o que faltar
- Integração com API GLM para geração de prompts técnicos
- Geração de prompt técnico otimizado para criar Event commands e Common Events do RPG Maker MZ
- Exibição do prompt gerado em caixa de texto com botão de copiar
- Regeneração de prompt se resultado não for satisfatório
- Configuração de API Key GLM via arquivo .env no projeto e binário compilado

Fora de escopo
- Aplicação automática do código gerado no projeto RPG Maker MZ (write direto em data/)
- Validação visual ou preview da cena gerada
- Versionamento de prompts gerados
- Comparação automatizada entre NSD original e cena implementada
- Gerenciamento de múltiplos NSDs simultâneos
- Modificação ou escrita no banco do RPG Maker MZ
- Segurança avançada (ferramenta de uso interno)

---

### Requisitos funcionais

#### FR-001 Home gamificada estilo Age of Mythology

O sistema deve apresentar uma tela inicial gamificada estilo seleção de divindades do Age of Mythology, com dois portais circulares representando as ferramentas disponíveis.

**Fluxo principal**
- Usuario seleciona projeto RPG Maker MZ (tela existente mantida)
- Sistema exibe Home gamificada com dois círculos/portais:
  - Portal TTK Validation (ferramenta existente)
  - Portal NSD Generator (nova ferramenta)
- Cada portal possui ícone ou imagem representativa
- Ao passar o mouse sobre um portal, sistema exibe animação hover e descrição da ferramenta
- Cenário ao fundo remete a ambiente de jogo (templo ou fantasia)
- Usuario clica no portal desejado e é redirecionado para a ferramenta correspondente

**Fluxos alternativos e exceções**
- Usuario pode acessar diretamente uma ferramenta via atalho ou URL direta

**Erros previstos**
- Nenhum erro especifico neste requisito

**Prioridade:** media

---

#### FR-002 Upload de arquivo NSD

O sistema deve permitir que usuario faca upload de um arquivo NSD em formato markdown contendo a estrutura de cenas de uma quest.

**Fluxo principal**
- Usuario clica no portal NSD Generator na Home
- Sistema exibe tela de upload com botão para selecionar arquivo
- Usuario seleciona arquivo .md ou .NSD.fluxo-cenas.md do seu computador
- Sistema faz upload do arquivo e o armazena temporariamente em memória
- Sistema consome o arquivo inteiro via IA (sem parsing manual do markdown)
- Sistema extrai e lista todas as cenas disponíveis no NSD para referencia do usuario
- Sistema libera campo de texto para usuario digitar o nome da cena

**Fluxos alternativos e exceções**
- Usuario pode fazer upload de novo arquivo substituindo o anterior
- Se arquivo não estiver em formato markdown válido, sistema exibe erro e solicita novo arquivo

**Erros previstos**
- Arquivo selecionado não é um markdown válido (extensão .md ou formato incorreto)
- Arquivo corrompido ou ilegível
- Arquivo vazio ou sem estrutura de cenas reconhecível

**Prioridade:** alta

---

#### FR-003 Seleção de cena por digitação

O sistema deve permitir que usuario digite o nome da cena que deseja implementar, baseado na lista extraída do NSD.

**Fluxo principal**
- Sistema exibe campo de texto para digitação do nome da cena
- Sistema exibe lista de cenas disponíveis no NSD como referencia
- Usuario digita o nome exato da cena que deseja implementar
- Sistema valida se o nome digitado corresponde a uma cena existente no NSD
- Se nome for válido, sistema libera botão Gerar Prompt
- Se nome for inválido, sistema exibe mensagem de erro e mantem botão desabilitado

**Fluxos alternativos e exceções**
- Usuario pode digitar apenas parte do nome e sistema sugere completar (opcional futuro)
- Usuario pode corrigir o nome digitado antes de gerar o prompt

**Erros previstos**
- Nome digitado não corresponde a nenhuma cena do NSD
- Nome digitado está vazio ou em formato inválido

**Prioridade:** alta

---

#### FR-004 Análise de projeto RPG Maker MZ

O sistema deve analisar o projeto RPG Maker MZ selecionado para extrair informações necessárias para geração do prompt, incluindo mapas, database completa e variáveis de controle de quests.

**Fluxo principal**
- Sistema le a estrutura de mapas do projeto (MapInfos.json, MapXXX.json)
- Sistema le a database completa (Classes.json, Skills.json, Items.json, Weapons.json, Armors.json, Enemies.json, Troops.json, States.json, Animations.json, CommonEvents.json, Switches.json, Variables.json)
- Sistema identifica em qual mapa a cena selecionada deve ocorrer, baseado no NSD
- Sistema identifica a variável de controle da quest associada a cena, considerando que um mapa pode conter múltiplas cenas e é crucial alterar apenas a cena escolhida sem afetar as outras
- Sistema lista recursos disponíveis relevantes para a cena (sprites, battlebacks, BGMs, sound effects)
- Sistema organiza todas as informações estruturadas para envio à IA

**Fluxos alternativos e exceções**
- Se mapa referenciado no NSD não existir, sistema gera warning mas permite continuar
- Se recurso referenciado não estiver disponível, sistema sugere alternativas ou marca como placeholder

**Erros previstos**
- Projeto RPG Maker MZ não possui estrutura válida (sem data/, sem MapInfos.json)
- Arquivos da database corrompidos ou ilegíveis
- Variável de controle da quest não pode ser identificada automaticamente

**Prioridade:** alta

---

#### FR-005 Geração de prompt técnico via IA

O sistema deve integrar com API GLM para gerar um prompt técnico otimizado que permita a IA criar Event commands e Common Events do RPG Maker MZ correspondentes à cena selecionada.

**Fluxo principal**
- Usuario clica no botão Gerar Prompt após digitar o nome da cena válido
- Sistema coleta: NSD completo (arquivo markdown), cena selecionada, análise do projeto MZ (mapas, database, variável de quest, recursos)
- Sistema envia todas as informações estruturadas para API GLM via requisição HTTP
- Sistema aguarda processamento da IA (timeout de até 2 minutos)
- IA analisa NSD, contexto do projeto MZ e cena específica, gerando um prompt técnico
- Sistema recebe o prompt gerado da API GLM
- Sistema exibe o prompt em caixa de texto grande e editável
- Sistema habilita botão Copiar para area de transferência

**Fluxos alternativos e exceções**
- Se resultado não for satisfatório, usuario pode clicar em Gerar Prompt novamente para regenerar
- Se primeira tentativa não gerar bom resultado, sistema pode aplicar engenharia de prompt em duas etapas (extrair estrutura NSD → gerar prompt final) em tentativas subsequentes
- Usuario pode editar manualmente o prompt gerado antes de copiar

**Erros previstos**
- API GLM não responde dentro do timeout de 2 minutos
- API Key GLM inválida, expirada ou sem créditos disponíveis
- Falha de conexão com API GLM (sem internet, servidor indisponível)
- Resposta da IA não é válida ou está mal formatada

**Prioridade:** alta

---

#### FR-006 Configuração de API Key GLM

O sistema deve permitir configuração de API Key para integração com API GLM, garantindo acesso controlado e seguro.

**Fluxo principal**
- Administrador configura API Key GLM em arquivo .env na raiz do projeto
- Durante build do binário Electron, API Key é embutida no executável
- Sistema carrega API Key do ambiente ao inicializar o NSD Generator
- Sistema utiliza API Key em todas as requisições à API GLM
- Sistema não exibe a API Key em logs ou interface de usuario

**Fluxos alternativos e exceções**
- API Key pode ser atualizada rebuildando o binário com novo .env
- Sistema valida se API Key está presente antes de habilitar funcionalidade

**Erros previstos**
- API Key não configurada ou ausente do ambiente
- API Key inválida ou expirada (erro retornado pela API GLM)

**Prioridade:** alta

---

#### FR-007 Regeneração de prompt

O sistema deve permitir que usuario regere o prompt se o resultado não for satisfatório, sem precisar refazer todo o fluxo desde o inicio.

**Fluxo principal**
- Usuario visualiza prompt gerado na caixa de texto
- Usuario clica no botão Gerar Prompt novamente (mesmo com resultado já exibido)
- Sistema envia nova requisição à API GLM com os mesmos dados
- Sistema exibe novo prompt gerado, substituindo o anterior
- Usuario pode repetir o processo quantas vezes desejar

**Fluxos alternativos e exceções**
- Sistema pode aplicar variações na engenharia de prompt em tentativas subsequentes para melhorar resultado
- Usuario pode ajustar manualmente o nome da cena entre tentativas

**Erros previstos**
- API GLM atinge limite de taxa de requisições (rate limit)
- Créditos da API Key esgotaram temporariamente

**Prioridade:** media

---

#### FR-008 Navegação e fluxo de telas

O sistema deve prover navegação fluida entre as telas do NSD Generator e permitir que usuario retorne, cancele ou reinicie o fluxo a qualquer momento.

**Fluxo principal**
- Tela inicial do NSD Generator exibe botão de upload de NSD
- Após upload com sucesso, sistema exibe tela com campo de digitação de cena
- Após gerar prompt com sucesso, sistema exibe tela com resultado
- Cada tela possui botão Voltar para retornar à etapa anterior
- Cada tela possui botão Cancelar para retornar à Home
- Usuario pode reiniciar o fluxo a qualquer momento clicando em Cancelar ou voltando à Home

**Fluxos alternativos e exceções**
- Usuario pode fazer upload de novo NSD cancelando o fluxo atual
- Sistema mantem estado do NSD carregado se usuario navegar entre telas

**Erros previstos**
- Navegação interrompida por erro inesperado
- Estado perdido ao navegar entre telas (raro)

**Prioridade:** media

---

### Requisitos não funcionais

Performance
- Geração de prompt deve completar em até 1 a 2 minutos, dependendo da complexidade da cena e disponibilidade da API GLM
- Upload de arquivo NSD deve completar em menos de 5 segundos para arquivos de até 1MB
- Listagem de cenas do NSD deve ser exibida em menos de 10 segundos após upload
- Análise do projeto MZ deve completar em menos de 30 segundos para projetos típicos

Disponibilidade
- Funcionalidade de NSD Generator depende de disponibilidade da API GLM e acesso à internet
- Se API GLM estiver indisponível, sistema deve exibir mensagem clara ao usuario
- Se créditos da API Key esgotarem, sistema deve exibir mensagem orientando usuario a aguardar renovação

Segurança e autorização
- Ferramenta de uso interno, sem necessidade de autenticação de usuario no escopo v2
- API Key GLM deve ser protegida e não exposta em logs ou interface
- Projetos RPG Maker MZ são acessados localmente sem necessidade de validação de permissões especiais

Observabilidade
- Seguir padrão de logs existente em packages/electron do projeto
- Registrar eventos importantes: upload de NSD, geração de prompt, erros de API GLM
- Logs devem incluir contexto suficiente para debug (nome do NSD, cena selecionada, status da requisição)
- Não expor informações sensíveis (API Key, conteúdo completo de NSD) em logs

Confiabilidade e integridade de dados
- Sistema não deve modificar o projeto RPG Maker MZ (read-only)
- Sistema deve garantir que variável de quest identificada não afete outras cenas do mesmo mapa
- Regeneração de prompt deve ser idempotente (mesmos dados → resultados consistentes)
- Falhas na API GLM não devem corromper estado da aplicação

Compatibilidade e portabilidade
- Funcionar em ambiente Electron (macOS, Windows, Linux)
- Compatível com estrutura de projetos RPG Maker MZ padrão
- Suportar arquivos NSD em formato markdown com codificação UTF-8
- Integração via HTTP REST API com GLM

Compliance
- Não aplicável para ferramenta interna de uso interno

Acessibilidade no frontend consumidor
- Interface seguir principios básicos de acessibilidade (contraste, tamanho de fonte, navegacao por teclado)
- Botões e campos devem ter labels descritivos
- Mensagens de erro devem ser claras e acionáveis

---

### Arquitetura e abordagem

Abordagem
- Extensão do Portal Electron existente em packages/electron, adicionando Home gamificada e módulo NSD Generator
- Arquitetura baseada em comunicação síncrona entre interface React, backend Node.js no processo principal do Electron e integração externa com API GLM via HTTP
- NSD é consumido integralmente pela IA sem parsing manual do markdown, simplificando manutenção
- Análise do projeto MZ reaproveita infraestrutura de @coreto/core (loader, validação) e adiciona novos analysers para mapas, database completa e variaveis de quest

Componentes
- Interface React: Home gamificada, tela de upload de NSD, tela de seleção de cena, tela de resultado com prompt gerado
- Backend Node.js (Electron Main Process): orquestração do fluxo, integração com API GLM, análise de projeto MZ
- Módulo de Análise MZ: leitura de MapInfos.json, MapXXX.json, database completa, identificação de variaveis de quest e recursos disponíveis
- Cliente HTTP GLM: wrapper para requisições à API GLM com tratamento de erros e timeout
- Config Manager: leitura de API Key do .env e gerenciamento de configurações

Integrações
- Projeto RPG Maker MZ local: leitura de arquivos de mapas e database via filesystem
- API GLM externa: requisições HTTP POST para gerar prompts técnicos
- @coreto/core existente: reaproveitamento de loaders e validadores de estrutura MZ

---

### Decisões e trade-offs

#### Decisão: Integração com API GLM em vez de OpenAI ou Claude
- **Justificativa:** GLM é o provedor de IA escolhido pelo time, adequado para tarefa de geração de prompts técnicos em português
- **Trade-off:** Dependência de um provedor específico pode limitar portabilidade para outros modelos de linguagem no futuro

#### Decisão: Não fazer parsing manual do NSD, enviar arquivo inteiro para IA
- **Justificativa:** Simplifica implementação e reduz manutenção de código de parsing, IA consegue consumir markdown diretamente
- **Trade-off:** Se resultados não forem bons, será necessário engenharia de prompt em duas etapas, aumentando complexidade e custo de tokens

#### Decisão: Usuario digita nome da cena em vez de selecionar de lista
- **Justificativa:** Flexibilidade para usuario digitar exatamente o que deseja, permite escolher cenas que não estejam perfeitamente formatadas na lista
- **Trade-off:** Possibilidade de erros de digitação, mitigada por validação contra NSD e exibição de lista como referencia

#### Decisão: Não fazer write automático no projeto RPG Maker MZ
- **Justificativa:** Mantém consistência com filosofia read-only da v1, reduz risco de corrupção de dados, permite usuario revisar antes de aplicar
- **Trade-off:** Requer passo manual de copiar prompt e colar na IA externa para gerar código, depois aplicar código no editor do RPG Maker MZ

#### Decisão: Regeneração como mitigação principal para riscos
- **Justificativa:** IA generativa tem variabilidade natural, regenerar é simples e eficaz para obter melhor resultado
- **Trade-off:** Pode aumentar custo de tokens e tempo se usuario precisar regenerar múltiplas vezes

---

### Dependências

#### technical: API Key GLM configurada
Administrador do sistema deve configurar API Key da GLM em arquivo .env na raiz do projeto antes do build. Sem essa credencial, funcionalidade de NSD Generator não opera.

#### technical: Acesso à internet
Usuario deve ter acesso à internet ativo e estável durante uso do NSD Generator para comunicação com API GLM.

#### technical: Projeto RPG Maker MZ válido e acessível
Usuario deve ter um projeto RPG Maker MZ válido (com estrutura data/, MapInfos.json, database completa) acessível localmente para análise.

#### organizational: Design visual da Home gamificada
Design team deve fornecer especificações visuais detalhadas da Home gamificada baseadas em Figma existente para implementação pela equipe de frontend.

#### organizational: Documentação de NSDs
Equipe de game design deve manter NSDs atualizados e em formato markdown válido para uso efetivo da ferramenta.

---

### Riscos e mitigação

#### IA gera código ou events errados, incompatíveis com RPG Maker MZ
- **Probabilidade:** media
- **Impacto:** Usuario não consegue usar prompt gerado, precisa regenerar ou ajustar manualmente
- **Mitigação:**
  - Usuario pode regenerar prompt quantas vezes for necessário
  - Prompt gerado pode ser editado manualmente antes do uso
  - Engenharia de prompt iterativa para melhorar qualidade ao longo do tempo
- **Plano de contingência:** Se múltiplas regerações não resolverem, usuario pode ajustar manualmente o prompt ou reportar problema para equipe melhorar engenharia de prompt

#### Variável de quest identificada incorretamente, afetando outras cenas do mesmo mapa
- **Probabilidade:** media
- **Impacto:** Quebra de cenas existentes no mapa, bugs em quests relacionadas
- **Mitigação:**
  - Algoritmo de identificação foca em contexto especifico da cena selecionada no NSD
  - Usuario pode revisar prompt gerado e validar variável antes de usar
  - Sistema inclui warnings se detecção de variável não for conclusiva
- **Plano de contingência:** Usuario pode corrigir variável manualmente no prompt gerado ou informar problema para ajuste no algoritmo de detecção

#### Prompt gerado não é bom suficiente ou fica faltando informações
- **Probabilidade:** media
- **Impacto:** Usuario precisa regenerar ou ajustar manualmente, perdendo o ganho de produtividade esperado
- **Mitigação:**
  - Usuario pode regenerar prompt livremente
  - Se primeira abordagem falhar, implementar engenharia de prompt em duas etapas (extrair estrutura → gerar prompt final)
  - Iterar em engenharia de prompt baseado em feedback real dos usuários
- **Plano de contingência:** Ajustar engenharia de prompt com base em casos reais, coletar feedback dos usuários para melhorar qualidade

#### API GLM fica instável, indisponível ou atinge limite de taxa
- **Probabilidade:** baixa
- **Impacto:** Usuario não consegue gerar prompt naquele momento, precisa aguardar ou tentar mais tarde
- **Mitigação:**
  - Sistema exibe mensagem clara de erro quando API está indisponível
  - Sistema implementa timeout adequado (2 minutos) para não travar interface
  - Rate limit é tratado com mensagem orientando usuario a aguardar
- **Plano de contingência:** Usuario aguarda retorno da API ou renovação de créditos, não há workaround técnico para dependência externa

#### Análise do projeto MZ falha ou demora muito
- **Probabilidade:** baixa
- **Impacto:** Fluxo não pode ser completado, usuario não consegue gerar prompt
- **Mitigação:**
  - Validação precoce de estrutura do projeto MZ antes de iniciar análise completa
  - Tratamento robusto de erros na leitura de arquivos JSON
  - Progress indicators para usuario acompanhar andamento da análise
- **Plano de contingência:** Corrigir estrutura do projeto MZ ou contatar suporte técnico, dependendo do tipo de erro

---

### Critérios de aceitação

Checklist objetivo que define se a feature está pronta.

- Usuario consegue fazer upload de arquivo NSD em formato markdown e visualizar lista de cenas disponíveis
- Sistema identifica corretamente a variável de controle da quest para a cena selecionada, sem afetar outras cenas do mesmo mapa
- Prompt gerado contem todas as informações necessárias para implementação: contexto da cena, beats, recursos disponíveis, mapa, variaveis, Event commands e Common Events
- Prompt copiado funciona para gerar uma cena funcional no editor do RPG Maker MZ (validado por usuario)
- Home gamificada é exibida corretamente com dois portais, ícones, animações e cenário ao fundo
- Integração com API GLM funciona estavelmente com autenticação via API Key
- Sistema permite regeneração de prompt sem travar ou perder estado
- Mensagens de erro são claras e acionáveis em caso de falha (API indisponível, arquivo invalido, etc.)
- Tempo total de geração de prompt (upload + análise + geração) fica dentro de 1 a 2 minutos para cenas médias
- Logs seguem padrão do projeto packages/electron e incluem contexto suficiente para debug

---

### Testes e validação

Tipos de teste obrigatórios
- Testes unitários para leitura e validação de arquivos NSD (listagem de cenas, extração de metadados)
- Testes unitários para análise de projeto MZ (leitura de MapInfos.json, database, identificação de variaveis de quest)
- Testes unitários para cliente HTTP GLM (tratamento de resposta, erros, timeout)
- Testes de integração para fluxo principal (upload → digita cena → gera prompt → exibe resultado)
- Testes de integração para chamadas reais à API GLM (com API Key de teste)
- Testes E2E para fluxo completo desde Home gamificada até cópia do prompt gerado
- Testes manuais de validação dos prompts gerados aplicando em cenários reais do RPG Maker MZ
- Testes de performance para garantir tempo de geração dentro de 1 a 2 minutos
- Testes de usabilidade com game designers reais para validar experiência do fluxo

Estratégia de validação
- TDD (Test-Driven Development) para lógica crítica de análise de MZ, detecção de variaveis de quest e geração de prompts
- QA manual guiado por roteiro para validar fluxo completo em ambiente Electron real
- Validação exploratória com game designers usando NSDs reais do projeto para identificar problemas práticos e oportunidades de melhoria
- Iteração baseada em feedback real dos usuários para ajustar engenharia de prompt e qualidade dos resultados
