# NPM 发布指南

## 前置条件

```bash
# 1. 登录 npm (使用官方源)
npm config set registry https://registry.npmjs.org/
npm login

# 2. 创建 npm 组织 (如果是 scoped package)
# 访问 https://www.npmjs.com/org/create 创建组织
```

## 发布流程

### 方式一：使用脚本发布 (推荐)

```bash
# 1. 构建
pnpm build

# 2. 升级版本号 (可选)
pnpm run version:patch  # 所有包升级 patch 版本
# 或
pnpm run version:minor  # 所有包升级 minor 版本

# 3. 发布所有包 (按依赖顺序)
pnpm run publish:all

# 或单独发布某个包
pnpm run publish:core
pnpm run publish:cli
```

### 方式二：手动发布

```bash
# 按依赖顺序发布
cd packages/utils && pnpm publish --access public --no-git-checks
cd ../core && pnpm publish --access public --no-git-checks
cd ../git-source && pnpm publish --access public --no-git-checks
cd ../filesystem-source && pnpm publish --access public --no-git-checks
cd ../plugins/metadata && pnpm publish --access public --no-git-checks
cd ../../cli && pnpm publish --access public --no-git-checks
```

## 发布顺序

由于包之间有依赖关系，必须按顺序发布：

```
1. @skill-toolbox/utils     (无内部依赖)
2. @skill-toolbox/core      (依赖 utils)
3. @skill-toolbox/git-source      (依赖 utils)
4. @skill-toolbox/filesystem-source (依赖 utils)
5. @skill-toolbox/plugin-metadata (依赖 utils)
6. @skill-toolbox/cli       (依赖所有上述包)
```

## 可用脚本

| 脚本 | 说明 |
|------|------|
| `pnpm run publish:all` | 发布所有包 |
| `pnpm run publish:utils` | 发布 utils |
| `pnpm run publish:core` | 发布 core |
| `pnpm run publish:git` | 发布 git-source |
| `pnpm run publish:fs` | 发布 filesystem-source |
| `pnpm run publish:plugin` | 发布 plugin-metadata |
| `pnpm run publish:cli` | 发布 cli |
| `pnpm run version:patch` | 所有包升级 patch (0.0.x) |
| `pnpm run version:minor` | 所有包升级 minor (0.x.0) |
| `pnpm run version:major` | 所有包升级 major (x.0.0) |

## 重要说明

### workspace:* 自动转换

使用 `pnpm publish` 时，`workspace:*` 会自动转换为实际版本号：

```json
// 本地开发
"dependencies": {
  "@skill-toolbox/utils": "workspace:*"
}

// 发布到 npm 后自动变为
"dependencies": {
  "@skill-toolbox/utils": "0.0.1"
}
```

**不要使用 `npm publish`**，它不会自动处理 `workspace:*`。

### 双因素认证 (2FA)

如果开启了 2FA，发布时需要 OTP：

```bash
pnpm publish --access public --no-git-checks --otp=123456
```

### Git 检查

`--no-git-checks` 参数跳过 git 状态检查。如果要发布时自动提交：

```bash
# 移除 --no-git-checks，pnpm 会检查工作区是否干净
pnpm publish --access public
```

## 常见问题

### Q: 发布失败 "E403 Forbidden"

确保：
1. 已登录 npm (`npm whoami`)
2. 组织已创建
3. 包名在组织中不存在

### Q: 发布失败 "EOTP"

需要提供 OTP 验证码：
```bash
pnpm publish --access public --no-git-checks --otp=你的验证码
```

### Q: 发布后安装报错 "workspace:*"

确保使用 `pnpm publish` 而不是 `npm publish`。

## 快速参考

```bash
# 完整发布流程
pnpm build && pnpm run version:patch && pnpm run publish:all
```
