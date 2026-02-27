# pnpm-workspace-template

一个现代化的 pnpm workspace monorepo 模板

## 特性

- 📦 **pnpm workspace** - 高效的包管理
- 🚀 **TypeScript** - 类型安全
- 🎨 **ESLint + Prettier** - 代码规范
- 📁 **Monorepo 结构** - 清晰的项目组织

## 项目结构

```
.
├── packages/           # 共享包
│   ├── core/          # 核心功能
│   ├── utils/         # 工具函数
│   └── ui/            # UI 组件
├── apps/              # 应用程序
│   └── web/           # Web 应用
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json      # 共享 TypeScript 配置
├── .eslintrc.js       # 共享 ESLint 配置
└── .prettierrc        # 共享 Prettier 配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
```

## 添加新包

### 创建新的共享包

```bash
mkdir -p packages/new-package/src
cd packages/new-package
# 创建 package.json 和其他文件
```

### 创建新应用

```bash
mkdir -p apps/new-app/src
cd apps/new-app
# 创建 package.json 和其他文件
```

## 包依赖关系

在 monorepo 中，包之间可以相互引用：

```json
{
  "dependencies": {
    "@workspace/core": "workspace:*",
    "@workspace/utils": "workspace:*"
  }
}
```

## 注意事项

1. 使用 `workspace:*` 引用本地包
2. 根目录的 `devDependencies` 会被所有包共享
3. 每个包可以有自己独立的依赖
4. 使用 `pnpm -r` 命令递归执行脚本

## License

MIT
