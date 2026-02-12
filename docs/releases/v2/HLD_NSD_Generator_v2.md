# HLD - NSD Generator v2

**Versão:** 0.1 (Parcial)
**Data:** 2026-02-11
**Sistema:** Coreto Game Engine - NSD Generator e Portal Evoluído v2

---

## 1. Contexto e Objetivo Técnico

### 1.1 Objetivo

Criar uma ferramenta de geração de cenas assistida por IA que analisa projetos RPG Maker MZ, processa documentos NSD (Narrative Structure Documents) em markdown e gera prompts técnicos otimizados para implementação de Event commands e Common Events, integrando ao Portal Electron existente.

### 1.2 Problema Arquitetural

Designers implementam cenas manualmente no editor do RPG Maker MZ, um processo lento (3 dias por cena) com risco de inconsistência entre NSD documentado e código final, pois desenvolvedores frequentemente implementam variações não documentadas durante o processo.

### 1.3 Escopo

**Incluso:**

- Home gamificada estilo Age of Mythology (dois portais: TTK Validation + NSD Generator)
- Upload e parse de arquivos NSD em formato markdown
- Análise de projeto RPG Maker MZ (mapas, database, variáveis de quest)
- Integração com API GLM para geração de prompts técnicos
- Geração de prompts para Event commands e Common Events
- Exibição com botão de copiar e regeneração
- Configuração de API Key GLM via .env

**Fora de Escopo (MVP v2):**

- Aplicação automática no projeto (write direto em data/)
- Validação visual ou preview da cena gerada
- Versionamento de prompts gerados
- Comparação automatizada NSD vs implementação

---

## 2. Arquitetura Geral

### 2.1 Visão de Alto Nível

O sistema segue arquitetura Electron existente com Worker Thread para isolamento de operações pesadas.

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                       │
│  (React UI - Home Gamificada + NSD Generator)        │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC (nsd:start, nsd:progress, nsd:result, nsd:cancel)
┌──────────────────────▼──────────────────────────────────────┐
│                    Main Process                          │
│  (IPC Handlers + Validation + NSD Orchestrator)         │
└──────────────────────┬──────────────────────────────────────┘
                       │ Job Queue / Coordenação
┌──────────────────────▼──────────────────────────────────────┐
│                 Worker Thread (Node)                         │
│  (NSD Service: Parse + GLM + Prompt Builder)            │
└──────────────┬───────────────────────────────────────────────┘
               │                     │
               │ Read-only           │ HTTP
┌──────────────▼─────────────────▼───────────────────────────┐
│         @coreto/core          GLM API                       │
│  (Project Analysis)      (Prompt Generation)                │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Comunicação

- **Pipeline com Job Queue:** Renderer → IPC → Main → Orchestrator → Worker → Core/GLM
- **Streaming de Progresso:** Canais IPC separados para start/progress/result/cancel
- **Isolamento:** Worker Thread previne bloqueio do Main durante parsing/GLM
- **Read-Only:** @coreto/core permanece agnóstico de Electron
- **Segurança:** API GLM no Worker (não no Renderer) protege credenciais

---

## 3. Componentes e Responsabilidades

### 3.1 Componentes Principais

| Componente | Camada | Responsabilidades |
|------------|----------|------------------|
| **NSD Renderer UI** | Renderer Process | React components: Home gamificada, upload NSD, seleção de cena, exibição prompt, botão copiar/regenerar |
| **IPC Handlers** | Main Process | Channels: `nsd:start`, `nsd:progress`, `nsd:result`, `nsd:cancel` com validação Zod |
| **NSD Orchestrator** | Main Process | Job queue, gestão de jobId, coordenação de progresso, cancelamento, retry |
| **NSD Worker Service** | Worker Thread | Parser de NSD markdown, integração GLM API, chamadas @coreto/core |
| **NSD Repository** | Main Process | Persistência de jobs (sqlite), histórico de prompts gerados |
| **Project Analyzer** | Core (reuso @coreto/core) | Análise de projeto MZ: mapas, database, variáveis de quest |
| **GLM Client** | Worker Thread | Cliente HTTP para API GLM, gerenciamento de API key, rate limiting |
| **Prompt Builder** | Worker Thread | Construção de prompt técnico otimizado para Event commands + Common Events |

### 3.2 Dependências Entre Componentes

```
NSD Renderer UI ──IPC──> IPC Handlers
IPC Handlers ──validação──> NSD Orchestrator
NSD Orchestrator ──job queue──> NSD Worker Service
NSD Worker Service ──read-only──> Project Analyzer (@coreto/core)
NSD Worker Service ──HTTP──> GLM Client
NSD Worker Service ──compose──> Prompt Builder
NSD Orchestrator ──persist──> NSD Repository
```

---

## 4. Fluxo de Requisições e de Dados

### 4.1 Fluxo Principal: Geração de Prompt NSD

```
1. USUÁRIO seleciona projeto RPG Maker MZ
   └─> UI exibe Home gamificada

2. USUÁRIO clica no portal "NSD Generator"
   └─> UI navega para rota /nsd-generator

3. USUÁRIO faz upload de arquivo NSD (markdown)
   └─> IPC: nsd:upload { filePath, content }

4. WORKER SERVICE processa upload (no Main, apenas roteamento)
   ├─> Parser extrai: metadados, lista de cenas
   └─> Retorna: { sceneList: [{id, name, summary}] }

5. USUÁRIO digita nome da cena desejada
   └─> UI valida que cena existe no NSD

6. USUÁRIO clica "Gerar Prompt"
   └─> IPC: nsd:start { nsdPath, sceneName, projectPath }

7. ORCHESTRATOR cria job
   └─> Gera jobId único
   └─> Persiste no Repository (status: pending)
   └─> Retorna jobId para UI

8. WORKER SERVICE processa job
   ├─> Parser: extrai cena do NSD
   ├─> Project Analyzer: lê mapas/database (via @coreto/core)
   ├─> Identifica: variável de controle da quest
   ├─> Prompt Builder: monta prompt técnico
   └─> GLM Client: envia prompt → API

9. IPC PROGRESS (streaming)
   ├─> nsd:progress { jobId, stage, percent }
   └─> UI atualiza barra de progresso

10. GLM CLIENT retorna prompt gerado
    └─> IPC: nsd:result { jobId, prompt, metadata }

11. UI exibe prompt em caixa de texto
    ├─> Botão "Copiar"
    ├─> Botão "Regenerar" (volta ao passo 6)
    └─> Repository atualiza status: completed
```

### 4.2 Fluxos Alternativos

**Regeneração de Prompt:**
- Usuário clica "Regenerar" → Reutiliza mesmo jobId → Nova chamada GLM

**Cancelamento:**
- Usuário clica "Cancelar" → IPC: nsd:cancel { jobId } → Worker interrompe processamento

**Erro na GLM API:**
- Worker captura erro → IPC: nsd:error { jobId, error } → UI exibe mensagem + opção de retry

---

## 5. Modelo de Dados (Alto Nível)

### 5.1 Domínio 1: NSD Documents (Fonte de Verdade: Upload do Usuário)

#### Estrutura NSD Detectada (baseada em exemplos reais)

```markdown
🎮 Narrative Structure Document (NSD) - Fluxo Visual De Cenas

## 📄 Quest: [Nome da Quest]

### 1️⃣ Resumo Geral *(Checkpoint 0)*
- Status: [x] Concluído / [ ] Pendente
- Metadados: nome, importância, arco, conflito, objetivo, premissa, resumo
- Locais principais
- NPCs principais

### 2️⃣ Pré-condições Narrativas *(Checkpoint 1)*
- Flags/Decisões anteriores
- Limitações ou bloqueios
- (Opcional) Estado emocional do protagonista

### 3️⃣ Fluxo Visual Resumido *(Checkpoint 2)*
```
plaintext
Quest: Nome
 ├── Cena 1: Nome — Premissa
 │    └── Beat 1: Descrição (🎬/🎮)
 │    └── Beat 2: Descrição (🎬/🎮)
 ...
```

#### Tabela de Cenas
| # | Nome | Premissa expandida |

#### Beats por Cena (detalhamento)
##### Cena 1 – Nome
| # | Beat | Controle |
|---|-------|----------|
| 1 | Descrição | 🎮/🎬 |
```

#### NSDDocument
```typescript
{
  id: string              // hash do conteúdo
  fileName: string        // ex: "primeiro-contrato.NSD.fluxo-cenas.md"
  questName: string       // ex: "Primeiro Contrato"
  uploadedAt: Date
  content: string         // markdown completo

  metadata: {
    title: string         // "🎮 Narrative Structure Document (NSD) - Fluxo Visual De Cenas"
    status: 'completed' | 'pending'
    campaignImportance: 'main' | 'side'
    narrativeArc: string  // ex: "Chamado à Aventura"
    previousQuest: string?
    centralConflict: string
    globalNarrativeObjective: string
  }
}
```

#### NSDCheckpoint
```typescript
{
  id: string              // "checkpoint-0", "checkpoint-1", "checkpoint-2"
  type: 'general' | 'pré-condições' | 'fluxo-visual'

  // Checkpoint 0
  generalSummary?: {
    completed: boolean
    shortPremise: string
    mainLocations: string[]
    mainNPCs: string[]
  }

  // Checkpoint 1
  prerequisites?: {
    flags: string[]       // ex: ["Hora de Crescer concluído"]
    limitations: string[]
    emotionalState?: string
  }

  // Checkpoint 2
  visualFlow?: {
    tree: string          // estrutura em plaintext
    sceneList: NSDScene[]
  }
}
```

#### NSDScene
```typescript
{
  id: string              // "cena-1", "cena-2", etc.
  name: string           // ex: "Contrato na Taverna"
  expandedPremise: string  // descrição longa da tabela

  beats: NSDBeat[]
}
```

#### NSDBeat
```typescript
{
  id: number             // sequencial na cena
  description: string    // ex: "Thorin entra na taverna."
  control: 'player' | 'cutscene'  // 🎮 = player, 🎬 = cutscene
  dialogueTree?: string   // árvore de diálogo (opcional)
  systemEvent?: string    // ex: "Contrato adicionado ao inventário"
}
```

### 5.2 Domínio 2: Jobs de Geração (Fonte de Verdade: Repository - SQLite)

#### GenerationJob
```typescript
{
  id: string              // jobId UUID
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  createdAt: Date
  updatedAt: Date
  completedAt?: Date

  // Request
  nsdDocumentId: string
  sceneName: string
  projectPath: string

  // Result
  generatedPrompt?: string
  errorMessage?: string

  // Metadata
  glmModel: string       // ex: "glm-4"
  glmTokensUsed?: number
  retryCount: number
}
```

### 5.3 Domínio 3: Projeto RPG Maker MZ (Fonte de Verdade: @coreto/core - Read-only)

#### QuestVariable
```typescript
{
  variableId: number     // ID da variável no sistema do RPG Maker
  name: string          // nome da variável (ex: "Quest 01 Progress")
  type: 'progress' | 'state' | 'flag'
  scope: 'game' | 'quest'
}
```

#### ProjectAnalysis
```typescript
{
  projectPath: string
  analyzedAt: Date

  // Extraído do projeto
  questVariables: QuestVariable[]
  mapCount: number
  troopCount: number

  // Detectado automaticamente
  recommendedQuestVariable?: QuestVariable
}
```

---

## 6. Interfaces Públicas

### 6.1 Interface IPC (Renderer ↔ Main ↔ Worker)

**Canais IPC para comunicação entre processos:**

#### Request Channels (Commands via `ipcRenderer.invoke`)

```typescript
// Upload de documento NSD
nsd:upload → {
  source: { path?: string, text?: string },
  clientRequestId?: string  // para idempotência
}
← Returns: {
  documentId: string,
  sceneList: NSDScene[],
  warnings?: string[]
}

// Iniciar geração de prompt
nsd:start → {
  documentId: string,
  sceneId?: string,
  clientRequestId?: string  // para idempotência
}
← Returns: {
  jobId: string,
  status: 'pending' | 'processing'
}

// Consultar status de job
nsd:getStatus → { jobId: string }
← Returns: {
  jobId: string,
  status: JobStatus,
  progress: number,
  lastMessage: string
}

// Listar todos os jobs
nsd:listJobs → {}
← Returns: { jobs: GenerationJob[] }

// Validar documento antes de processar
nsd:validate → { source: { path?: string, text?: string } }
← Returns: {
  valid: boolean,
  sceneList: NSDScene[],
  warnings?: string[]
}

// Cancelar job em andamento
nsd:cancel → { jobId: string }
← Returns: { success: boolean, message: string }
```

#### Event Channels (Push via `webContents.send`)

```typescript
// Progresso streaming durante processamento
nsd:progress → {
  jobId: string,
  stage: string,        // 'parsing', 'analyzing', 'generating', 'post-processing'
  percent: number,      // 0-100
  message: string,
  sequence: number      // incremental para ordenação/dedup
}

// Resultado final
nsd:result → {
  jobId: string,
  prompt: string,
  metadata: {
    model: string,
    usage: { promptTokens: number, completionTokens: number, totalTokens: number },
    timings: { totalMs: number, glmApiMs: number },
    inputHash: string,
    configSnapshot: any
  }
}

// Erro com taxonomia definida
nsd:error → {
  jobId: string,
  error: string,
  code: NSDErrorCode,    // ver enum abaixo
  retryable: boolean,
  details?: any
}
```

#### Enum de Códigos de Erro

```typescript
enum NSDErrorCode {
  // Parsing Errors
  NSD_PARSE_ERROR = "NSD_PARSE_ERROR",
  NSD_INVALID_FORMAT = "NSD_INVALID_FORMAT",
  NSD_SCENE_NOT_FOUND = "NSD_SCENE_NOT_FOUND",

  // GLM API Errors
  GLM_AUTH_ERROR = "GLM_AUTH_ERROR",
  GLM_RATE_LIMIT = "GLM_RATE_LIMIT",
  GLM_TIMEOUT = "GLM_TIMEOUT",
  GLM_INVALID_RESPONSE = "GLM_INVALID_RESPONSE",
  GLM_NETWORK_ERROR = "GLM_NETWORK_ERROR",

  // System Errors
  WORKER_CRASH = "WORKER_CRASH",
  JOB_NOT_FOUND = "JOB_NOT_FOUND",
  INVALID_PROJECT_PATH = "INVALID_PROJECT_PATH",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
}
```

### 6.2 Interface HTTP - GLM API

**Contrato HTTP com API GLM (compatível padrão OpenAI):**

```typescript
// Request
POST https://api.glm.com/v1/chat/completions
Headers: {
  "Authorization": "Bearer ${GLM_API_KEY}",
  "Content-Type": "application/json"
}
Body: {
  model: string,           // ex: "glm-4"
  messages: Array<{
    role: 'system' | 'user' | 'assistant',
    content: string
  }>,
  temperature: number,     // 0.0 - 2.0 (default: 0.7)
  max_tokens: number,      // max tokens na resposta (default: 4096)
  stream?: boolean,        // streaming de resposta (opcional)
  top_p?: number,         // nucleus sampling (opcional)
  presence_penalty?: number,  // penalidade por repetição (opcional)
  timeout?: number         // timeout em ms (config)
}

// Success Response (200 OK)
{
  id: string,             // ex: "chatcmpl-xxx"
  object: "chat.completion",
  created: number,         // timestamp Unix
  model: string,
  choices: [{
    index: number,
    message: {
      role: "assistant",
      content: string     // prompt gerado
    },
    finish_reason: "stop" | "length" | "content_filter"
  }],
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}

// Error Responses
{
  error: {
    message: string,
    type: string,           // ex: "invalid_request_error"
    param?: string,
    code: string            // ex: "invalid_api_key"
  }
}
```

#### Tratamento de Erros HTTP

| Status Code | Tipo | Retryable | Ação |
|-------------|------|-----------|--------|
| 401 | Auth Error | Não | API key inválida |
| 403 | Auth Error | Não | API key sem permissão |
| 429 | Rate Limit | Sim | Backoff exponencial |
| 500+ | Server Error | Sim | Retry com backoff |
| Timeout | Network | Sim | Retry com backoff |
| Network Error | Network | Sim | Retry com backoff |

### 6.3 Interface de Configuração (project.config.json)

**Estrutura de configuração local na raiz do projeto MZ:**

```json
{
  "$schema": "https://coreto.dev/schemas/project-config-v2.json",
  "configVersion": 2,
  "version": "2.0",

  "glm": {
    "apiKey": "env:GLM_API_KEY",
    "baseUrl": "https://api.glm.com",
    "model": "glm-4",
    "temperature": 0.7,
    "maxTokens": 4096,
    "timeout": 30000,
    "retries": 3,
    "retryBackoffMs": 1000,
    "stream": false
  },

  "nsd": {
    "defaultPath": "./docs/Quests",
    "questVariablePattern": "Quest {id:02d} Progress",
    "autoDetectVariables": true,
    "encoding": "utf-8"
  },

  "coreto": {
    "projectId": "project-x",
    "lastValidated": "2026-02-12T10:30:00Z",
    "lastOpened": "2026-02-12T10:30:00Z",
    "lastRunJobId": "uuid-xxx"
  }
}
```

#### Políticas de Configuração

- **Segurança:** `apiKey` NUNCA armazenada no arquivo, apenas referência `env:VAR_NAME`
- **Validação:** Schema JSON validado na leitura, erro se campos obrigatórios faltarem
- **Migração:** `configVersion` permite upgrades automáticos de estrutura
- **Snapshot:** Config capturada no início de cada job (`configSnapshot` em metadata) para reprodutibilidade

---

## 7. Escalabilidade e Disponibilidade

### 7.1 Estratégias de Escalabilidade

#### 7.1.1 Concorrência de Jobs

**Arquitetura:** Fila simples com processamento sequencial (1 job por vez).

**Justificativa:**
- Simplifica gestão de estado e cancelamento
- Evita sobrecarga de API GLM (rate limiting)
- Suficiente para MVP v2 (geração de cenas é workflow assíncrono)

**Evolução futura:**
- Worker Thread pool para paralelismo (caso necessário)
- Priority queue (jobs de usuários premium têm precedência)

#### 7.1.2 Cache de Prompts

**Decisão:** Sem cache (sempre regenerar prompts via GLM).

**Justificativa:**
- Prompts gerados por IA podem variar entre execuções (temperatura, modelo atualizado)
- Usuário pode quer regenerar com parâmetros diferentes
- Simplifica MVP v2 (evita gestão de cache invalidação)

**Evolução futura:**
- Cache opcional habilitado por configuração
- Cache com TTL (time-to-live) para invalidação automática

#### 7.1.3 Persistência e Recuperação

**Padrão:** Jobs persistidos em SQLite (Main Process).

**Recuperabilidade:**
- `nsd:listJobs` retorna histórico completo
- UI pode reconectar após crash e listar jobs anteriores
- Jobs com status `processing` são marcados `failed` na inicialização

### 7.2 Limites de Operação

| Limites | Valor | Justificativa |
|----------|-------|--------------|
| **Max jobs na fila** | 100 | Evitar memória infinita |
| **Max tamanho NSD** | 1MB | Evitar memory issues no Worker |
| **Max tempo de job** | 5 minutos | Timeout + cancelamento automático |
| **Max retries GLM** | 3 | Backoff exponencial (1s→2s→4s) |

**Nota:** SLAs e metas de disponibilidade (99.9% uptime) não se aplicam a ferramenta pessoal de execução sob demanda.

### 7.3 Limites e Rate Limiting

**GLM API Rate Limits:**
- Consultar documentação oficial para limits de requisições/minuto
- Implementar backoff exponencial: 1s → 2s → 4s → 8s (max 30s)
- Retry automático apenas para erros `retryable: true`

**Limites Internos:**
- Max jobs na fila: 100 (após, rejeitar novos uploads)
- Max tamanho de NSD: 1MB (evitar memory issues no Worker)
- Max tempo de job: 5 minutos (timeout + cancelamento automático)

---

## 8. Segurança

### 8.1 Segurança de Credenciais

**API Key GLM:**
- Armazenada como variável de ambiente: `env:GLM_API_KEY`
- **NUNCA** gravada em arquivo `project.config.json` (somente referência)
- **NUNCA** exposta em logs ou mensagens de erro
- Validada na inicialização do Worker (erro se não definida)

**Proteção contra Git Leak:**
- `project.config.json` usa referência `env:VAR_NAME` (não o valor real)
- `.gitignore` deve incluir arquivos de config com valores reais
- Documentação alerta para nunca commmitar env files com secrets

### 8.2 Segurança de Dados

**Contexto de Uso:** Sistema será usado pelo próprio desenvolvedor (uso pessoal, não multi-tenant).

| Tipo de Dado | Risco | Medida |
|---------------|-----------|----------|
| **Conteúdo NSD** | Baixo | Armazenamento local (documentos do usuário) |
| **Prompts gerados** | Baixo | Histórico SQLite local (uso pessoal) |
| **Caminho do projeto** | Baixo | Read-only, nenhuma escrita em data/ |
| **API Key GLM** | Alto (pagamento) | Env var isolada, never log |

**Nota:** Como é uso pessoal, dados sensíveis são apenas do próprio usuário (nÃO há dados de terceiros).

### 8.3 Segurança de Comunicação

**IPC (Renderer ↔ Main):**
- Electron IPC fornece isolamento nativo (mesmo processo)
- Validação Zod em todos os canais (type-check em runtime)
- Sanitização de erros (não expor paths internos em mensagens ao usuário)

**HTTP (Worker → GLM API):**
- HTTPS obrigatório (já definido)
- Timeout configurável (previne resource exhaustion)
- Headers sem credenciais em plain text
- User-Agent: `coreto-nsd-generator/2.0` (para identificação)

### 8.4 Segurança de Execução

**Worker Thread:**
- Sandbox Node.js (isolamento de código)
- Timeout máximo: 5 minutos (cancelamento automático)
- Memory limit: 512MB (evitar OOM no Main Process)
- Validação de entrada (tamanho máximo NSD: 1MB)

**Main Process:**
- Job cleanup periódico (remover jobs antigos: >30 dias)
- Rate limiting interno (max 100 jobs na fila)
- Graceful shutdown (aguardar jobs em andamento ao fechar app)

---

## 9. Observabilidade

### 9.1 Estratégia de Logging

**Coerência com v1:** Sistema mantém mesmo formato e padrão de exportação de logs.

#### Níveis de Log

| Nível | Uso | Exemplo |
|---------|-----|----------|
| **ERROR** | Falhas que requerem intervenção | API GLM falhou, parse NSD inválido |
| **WARN** | Problemas recuperáveis | Retry executado, config com fallback |
| **INFO** | Fluxo normal de negócio | Job iniciado, prompt gerado |
| **DEBUG** | Detalhes técnicos (desabilitado por padrão) | Payload IPC, timing GLM |

#### Fontes de Log (Coerência v1)

| Fonte | Descrição | Schema |
|---------|-----------|--------|
| **main** | Processo Main (IPC handlers, Orchestrator) | LogEntry { source: 'main' } |
| **renderer** | Processo Renderer (UI, hooks) | LogEntry { source: 'renderer' } |
| **worker** | Worker Thread (NSD service, GLM client) | LogEntry { source: 'worker' } |

#### Estrutura de LogEntry

```typescript
// v2: Adiciona suporte a 'worker' como source
// v1: suportava apenas 'main' | 'renderer'
// ⚠️ MIGRATION NECESSÁRIA: Atualizar LogEntrySchema em logs.schema.ts
interface LogEntry {
  timestamp: string        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error'
  source: 'main' | 'renderer' | 'worker'  // NOVO: worker para v2
  message: string        // não-vazio
  meta?: Record<string, unknown>
  stack?: string         // para errors apenas
}
```

**⚠️ Nota de Compatibilidade v1 ↔ v2:**

A versão v1 do sistema de logs (`packages/electron/src/domain/schemas/logs.schema.ts`) valida `source` como enum `['main', 'renderer']`. A versão v2 propõe adicionar `'worker'` como terceira opção.

**Migração necessária em v2:**
1. Atualizar `LogEntrySchema` para: `z.enum(['main', 'renderer', 'worker'])`
2. Atualizar `LogBundle.logs` de array único para objeto separado:
   ```typescript
   // v1:
   logs: z.array(LogEntrySchema)

   // v2 (proposto):
   mainLogs: z.array(LogEntrySchema),
   rendererLogs: z.array(LogEntrySchema),
   workerLogs: z.array(LogEntrySchema)  // NOVO
   ```
3. Atualizar `LogAggregator.createBundle()` para separar logs por fonte

Esta mudança é **breaking** com v1, mas necessária para isolar logs do Worker Thread.

#### Estrutura de LogBundle (Export)

```typescript
// Mesmo formato da v1 para compatibilidade
interface LogBundle {
  id: string            // UUID v4
  timestamp: string     // ISO 8601
  appVersion: string    // package.json version
  electronVersion: string // Electron version
  platform: 'darwin' | 'win32' | 'linux'
  projectPath?: string  // projeto MZ aberto (opcional)

  // Logs separados por fonte (igual v1)
  logs: {
    mainLogs: LogEntry[]
    rendererLogs: LogEntry[]
    workerLogs: LogEntry[]  // NOVO para v2
  }
}
```

#### Local de Export (Coerência v1)

- **Caminho:** `reports/application-logs/coreto-nsd-logs-{timestamp}.json`
- **Root:** Monorepo root (`../../reports/` a partir de `packages/electron/`)
- **Formato:** JSON com indent=2 (pretty-printed)
- **Trigger:** Botão "Export Logs" na UI (mesmo padrão v1)

### 9.2 Métricas

**Métricas essenciais para uso pessoal (debugging + controle de custo):**

| Métrica | Tipo | Descrição | Justificativa |
|-----------|------|------------|---------------|
| **nsd_jobs_completed_total** | Counter | Jobs completados com sucesso | Debugging de saúde do sistema |
| **nsd_jobs_failed_total** | Counter | Jobs falhados (por error code) | Identificar problemas recorrentes |
| **nsd_jobs_cancelled_total** | Counter | Jobs cancelados pelo usuário | Comportamento de uso |
| **glm_tokens_used_total** | Counter | Tokens consumidos (prompt + completion) | Controle de custo $ |

**Nota:** Métricas são agregadas localmente para debugging e controle de custo. Não há dashboard em tempo real (uso pessoal).

### 9.3 Tracing

**Decisão:** Correlation ID simples (jobId) para debugging local.

#### Implementação

- **Correlation ID:** `jobId` UUID presente em todos os logs de um job
- **Propósito:** Agrupar logs de um mesmo job para análise post-mortem
- **Debugging:** Console + export JSON são suficientes (você tem acesso local)

**Nota:** Tracing distribuído (OpenTelemetry) não se aplica a execução local. Debugging em tempo real via console é adequado para ferramenta pessoal.

---

## 10. Riscos Arquiteturais e Mitigação

**Consenso:** Validado via análise de over-engineering (ferramenta pessoal single-tenant). Riscos consolidados nas categorias essenciais.

### 10.1 Riscos de Integração

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---------|-------------|----------|------------|
| 1 | @coreto/core não tem parser NSD | Alta | Worker falha ao ler NSD | Implementar parser específico no NSD Worker |
| 2 | GLM API muda contrato | Média | Jobs falham | Versionar API client isolado |
| 3 | Worker crash durante job | Baixa | Job em limbo | Heartbeat + status recovery |

### 10.2 Riscos de Performance

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---------|-------------|----------|------------|
| 7 | Parsing NSD >1MB | Média | Worker timeout | Limite 1MB + warning UI |
| 8 | GLM timeout | Média | Job falha | Timeout 30s + 3 retries |
| 9 | Main bloqueado | Baixa | UI congela | Worker para operações pesadas |
| 10 | **Fila grande (concorrência)** | Baixa | Memória | Limite 100 jobs + rejeição |
| 11 | **Explosão de custo (NSD complexo)** | Média | Custo operacional alto | Limites de complexidade + quotas |
| 12 | **Deadlocks SQLite (multi-worker)** | Baixa | Timeout no DB | WAL mode + transações curtas |

### 10.3 Riscos de Segurança

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---------|-------------|----------|------------|
| 1 | **Injeção via NSD malicioso** | Alta | Execução de código | Sandboxing do parser + validação rigorosa |
| 2 | **Vazamento de API Key** | Alta | Custo indevido | Env var only + nunca em logs |

**Priorização (Pragmática para Uso Pessoal):**

- **P0 (Críticos):** #1 (NSD injection), #2 (API Key leak)
- **P1 (Alta):** #3 (Worker crash)
- **P2 (Média):** #4 (Parsing >1MB), #5 (GLM timeout), #6 (Main bloqueado)

### 10.7 Contexto de Uso Pessoal (Single-Tenant)

**Escopo de Uso:** Este sistema foi projetado para uso pessoal pelo desenvolvedor do Coreto Game Engine.

**Implicações Arquiteturais:**

1. **Isolamento entre tenants não é necessário**
   - Sistema é single-tenant: apenas o desenvolvedor utiliza a ferramenta
   - Riscos de cross-contamination entre usuários não se aplicam
   - Workspaces e ACLs para multi-tenant foram removidos do escopo

2. **Simplificação de segurança**
   - Dados sensíveis são apenas do próprio usuário (não há dados de terceiros)
   - API Key é o único segredo crítico (controlado via env var)
   - Não há necessidade de criptografia adicional para dados em repouso

3. **Gestão de estado simplificada**
   - Não há concorrência entre múltiplos usuários
   - Jobs são processados sequencialmente (fila simples)
   - Não há necessidade de locks distribuídos ou semânticas de isolamento

4. **Riscos Removidos**
   - **#20 (Cross-job contamination):** Não há dados de outros usuários para vazar
   - **#27 (Multi-tenant sem isolamento):** Sistema é single-tenant por design

**Trade-offs:**
- ✅ **Simplicidade:** Arquitetura mais simples sem camadas de multi-tenancy
- ✅ **Performance:** Sem overhead de isolamento entre tenants
- ⚠️ **Migração futura:** Se o sistema evoluir para multi-usuário, será necessário adicionar workspaces e ACLs

---

## 11. ADRs Associados e Próximos Passos

### 11.1 ADRs Existentes que se Aplicam ao NSD Generator v2

| ADR | Título | Módulo | Aplicabilidade |
|------|---------|-----------|----------------|
| **ADR-032** | Electron Dev Portal Multi-Tool Platform | UI | ✅ **Direto** - NSD é nova tool no portal multi-tool |
| **ADR-033** | Clean Architecture Electron Package | UI | ✅ **Direto** - NSD deve seguir pattern (domain/, handlers thin adapters) |
| **ADR-008** | Schema Validation Library - Zod | CONFIG | ✅ **Direto** - Canais IPC NSD devem usar Zod para validação |
| **ADR-021** | JSON-Based Configuration Format | CONFIG | ✅ **Direto** - `project.config.json` para config NSD (glm, nsd namespaces) |
| **ADR-029** | TSyringe DI Container | FOUNDATION | ✅ **Direto** - DI container para registrar use cases NSD |
| **ADR-032** (FOUNDATION) | Ports and Adapters Layer Contracts | FOUNDATION | ✅ **Direto** - Ports para NSD Service (INSDParser, IGLMClient) |

**Nota:** Estes ADRs estabelecem o fundação arquitetural que o NSD Generator v2 deve seguir. Não há conflitos ou necessidade de ADRs superseded.

### 11.2 Novos ADRs Necessários (Core Arquiteturais)

Baseado em decisões específicas do NSD Generator v2, os seguintes ADRs devem ser criados:

| ID Proposto | Título | Status | Contexto de Decisão |
|-------------|---------|----------|----------------------|
| **ADR-034** | Worker Thread Isolation for NSD Operations | ⏳ **Pendente** | Isolar parsing NSD + chamadas GLM API em Worker Thread para não bloquear Main Process |
| **ADR-035** | Sequential Job Queue for NSD Generation | ⏳ **Pendente** | Fila sequencial (1 job por vez) vs paralela para simplificar gestão de estado e cancelamento |
| **ADR-036** | GLM API Integration vs Alternative Providers | ⏳ **Pendente** | Integração com API GLM (contrato OpenAI-compatible) vs OpenAI direto, Anthropic Claude, local models |

**Nota:** ADRs de domínio especiais (parser NSD markdown, prompt template, single-tenant design) podem ser criados post-MVP conforme necessidade.

### 11.3 Próximos Passos Priorizados

**Fase 1: Foundation (Semanas 1-2)**

1. ✅ **Completar HLD** (este documento) - Validar consistência e aprovar
2. 🔄 **Criar ADR-034** (Worker Thread Isolation)
   - Definir: Worker Thread vs Main process direto
   - Trade-offs: complexidade de comunicação IPC vs bloqueio de UI
3. 🔄 **Criar ADR-035** (Job Queue Sequential)
   - Definir: Fila sequencial vs pool de workers paralelos
   - Trade-offs: throughput vs simplicidade de gestão de estado
4. 🔄 **Criar ADR-036** (GLM API Integration)
   - Definir: GLM API vs alternativos (OpenAI, Anthropic, local models)
   - Trade-offs: custo, performance, disponibilidade, compliance

**Fase 2: Implementation Core (Semanas 3-6)**

5. 📝 **Implementar NSD Orchestrator** (Main Process)
   - Job queue com persistência SQLite
   - Coordenação de progresso streaming (IPC channels)
   - Cancelamento e retry logic

6. 📝 **Implementar NSD Worker Service** (Worker Thread)
   - Parser de NSD markdown (estrutura de checkpoint)
   - Client GLM API HTTP
   - Prompt Builder (template técnico)
   - Integração com @coreto/core (Project Analyzer)

7. 📝 **Implementar IPC Handlers** (Main Process)
   - Canais: `nsd:upload`, `nsd:start`, `nsd:progress`, `nsd:result`, `nsd:cancel`, `nsd:getStatus`, `nsd:listJobs`, `nsd:validate`
   - Validação Zod em todos os payloads
   - Thin adapter pattern (delegar para use cases domain)

8. 📝 **Implementar NSD Renderer UI** (Renderer Process)
   - Home gamificada com portal NSD Generator
   - Upload de arquivo NSD (drag & drop + file dialog)
   - Seleção de cena (autocomplete baseado no NSD)
   - Exibição de prompt gerado (caixa texto + botão copiar)
   - Barra de progresso streaming (IPC `nsd:progress`)

**Fase 3: Integration & Polish (Semanas 7-8)**

9. ✅ **Testes E2E** (Playwright)
   - Fluxo completo: upload NSD → gerar prompt → copiar
   - Cancelamento de job em andamento
   - Erro de API GLM (retry automático)
   - Validação de NSD inválido

10. ✅ **Testes de Arquitetura** (Jest)
    - Validar Clean Architecture (domain purity, handler thin adapters)
    - Validar import conventions (module aliases)
    - Validar DI registration (use cases NSD registrados)

11. 🎨 **Polish UI**
    - Animações de transição (home → NSD generator)
    - Tooltip de ajuda para campos de configuração
    - Theme dark/light (consistente com TTK Validation)
    - Logs export (botão integrado com v1)

**Fase 4: Documentação & Release (Pós-MVP)**

12. 📚 **Documentação de Uso**
    - Guia de criação de NSD markdown (estrutura esperada)
    - Configuração de API Key GLM (.env)
    - Troubleshooting comum (erros de parsing, timeout GLM)

13. 🏷️ **Build & Distribuição**
    - Assinar builds macOS (Developer ID)
    - Testar em Windows (Parallels/VM)
    - Release notes (changelog com ADRs implementados)

**Critérios de Sucesso MVP v2:**

- [ ] Usuário consegue fazer upload de NSD markdown válido
- [ ] Sistema detecta automaticamente estrutura (checkpoint 0, 1, 2)
- [ ] Usuário seleciona cena e gera prompt técnico
- [ ] Prompt gerado é copiável e pronto para implementação manual
- [ ] Logs exportáveis (coerentes com v1)
- [ ] Cancelamento de job funciona corretamente
- [ ] Sem crashes em Worker Thread durante operações normais

---

**Fim do HLD - NSD Generator v2**
