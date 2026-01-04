# ADR-001: Wrapper Read-Only e Alterações no Editor RPG Maker

**Status:** Decidido
**Data:** 2026-01-04
**Contexto:** Reduzir risco de corrupção de dados e manter o editor RPG Maker MZ como fonte final de alteração de dados

## Contexto e Problema

O design de balanceamento de combate em RPGs de turno enfrenta um ciclo lento que pode levar 2-3 dias para validar a progressão. Uma ferramenta que escreva no banco do RPG Maker aumenta risco de divergência e corrupção de dados do projeto.

## Decisão

O sistema MVP v1 funciona como **wrapper read-only**, sem escrever em `data/` do projeto MZ. Todas as alterações de fórmulas, stats e dados continuam sendo feitas diretamente no editor RPG Maker MZ.

### Implementação

- NUNCA usar `fs.writeFileSync()`, `fs.appendFileSync()`, `fs.unlinkSync()` em `projectPath/data/`
- Usar apenas `fs.readFileSync()` para arquivos do projeto MZ
- Permitir escrita APENAS em `report/` (relatórios e exports)
- Criar `report/` se não existir, mas NUNCA dentro do `projectPath`

## Consequências

### Positivas

- ✅ Zero risco de corrupção do projeto MZ
- ✅ Disciplina clara: editor é fonte de verdade para game data
- ✅ Workflow previsível e seguro

### Negativas

- ❌ Não acelera edição em massa de dados
- ❌ Depende de workflow disciplinado (designer atualiza MZ → roda validação)

## Alternativas Consideradas

**Wrapper read-write que gera dados automaticamente**
Rejeitado por risco de divergência entre dados gerados e editor RPG Maker MZ, podendo causar inconsistências e corrupção.

## Referências

- PRD: `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`
- HLD Seção 8.1: Segurança de Filesystem
