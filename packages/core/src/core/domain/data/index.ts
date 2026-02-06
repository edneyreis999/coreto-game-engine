/**
 * Domain data types barrel export.
 * Pure domain types with no infrastructure dependencies.
 *
 * Exported with "Domain" prefix to avoid conflicts with infrastructure types.
 */

export type {
  EnemyData as DomainEnemyData,
  ActionData as DomainActionData,
  TraitData as DomainEnemyTraitData,
  DropItemData as DomainDropItemData,
} from './EnemyData.js';

export type {
  SkillData as DomainSkillData,
  EffectData as DomainSkillEffectData,
  DamageData as DomainSkillDamageData,
} from './SkillData.js';

export type {
  ClassData as DomainClassData,
  LearningData as DomainLearningData,
  TraitData as DomainClassTraitData,
} from './ClassData.js';

export type {
  TroopData as DomainTroopData,
  TroopMemberData as DomainTroopMemberData,
  TroopPageConditionsData as DomainTroopPageConditionsData,
  TroopEventCommandData as DomainTroopEventCommandData,
  TroopPageData as DomainTroopPageData,
} from './TroopData.js';

export type {
  ItemData as DomainItemData,
  EffectData as DomainItemEffectData,
  DamageData as DomainItemDamageData,
} from './ItemData.js';

export type { SystemData as DomainSystemData } from './SystemData.js';
