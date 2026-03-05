---
name: code-review
description: Code review guidelines for team
author: Engineering Team
tags: [review, quality, best-practices]
---

## [en]

# Code Review Guidelines

When reviewing code, please check for:

### Security
- SQL injection vulnerabilities
- XSS vulnerabilities
- Proper input validation
- Secure password handling

### Performance
- N+1 query problems
- Unnecessary loops
- Memory leaks
- Proper caching

### Code Style
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Write unit tests

## Examples

### Bad Example
\`\`\`javascript
// ❌ Never do this!
eval(userInput);
const password = "hardcoded123";  // ❌ Security risk!
\`\`\`

### Good Example
\`\`\`javascript
// ✅ Always sanitize input
const sanitized = sanitize(userInput);
const password = process.env.PASSWORD;  // ✅ From environment
\`\`\`

---

## [zh-CN]

# 代码审查指南

在审查代码时，请检查：

### 安全性
- SQL 注入漏洞
- XSS 跨站脚本漏洞
- 输入验证是否充分
- 密码处理是否安全

### 性能
- N+1 查询问题
- 不必要的循环
- 内存泄漏
- 缓存使用是否合理

### 代码风格
- 遵循 ESLint 规则
- 使用有意义的变量名
- 为复杂逻辑添加注释
- 编写单元测试

## 示例

### 错误示例
\`\`\`javascript
// ❌ 永远不要这样做！
eval(userInput);
const password = "hardcoded123";  // ❌ 安全风险！
\`\`\`

### 正确示例
\`\`\`javascript
// ✅ 总是清理输入
const sanitized = sanitize(userInput);
const password = process.env.PASSWORD;  // ✅ 从环境变量读取
\`\`\`

---

## [ja]

# コードレビューガイドライン

コードをレビューする際は、以下を確認してください：

### セキュリティ
- SQLインジェクションの脆弱性
- XSSの脆弱性
- 適切な入力検証
- 安全なパスワード処理

### パフォーマンス
- N+1クエリの問題
- 不要なループ
- メモリリーク
- 適切なキャッシング

### コードスタイル
- ESLintルールに従う
- 意味のある変数名を使用
- 複雑なロジックにコメントを追加
- ユニットテストを作成

## 例

### 悪い例
\`\`\`javascript
// ❌ 絶対にしないでください！
eval(userInput);
const password = "hardcoded123";  // ❌ セキュリティリスク！
\`\`\`

### 良い例
\`\`\`javascript
// ✅ 常に入力をサニタイズ
const sanitized = sanitize(userInput);
const password = process.env.PASSWORD;  // ✅ 環境変数から
\`\`\`
