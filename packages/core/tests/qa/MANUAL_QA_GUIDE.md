# Guia de QA Manual - Coreto Game Engine

**Status:** FASE 8 concluída | 1054 testes | Comando `run-ttk` implementado

---

## Pré-requisitos

```bash
cd /Users/edney/projects/coreto/game-engine
npm install
npm test  # 1054 testes passando
```

---

## Testes com Projeto Real

### 1. Validar Projeto RPG Maker MZ

```bash
npm run validate -- /Users/edney/projects/coreto/projectX/frontend
```

**Esperado:** Validação sem erros, arquivos JSON detectados.

---

### 2. Executar TTK Validation

**Config:** `temp/project.config.json`

```bash
# Execução básica
./bin/dev.js run-ttk --config temp/project.config.json

# Com verbose (progress bar e detalhes)
./bin/dev.js run-ttk --config temp/project.config.json --verbose

# Com diagnóstico (métricas de performance)
./bin/dev.js run-ttk --config temp/project.config.json --diagnostic

# Override de seed
./bin/dev.js run-ttk --config temp/project.config.json --seed 99999

# Filtrar trecho específico
./bin/dev.js run-ttk --config temp/project.config.json --trecho primeiro-caminho-a-kravens
```

**Esperado:**

- Report JSON gerado em `./reports/`
- Exit code 0 (sucesso)
- Summary com total de batalhas e TTK médio

---

### 3. Estrutura do Config

```json
{
  "projectPath": "/Users/edney/projects/coreto/projectX/frontend",
  "reportOutputPath": "./reports",
  "seed": 12345,
  "maxBattleTurns": 100,
  "trechos": [
    {
      "id": "primeiro-caminho-a-kravens",
      "name": "Primeiro Caminho a Kravens",
      "anchorLevelRange": { "min": 1, "max": 5 },
      "troopIds": [10, 11, 12, 13, 14, 15, 16],
      "party": {
        "members": [
          { "classId": 7, "level": 1 },
          { "classId": 1, "level": 1 },
          { "classId": 4, "level": 10 },
          { "classId": 4, "level": 10 }
        ]
      },
      "ttkTarget": { "turns": 3, "actions": 12, "tolerance": 0.25 }
    }
  ]
}
```

**Campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `projectPath` | string | Caminho para projeto RPG Maker MZ |
| `reportOutputPath` | string | Diretório para salvar reports |
| `seed` | integer | Seed RNG para determinismo (default: 12345) |
| `maxBattleTurns` | integer | Máximo de turnos antes de timeout (opcional) |
| `trechos[].id` | string | Identificador único do trecho |
| `trechos[].troopIds` | number[] | IDs das tropas em Troops.json |
| `trechos[].party.members` | array | 1-4 membros com classId e level |
| `trechos[].ttkTarget.turns` | integer | TTK alvo em turnos |
| `trechos[].ttkTarget.actions` | integer | TTK alvo em ações |
| `trechos[].ttkTarget.tolerance` | number | Tolerância 0-1 (ex: 0.25 = 25%) |

---

### 4. Referência Daratrine (projectX)

**Classes (Classes.json):**

| ID | Nome |
|----|------|
| 1 | Espadachim |
| 2 | Mago |
| 3 | Sacerdote |
| 4 | Cavaleiro |
| 5 | Artista Marcial |
| 7 | Protagonista |

**Tropas sugeridas (Troops.json):**

- IDs 10-16: Primeiro caminho a Kravens
- IDs 1-9: Tutoriais/testes
- IDs 17+: Áreas avançadas

---

### 5. Checklist de Validação

```bash
# Build e tipos
npm run type-check   # Sem erros TypeScript
npm run lint         # Sem erros ESLint

# Testes
npm test             # 1054 testes passando
npm run test:coverage # Coverage > 80%

# CLI
./bin/dev.js run-ttk --help  # Mostra help
```

---

### 6. Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `projectPath not found` | Caminho inválido | Verificar path absoluto |
| `trecho not found` | ID não existe | Verificar `--trecho` flag |
| `troopId X not found` | ID não existe em Troops.json | Verificar IDs válidos |
| `classId X not found` | ID não existe em Classes.json | Verificar IDs válidos |
| `Exit code 1` | Erro de validação | Verificar config JSON |
| `Exit code 2` | Erro de filesystem | Verificar permissões |
| `Exit code 3` | Erro de runtime | Verificar logs |

---

## Componentes Implementados

| Componente | Status | Descrição |
|------------|--------|-----------|
| RmmzProjectValidator | ✅ | Valida estrutura do projeto |
| RmmzDataLoader | ✅ | Carrega dados JSON |
| HeadlessRuntimeBootstrapper | ✅ | Inicializa runtime JSDOM |
| BattleSimulator | ✅ | Executa batalhas headless |
| DeterministicRNG | ✅ | RNG com seed fixo |
| SkillSelector | ✅ | Seleção de skills (Attack/Guard) |
| TtkMeasurer | ✅ | Medição TTK (turns + actions) |
| JsonReporter | ✅ | Gera report.json |
| WarningCollector | ✅ | Coleta warnings tipados |
| run-ttk Command | ✅ | CLI completo |
| Progress Bar | ✅ | UI verbose mode |
| Diagnostic Mode | ✅ | Profiling de performance |

---

**Última atualização:** 2026-01-05
