# Sprint 1 任务看板

## 🔴 In Progress (进行中)

无

## 📋 TODO (待开始)

### 类型安全工程师

#### TS-1: 修复 SkillParser 类型安全 🔴 CRITICAL
**优先级**: P0
**工时**: 4h
**文件**: `packages/core/src/parser/SkillParser.ts`

**问题描述**:
`irToSkill()` 方法使用 `as any` 类型转换，绕过 TypeScript 类型检查。

**验收标准**:
- [ ] 移除所有 `as any` 类型转换
- [ ] 定义 `SkillIR` 各字段的正确类型
- [ ] 添加类型守卫函数
- [ ] TypeScript 严格模式无错误

**技术方案**:
```typescript
// 当前问题代码
metadata: (ir.metadata as any) || { name: '', version: '' }

// 解决方案
interface SkillIRMetadata {
  name: string;
  description?: string;
  version?: string;
  // ...
}

function isSkillIRMetadata(obj: unknown): obj is SkillIRMetadata {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}
```

---

#### TS-2: 添加类型守卫函数
**优先级**: P1
**工时**: 2h
**依赖**: TS-1

**任务**:
- [ ] 创建 `packages/utils/src/type-guards.ts`
- [ ] 实现 `isSkillMetadata()`
- [ ] 实现 `isSkillSection()`
- [ ] 实现 `isCodeBlock()`
- [ ] 导出所有类型守卫

---

#### TS-3: 添加编译时穷尽性检查
**优先级**: P1
**工时**: 1h

**完成内容**:
- [x] 在 `factory.ts` 中添加 `default` 分支类型检查
- [x] 使用 `never` 类型确保所有 case 都处理

**提交**: 8127b5c

---

#### TE-2: 统一导出格式
**优先级**: P1
**工时**: 2h

**完成内容**:
- [x] 添加 `type: "module"` 到 filesystem-source 和 git-source
- [x] 统一所有包的 exports 格式（`.cjs` for CommonJS, `.js` for ES modules）
- [x] 验证所有测试通过

**提交**: a76dde5

---

### 测试工程师

#### TE-1: CLI 集成测试 🔴 CRITICAL
**优先级**: P0
**工时**: 8h
**文件**: `packages/cli/`

**完成内容**:
- [x] 设置 CLI 测试框架（使用 execa 和 Vitest）
- [x] 测试 `skill list` 命令
- [x] 测试 `skill validate` 命令
- [x] 测试帮助和版本命令
- [x] 测试错误处理（无效参数、空结果等）

**验收标准**:
- [x] 所有命令有至少 2 个测试用例
- [x] 错误场景有测试

**提交**: 24bcbfb

---

#### TE-2: 统一导出格式
**优先级**: P1
**工时**: 2h

**问题**:
discovery-source 使用 `.cjs` 扩展名，其他包使用 `.js`

**任务**:
- [ ] 统一 discovery-source 的 main/module 配置
- [ ] 确保所有包的 exports 格式一致
- [ ] 更新相关测试

---

#### TE-3: HTTP Source 完整测试
**优先级**: P1
**工时**: 4h

**完成内容**:
- [x] 测试缓存机制（首次加载、缓存命中、刷新）
- [x] 测试网络错误处理（超时、404、500）
- [x] Mock fetch API
- [x] 测试 index.json 解析

**提交**: 9acc2aa

---

#### TE-4: Git Source Mock 测试
**优先级**: P1
**工时**: 4h

**完成内容**:
- [x] 创建 Git Source 单元测试
- [x] 浅克隆选项测试
- [x] 分支/标签切换测试
- [x] 错误场景测试（无效源格式）
- [x] 源解析测试（GitHub shorthand, full URL, SSH）
- [x] 总计 28 个测试全部通过（12 个现有 + 16 个新增）

**提交**: f064b4b

---

#### DO-1: GitHub Actions CI
**优先级**: P1
**工时**: 3h

**完成内容**:
- [x] 创建 `.github/workflows/ci.yml`
- [x] 配置测试矩阵（Node 18, 20, 22）
- [x] 添加 build 检查
- [x] 配置 PR 自动运行 CI

**提交**: dbce100

---

#### DO-2: npm Provenance
**优先级**: P2
**工时**: 2h

**完成内容**:
- [x] 配置 npm provenance（添加 --provenance 标志）
- [x] 更新发布脚本
- [x] 包含 discovery-source 和 http-source

**提交**: 1656f25

---

#### DE-1: TypeDoc 配置
**优先级**: P2
**工时**: 3h

**完成内容**:
- [x] 安装 TypeDoc 0.28.17
- [x] 配置 `typedoc.json`
- [x] 添加文档生成脚本（docs, docs:watch）
- [x] 配置所有包的入口点

**提交**: 4c646b0

---

#### SA-1: 依赖安全审计
**优先级**: P2
**工时**: 2h

**完成内容**:
- [x] 运行 `pnpm audit`
- [x] 修复 3 个高危漏洞（更新 TypeScript ESLint）
- [x] 添加 `.npmignore` 到所有包
- [x] 剩余 1 个中危漏洞（esbuild 开发服务器，仅影响开发环境）

**提交**: 36dfb5c, 046ce9c

---

## ✅ Done (已完成)

### 类型安全工程师

#### TS-1: 修复 SkillParser 类型安全 🔴 CRITICAL
**优先级**: P0
**工时**: 4h
**文件**: `packages/core/src/parser/SkillParser.ts`

**完成内容**:
- [x] 移除所有 `as any` 类型转换
- [x] 创建 `packages/utils/src/types/type-guards.ts`
- [x] 添加类型守卫函数（`isSkillMetadata`, `isSkillSection` 等）
- [x] 添加 `extract*` 辅助函数用于类型安全的 IR 字段访问
- [x] TypeScript 严格模式无错误

**提交**:
- d03e32b: fix: remove `as any` type casts in SkillParser
- 1dc1374: fix: add DiscoverySource and HttpSource mocks to factory tests

---

#### TS-2: 添加类型守卫函数
**优先级**: P1
**工时**: 2h

**完成内容**:
- [x] 创建 `packages/utils/src/types/type-guards.ts`
- [x] 实现 `isSkillMetadata()`
- [x] 实现 `isSkillSection()`
- [x] 实现 `isSkillCodeBlock()`
- [x] 实现 `isSkillDependency()`
- [x] 实现 `isSkillReference()`
- [x] 添加 `extract*` 辅助函数
- [x] 导出所有类型守卫

**提交**: 已包含在 TS-1 中

---

## 🚫 Blocked (阻塞)

暂无

---

## 📊 Sprint 1 统计

- **总任务数**: 14
- **进行中**: 0
- **待开始**: 0
- **已完成**: 11
- **总工时**: 38h
- **已完成工时**: 38h (100%)
- **完成日期**: 2026-03-04

---

## 每日站会模板

### 昨天
- 完成了什么？

### 今天
- 计划做什么？

### 阻塞
- 有什么问题需要帮助？
