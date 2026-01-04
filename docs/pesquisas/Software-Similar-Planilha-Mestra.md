# Pesquisa — Softwares similares ao conceito “Planilha Mestra”

## O que aparece como “já existe”

Síntese (alto nível):

- **Existe “calculadora de fórmula/dano”** (web/desktop) para testar dano e quantidade de hits.
- **Existe “bulk editor”** para editar o database do RPG Maker (especialmente via CSV import/export).
- **Existe tooling para versionar JSON melhor** (formatadores de `data/*.json` visando merges).
- **Não foi encontrado** (nesta rodada) um software pronto que combine tudo do seu MVP: **âncoras→curvas determinísticas→simulação/TTK→validação→apply direto em JSON do MZ + snapshots/diffs** como “produto” único e integrado.

---

## Consultas realizadas e resultados (Perplexity)

### Query A — “RPG Maker MZ database editor CSV export import tool”

1) Exporting Items from the RPG Maker MZ Database to a CSV (YouTube)  
`https://www.youtube.com/watch?v=xyZ2YkY0k84`  
Nota: exemplo de pipeline “JSON do MZ → CSV (via script)”.

2) Bulk Database Editor for RPG Maker MZ — BitQuest Studio (itch.io)  
`https://bitqueststudio.itch.io/bulk-database-editor`  
Nota: plugin/tool para **export/import CSV** de várias categorias (Items/Weapons/Armors/Skills/Enemies/Actors/Classes).

3) RPG Maker MV Import / Export Database Items From Excel (YouTube)  
`https://www.youtube.com/watch?v=zyOxXwhJJzk`  
Nota: MV (não MZ), mas reforça a ideia de **edição em massa via Excel/CSV**.

4) RPG Maker MV — Development Tool + Import / Export Tool (YouTube)  
`https://www.youtube.com/watch?v=tH9q0Ddy3l4`  
Nota: MV (não MZ), app/tooling para export/import da database.

5) Steam Community — RPG Maker MV Tools - Database ConVerter MV  
`https://steamcommunity.com/app/1171220`  
Nota: ferramenta MV de conversão/export/import (aparece como “Database ConVerter MV”).

6) Bulk Database Editor Changelog 1.1.0 — BitQuest Studio (itch.io)  
`https://bitqueststudio.itch.io/bulk-database-editor/devlog/1010051/bulk-database-editor-changelog-110`  
Nota: detalhes do tool (nomes padrão de CSV, fixes etc.).

7) Niklas Notes — RPG Maker MV Tools - Database ConVerter MV  
`https://niklasnotes.com/dashboard/game/27296/rpg_maker_mv_tools_database_converter_mv`  
Nota: página descritiva/curadoria de ferramenta MV.

---

### Query B — “RPG Maker damage calculator loads project database formula balancing”

1) RPG Maker Damage Calculators (ARPGMaker forum thread)  
`https://www.arpgmaker.com/threads/rpg-maker-damage-calculators.67456/`  
Nota: app antiga (VX/XP) que “carrega o projeto” e calcula dano (inclui elementos).

2) RPG Maker Damage Calculator — SumRndmDde (web)  
`http://sumrndmdde.github.io/RPGMV-Damage-Calculator/`  
Nota: calculadora web (MV) para testar fórmula/variance/element rate e “hits to kill”.

3) Help balancing custom damage formula (RMRK forum)  
`https://rmrk.net/index.php?topic=39143.0`  
Nota: discussão antiga (XP) sobre balancear fórmula; útil como referência conceitual.

4) RPG Maker MV Tutorial — Custom Damage Formulas (YouTube)  
`https://www.youtube.com/watch?v=NnNjP1EF5GU`  
Nota: tutorial de fórmulas (MV), serve como material de base.

5) RPG Maker Action Combat — Deal Formula Damage to Enemy (site)  
`https://www.rpgmakeractioncombat.com/2025/02/26-dealing-damage-using-formula.html`  
Nota: descreve uso de fórmula e atributos do database no MZ (apesar do contexto “action combat”).

---

### Query C — “RPG Maker MZ pretty JSON format data files Git merge plugin”

1) Pretty JSON MV + MZ — Tamschi (itch.io)  
`https://tamschi.itch.io/pretty-json-for-rpg-maker`  
Nota: plugin para **formatar `data/*.json`** e facilitar merge/diff em Git.

2) RPGツクールMVをバージョン管理するための初期設定 (blog)  
`https://yukihane.github.io/blog/201903/24/versioning-rpg-maker/`  
Nota: guia (MV) para versionamento/formatting de JSON/JS (prettier/husky/lint-staged).

3) Qiita — script para reduzir ruído de itens que mudam sozinho no Git (MV)  
`https://qiita.com/nariya/items/eac6d2040ffc4330b2c3`  
Nota: práticas de versionamento; não é o tool de balance, mas é relevante ao pipeline.

4) Steam discussion — plugin para formatar data/JSON (MV)  
`https://steamcommunity.com/app/363890/discussions/3/3883849331778307998/`  
Nota: discussão/linkagem comunitária de plugins voltados a JSON formatting.

5) Itch.io collection — “RPG Maker Plugins and Scripts” (inclui Pretty JSON e outros)  
`https://itch.io/c/710849/rpg-maker-plugins-and-scripts`  
Nota: coleção curada que pode render novos caminhos (ex.: ferramentas de compartilhamento/export/import).

6) RMMZPluginMetadata (comuns-rpgmaker)  
`https://comuns-rpgmaker.github.io/plugin-metadata/`  
Nota: esquema/metadata para plugins MZ; útil se você publicar/organizar plugins/tooling.

7) SRDude (SumRndmDde site)  
`http://sumrndm.site`  
Nota: hub/índice de plugins (nem todos são MZ; ainda assim, é uma fonte para varredura).

---

## Observações para o seu MVP (conexão com os achados)

- Se o objetivo é acelerar o “Ato 1”, um caminho híbrido é:  
  - usar um **bulk editor CSV** (ou scripts) para “IO/edição em massa”, e  
  - focar seu software no que parece menos coberto por ferramentas prontas: **curvas determinísticas por âncoras + validação + simulação/TTK + snapshots/diffs**.
