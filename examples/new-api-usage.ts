/**
 * 新的 SkillSource API 使用示例
 *
 * 每个 Git 仓库/本地路径用独立的 Source 实例
 */

import { GitSource } from './packages/git-source/src';
import { FilesystemSource } from './packages/filesystem-source/src';
import { SkillLoader, SkillParser } from './packages/core/src';
import { metadataPlugin } from './packages/plugins/metadata/src';

async function example1() {
  console.log('=== 示例 1: 从多个 Git 仓库加载 ===\n');

  const loader = new SkillLoader({
    sources: [
      new GitSource({
        source: 'ComposioHQ/awesome-claude-skills',
        skillPath: ''  // 根目录
      }),
      new GitSource({
        source: 'anthropics/claude-skills',
        skillPath: 'skills'  // skills 子目录
      }),
    ],
    parser: new SkillParser().use(metadataPlugin()),
  });

  const { skills, errors } = await loader.loadAll();

  console.log(`✅ 成功加载 ${skills.size} 个技能:\n`);

  // 技能名称格式: 'source-id/skill-name'
  for (const [name, skill] of skills) {
    console.log(`  • ${name}`);
    console.log(`    描述: ${skill.metadata.description?.substring(0, 60)}...\n`);
  }

  if (errors.size > 0) {
    console.log(`\n❌ ${errors.size} 个错误:\n`);
    for (const [path, error] of errors) {
      console.log(`  • ${path}`);
      console.log(`    ${error.message}\n`);
    }
  }
}

async function example2() {
  console.log('\n=== 示例 2: 混合 Git 和本地源 ===\n');

  const loader = new SkillLoader({
    sources: [
      // Git 仓库
      new GitSource({
        source: 'ComposioHQ/awesome-claude-skills',
        skillPath: '',
        cacheDir: './skill-cache',  // 使用缓存
      }),
      // 本地目录
      new FilesystemSource({
        path: './local-skills'
      }),
      // 绝对路径
      new FilesystemSource({
        path: '/home/user/.claude/skills'
      }),
    ],
    parser: new SkillParser().use(metadataPlugin()),
  });

  const { skills, errors } = await loader.loadAll();

  console.log(`加载了 ${skills.size} 个技能`);

  // 按源分组显示
  const bySource = new Map<string, Skill[]>();
  for (const [name, skill] of skills) {
    const [source,] = name.split('/');
    if (!bySource.has(source)) {
      bySource.set(source, []);
    }
    bySource.get(source)!.push(skill);
  }

  console.log('\n按源分组:\n');
  for (const [source, sourceSkills] of bySource) {
    console.log(`  ${source}:`);
    console.log(`    ${sourceSkills.length} 个技能`);
    console.log(`    ${sourceSkills.map(s => s.metadata.name).join(', ')}\n`);
  }
}

async function example3() {
  console.log('\n=== 示例 3: 使用缓存提高性能 ===\n');

  const loader = new SkillLoader({
    sources: [
      new GitSource({
        source: 'anthropics/claude-skills',
        skillPath: 'skills',
        cacheDir: './cache',  // 持久化缓存
        shallow: true,        // 浅克隆
      }),
    ],
    parser: new SkillParser().use(metadataPlugin()),
  });

  // 第一次加载（会克隆）
  const start1 = Date.now();
  const result1 = await loader.loadAll();
  const time1 = Date.now() - start1;

  console.log(`首次加载: ${result1.skills.size} 个技能 (${time1}ms)`);

  // 第二次加载（使用缓存）
  const start2 = Date.now();
  const result2 = await loader.loadAll();
  const time2 = Date.now() - start2;

  console.log(`缓存加载: ${result2.skills.size} 个技能 (${time2}ms)`);
  console.log(`提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
}

async function example4() {
  console.log('\n=== 示例 4: 错误处理 ===\n');

  const loader = new SkillLoader({
    sources: [
      // 有效的仓库
      new GitSource({
        source: 'ComposioHQ/awesome-claude-skills',
        skillPath: '',
      }),
      // 无效的仓库（会失败，但不影响其他源）
      new GitSource({
        source: 'nonexistent/repo-that-does-not-exist',
        skillPath: 'skills',
      }),
      // 不存在的本地路径
      new FilesystemSource({
        path: '/nonexistent/path'
      }),
    ],
    parser: new SkillParser().use(metadataPlugin()),
  });

  const { skills, errors } = await loader.loadAll();

  console.log(`✅ 成功: ${skills.size} 个技能`);
  console.log(`❌ 失败: ${errors.size} 个源\n`);

  console.log('错误详情:\n');
  for (const [path, error] of errors) {
    console.log(`  • ${path}`);
    console.log(`    ${error.message}\n`);
  }
}

async function main() {
  try {
    await example1();
    await example2();
    await example3();
    await example4();
  } catch (error) {
    console.error('错误:', error);
  }
}

main();
