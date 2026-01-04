#!/usr/bin/env npx tsx
/**
 * Validate RPG Maker MZ Project
 * Usage: npm run validate -- /path/to/project
 */

import 'reflect-metadata';
import { RmmzProjectValidator } from '../src/infrastructure/adapters/data/RmmzProjectValidator.js';
import { RmmzDataLoader } from '../src/infrastructure/adapters/data/RmmzDataLoader.js';
import { IntegrityValidator } from '../src/infrastructure/adapters/data/IntegrityValidator.js';
import { NodeFileSystem } from '../src/infrastructure/adapters/filesystem/NodeFileSystem.js';

const projectPath = process.argv[2];

if (!projectPath) {
  console.error('❌ Uso: npm run validate -- /caminho/para/projeto');
  console.error('   Exemplo: npm run validate -- /Users/edney/projects/coreto/projectX/frontend');
  process.exit(1);
}

async function main() {
  console.log('='.repeat(60));
  console.log('🎮 CORETO GAME ENGINE - Validação de Projeto');
  console.log('='.repeat(60));
  console.log(`\n📁 Projeto: ${projectPath}\n`);

  const fs = new NodeFileSystem();
  const validator = new RmmzProjectValidator(fs);
  const loader = new RmmzDataLoader(fs, validator);
  const integrity = new IntegrityValidator();

  // 1. Validate Project Structure
  console.log('1️⃣  Validando estrutura do projeto...');
  try {
    const isValid = await validator.validateProjectStructure(projectPath);
    console.log(`   ✅ Estrutura válida: ${isValid}`);
  } catch (e) {
    console.log(`   ❌ Erro: ${(e as Error).message}`);
    process.exit(1);
  }

  // 2. Load Database
  console.log('\n2️⃣  Carregando database...');
  let db;
  try {
    db = await loader.loadDatabase(projectPath);
    console.log('   ✅ Database carregado com sucesso!');

    const stats = {
      classes: db.$dataClasses?.filter(Boolean).length || 0,
      skills: db.$dataSkills?.filter(Boolean).length || 0,
      items: db.$dataItems?.filter(Boolean).length || 0,
      weapons: db.$dataWeapons?.filter(Boolean).length || 0,
      armors: db.$dataArmors?.filter(Boolean).length || 0,
      enemies: db.$dataEnemies?.filter(Boolean).length || 0,
      troops: db.$dataTroops?.filter(Boolean).length || 0,
      states: db.$dataStates?.filter(Boolean).length || 0,
      actors: db.$dataActors?.filter(Boolean).length || 0,
    };

    console.log('\n   📊 Estatísticas do Database:');
    console.log(`      Classes:  ${stats.classes}`);
    console.log(`      Skills:   ${stats.skills}`);
    console.log(`      Items:    ${stats.items}`);
    console.log(`      Weapons:  ${stats.weapons}`);
    console.log(`      Armors:   ${stats.armors}`);
    console.log(`      Enemies:  ${stats.enemies}`);
    console.log(`      Troops:   ${stats.troops}`);
    console.log(`      States:   ${stats.states}`);
    console.log(`      Actors:   ${stats.actors}`);

    if (db.$dataSystem?.gameTitle) {
      console.log(`\n   🎯 Título do Jogo: "${db.$dataSystem.gameTitle}"`);
    }
  } catch (e) {
    console.log(`   ❌ Erro ao carregar: ${(e as Error).message}`);
    process.exit(1);
  }

  // 3. Validate Integrity
  console.log('\n3️⃣  Validando integridade das referências...');
  const warnings = integrity.validate(db);

  if (warnings.length === 0) {
    console.log('   ✅ Nenhum problema de integridade encontrado!');
  } else {
    console.log(`   ⚠️  ${warnings.length} problema(s) encontrado(s):\n`);

    const grouped = warnings.reduce((acc, w) => {
      acc[w.type] = acc[w.type] || [];
      acc[w.type].push(w);
      return acc;
    }, {} as Record<string, typeof warnings>);

    for (const [type, items] of Object.entries(grouped)) {
      console.log(`   📌 ${type}: ${items.length} ocorrência(s)`);
      for (const item of items.slice(0, 5)) {
        console.log(`      - ${item.message}`);
      }
      if (items.length > 5) {
        console.log(`      ... e mais ${items.length - 5} ocorrência(s)`);
      }
    }
  }

  // 4. Sample Data
  console.log('\n4️⃣  Amostra de dados:');

  console.log('\n   📚 Classes:');
  db.$dataClasses?.filter(Boolean).slice(0, 5).forEach((c: any) => {
    console.log(`      [${c.id}] ${c.name}`);
  });

  console.log('\n   👾 Inimigos (primeiros 5):');
  db.$dataEnemies?.filter(Boolean).slice(0, 5).forEach((e: any) => {
    const hp = e.params?.[0] || 'N/A';
    const atk = e.params?.[2] || 'N/A';
    const def = e.params?.[3] || 'N/A';
    console.log(`      [${e.id}] ${e.name} - HP:${hp} ATK:${atk} DEF:${def}`);
  });

  console.log('\n   ⚔️  Troops (primeiros 5):');
  db.$dataTroops?.filter(Boolean).slice(0, 5).forEach((t: any) => {
    const members = t.members?.map((m: any) => {
      const enemy = db.$dataEnemies?.[m.enemyId];
      return enemy?.name || `Enemy#${m.enemyId}`;
    }).join(', ') || 'N/A';
    console.log(`      [${t.id}] ${t.name}: ${members}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Validação concluída!');
  console.log('='.repeat(60));
}

main().catch((e) => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});
