# 01-repo-as-source-of-truth.md - 代码库即真理

> **核心定义**：所有规则、约束和架构决策必须内嵌在代码库中，可被机械化验证，不能依赖"人类理解"或"口头约定"。

---

## 🎯 为什么重要

### 背景

在传统的软件工程实践中，大量知识是"隐性"的：

- "我们通常把 API 放在 `src/api/` 目录下"
- "这个模块不应该直接访问数据库"
- "新功能应该遵循现有的模式"

这些规则依赖于**人类的理解和记忆**。当团队规模扩大、人员流动、或引入 AI 智能体时，这种隐性知识就会成为瓶颈。

### 痛点

#### 1. 智能体无法理解"最佳实践"

AI 智能体（如 Codex、Claude Code）没有"直觉"，它们只能：
- 看到代码库中的**实际代码**
- 执行**可机械化的规则**
- 遵循**明确的指令**

如果规则只存在于人类脑海中，智能体会：
- 产生不一致的代码风格
- 违反架构约束
- 重复造轮子

#### 2. 人工审查无法规模化

- 人类会疲劳、会疏忽
- 随着 PR 数量增加，审查质量必然下降
- 3 人团队每天 3.5 个 PR → 7 人团队每天 7+ 个 PR → 人工审查成为瓶颈

#### 3. "知识孤岛"导致系统脆弱

- 只有某个人知道"为什么这样设计"
- 他离职后，系统变成"黑盒"
- 新人不敢修改，系统逐渐僵化

### 核心数据

OpenAI 的案例显示：
- **3 人团队** → **5 个月** → **~100 万行代码** → **~1500 个 PR**
- **零手写代码**，全部由 Codex 生成
- **关键成功因素**：所有规则都内嵌在代码库中，可机械化执行

---

## 🔨 如何落地

### 原则一：所有规则必须可执行

**错误做法**：
```markdown
# README.md
## 架构规范
- 服务层应该调用数据层
- 避免循环依赖
- 使用统一的错误处理
```

**正确做法**：
```typescript
// src/linter/rules/no-cycle-dependency.ts
import { ESLintUtils } from '@typescript-eslint/utils';

export const noCycleDependency = ESLintUtils.RuleCreator(
  (name) => `https://example.com/docs/${name}`
)({
  name: 'no-cycle-dependency',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止循环依赖',
    },
    schema: [],
    messages: {
      cycleFound: '发现循环依赖：{{path}}',
    },
  },
  defaultOptions: [],
  create(context) {
    // 实现依赖图检测和循环查找逻辑
    return {
      ImportDeclaration(node) {
        // 检查导入是否形成循环
        const importPath = node.source.value;
        if (hasCycle(context.getFilename(), importPath)) {
          context.report({
            node,
            messageId: 'cycleFound',
            data: { path: buildDependencyPath() },
          });
        }
      },
    };
  },
});
```

### 原则二：代码库是唯一的真理来源

#### 1. 创建 AGENTS.md 作为智能体导航入口

```markdown
# AGENTS.md - 智能体导航入口

## 核心原则
1. **代码即文档**：所有规则都在代码中，不在文档里
2. **机械化验证**：CI 通过 = 正确，无需人工审查
3. **明确意图**：用代码表达"为什么"，而非"做什么"

## 架构分层
```
src/
├── types/      # 类型定义（最稳定）
├── config/     # 配置（环境相关）
├── repo/       # 数据访问（数据库、API）
├── service/    # 业务逻辑（核心）
├── runtime/    # 运行时逻辑（事件处理、定时任务）
└── ui/         # 界面层（最易变）
```

## 禁止行为
- ❌ 跨层调用（如 ui/ 直接调用 repo/）
- ❌ 循环依赖
- ❌ 硬编码配置
- ❌ 未处理的 Promise

## 检查清单
运行 `make lint` 确保：
- [ ] 所有文件通过 ESLint
- [ ] 依赖图无循环
- [ ] 测试覆盖率 > 80%
- [ ] 无 TODO 注释
```

#### 2. 用代码表达架构约束

```typescript
// src/linter/rules/layers.ts
// 定义层与层之间的依赖规则
export const LAYER_DEPS = {
  'types': [],           // types 层不依赖任何层
  'config': ['types'],   // config 只能依赖 types
  'repo': ['types', 'config'],
  'service': ['types', 'config', 'repo'],
  'runtime': ['types', 'config', 'repo', 'service'],
  'ui': ['types', 'config', 'service'], // ui 不能直接访问 repo
};

// ESLint 规则实现
export const layerDependencyRule = {
  create(context) {
    return {
      ImportDeclaration(node) {
        const currentFile = context.getFilename();
        const importPath = node.source.value;
        
        const currentLayer = extractLayer(currentFile);
        const importLayer = extractLayer(importPath);
        
        const allowedDeps = LAYER_DEPS[currentLayer];
        if (!allowedDeps.includes(importLayer)) {
          context.report({
            node,
            message: `Layer "${currentLayer}" cannot depend on "${importLayer}"`,
          });
        }
      },
    };
  },
};
```

### 原则三：用测试作为"可执行规范"

```typescript
// tests/layers.spec.ts
import { describe, it, expect } from 'vitest';
import { checkLayerDependency } from '../../src/linter/rules/layers';

describe('Layer Dependency Rules', () => {
  it('should allow service to import repo', () => {
    const result = checkLayerDependency('service/user.service.ts', 'repo/user.repo.ts');
    expect(result.allowed).toBe(true);
  });

  it('should reject ui importing repo directly', () => {
    const result = checkLayerDependency('ui/user.component.tsx', 'repo/user.repo.ts');
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('Layer "ui" cannot depend on "repo"');
  });

  it('should detect circular dependency', () => {
    const result = checkLayerDependency('service/a.service.ts', 'service/b.service.ts', true);
    expect(result.hasCycle).toBe(true);
  });
});
```

### 原则四：CI/CD 作为"最终仲裁者"

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run lint  # 所有规则必须在这里通过
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test -- --coverage  # 覆盖率必须 > 80%
      
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build  # 必须能成功构建
```

### 原则五：预提交钩子作为"第一道防线"

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 运行快速检查，阻止明显错误的提交
npm run lint:staged || exit 1
npm run test:staged || exit 1

# 检查是否有未完成的 TODO
if grep -r "TODO(" --cached --include='*.ts' --include='*.tsx'; then
  echo "❌ 禁止提交包含 TODO 的代码"
  exit 1
fi

# 检查是否有硬编码的 secret
if grep -r "sk_live_\|ghp_" --cached --include='*.ts' --include='*.tsx' --include='*.env'; then
  echo "❌ 检测到硬编码的 secret，请使用环境变量"
  exit 1
fi

exit 0
```

---

## 🚨 反例警示

### 错误案例 1：依赖"团队默契"

**场景**：团队约定"服务层不应该直接访问数据库"

**问题**：
- 新加入的智能体不知道这个规则
- 产生了直接 `new Database()` 的代码
- 人工 Review 漏掉了
- 系统出现性能问题

**教训**：规则必须写成 linter，而不是写在文档里

### 错误案例 2：文档与代码不一致

**场景**：
```markdown
# README.md
## 错误处理规范
所有 API 应该返回统一的错误格式：
```json
{ "error": { "code": "...", "message": "..." } }
```
```

但代码中：
```typescript
// 实际实现
res.status(500).send({ msg: 'Something went wrong' }); // ❌ 不符合文档
```

**问题**：
- 文档是"死的"，不会被强制执行
- 智能体可能参考旧代码而非文档
- 系统逐渐偏离规范

**教训**：用测试验证错误格式，而不是依赖文档

### 错误案例 3：规则只存在于人类脑中

**场景**：
> 人类：这个模块不应该被外部调用，是内部实现的
> 智能体：好的（但继续导出了该模块）
> 人类：我说过不能导出！
> 智能体：你只说了"不应该"，没有写规则

**问题**：
- 模糊的语言无法被机械化
- 智能体按字面意思理解
- 人类感到沮丧

**教训**：用 `export` 限制和 linter 规则表达"不应该"

---

## 🔧 可复制的配置片段

### ESLint 规则配置

```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@custom-rules'],
  rules: {
    '@custom-rules/no-cycle-dependency': 'error',
    '@custom-rules/layer-dependency': 'error',
    '@custom-rules/no-todo': 'warn',
    '@custom-rules/hardcoded-secret': 'error',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@custom-rules/layer-dependency': 'off', // 测试文件可以跨层
      },
    },
  ],
};
```

### Makefile 快捷命令

```makefile
# Makefile

.PHONY: lint test build

lint:
	npx eslint src/ --ext .ts,.tsx

lint:staged
	npx eslint --fix $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

test:
	npx vitest run

test:coverage:
	npx vitest run --coverage

test:staged:
	npx vitest run $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

build:
	npx tsc --noEmit

check: lint test build
	@echo "✅ All checks passed"
```

### pre-commit 配置

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: lint
        name: Lint
        entry: npm run lint:staged
        language: system
        pass_filenames: false
        
      - id: test
        name: Test
        entry: npm run test:staged
        language: system
        pass_filenames: false
        
      - id: no-todo
        name: Check for TODOs
        entry: bash -c 'grep -r "TODO(" --cached --include="*.ts" --include="*.tsx" && exit 1 || exit 0'
        language: system
        pass_filenames: false
```

---

## 📚 参考链接

### 原文

- **OpenAI Harness Engineering**: [Harnessing Codex in an Agent-First World](https://openai.com/index/harness-engineering/)
  - 来源：OpenAI 官方博客
  - 作者：Ryan Lopopolo
  - 日期：2026-02-11

### 延伸阅读

1. **ESLint 官方文档**: [Writing Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
2. **TypeScript ESLint**: [Custom Rules](https://typescript-eslint.io/rules/)
3. **Pre-commit Framework**: [pre-commit.com](https://pre-commit.com/)
4. **GitHub Actions**: [CI/CD Best Practices](https://docs.github.com/en/actions)

### 相关概念

- [02-mechanical-enforcement.md](./02-mechanical-enforcement.md) - 机械化执行
- [04-agent-readability.md](./04-agent-readability.md) - 智能体可读性

---

## ✅ 检查清单

在开始 Harness Engineering 之前，确保你的代码库包含：

- [ ] `AGENTS.md` - 智能体导航入口
- [ ] `.eslintrc.js` - ESLint 配置（包含自定义规则）
- [ ] `.pre-commit-config.yaml` - 预提交钩子
- [ ] `.github/workflows/ci.yml` - CI/CD 配置
- [ ] `Makefile` 或 `package.json` scripts - 快捷命令
- [ ] `tests/` - 测试文件（覆盖率 > 80%）
- [ ] 至少 1 个自定义 linter 规则（如层依赖检查）

---

> **记住**：代码库即真理。如果你的规则不能通过 `make check`，那它就不存在。
