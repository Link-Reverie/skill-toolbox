# 贡献者快速上手指南

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆仓库
git clone https://github.com/Link-Reverie/skill-toolbox.git
cd skill-toolbox

# 安装 pnpm（如未安装）
npm install -g pnpm

# 安装依赖
pnpm install

# 构建所有包
pnpm -r build

# 运行测试
pnpm -r test
```

### 2. 项目结构

```
skill-toolbox/
├── packages/
│   ├── core/              # 核心解析引擎
│   ├── utils/             # 共享类型和工具
│   ├── cli/               # 命令行工具
│   ├── plugins/
│   │   └── metadata/      # YAML frontmatter 解析插件
│   └── sources/
│       ├── filesystem/    # 本地文件系统源
│       ├── git/           # Git 仓库源
│       ├── discovery/     # 自动发现源
│       └── http/          # HTTP 远程源
├── apps/
│   └── agent/             # 示例 AI 代理应用
├── examples/              # 示例技能
└── docs/                  # 文档
```

### 3. 开发工作流

```bash
# 1. 创建功能分支
git checkout -b feature/my-feature

# 2. 开发（以 core 包为例）
cd packages/core
pnpm dev  # 启动 watch 模式

# 3. 测试
pnpm test

# 4. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 5. 推送并创建 PR
git push origin feature/my-feature
```

---

## 📚 核心概念

### 1. SkillSource 抽象

所有技能源实现 `SkillSource` 接口：

```typescript
interface SkillSource {
  getSourceInfo(): SourceInfo;
  load(options?: LoadOptions): Promise<SourceLoadResult>;
  cleanup(): Promise<void>;
}
```

### 2. 插件系统

技能解析使用中间件模式：

```typescript
const parser = new SkillParser()
  .use(metadataPlugin())
  .use(customPlugin());
```

### 3. 工厂模式

使用工厂函数创建源：

```typescript
const sources = createSources(
  [
    { type: 'filesystem', path: './skills' },
    { type: 'git', source: 'user/repo' },
  ],
  { FilesystemSource, GitSource }
);
```

---

## 🎯 开发任务优先级

### P0 - Critical（必须完成）

1. **修复类型安全** - `packages/core/src/parser/SkillParser.ts`
   - 问题：`as any` 类型转换
   - 工时：4h
   - 联系人：类型工程师

2. **CLI 测试** - `packages/cli/`
   - 问题：无测试
   - 工时：8h
   - 联系人：测试工程师

### P1 - High（应该完成）

3. **导出格式统一**
   - 问题：discovery-source 使用 `.cjs`
   - 工时：2h

4. **HTTP Source 测试**
   - 问题：只测试了 getSourceInfo
   - 工时：4h

### P2 - Medium（可选）

5. **API 文档**
   - 配置 TypeDoc
   - 工时：4h

6. **包 README**
   - discovery-source, http-source
   - 工时：3h

---

## 🔍 代码审查清单

### 提交前自检

- [ ] TypeScript 无错误
- [ ] 测试通过
- [ ] 遵循代码风格
- [ ] 添加必要注释
- [ ] 更新相关文档

### 代码风格

- **命名**:
  - 类: PascalCase (`SkillLoader`)
  - 函数/变量: camelCase (`loadSkills`)
  - 常量: UPPER_SNAKE_CASE (`MAX_RETRIES`)
  - 文件: kebab-case (`skill-loader.ts`)

- **导入顺序**:
  1. Node.js 内置模块
  2. 外部依赖
  3. 内部包
  4. 相对路径

- **错误处理**:
  - 使用自定义错误类
  - 不要吞噬错误
  - 提供可操作的错误消息

---

## 🧪 测试指南

### 单元测试

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should work correctly', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Mock 外部依赖

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ skills: [] }),
  })
);
```

### 测试覆盖率

```bash
# 查看覆盖率
pnpm test -- --coverage

# 目标：≥ 80%
```

---

## 📝 文档风格

### JSDoc 注释

```typescript
/**
 * 加载所有技能
 *
 * @param options - 加载选项
 * @returns 技能映射和错误信息
 *
 * @example
 * ```typescript
 * const { skills, errors } = await loader.loadAll();
 * ```
 */
async loadAll(options?: LoadOptions): Promise<LoadAllResult>
```

### README 模板

```markdown
# @skill-toolbox/package-name

简短描述

## 安装

npm install @skill-toolbox/package-name

## 使用

代码示例

## API

API 文档链接

## 许可证

MIT
```

---

## 🚨 常见问题

### Q: 测试失败：找不到模块

**A**: 确保先运行 `pnpm -r build`

### Q: TypeScript 报错：类型不匹配

**A**: 检查 `tsconfig.json` 的 `paths` 配置

### Q: 发布失败：权限不足

**A**: 联系维护者添加 npm 权限

---

## 📞 联系方式

- **项目维护者**: Link-Reverie
- **GitHub Issues**: https://github.com/Link-Reverie/skill-toolbox/issues
- **讨论区**: https://github.com/Link-Reverie/skill-toolbox/discussions

---

## 🎉 第一次贡献？

1. 查看 [Good First Issues](https://github.com/Link-Reverie/skill-toolbox/labels/good%20first%20issue)
2. Fork 仓库
3. 创建功能分支
4. 提交 PR
5. 等待审查

我们欢迎所有形式的贡献！
