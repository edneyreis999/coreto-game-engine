# RPG Maker MZ Data Structure - Empirical Analysis

**Version:** 1.0
**Analysis Date:** 2026-01-04
**Analyst:** Coreto Game Engine Team
**Project Analyzed:** Daratrine - A Origem

---

## Project Metadata

| Property | Value |
|----------|-------|
| **Project Name** | Daratrine - A Origem |
| **Project Path** | `/Users/edney/projects/coreto/projectX/frontend/` |
| **RPG Maker MZ Version ID** | 83639521 |
| **Battle System** | 1 (VisuStella ATB/CTB) |
| **Total Classes** | 9 |
| **Total Skills** | 236 |
| **Total Enemies** | 101 |
| **Total Troops** | 31 |
| **Total Items** | 91 |

---

## VisuStella Plugins Installed

| Plugin Name | Version | Impact on Data Structure |
|-------------|---------|--------------------------|
| VisuMZ_0_CoreEngine | 1.85 | Adds `messageType` to Skills, `battleSystem` to System |
| VisuMZ_1_BattleCore | 1.85 | Battle system mechanics, affects System.battleSystem |
| VisuMZ_1_ElementStatusCore | 1.26 | Element and status mechanics |
| VisuMZ_1_SkillsStatesCore | 1.51 | Skill and state mechanics |
| VisuMZ_1_ItemsEquipsCore | 1.56 | Item and equipment mechanics |

**Total VisuStella Plugins:** 18 plugins, 21 active instances

---

## Custom Coreto Plugins

| Plugin Name | Purpose | Impact on Data Structure |
|-------------|---------|--------------------------|
| Coreto_battle_delay | Battle accumulation system | Item ID 21 (BattleDelay) |
| Coreto_Skill_Learn_Control | Skill shop system | Notetags in Skills.note |
| Coreto_battle_enemy_reinforcements | Enemy reinforcement system | Troops event pages |

**Total Custom Plugins:** 7 battle-related plugins

---

## 1. Classes.json Structure

### Overview

Classes.json is an array of class definitions. Index 0 is null, IDs start at 1.

### Field Reference Table

| Field | Type | Required | Default | Example | Notes |
|-------|------|----------|---------|---------|-------|
| `id` | number | Yes | - | `1` | Unique class ID (1-based) |
| `name` | string | Yes | - | `"Espadachim"` | Class display name |
| `expParams` | number[4] | Yes | - | `[30, 20, 30, 30]` | Experience curve parameters [base, extra, accel_a, accel_b] |
| `params` | number[][] | Yes | - | `[[1, 544, ...], ...]` | 8 arrays of 100 numbers each for stats at levels 0-99 |
| `traits` | Trait[] | Yes | `[]` | See Trait structure | Class-specific traits |
| `learnings` | Learning[] | Yes | `[]` | See Learning structure | Skills learned at specific levels |
| `note` | string | Yes | `""` | `""` | Additional notes (usually empty for classes) |

### Parameter Arrays (params)

The `params` field is a 2D array with 8 rows and 100 columns:

```typescript
params[0] = MaxHP for levels 0-99 (100 values)
params[1] = MaxMP for levels 0-99
params[2] = ATK for levels 0-99
params[3] = DEF for levels 0-99
params[4] = MAT for levels 0-99
params[5] = MDF for levels 0-99
params[6] = AGI for levels 0-99
params[7] = LUK for levels 0-99
```

**Important:** Index 0 represents level 1 (not level 0). Value at params[0][0] is always 1 for HP.

### Trait Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `code` | number | Yes | `22` | Trait type code (see Appendix) |
| `dataId` | number | Yes | `0` | Context-dependent ID |
| `value` | number | Yes | `0.95` | Trait value (often a rate 0.0-1.0) |

### Learning Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `level` | number | Yes | `5` | Level at which skill is learned |
| `skillId` | number | Yes | `99` | ID of skill to learn (references Skills.json) |
| `note` | string | Yes | `""` | Additional notes (usually empty) |

### Edge Cases

- **Classes without learnings:** Espadachim (ID 1) has `learnings: []`
- **Classes with many learnings:** Mago (ID 2) has 13 learnings
- **Parameter growth:** All classes have exactly 100 values per parameter (levels 0-99)
- **First HP value:** Always `params[0][0] = 1` for level 1

### Examples

**Class without learnings (Espadachim - ID 1):**

```json
{
  "id": 1,
  "name": "Espadachim",
  "expParams": [30, 20, 30, 30],
  "learnings": [],
  "traits": [
    { "code": 23, "dataId": 0, "value": 1 },
    { "code": 22, "dataId": 0, "value": 0.95 }
  ],
  "params": [
    [1, 544, 618, 691, ...], // MaxHP
    // ... other params
  ],
  "note": ""
}
```

**Class with learnings (Mago - ID 2):**

```json
{
  "id": 2,
  "name": "Mago",
  "expParams": [20, 20, 30, 30],
  "learnings": [
    { "level": 1, "skillId": 99, "note": "" },
    { "level": 3, "skillId": 75, "note": "" },
    { "level": 5, "skillId": 103, "note": "" }
  ],
  "traits": [...],
  "params": [...],
  "note": ""
}
```

---

## 2. Skills.json Structure

### Overview

Skills.json is an array of skill definitions. Index 0 is null, IDs start at 1.

### Field Reference Table

| Field | Type | Required | Default | Example | Notes |
|-------|------|----------|---------|---------|-------|
| `id` | number | Yes | - | `1` | Unique skill ID (1-based) |
| `name` | string | Yes | - | `"Ataque"` | Skill display name |
| `description` | string | Yes | `""` | `"Realiza um ataque"` | Skill description in menus |
| `iconIndex` | number | Yes | `0` | `76` | Icon index from IconSet.png (0-based) |
| `damage` | Damage | Yes | - | See Damage structure | Damage configuration |
| `effects` | Effect[] | Yes | `[]` | See Effect structure | Effects applied on use |
| `scope` | number | Yes | - | `1` | Target selection (see Appendix) |
| `mpCost` | number | Yes | `0` | `0` | MP cost to use skill |
| `tpCost` | number | Yes | `0` | `10` | TP cost to use skill |
| `tpGain` | number | Yes | `0` | `5` | TP gained by target when hit |
| `occasion` | number | Yes | - | `1` | When skill can be used (0=Always, 1=Battle, 2=Menu, 3=Never) |
| `hitType` | number | Yes | - | `1` | Hit type (0=Certain, 1=Physical, 2=Magical) |
| `successRate` | number | Yes | `100` | `100` | Base success rate % (0-100) |
| `repeats` | number | Yes | `1` | `1` | Number of times skill hits |
| `speed` | number | Yes | `0` | `0` | Speed correction for turn order |
| `animationId` | number | Yes | `0` | `-1` | Animation ID (-1=weapon anim, 0+=Animations.json) |
| `message1` | string | Yes | `""` | `"%1 ataca!"` | Battle log message |
| `message2` | string | Yes | `""` | `""` | Optional second message |
| `stypeId` | number | Yes | `0` | `0` | Skill type ID (references System.skillTypes) |
| `requiredWtypeId1` | number | Yes | `0` | `0` | Required weapon type 1 (0=no requirement) |
| `requiredWtypeId2` | number | Yes | `0` | `0` | Required weapon type 2 (0=no requirement) |
| `note` | string | Yes | `""` | See Notetags | Custom notetags (Coreto plugins) |
| `messageType` | number | Yes | `1` | `1` | **VisuStella extension:** Message display type |

### Damage Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `type` | number | Yes | `1` | Damage type (see Appendix) |
| `elementId` | number | Yes | `-1` | Element ID (-1=weapon element, 0+=System.elements) |
| `formula` | string | Yes | `"a.atk * 4 - b.def * 2"` | JavaScript damage formula |
| `variance` | number | Yes | `20` | Damage variance % (0-100) |
| `critical` | boolean | Yes | `true` | Whether skill can critical hit |

### Effect Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `code` | number | Yes | `21` | Effect type code (see Appendix) |
| `dataId` | number | Yes | `0` | Context-dependent ID |
| `value1` | number | Yes | `1` | First effect value |
| `value2` | number | Yes | `0` | Second effect value |

### Custom Notetags (Coreto Plugins)

These notetags are added by Coreto_Skill_Learn_Control plugin:

| Notetag | Pattern | Example | Purpose |
|---------|---------|---------|---------|
| Skill Shop Class Requirement | `<Skill Shop Require Class: (\d+)>` | `<Skill Shop Require Class: 1>` | Restrict skill to specific class |
| Skill Shop Gold Cost | `<Skill Shop Cost: (\d+)>` | `<Skill Shop Cost: 0>` | Gold cost to buy skill |
| Skill Ticket Cost | `<Item (\d+) Cost: (\d+)>` | `<Item 41 Cost: 1>` | Cost in Skill Tickets (Item 41) |
| Forget Reward | `<Item (\d+) Forget Reward: (\d+)>` | `<Item 41 Forget Reward: 1>` | Ticket refund when forgetting |

### Edge Cases

- **Basic Attack (ID 1):** Critical skill, always present, scope=1 (one enemy)
- **Skills with multiple notetags:** Can have 4+ notetags in single note field
- **Empty descriptions:** Many skills have `description: ""`
- **Negative animationId:** Value `-1` means use weapon's default animation

### Examples

**Basic Attack (ID 1):**

```json
{
  "id": 1,
  "name": "Ataque",
  "description": "",
  "iconIndex": 76,
  "damage": {
    "type": 1,
    "elementId": -1,
    "formula": "a.atk * 4 - b.def * 2",
    "variance": 20,
    "critical": true
  },
  "effects": [
    { "code": 21, "dataId": 0, "value1": 1, "value2": 0 }
  ],
  "scope": 1,
  "mpCost": 0,
  "tpCost": 0,
  "tpGain": 5,
  "occasion": 1,
  "hitType": 1,
  "successRate": 100,
  "repeats": 1,
  "speed": 0,
  "animationId": -1,
  "message1": "%1 ataca!",
  "message2": "",
  "stypeId": 0,
  "requiredWtypeId1": 0,
  "requiredWtypeId2": 0,
  "note": "A habilidade n.º 1 corresponde ao comando de Ataque.",
  "messageType": 1
}
```

**Skill with Skill Shop Notetags (ID 172):**

```json
{
  "id": 172,
  "name": "Ataque Forte",
  "description": "Realiza um ataque poderoso em um inimigo.",
  "damage": {
    "type": 1,
    "elementId": -1,
    "formula": "a.atk * 5 - b.def * 2",
    "variance": 20,
    "critical": true
  },
  "note": "<Skill Shop Require Class: 1>\n<Skill Shop Cost: 0>\n<Item 41 Cost: 1>\n<Item 41 Forget Reward: 1>",
  "messageType": 1
}
```

**Multi-Target Skill (scope: 2):**

```json
{
  "id": 173,
  "name": "Corte",
  "description": "Ataca todos os inimigos.",
  "scope": 2,
  "tpCost": 20,
  "note": "<Skill Shop Require Class: 1>\n<Skill Shop Cost: 0>\n<Item 41 Cost: 1>\n<Item 41 Forget Reward: 1>",
  "messageType": 1
}
```

---

## 3. Enemies.json Structure

### Overview

Enemies.json is an array of enemy definitions. Index 0 is null, IDs start at 1.

### Field Reference Table

| Field | Type | Required | Default | Example | Notes |
|-------|------|----------|---------|---------|-------|
| `id` | number | Yes | - | `1` | Unique enemy ID (1-based) |
| `name` | string | Yes | - | `"Goblin"` | Enemy display name |
| `battlerName` | string | Yes | `""` | `"Goblin"` | Battler graphic filename (without extension) |
| `battlerHue` | number | Yes | `0` | `0` | Hue rotation for battler graphic (0-360) |
| `params` | number[8] | Yes | - | `[1, 0, 25, 20, 20, 20, 20, 20]` | Fixed stats [HP, MP, ATK, DEF, MAT, MDF, AGI, LUK] |
| `exp` | number | Yes | `0` | `10000` | Experience points awarded |
| `gold` | number | Yes | `0` | `5000` | Gold awarded when defeated |
| `actions` | Action[] | Yes | - | See Action structure | AI action patterns |
| `traits` | Trait[] | Yes | `[]` | See Trait structure | Enemy-specific traits |
| `dropItems` | DropItem[] | Yes | - | See DropItem structure | Items dropped when defeated (3 slots) |
| `note` | string | Yes | `""` | `""` | Additional notes |

### Action Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `skillId` | number | Yes | `1` | ID of skill to use (references Skills.json) |
| `rating` | number | Yes | `5` | Priority rating (higher = more likely) |
| `conditionType` | number | Yes | `0` | When action can be used (0=always) |
| `conditionParam1` | number | Yes | `0` | First condition parameter |
| `conditionParam2` | number | Yes | `0` | Second condition parameter |

### DropItem Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `kind` | number | Yes | `0` | Item type (0=Item, 1=Weapon, 2=Armor) |
| `dataId` | number | Yes | `1` | ID in respective database |
| `denominator` | number | Yes | `1` | Drop rate (1/denominator) |

### Edge Cases

- **Fixed dropItems array:** Always has exactly 3 slots (can be identical)
- **Simple AI (conditionType: 0):** Most enemies use "always" condition
- **Parameter order:** Fixed array of 8 values, always in same order

### Examples

**Simple Enemy (Goblin - ID 1):**

```json
{
  "id": 1,
  "name": "Goblin",
  "battlerName": "Goblin",
  "battlerHue": 0,
  "params": [1, 0, 25, 20, 20, 20, 20, 20],
  "exp": 10000,
  "gold": 5000,
  "actions": [
    {
      "skillId": 1,
      "rating": 5,
      "conditionType": 0,
      "conditionParam1": 0,
      "conditionParam2": 0
    },
    {
      "skillId": 20,
      "rating": 5,
      "conditionType": 0,
      "conditionParam1": 0,
      "conditionParam2": 0
    }
  ],
  "traits": [
    { "code": 22, "dataId": 0, "value": 0.95 },
    { "code": 22, "dataId": 1, "value": 0.05 },
    { "code": 31, "dataId": 1, "value": 0 }
  ],
  "dropItems": [
    { "kind": 0, "dataId": 1, "denominator": 1 },
    { "kind": 0, "dataId": 1, "denominator": 1 },
    { "kind": 0, "dataId": 1, "denominator": 1 }
  ],
  "note": ""
}
```

---

## 4. Troops.json Structure

### Overview

Troops.json is an array of troop formations. Index 0 is null, IDs start at 1.

### Field Reference Table

| Field | Type | Required | Default | Example | Notes |
|-------|------|----------|---------|---------|-------|
| `id` | number | Yes | - | `1` | Unique troop ID (1-based) |
| `name` | string | Yes | - | `"Goblin*2"` | Troop display name |
| `members` | TroopMember[] | Yes | - | See TroopMember structure | Enemy positions in formation |
| `pages` | TroopPage[] | Yes | - | See TroopPage structure | Battle event pages |

### TroopMember Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `enemyId` | number | Yes | `1` | ID of enemy (references Enemies.json) |
| `x` | number | Yes | `336` | X coordinate on battle screen |
| `y` | number | Yes | `436` | Y coordinate on battle screen |
| `hidden` | boolean | Yes | `false` | Whether enemy starts hidden |

### TroopPage Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `conditions` | PageConditions | Yes | See structure | Conditions for page activation |
| `list` | EventCommand[] | Yes | See structure | Event commands to execute |
| `span` | number | Yes | `0` | When to check conditions (0=Battle, 1=Turn, 2=Moment) |

### PageConditions Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `actorValid` | boolean | Yes | `false` | Whether actor condition is active |
| `actorId` | number | Yes | `1` | Actor ID for condition |
| `actorHp` | number | Yes | `50` | Actor HP percentage threshold |
| `enemyValid` | boolean | Yes | `false` | Whether enemy condition is active |
| `enemyIndex` | number | Yes | `0` | Enemy index in troop (0-7) |
| `enemyHp` | number | Yes | `50` | Enemy HP percentage threshold |
| `switchValid` | boolean | Yes | `false` | Whether switch condition is active |
| `switchId` | number | Yes | `1` | Switch ID for condition |
| `turnValid` | boolean | Yes | `false` | Whether turn condition is active |
| `turnA` | number | Yes | `0` | Turn count start |
| `turnB` | number | Yes | `0` | Turn count end |
| `turnEnding` | boolean | Yes | `false` | Whether turn ending condition is active |

### EventCommand Structure

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `code` | number | Yes | `0` | Command code (0 = end of list) |
| `indent` | number | Yes | `0` | Indentation level for conditional branches |
| `parameters` | any[] | Yes | `[]` | Command parameters (vary by code) |

### Edge Cases

- **Empty event pages:** Most simple troops have pages with only code 0 (end)
- **Multiple enemies:** Members array can have 1-8 enemies
- **Same enemy ID:** Multiple members can reference the same enemyId

### Examples

**Simple Troop (Goblin*2 - ID 1):**

```json
{
  "id": 1,
  "name": "Goblin*2",
  "members": [
    { "enemyId": 1, "x": 336, "y": 436, "hidden": false },
    { "enemyId": 1, "x": 480, "y": 436, "hidden": false }
  ],
  "pages": [
    {
      "conditions": {
        "actorValid": false,
        "actorId": 1,
        "actorHp": 50,
        "enemyValid": false,
        "enemyIndex": 0,
        "enemyHp": 50,
        "switchValid": false,
        "switchId": 1,
        "turnValid": false,
        "turnA": 0,
        "turnB": 0,
        "turnEnding": false
      },
      "list": [
        { "code": 0, "indent": 0, "parameters": [] }
      ],
      "span": 0
    }
  ]
}
```

---

## 5. Items.json Structure

### Overview

Items.json is an array of item definitions. Index 0 is null, IDs start at 1.

### Field Reference Table

| Field | Type | Required | Default | Example | Notes |
|-------|------|----------|---------|---------|-------|
| `id` | number | Yes | - | `21` | Unique item ID (1-based) |
| `name` | string | Yes | - | `""` | Item display name |
| `description` | string | Yes | `""` | `""` | Item description in menus |
| `iconIndex` | number | Yes | `0` | `0` | Icon index from IconSet.png |
| `price` | number | Yes | `0` | `0` | Shop price in gold |
| `consumable` | boolean | Yes | `true` | `true` | Whether item is consumed on use |
| `itypeId` | number | Yes | `1` | `1` | Item type ID (references System.itemCategories) |
| `damage` | Damage | Yes | - | See Damage structure | Damage configuration (usually type 0) |
| `effects` | Effect[] | Yes | `[]` | See Effect structure | Effects applied on use |
| `scope` | number | Yes | - | `7` | Target selection (see Appendix) |
| `occasion` | number | Yes | - | `0` | When item can be used (0=Always, 1=Battle, 2=Menu, 3=Never) |
| `hitType` | number | Yes | - | `0` | Hit type (0=Certain, 1=Physical, 2=Magical) |
| `successRate` | number | Yes | `100` | `100` | Base success rate % |
| `repeats` | number | Yes | `1` | `1` | Number of times item effect repeats |
| `speed` | number | Yes | `0` | `0` | Speed correction |
| `animationId` | number | Yes | `0` | `0` | Animation ID (0+=Animations.json) |
| `tpGain` | number | Yes | `0` | `0` | TP gained by target |
| `note` | string | Yes | `""` | `""` | Additional notes |

### Custom Items

**Item ID 21: BattleDelay**
- Purpose: Coreto_battle_delay plugin mechanic
- Special handling required by plugin
- Empty name/description (handled by plugin)

**Item ID 41: Skill Ticket**
- Purpose: Currency for Coreto_Skill_Learn_Control plugin
- Used in `<Item 41 Cost: X>` notetags
- Not a consumable item in traditional sense

### Edge Cases

- **Empty names:** Items 21 and 41 have `name: ""`
- **Zero price:** Custom items often have `price: 0`
- **Empty effects:** Items can have `effects: []`

### Examples

**Custom Item (BattleDelay - ID 21):**

```json
{
  "id": 21,
  "name": "",
  "description": "",
  "iconIndex": 0,
  "price": 0,
  "consumable": true,
  "itypeId": 1,
  "damage": {
    "type": 0,
    "elementId": 0,
    "formula": "0",
    "variance": 20,
    "critical": false
  },
  "effects": [],
  "scope": 7,
  "occasion": 0,
  "hitType": 0,
  "successRate": 100,
  "repeats": 1,
  "speed": 0,
  "animationId": 0,
  "tpGain": 0,
  "note": ""
}
```

---

## 6. System.json Structure

### Overview

System.json is a **single object** (not an array) containing global game configuration.

### Field Reference Table (Key Fields)

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `gameTitle` | string | Yes | `"Daratrine"` | Game title |
| `versionId` | number | Yes | `83639521` | RPG Maker MZ version ID |
| `battleSystem` | number | Yes | `1` | **VisuStella extension:** 0=Turn-Based, 1=ATB/CTB |
| `locale` | string | Yes | `"pt_BR"` | Game language/locale |
| `elements` | string[] | Yes | `["", "Físico", "Fogo", ...]` | Element names (index 0 is empty) |
| `skillTypes` | string[] | Yes | `["", "Mágica", "Especial"]` | Skill type names |
| `weaponTypes` | string[] | Yes | `["", "Adaga", "Espada", ...]` | Weapon type names |
| `armorTypes` | string[] | Yes | `["", "Armadura Leve", ...]` | Armor type names |
| `equipTypes` | string[] | Yes | `["", "Arma", "Escudo", ...]` | Equipment slot names |
| `currencyUnit` | string | Yes | `"G"` | Currency unit display |
| `startMapId` | number | Yes | `1` | Starting map ID |
| `startX` | number | Yes | `10` | Starting X coordinate |
| `startY` | number | Yes | `10` | Starting Y coordinate |
| `partyMembers` | number[] | Yes | `[1, 2, 3]` | Initial party actor IDs |
| `testBattlers` | object[] | Yes | `[...]` | Test battle party configuration |
| `testTroopId` | number | Yes | `1` | Test battle troop ID |

### VisuStella Extensions

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `battleSystem` | number | `0` | Added by VisuMZ_0_CoreEngine<br>0 = Turn-Based<br>1 = ATB/CTB |

### Additional Fields

System.json contains many additional fields for game configuration. See fixtures/sample-data/System.json for complete structure. Key additional fields include:

- Battle configuration: `battleBgm`, `battleback1Name`, `battleback2Name`
- Music/SFX: `titleBgm`, `victoryMe`, `defeatMe`, `gameoverMe`
- Vehicle configuration: `boat`, `ship`, `airship`
- Options: `optDisplayTp`, `optSideView`, `optAutosave`, etc.
- Terms: `terms` (object with game terminology)

### Edge Cases

- **Array indexing:** All type arrays (elements, skillTypes, etc.) start with empty string at index 0
- **battleSystem:** Non-standard field, added by VisuStella plugins
- **Optional fields:** Some fields may be undefined in older projects

### Example

**System.json (key fields):**

```json
{
  "gameTitle": "Daratrine - A Origem",
  "versionId": 83639521,
  "battleSystem": 1,
  "locale": "pt_BR",
  "elements": ["", "Físico", "Fogo", "Gelo", "Trovão"],
  "skillTypes": ["", "Mágica", "Especial"],
  "weaponTypes": ["", "Adaga", "Espada", "Malho", "Machado"],
  "armorTypes": ["", "Armadura Leve", "Armadura Pesada"],
  "currencyUnit": "G",
  "startMapId": 1,
  "partyMembers": [1, 2, 3]
}
```

---

## 7. Plugin Dependencies Map

### VisuStella → Data Structure Impact

| Plugin | Version | Fields Added | Structures Affected |
|--------|---------|--------------|---------------------|
| VisuMZ_0_CoreEngine | 1.85 | `messageType` | Skills.json |
| VisuMZ_0_CoreEngine | 1.85 | `battleSystem` | System.json |
| VisuMZ_1_BattleCore | 1.85 | Battle mechanics | System.battleSystem values |
| VisuMZ_1_ElementStatusCore | 1.26 | Element mechanics | Trait codes interpretation |
| VisuMZ_1_SkillsStatesCore | 1.51 | Skill mechanics | Effect codes interpretation |
| VisuMZ_1_ItemsEquipsCore | 1.56 | Item mechanics | Item structure interpretation |

### Coreto Plugins → Data Structure Impact

| Plugin | Notetags/Items Affected | Purpose |
|--------|-------------------------|---------|
| Coreto_Skill_Learn_Control | Skills.note | `<Skill Shop Require Class: X>`<br>`<Skill Shop Cost: X>`<br>`<Item 41 Cost: X>`<br>`<Item 41 Forget Reward: X>` |
| Coreto_battle_delay | Items ID 21 | BattleDelay item (custom mechanic) |

---

## Appendix: Code Reference Tables

### A. Trait Codes (Found in Analysis)

| Code | Meaning | dataId | value |
|------|---------|--------|-------|
| 11 | Element Rate | Element ID | Rate multiplier (1.0 = 100%) |
| 22 | Parameter (xparam) | XParam ID (0=HIT, 1=EVA, 2=CRI) | Rate value |
| 23 | Attack Element | Element ID | 1 (enabled) |
| 31 | Attack State | State ID | Rate (0.0-1.0) |
| 41 | Skill Type Seal | Skill Type ID | 1 (sealed) |
| 51 | Equipment Type Seal | Equipment Type ID | 0 (sealed) |
| 52 | Equip Slot Seal | Slot index | 0 (sealed) |
| 55 | Action Times+ | - | Bonus actions |

**Note:** Not exhaustive. Only codes found empirically in the analyzed project.

### B. Skill/Item Scope Codes

| Code | Meaning |
|------|---------|
| 0 | None |
| 1 | One Enemy |
| 2 | All Enemies |
| 3 | Random Enemies (1x) |
| 4 | Random Enemies (2x) |
| 5 | Random Enemies (3x) |
| 6 | Random Enemies (4x) |
| 7 | One Ally |
| 8 | All Allies |
| 9 | One Ally (Dead) |
| 10 | All Allies (Dead) |
| 11 | User |

### C. Effect Codes (Found in Analysis)

| Code | Meaning | dataId | value1 | value2 |
|------|---------|--------|--------|--------|
| 21 | Common Event | Common Event ID | 1 (trigger) | 0 |
| 22 | Special Effect | Effect type | - | - |

**Note:** Not exhaustive. Only codes found empirically.

### D. Damage Types

| Type | Meaning |
|------|---------|
| 0 | None |
| 1 | HP Damage |
| 2 | MP Damage |
| 3 | HP Recover |
| 4 | MP Recover |
| 5 | HP Drain |
| 6 | MP Drain |

### E. Hit Types

| Type | Meaning |
|------|---------|
| 0 | Certain Hit |
| 1 | Physical Attack |
| 2 | Magical Attack |

---

## Summary

This document provides empirical analysis of RPG Maker MZ data structures from the "Daratrine - A Origem" project. All structures, fields, and examples are based on real data extracted from the project.

**Key Findings:**

1. **VisuStella Extensions:** Fields `messageType` (Skills) and `battleSystem` (System) are non-standard
2. **Custom Notetags:** Coreto plugins add 4 notetag patterns to Skills.note
3. **Custom Items:** Items 21 (BattleDelay) and 41 (Skill Ticket) are plugin-specific
4. **Data Consistency:** All structures follow strict schema with predictable types

**Version Constraints:**

- This analysis is valid for VisuStella plugins version 1.85
- Updating plugins may change data structures
- TypeScript types in `src/types/rmmz-data.ts` reflect this version

**Implementation Notes:**

- Use TypeScript types as source of truth for structure validation
- Parse notetags only when needed (Loader Layer responsibility)
- Treat System.battleSystem and Skills.messageType as optional for vanilla MZ compatibility
- Custom items (21, 41) require special handling in simulation logic

---

**End of Document**
