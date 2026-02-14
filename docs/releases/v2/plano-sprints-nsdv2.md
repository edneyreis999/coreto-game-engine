# NSD Generator v2 - Plano de Sprints

## Metadata

- **Projeto:** Coreto Game Engine - NSD Generator v2
- **Data:** 2026-02-13
- **Horizonte:** 13 semanas (~3 meses)
- **Abordagem:** Vertical Slicing (diluicao de fundacao arquitetural)
- **Total de Sprints:** 8

---

## Resumo Executivo

| Sprint | Duracao | Foco | Valor Percebido |
|--------|----------|------|------------------|
| 1 | 2 semanas | Home gamificada + Router | VISIVEL: Cliente abre app e ve nova interface |
| 2 | 2 semanas | Upload + Parse NSD | INTERATIVO: Cliente carrega arquivo NSD real |
| 3 | 1 semana | Selecao de cena | INTERATIVO: Cliente digita nome, ve validacao |
| 4 | 2 semanas | Analise MZ + Orchestrator | PROGRESSO: Cliente ve barra de progresso |
| 5 | 2 semanas | Geracao Prompt + GLM | RESULTADO: Cliente recebe prompt tecnico |
| 6 | 1 semana | Regeneracao + Cancelamento | CONTROLE: Cliente pode interromper e tentar novamente |
| 7 | 2 semanas | Polish + Testes E2E | REFINADO: Interface polida e robusta |
| 8 | 1 semana | Config + Build + Release | AUTONOMO: Produto final sem workarounds |

**Primeiro valor visivel:** Sprint 1 (semana 2)
**Primeiro resultado funcional:** Sprint 5 (semana 9)
**Produto completo:** Sprint 8 (semana 13)

---

## Diluicao da Sprint 0 (Fundacao Arquitetural)

A Sprint 0 original (fundacao pura) foi **completamente diluida** nas outras sprints:

| Componente Sprint 0 | Diluido Em | Status |
|---------------------|-------------|--------|
| ADR-034: Worker Thread Isolation | Sprint 2 | Worker Thread criado com IPC |
| ADR-035: Sequential Job Queue | Sprint 4 | Orchestrator com job queue basico |
| ADR-036: GLM API Integration | Sprint 5 | GLM Client HTTP wrapper |
| DI Container (TSyringe) | Sprint 1 | Setup basico no inicio |
| SQLite Schema (generation_jobs) | Sprint 5 | Repository criado com persistencia |

**Justificativa:** Vertical Slicing permite valor visivel desde Sprint 1, feedback mais cedo, e risco reduzido de re-arquitetura.

---

## Sprint 1: Home Gamificada (2 semanas)

### O que e construido

**Componentes React:**
- `Home.tsx` - Tela inicial com layout de portais
- `PortalButton.tsx` - Componente reutilizavel para cada ferramenta
- `App.tsx` - Atualiza com Router para `/nsd-generator`

**Estilizacao:**
- Background estilo "Age of Mythology" (fantasia/templo)
- Hover animations (scale + glow)
- Icones para TTK (spada) e NSD Generator (documento)

**DI Container (DILUIDO da Sprint 0):**
- Registro de use cases (vazios nesta sprint)
- Setup basico de containers

**Rotas:**
- `/` - Home.tsx
- `/nsd-generator` - Placeholder (Proxima sprint)

### Valor percebido pelo cliente

```
+------------------------------------------+
|     Age of Mythology Style          |
|   [Cenario de fantasia ao fundo]  |
|                                      |
|    +-------------+    +-------------+  |
|    |    TTK      |    |    NSD      |  |
|    |  Validation  |    |   Generator  |  | <- HOVER: scale(1.05) + glow
|    +-------------+    +-------------+  |
|                                      |
|  [Selecione seu projeto RPG Maker] |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Portal NSD Generator clicavel - navega para `/nsd-generator`
- Hover nos portais exibe animacao
- Roteamento funciona (voltar para Home)

### Diluicao da Sprint 0

**O que NAO e feito ainda:**
- Worker Thread (ainda nao preciso)
- IPC channels (proxima sprint)
- SQLite Schema (proximas sprints)
- GLM Client (Sprint 5)

**O que E feito (minimo):**
- DI Container basico com containers vazios
- Router configurado

### Riscos e mitigacao

- Risco: Over-engineering estilizacao antes de funcionalidade pronta
  - Mitigacao: CSS simples, usando Tailwind utilities + shadcn/ui
- Risco: Router criar complexidade desnecessaria
  - Mitigacao: Hash router (`#/nsd-generator`) ao inves de history router

### Dependencias

**Entrada:** Nenhuma (primeira sprint)
**Saida:** Infraestrutura de roteamento para Sprint 2

---

## Sprint 2: Upload e Parse de NSD (2 semanas) - GATEWAY CRITICO

### O que e construido

**Worker Thread (DILUIDO da Sprint 0):**
- `worker.ts` - Worker Thread setup com Communication Channel
- `nsd-worker.service.ts` - Servico principal no Worker

**IPC Channels (DILUIDO da Sprint 0):**
- `nsd:upload` - Request: `{ source: { path?: string, text?: string } }`
- `nsd:upload:response` - Response: `{ documentId: string, sceneList: NSDScene[], warnings?: string[] }`
- Zod schemas para validacao de payloads

**NSD Parser:**
- `nsd-parser.service.ts` - Consome markdown via IA (envia arquivo completo para GLM)
- `nsd-document.entity.ts` - Domain entity (NSD lido)
- `nsd-scene.entity.ts` - Domain entity (cena extraida)
- IA consome markdown - sem parsing manual de markdown

**React Components:**
- `NsdUpload.tsx` - Tela de upload (drag & drop + file dialog)
- `SceneList.tsx` - Lista de cenas detectadas
- `useNsdUpload.ts` - Custom hook para IPC

**Validacao:**
- Extensao .md obrigatoria
- Tamanho maximo 1MB
- Arquivo vazio ou ilegivel - erro claro

### Valor percebido pelo cliente

```
+------------------------------------------+
|  NSD Generator                       |
|                                      |
|  +-------------------------------+   |
|  |  Upload NSD Document      |   |
|  |                            |   |
|  |  [Arraste arquivo .md aqui] |   | <- DRAG & DROP
|  |  ou                         |   |
|  |  [Selecionar Arquivo]        |   | <- FILE DIALOG
|  +-------------------------------+   |
|                                      |
|  Processando NSD...                   |
|                                      |
|  3 cenas detectadas:                 |
|  - Cena 1: Contrato na Taverna     |
|  - Cena 2: Conversa com Barda      |
|  - Cena 3: Revelacao do Segredo     |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Drag & drop de arquivo .md funciona
- File dialog abre para selecionar NSD
- Loading state enquanto processa
- Sistema detecta cenas automaticamente (IA GLM consome markdown)
- Lista de cenas aparece (<10s apos upload)
- Erros claros: "Arquivo invalido", "Tamanho excedido (1MB max)", "Arquivo vazio"

### Diluicao da Sprint 0

**O que E feito (CRITICO):**
- Worker Thread completo (base para tudo adiante)
- IPC channels com Zod (padrao de comunicacao)
- NSD Parser (dominio + integracao IA)

**O que NAO e feito ainda:**
- Job Queue/Orchestrator (Sprint 4)
- Project Analyzer (Sprint 4)
- GLM Client (Sprint 5)
- Repository SQLite (Sprint 5)

### Riscos e mitigacao

- Risco: Worker Thread nao conseguir ler arquivo (sandbox)
  - Mitigacao: IPC passa `path`, Worker le via `fs.readFile()`
- Risco: IA GLM nao conseguir extrair cenas do markdown
  - Mitigacao: Fallback para parsing manual regex se IA falhar (Sprint 2.1)
- Risco: Upload de arquivo grande travar Worker
  - Mitigacao: Limite 1MB + validacao antes de enviar

### Dependencias

**Entrada:** Router (Sprint 1)
**Saida:** Infraestrutura para Sprint 3 (Selecao)

---

## Sprint 3: Selecao de Cena (1 semana)

### O que e construido

**React Components:**
- `SceneSelector.tsx` - Campo de digitacao com autocomplete
- `useSceneValidation.ts` - Custom hook para validacao

**Validacao:**
- Validacao contra `sceneList` do NSD carregado
- Feedback visual em tempo real (check ou X)

**Estado da aplicacao:**
- `selectedScene` state em React context
- NSD carregado persiste em estado global

### Valor percebido pelo cliente

```
+------------------------------------------+
|  NSD Generator                       |
|                                      |
|  Cenas disponiveis no NSD:           |
|  - Cena 1: Contrato na Taverna       | <- REFERENCIA
|  - Cena 2: Conversa com Barda        |
|  - Cena 3: Revelacao do Segredo       |
|                                      |
|  +-------------------------------+   |
|  | Digite o nome da cena:       |   |
|  | [Contrato na Taverna_______] | <- DIGITACAO
|  |                            |   |
|  |  Nome valido!               | <- FEEDBACK
|  |                            |   |
|  |  [Gerar Prompt] <- Habilitado   | <- SO VALIDO SE VALIDO
|  +-------------------------------+   |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Autocomplete sugere cenas do NSD
- Validacao em tempo real (nome existe? check ou X)
- Botao "Gerar Prompt" so habilita se nome valido
- Mensagem de erro: "Cena 'X' nao encontrada no NSD"

### Diluicao da Sprint 0

**Reutiliza:**
- IPC + Worker (Sprint 2)

**Novo:**
- Validacao UI (sem novos backend)

### Riscos e mitigacao

- Risco: Usuario digitar nome com typo pequeno
  - Mitigacao: Autocomplete + validacao fuzzy (permitir "taverna" - "Taverna")

### Dependencias

**Entrada:** Upload + Parse (Sprint 2)
**Saida:** Estado pronto para Sprint 4 (Analise MZ)

---

## Sprint 4: Analise de Projeto MZ (2 semanas)

### O que e construido

**Project Analyzer (@coreto/core):**
- `ProjectAnalyzer` use case (novo)
- `MzProjectRepository` (reuso de loaders existentes)
- `QuestVariableDetector` (nova logica) - Identifica variavel de controle da quest

**Orchestrator (DILUIDO da Sprint 0):**
- `nsd-orchestrator.ts` - Job queue basico (sequencial)
- Job tracking: `pending | processing | completed | failed`
- `JobId` generation

**IPC Channels (NOVOS):**
- `nsd:start` - Request: `{ documentId: string, sceneId?: string }`
- `nsd:start:response` - Response: `{ jobId: string, status: "pending" | "processing" }`
- `nsd:progress` - Event push: `{ jobId, stage, percent, message }`

**Leitura de Projeto MZ:**
- MapInfos.json (mapas disponiveis)
- MapXXX.json (estrutura de cada mapa)
- Database completa (Classes, Skills, Items, Weapons, Armors, Enemies, Troops, States, Animations, CommonEvents, Switches, Variables)

**React Components:**
- `ProgressBar.tsx` - Barra de progresso streaming
- `useJobProgress.ts` - Hook para ouvir `nsd:progress`

### Valor percebido pelo cliente

```
+------------------------------------------+
|  NSD Generator                       |
|                                      |
|  Analisando projeto RPG Maker MZ...   |
|  ###    (40%)                     | <- STREAMING
|                                      |
|  - Lendo MapInfos.json... check        | <- ETAPAS
|  - Carregando database... check         |
|  - Identificando variaveis de quest    |
|                                      |
|  Analise completa!                     |
|                                      |
|  Projeto detectado:                     |
|  - Mapa: Map003 (Taverna)           |
|  - Variavel: Variable[42]              | <- QUEST VARIABLE
|  - Recursos: 15 sprites, 3 BGMs       |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Barra de progresso atualiza em tempo real (IPC `nsd:progress`)
- Sistema identifica variavel de controle da quest automaticamente
- Warnings nao bloqueiam (ex: "Mapa nao encontrado, mas pode continuar")
- Analise completa em <30s para projeto tipico

### Diluicao da Sprint 0

**O que E feito:**
- Orchestrator basico (job queue, tracking)
- Project Analyzer (reuso @coreto/core + nova logica)

**O que NAO e feito ainda:**
- GLM Client (Sprint 5)
- Repository SQLite (Sprint 5)
- Cancelamento (Sprint 6)

### Riscos e mitigacao

- Risco: Variavel de quest identificada incorretamente
  - Mitigacao: Warning na UI + usuario pode editar prompt depois
- Risco: Analise demorar muito (>30s)
  - Mitigacao: Timeout + mensagem "Analise demorando, aguarde..."

### Dependencias

**Entrada:** Selecao de Cena (Sprint 3)
**Saida:** Estado pronto para Sprint 5 (Geracao)

---

## Sprint 5: Geracao de Prompt com GLM (2 semanas) - PRIMEIRO RESULTADO TANGIVEL

### O que e construido

**GLM Client (DILUIDO da Sprint 0):**
- `glm-client.service.ts` - HTTP wrapper para API GLM
  - Base URL: `https://api.glm.com/v1/chat/completions`
  - Headers: `Authorization: Bearer ${GLM_API_KEY}`
  - Retry com exponential backoff (1s - 2s - 4s)
  - Timeout configuravel (30s default)
  - Tratamento de erros: 401/403 (auth), 429 (rate limit), 500+, timeout

**Prompt Builder (NOVO Domain Service):**
- `prompt-builder.service.ts` - Monta prompt tecnico otimizado
  - Template de prompt para Event Commands + Common Events
  - Inclui: contexto da cena, beats, recursos disponiveis, mapa, variaveis
  - Saida: string formatada para IA externa

**NSD Repository (DILUIDO da Sprint 0):**
- `nsd-repository.ts` - Persistencia SQLite
  - Schema: `generation_jobs` tabela
  - Operations: `create()`, `updateStatus()`, `getById()`, `listAll()`
  - Jobs persistidos com: request, result, metadata, status

**IPC Channels (NOVOS):**
- `nsd:result` - Event push: `{ jobId, prompt, metadata }`
- `nsd:error` - Event push: `{ jobId, error, code, retryable }`

**React Components:**
- `PromptResult.tsx` - Caixa de texto editavel com prompt gerado
- `CopyButton.tsx` - Botao copiar para area de transferencia
- `usePromptGeneration.ts` - Hook para ouvir `nsd:result` e `nsd:error`

**Integracao Worker - GLM:**
- Worker Service chama Project Analyzer (Sprint 4)
- Worker Service chama GLM Client com prompt construido
- Worker Service retorna resultado via IPC

### Valor percebido pelo cliente

```
+------------------------------------------+
|  NSD Generator                       |
|                                      |
|  Gerando prompt com IA...              |
|  ##########                       (80%)  | <- STREAMING
|                                      |
|  Prompt gerado com sucesso!           |
|                                      |
|  +-------------------------------+   |
|  | PROMPT TECNICO             |   |
|  |                            |   |
|  | ## Contexto da Cena          |   |
|  | Mapa: Map003 (Taverna)         |   |
|  | Variavel: Variable[42]           |   |
|  | Recursos: 15 sprites, 3 BGMs    |   |
|  |                            |   |
|  | ## Event Commands            |   |
|  | > Show Text: "Bem-vindo..."   |   | <- COPIAR
|  | > Choice Branches...            |   |
|  | > Set Variable: Variable[42] = 1|   |
|  |                            |   |
|  | ## Common Events              |   |
|  | Quest_01_Track() {            |   |
|  |   @show_text("Bem-vindo...")  |   | <- PROMPT
|  |   @choices([                |   |    TECNICO
|  |     "Sim, vamos conversar",   |   |    PRONTO
|  |     "Nao, deixe-me em paz"    |   |    PARA
|  |   ])                          |   |    USAR
|  | }                            |   |
|  |                            |   |
|  | GLM-4 | 1,234 tokens         |   | <- METADATA
|  | 12.3s                        |   |
|  |                            |   |
|  | [Copiar] [Regenerar]          |   | <- BOTOES
|  +-------------------------------+   |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Prompt aparece em caixa de texto editavel
- Botao Copiar leva para area de transferencia
- Botao Regenerar funciona (reutiliza dados)
- Geracao completa em 1-2 minutos
- Metadata visivel: modelo GLM, tokens usados, timing
- Erros claros: "API GLM indisponivel", "Rate limit - aguarde 30s", "API Key invalida"

### Diluicao da Sprint 0

**O que E feito:**
- GLM Client (integracao HTTP completa)
- Repository SQLite (persistencia de jobs)
- Prompt Builder (dominio)

**O que NAO e feito ainda:**
- Cancelamento sofisticado (Sprint 6)
- Historico de jobs (Sprint 6)

### Riscos e mitigacao

- Risco: GLM API mudar contrato
  - Mitigacao: Versionar GLM Client isolado (ADR-036)
- Risco: Prompt gerado nao e bom suficiente
  - Mitigacao: Botao Regenerar + prompt editavel
  - Fallback: Usuario pode editar manualmente antes de copiar
- Risco: Rate limit da API GLM
  - Mitigacao: Exponential backoff (1s - 2s - 4s - 8s)
  - Mensagem: "Rate limit atingido - aguarde 30s ou tente novamente"

### Dependencias

**Entrada:** Analise MZ + Orchestrator (Sprint 4)
**Saida:** Prompt gerado pronto para Sprint 6 (Cancelamento)

---

## Sprint 6: Regeneracao e Cancelamento (1 semana)

### O que e construido

**Orchestrator Cancelamento (DILUIDO da Sprint 0):**
- `nsd-orchestrator.ts` - Adiciona metodos:
  - `cancelJob(jobId)` - Cancela job em andamento
  - `heartbeatCheck()` - Verifica se Worker ainda vivo
  - `status recovery` - Jobs `processing` marcados `failed` na startup

**IPC Channel (NOVO):**
- `nsd:cancel` - Request: `{ jobId }`
- Response: `{ success: boolean, message: string }`

**Worker Service:**
- `abortController` - AbortSignal para requisicoes GLM
- Cleanup ao receber cancelamento

**React Components:**
- `CancelButton.tsx` - Botao cancelar visivel durante geracao
- `JobHistory.tsx` - Lista de jobs anteriores (do Repository)

**Estados da aplicacao:**
- `jobStatus` = `pending | processing | completed | failed | cancelled`
- Transicoes visuais com toast notifications

### Valor percebido pelo cliente

```
+------------------------------------------+
|  NSD Generator                       |
|                                      |
|  Gerando prompt com IA...              |
|  ######                            (60%)  |
|                                      |
|  [Cancelar Geracao] <- HABILITADO   | <- NOVO
+------------------------------------------+

...apos cancelar...

+------------------------------------------+
|  Geracao cancelada                   |
|                                      |
|  O job foi cancelado com sucesso.      |
|                                      |
|  O que voce deseja fazer?             |
|                                      |
|  [Tentar Novamente]                   |
|  [Voltar para Home]                  |
+------------------------------------------+

Historico de Jobs:
+------------------------------------------+
|  Historico de Geracoes                |
|                                      |
|  OK Contrato na Taverna             |
|     2024-02-10 14:32 | 12.3s       |
|     GLM-4 | 1,234 tokens             |
|                                      |
|  OK Conversa com Barda               |
|     2024-02-10 15:10 | 8.7s        |
|     GLM-4 | 987 tokens                |
|                                      |
|  X Revelacao do Segredo             |
|     2024-02-09 11:45 | CANCELADO    |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Cancelamento interrompe job imediatamente
- Status do job atualiza para `cancelled`
- Historico de jobs visivel (ultimos 10)
- Regeneracao com mesmo NSD + cena funciona
- Toast notifications para sucesso/erro/cancelamento

### Diluicao da Sprint 0

**O que E feito:**
- Cancelamento do Orchestrator (heartbeats + cleanup)

**O que NAO e feito ainda:**
- UI polish (Sprint 7)
- Testes E2E (Sprint 7)

### Riscos e mitigacao

- Risco: Worker crash silencioso durante cancelamento
  - Mitigacao: Heartbeat check a cada 5s
  - Status recovery: Jobs `processing` - `failed` na startup
- Risco: AbortSignal nao funcionar com GLM Client
  - Mitigacao: Timeout de 30s no GLM Client (force stop)

### Dependencias

**Entrada:** Geracao + Repository (Sprint 5)
**Saida:** Sistema completo para Sprint 7 (Polish)

---

## Sprint 7: Polish e Testes E2E (2 semanas) - EXPERIENCIA REFINADA

### O que e construido

**UI Polish:**
- Animacoes suaves entre transicoes (Framer Motion)
- Loading states com skeleton screens
- Toast notifications (sonner type: success | error | warning | info)
- Theme dark/light consistente com TTK Validation
- Tooltips de ajuda para campos

**Testes E2E Playwright:**
- Spec: `upload-nsd-to-prompt-complete.spec.ts`
  - Upload NSD - Seleciona cena - Gera prompt - Copia - Valida
- Spec: `cancel-job-in-progress.spec.ts`
  - Inicia job - Cancela - Valida status
- Spec: `error-handling.spec.ts`
  - API GLM falha - Valida mensagem erro
  - NSD invalido - Valida mensagem erro
  - Rate limit - Valida backoff

**Testes de Arquitetura (Jest):**
- Spec: `clean-architecture.spec.ts`
  - Valida domain purity (@coreto/core sem imports Electron)
  - Valida import conventions (module aliases)
  - Valida DI registration (use cases NSD registrados)

**Tratamento robusto de erros:**
- Taxonomia de erros (NSD_PARSE_ERROR, GLM_AUTH_ERROR, etc.)
- Mensagens acionaveis (nao tecnicas)
- Retry com user consentimento

### Valor percebido pelo cliente

**Animacoes:**
```
Home - NSD Generator:
  Fade in (300ms) + slide up
```

**Skeleton Loading:**
```
+------------------------------------------+
|  NSD Generator                       |
|                                      |
|  Upload NSD Document             | <- SKELETON
|                                 (shimmer)|
|                                    |
+------------------------------------------+
```

**Toast Notifications:**
```
+-------------------+
| Prompt copiado! | <- Success (3s, fade out)
+-------------------+

+-------------------+
| API GLM indisponivel| <- Error (5s, manual dismiss)
| Tente novamente em 1min.|
+-------------------+
```

**Funcionalidades testaveis:**
- Testes E2E passam (100% cobertura de fluxo feliz + triste)
- Testes de arquitetura passam
- Sem crashes em Worker Thread durante operacoes normais
- Logs exportaveis funcionam (incluindo logs worker)
- Animacoes suaves (60fps)
- Theme toggle funciona (dark/light)

### Diluicao da Sprint 0

**Reutiliza tudo** - Nenhuma fundacao nova

### Riscos e mitigacao

- Risco: Testes E2E flaky (timing issues)
  - Mitigacao: Waits explicitos + `waitFor` com timeout
  - Retry: 3 tentativas antes de falhar teste
- Risco: Animacoes causarem lag
  - Mitigacao: CSS transforms (GPU accelerated)
  - Motion reduction: Respeitar `prefers-reduced-motion`

### Dependencias

**Entrada:** Sistema completo (Sprint 6)
**Saida:** Produto pronto para Sprint 8 (Release)

---

## Sprint 8: Configuracao, Build e Release (1 semana) - PRODUTO FINAL

### O que e construido

**Config Manager:**
- `config-manager.service.ts` - Leitura de .env
  - Valida: `GLM_API_KEY` definida na startup
  - Error claro se ausente: "API Key GLM nao configurada"
  - Usa referencia `env:GLM_API_KEY` (nunca valor real)

**Tela de Configuracoes:**
- `Settings.tsx` - Interface para configuracoes
  - Campo API Key (maskado: `************`)
  - Status: check Configurada | X Nao configurada
  - Teste conexao (botao "Validar")

**Build & Distribuicao:**
- `electron-builder` config para macOS
- Code signing com Developer ID
- Notarizacao (macOS) - "App from internet"

**Documentacao:**
- Guia de uso: `docs/nsd-generator-user-guide.md`
  - Como criar NSD markdown (estrutura esperada)
  - Configuracao de API Key GLM (.env)
  - Troubleshooting comum (erros de parsing, timeout GLM)
- Release notes: `CHANGELOG-v2.md`

### Valor percebido pelo cliente

```
+------------------------------------------+
|  Configuracoes                      |
|                                      |
|  API Key GLM                          |
|  +--------------------------+          |
|  | ******************    |          | <- MASKADO
|  +--------------------------+          |
|                                      |
|  Status: check Configurada             | <- VALIDACAO
|  (Teste conexao: OK Sucesso)         |
|                                      |
|  [Salvar Configuracoes]             |
+------------------------------------------+
```

**Funcionalidades testaveis:**
- Configuracao de API Key via .env
- Validacao de API Key ao iniciar (erro claro se invalida)
- Binario compilado roda em macOS sem crashes
- Notarizacao funcional (usuario nao precisa click em "Abrir")
- Documentacao clara e acessivel

### Diluicao da Sprint 0

**O que E feito:**
- Config Manager (simples, usa mesmo padrao .env)

### Riscos e mitigacao

- Risco: Build de prod falha por API key nao configurada
  - Mitigacao: .env.example fornecido + validacao startup
- Risco: Code signing expirado
  - Mitigacao: Processo renovacao documentada

### Dependencias

**Entrada:** Polish + Testes (sprint 7)
**Saida:** Nenhuma - PRODUTO FINAL

---

## Cronograma Visual

```
+--------------------------------------------------------------+
|                    NSD Generator v2 - Plano            |
+--------------------------------------------------------------+
|  S1  |  S2  |  S3  |  S4  |  S5  |  S6  |  S7  |  S8  |
|  2s   |  2s   |  1s   |  2s   |  2s   |  1s   |  2s   |  1s   |
+--------------------------------------------------------------+
| Home  | Upload | Select | Analyze| Generat| Cancel | Polish | Config |
|        | +Parse |       | +JobQ  | +GLM   | +Hist  | +Tests | +Build |
|        |        |       |        | +Repo  |        |        |        |
+--------------------------------------------------------------+
|    Valor Percebido (Acumulativo)                          |
+--------------------------------------------------------------+
|  OK    |  OK    |  OK    | (!)    |  OK    |  OK    |  OK    |  OK    |
| Visivel| Interativo| Interativo| Progresso| Resultado| Controle| Refinado| Autonomo|
+--------------------------------------------------------------+
```

---

## Checkpoints de Decisao

| Checkpoint | Quando | O que validar |
|-----------|---------|---------------|
| CP1: Extracao de cenas pela IA | Apos Sprint 2 | IA GLM consegue extrair cenas do markdown? |
| CP2: Detecao de variaveis de quest | Apos Sprint 4 | Precisao de identificacao automatica e suficiente? |
| CP3: Qualidade de prompts gerados | Apos Sprint 5 | Prompts sao uteis sem edicao manual? |

## Plano de Contingencia

**Se CP1 falhar** (IA nao conseguir extrair cenas):
- Sprint 2.1: Adicionar parsing manual regex como fallback
- Impacto: +3 dias na Sprint 2

**Se CP2 falhar** (variaveis incorretas):
- Sprint 4.1: Melhorar algoritmo de detecao + permitir edicao manual
- Impacto: +2 dias na Sprint 4

**Se CP3 falhar** (prompts ruins):
- Sprint 5.1: Refinar Prompt Builder + engenharia de prompt em 2 etapas
- Impacto: +5 dias na Sprint 5

---

## Estrutura de Arquivos

```
planos/023-planejamento-v2/
├── plano-sprints-nsdv2.md       # Este arquivo
└── tasks/                        # Criar na Sprint 1
    ├── sprint-01-home-gamificada.tasks
    ├── sprint-02-upload-parse-nsd.tasks
    ├── sprint-03-selecao-cena.tasks
    ├── sprint-04-analise-mz.tasks
    ├── sprint-05-geracao-prompt.tasks
    ├── sprint-06-regeneracao-cancelamento.tasks
    ├── sprint-07-polish-testes.tasks
    └── sprint-08-config-build-release.tasks
```

---

## Criterios de Sucesso do Plano

- [ ] Todos os FRs do PRD enderecados
- [ ] Todos os componentes do HLD implementados
- [ ] Clean Architecture respeitada (domain purity)
- [ ] Validacao Zod em todos os canais IPC
- [ ] Worker Thread sem bloqueios
- [ ] Testes E2E cobrindo fluxo completo
- [ ] Build roda em macOS sem crashes
- [ ] 8 sprints em ~13 semanas

---

## Proximos Passos para Execucao

1. Salvar este plano em `planos/023-planejamento-v2/plano-sprints-nsdv2.md`
2. Validar com consensus MCP - Verificar se ha objecoes ou melhorias
3. Criar tasks XML para Sprint 1 - Detalhar tarefas concretas
4. Iniciar Sprint 1 - Setup Router + DI Container + Home Component
