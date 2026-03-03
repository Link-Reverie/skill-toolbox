/**
 * GitSource 快速开始示例
 *
 * 展示最常见的 GitSource 使用场景
 */

import { GitSource } from '@skill-toolbox/git-source';
import { SkillLoader, SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';

// ============================================================================
// 示例 1: 从 GitHub 加载技能（最简单）
// ============================================================================

async function example1() {
  console.log('=== 示例 1: 从 GitHub 加载技能 ===\n');

  const loader = new SkillLoader({
    sources: [new GitSource()],
    parser: new SkillParser().use(metadataPlugin()),
  });

  // 加载 ComposioHQ 的技能集合
  const result = await loader.loadFromSource('ComposioHQ/awesome-claude-skills:');

  console.log(`✅ 加载了 ${result.skills.size} 个技能:\n`);

  // 显示前 5 个技能
  const skills = Array.from(result.skills.entries()).slice(0, 5);
  for (const [name, skill] of skills) {
    console.log(`  • ${name}`);
    if (skill.metadata.description) {
      const desc = skill.metadata.description;
      const short = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;
      console.log(`    ${short}\n`);
    }
  }

  if (result.skills.size > 5) {
    console.log(`  ... 还有 ${result.skills.size - 5} 个技能\n`);
  }
}

// ============================================================================
// 示例 2: 从自定义路径加载
// ============================================================================

async function example2() {
  console.log('\n=== 示例 2: 从自定义路径加载 ===\n');

  const loader = new SkillLoader({
    sources: [new GitSource()],
    parser: new SkillParser().use(metadataPlugin()),
  });

  // 假设有一个仓库，技能在 docs/skills 目录
  // const result = await loader.loadFromSource('user/repo:docs/skills');

  console.log('使用语法: user/repo:path 来指定技能目录');
  console.log('示例:');
  console.log('  - user/repo:skills          -> 从 skills 目录加载');
  console.log('  - user/repo:docs/skills     -> 从 docs/skills 目录加载');
  console.log('  - user/repo:                -> 从根目录加载');
}

// ============================================================================
// 示例 3: 使用缓存提高性能
// ============================================================================

async function example3() {
  console.log('\n=== 示例 3: 使用缓存 ===\n');

  const gitSource = new GitSource({
    defaultCacheDir: './skill-cache'
  });

  const loader = new SkillLoader({
    sources: [gitSource],
    parser: new SkillParser().use(metadataPlugin()),
  });

  console.log('首次加载（会克隆并缓存）...');
  const start1 = Date.now();
  const result1 = await loader.loadFromSource('ComposioHQ/awesome-claude-skills:');
  const time1 = Date.now() - start1;
  console.log(`✅ 加载了 ${result1.skills.size} 个技能 (耗时 ${time1}ms)`);

  console.log('\n第二次加载（使用缓存）...');
  const start2 = Date.now();
  const result2 = await loader.loadFromSource('ComposioHQ/awesome-claude-skills:');
  const time2 = Date.now() - start2;
  console.log(`✅ 加载了 ${result2.skills.size} 个技能 (耗时 ${time2}ms)`);

  console.log(`\n速度提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
}

// ============================================================================
// 示例 4: 底层 API 使用
// ============================================================================

async function example4() {
  console.log('\n=== 示例 4: 底层 API ===\n');

  const gitSource = new GitSource();

  // 1. 解析源
  console.log('1. 解析源...');
  const meta = await gitSource.resolve('ComposioHQ/awesome-claude-skills:');
  console.log(`   仓库: ${meta.resolved}`);
  console.log(`   路径: "${meta.skillPath}"`);

  // 2. 获取仓库
  console.log('\n2. 获取仓库...');
  const localPath = await gitSource.fetch(meta);
  console.log(`   本地路径: ${localPath}`);

  // 3. 发现技能
  console.log('\n3. 发现技能...');
  const discovered = await gitSource.discover(localPath, meta);
  console.log(`   发现了 ${discovered.length} 个技能:`);
  discovered.slice(0, 3).forEach(s => console.log(`     - ${s.name}`));
  if (discovered.length > 3) {
    console.log(`     ... 还有 ${discovered.length - 3} 个`);
  }

  // 4. 清理
  console.log('\n4. 清理临时目录...');
  await gitSource.cleanup(localPath, meta);
  console.log('   ✅ 清理完成');
}

// ============================================================================
// 示例 5: 错误处理
// ============================================================================

async function example5() {
  console.log('\n=== 示例 5: 错误处理 ===\n');

  const loader = new SkillLoader({
    sources: [new GitSource()],
    parser: new SkillParser().use(metadataPlugin()),
  });

  const result = await loader.loadFromSource('ComposioHQ/awesome-claude-skills:');

  if (result.errors.length > 0) {
    console.log(`❌ 有 ${result.errors.length} 个文件加载失败:\n`);
    result.errors.forEach(err => {
      const fileName = err.source.split('/').pop() || err.source;
      console.log(`  • ${fileName}`);
      console.log(`    错误: ${err.error.message}\n`);
    });
  }

  console.log(`✅ 成功: ${result.skills.size}/${result.skills.size + result.errors.length}`);
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function main() {
  try {
    // 运行示例 1
    await example1();

    // 显示示例 2（只是说明）
    await example2();

    // 运行示例 3（需要较长时间）
    // await example3();  // 取消注释以运行

    // 运行示例 4
    await example4();

    // 运行示例 5
    await example5();

    console.log('\n✅ 所有示例运行完成！\n');
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

main();
