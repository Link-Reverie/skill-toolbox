# Skill Toolbox - 设计文档

**日期：** 2026-02-27
**版本：** 1.0.0

## 概述

Skill Toolbox 是一个用于发现、管理和集成 Claude Code 风格 skill 的工具集，提供 Node.js 库和 CLI 工具。

### 核心目标

- **低耦合**：插件化架构，核心功能独立
- **易集成**：简单的 API 让自定义 agent 轻松使用 skill
- **功能完整**：支持 skill 的完整生命周期管理
- **低复杂度**：混合解析器架构，平衡功能和简洁性

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  @skill-toolbox/cli - 命令行工具                            │
│  (discover, install, list, validate, search)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  @skill-toolbox/core - 核心引擎和插件系统                   │
│  (SkillParser, PluginManager, SkillRegistry)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Source Adapters                           │
│  @skill-toolbox/git-source - Git 仓库适配器                 │
│  @skill-toolbox/local-source - 本地文件适配器               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Plugin Layer                             │
│  @skill-toolbox/plugin-metadata - YAML 元数据解析           │
│  @skill-toolbox/plugin-codeblocks - 代码块提取              │
│  @skill-toolbox/plugin-dependencies - 依赖分析              │
│  @skill-toolbox/plugin-references - 引用解析                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                             │
│  @skill-toolbox/utils - 共享工具和类型                      │
└─────────────────────────────────────────────────────────────┘
```

### Monorepo 包结构

```
packages/
├── core/                    # @skill-toolbox/core
├── cli/                     # @skill-toolbox/cli
├── git-source/              # @skill-toolbox/git-source
├── local-source/            # @skill-toolbox/local-source
├── plugins/
│   ├── metadata/           # @skill-toolbox/plugin-metadata
│   ├── codeblocks/         # @skill-toolbox/plugin-codeblocks
│   ├── dependencies/       # @skill-toolbox/plugin-dependencies
│   └── references/         # @skill-toolbox/plugin-references
└── utils/                   # @skill-toolbox/utils
```

## 核心组件设计

### 1. 解析流程

```
Raw Markdown
    ↓
[Markdown Parser - marked]
    ↓
Intermediate Representation (IR)
    ↓
[Plugin Pipeline]
    ↓
Structured Skill Object
```

### 2. 核心类型

```typescript
// 中间表示
interface SkillIR {
  frontmatter?: string;
  tokens: Token[];
  raw: string;
  [key: string]: unknown;
}

// 插件接口
interface SkillPlugin {
  name: string;
  version?: string;
  parse(ir: SkillIR): Promise<SkillIR> | SkillIR;
  validate?(ir: SkillIR): Promise<PluginValidationResult>;
}

// 完整 Skill 对象
interface Skill {
  metadata: SkillMetadata;
  sections: SkillSection[];
  codeBlocks: SkillCodeBlock[];
  dependencies: SkillDependency[];
  references: SkillReference[];
  raw: {
    markdown: string;
    path?: string;
    source?: string;
  };
}
```

### 3. 插件系统

**PluginManager**：
- 注册和管理插件
- 按顺序执行插件处理 IR
- 支持插件验证

**核心插件**：
1. **Metadata Plugin** - 解析 YAML frontmatter
2. **CodeBlocks Plugin** - 提取代码块和命令
3. **Dependencies Plugin** - 分析依赖关系
4. **References Plugin** - 提取引用和链接

### 4. Git Source 适配器

**功能**：
- 解析多种源格式（github:user/repo, URL, user/repo）
- 克隆仓库到临时目录或缓存
- 搜索 GitHub 仓库
- 缓存管理和更新

**支持格式**：
- `github:user/repo`
- `https://github.com/user/repo`
- `git@github.com:user/repo.git`
- `user/repo` (默认 GitHub)

### 5. Skill Registry

**功能**：
- 管理本地安装的 skills
- 列出、获取、安装、卸载 skills
- 验证 skill 格式
- 缓存已解析的 skills

### 6. CLI 工具

**核心命令**：
- `skill-toolbox install <source>` - 安装 skill
- `skill-toolbox list` - 列出已安装 skills
- `skill-toolbox search <query>` - 搜索远程 skills
- `skill-toolbox validate <path>` - 验证 skill 格式
- `skill-toolbox info <name>` - 查看详细信息
- `skill-toolbox cache` - 缓存管理

**输出格式**：
- table（默认）
- json
- markdown
- simple

### 7. 错误处理

**错误类型**：
- `ParseError` - 解析错误
- `ValidationError` - 验证错误
- `PluginError` - 插件错误
- `GitSourceError` - Git 源错误
- `NetworkError` - 网络错误
- `NotFoundError` - 资源未找到

**验证系统**：
- 内置验证规则
- 自定义规则支持
- 严格模式
- 警告提示

## 技术栈

```yaml
核心依赖:
  - marked: ^12.0.0          # Markdown 解析
  - js-yaml: ^4.1.0          # YAML 解析
  - execa: ^8.0.0            # Git 命令执行
  - fs-extra: ^11.2.0        # 文件系统
  - commander: ^12.0.0       # CLI 框架
  - chalk: ^5.3.0            # 终端颜色
  - ora: ^8.0.0              # Loading 动画
  - cli-table3: ^0.6.3       # 表格输出
  - inquirer: ^9.2.0         # 交互式提示
  - glob: ^10.3.0            # 文件匹配

开发依赖:
  - typescript: ^5.3.0
  - tsup: ^8.0.0
  - vitest: ^1.2.0
  - eslint: ^8.56.0
  - prettier: ^3.2.4

运行时要求:
  - Node.js: >=18.0.0
  - Git: >=2.0.0
```

## 使用示例

### 基础使用

```typescript
import { SkillParser } from '@skill-toolbox/core';
import { metadataPlugin, codeBlocksPlugin } from '@skill-toolbox/plugins';

const parser = new SkillParser([
  metadataPlugin(),
  codeBlocksPlugin()
]);

const skill = await parser.parse(markdown);
```

### 集成到 Agent

```typescript
import { SkillRegistry } from '@skill-toolbox/core';
import { GitSource } from '@skill-toolbox/git-source';

class MyAgent {
  private registry = new SkillRegistry({ skillsDir: './skills' });

  async loadSkill(source: string) {
    const gitSource = new GitSource();
    const resolved = await gitSource.resolve(source);
    const tempDir = await gitSource.clone(resolved.url);
    const skill = await this.registry.validate(tempDir);
    await this.registry.install(tempDir, skill.metadata.name);
  }
}
```

### CLI 使用

```bash
# 安装
skill-toolbox install github:user/skill-repo

# 列出
skill-toolbox list

# 搜索
skill-toolbox search testing

# 验证
skill-toolbox validate ./skills/*
```

## 开发路线图

### Phase 1: 核心功能 (MVP)
- 搭建 monorepo 结构
- 实现 @skill-toolbox/utils
- 实现 @skill-toolbox/core
- 实现 4 个核心插件
- 单元测试覆盖 80%+
- 基础文档

### Phase 2: CLI 工具
- 实现 @skill-toolbox/cli
- 核心命令：install、list、validate
- 实现 @skill-toolbox/git-source
- CLI 文档
- 集成测试

### Phase 3: 完善功能
- 实现 search 命令
- 实现 @skill-toolbox/local-source
- 缓存机制
- 错误处理优化
- 性能优化

### Phase 4: 生态建设
- 完整 API 文档
- 示例代码和教程
- 插件开发指南
- 社区 skill 仓库
- CI/CD 和发布流程

## 设计决策

### 为什么选择混合解析器（Hybrid Parser）？

1. **平衡复杂度和灵活性** - 核心简单，依赖小
2. **低耦合** - 插件独立，IR 层解耦
3. **渐进式能力** - 简单场景简单用，复杂场景也能支持
4. **性能优秀** - 只解析需要的部分

### 为什么选择插件化架构？

1. **核心极简** - 保持低复杂度
2. **功能可扩展** - 用户可以开发自定义插件
3. **复杂度分散** - 每个插件职责单一
4. **易于测试** - 插件独立测试

### 为什么选择 Monorepo？

1. **统一开发** - 所有包在一个仓库中
2. **共享代码** - utils 包被所有包使用
3. **类型安全** - TypeScript 类型在包之间共享
4. **简化测试** - 集成测试更容易

### 为什么选择 Git 作为主要源？

1. **开发简单** - 不需要发布流程
2. **直接读取** - 可以直接读取 markdown 文件
3. **版本控制** - 天然的版本管理
4. **生态友好** - GitHub 生态成熟

## 风险和缓解

### 风险 1: marked 解析器不够强大

**缓解措施**：
- 如果需要，可以替换为 remark/unified
- 插件可以访问原始 markdown 文本
- IR 层抽象了解析器实现

### 风险 2: Git 操作性能问题

**缓解措施**：
- 使用浅克隆（shallow clone）
- 实现缓存机制
- 支持离线模式（使用缓存）

### 风险 3: 插件冲突

**缓解措施**：
- 插件顺序可控
- IR 不可变（每次返回新对象）
- 插件命名空间隔离

## 成功指标

1. **易用性** - 5 分钟内完成 skill 安装和集成
2. **性能** - 解析 1000 个 skills < 1 秒
3. **可靠性** - 测试覆盖率 > 80%
4. **可扩展性** - 支持自定义插件开发
5. **文档完善** - 完整的 API 文档和示例

## 总结

Skill Toolbox 采用插件化混合解析器架构，提供低耦合、易扩展的 skill 管理工具。通过 Monorepo 组织代码，Git 作为主要源，平衡了功能完整性和开发复杂度。
