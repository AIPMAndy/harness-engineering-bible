# 02-mechanical-enforcement.md - 机械化执行

> **核心定义**：用 linter、测试、CI/CD 等自动化工具强制执行约束，不依赖人工审查或"自觉遵守"。

---

## 🎯 为什么重要

### 背景

在 Harness Engineering 范式中，智能体是主要的"代码生产者"。人类不再是写代码的人，而是**设计约束系统的人**。

如果约束不能机械化执行，就会回到传统模式：
- 人类写代码 → 人类审查 → 人类发现问题 → 人类修复
- 智能体写代码 → 人类审查 → 人类发现问题 → 人类修复（智能体没带来提升）

**Harness 的核心价值**在于：
- 智能体写代码 → 机器验证 → **自动通过/失败** → 人类只处理例外

### 痛点

#### 1. 人工审查无法规模化

**数据**：
- 3 人团队 → 每天 3.5 个 PR/人 → 每天 10.5 个 PR
- 7 人团队 → 每天 7+ 个 PR/人 → 每天 49+ 个 PR
- 人类审查速度：约 1-2 个 PR/小时（高质量审查）
- **结论**：7 人团队需要 25+ 小时/天的审查时间，不可能完成

#### 2. 人类会疲劳、会疏忽

- 第 1 个 PR：仔细审查，发现所有问题
- 第 10 个 PR：开始走马观花
- 第 50 个 PR：机械点击"Approve"
- **结果**：错误代码流入生产环境

#### 3. 智能体需要明确的"通过/失败"信号

AI 智能体的学习机制：
- 如果 CI 通过 → 认为代码正确 → 继续生成类似代码
- 如果 CI 失败 → 收到错误信息 → 尝试修复

**如果审查是人工的**：
- 智能体不知道"为什么被拒绝"
- 无法从错误中学习
- 重复犯同样的错误

### 核心原则

> **只有机器能验证的，才是真实的约束。**

---

## 🔨 如何落地

### 原则一：多层次防御体系

机械化执行不是单一工具，而是**多层防御**：

```
┌─────────────────────────────────────────┐
│  第 1 层：预提交钩子 (pre-commit)        │ ← 本地拦截，快速反馈
│  - 检查语法错误                         │
│  - 运行快速 lint                        │
│  - 阻止明显违规                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  第 2 层：CI 流水线 (GitHub Actions)     │ ← 云端验证，全面检查
│  - 运行完整测试套件                     │
│  - 检查覆盖率                           │
│  - 构建验证                             │
│  - 安全扫描                             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  第 3 层：部署前检查 (pre-deploy)        │ ← 生产环境前最后防线
│  - 集成测试                             │
│  - 性能测试                             │
│  - 回滚预案                             │
└─────────────────────────────────────────┘
```

### 原则二：快速反馈循环

**黄金法则**：反馈越快，修正成本越低

| 层级 | 反馈时间 | 成本 | 适用场景 |
|-----|---------|-----|---------|
| 本地 lint | < 1 秒 | 最低 | 语法错误、格式问题 |
| 本地测试 | < 10 秒 | 低 | 单元测试 |
| CI lint | < 1 分钟 | 中 | 完整 lint 检查 |
| CI 测试 | < 5 分钟 | 高 | 完整测试套件 |
| 部署后监控 | 实时 | 最高 | 生产环境问题 |

**实现策略**：
```bash
# package.json - 优化脚本顺序
{
  "scripts": {
    "lint": "eslint src/ --cache",           # 使用缓存加速
    "test": "vitest run",                    # 并行测试
    "test:watch": "vitest",                  # 开发时实时测试
    "check": "npm run lint && npm run test"  # 完整检查
  }
}
```

### 原则三：失败即阻止

**关键规则**：任何自动化检查失败，都必须**阻止合并**。

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  # ❌ 错误做法：所有任务都运行，最后汇总结果
  check-all:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint || true  # 忽略失败
      - run: npm test || true      # 忽略失败
      - run: echo "检查完成"
  
  # ✅ 正确做法：任何失败都阻止合并
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint  # 失败则整个 job 失败
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test  # 失败则整个 job 失败
      
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]  # 依赖前面的任务
    steps:
      - run: npm run build
```

### 原则四：测试即规范

测试不仅是验证工具，更是**可执行的规范文档**。

```typescript
// tests/architecture-layers.spec.ts
// 用测试表达架构约束

import { describe, it, expect } from 'vitest';
import { analyzeDependencyGraph } from '../src/linter/dependency-analyzer';

describe('Architecture Layer Rules', () => {
  const dependencyGraph = analyzeDependencyGraph('src/');

  describe('Layer Dependency Direction', () => {
    it('types layer should have no dependencies', () => {
      const typesDeps = dependencyGraph.getDependencies('types/');
      expect(typesDeps).toHaveLength(0);
    });

    it('config layer can only depend on types', () => {
      const configDeps = dependencyGraph.getDependencies('config/');
      expect(configDeps).every(dep => dep.startsWith('types/'));
    });

    it('service layer cannot depend on ui', () => {
      const serviceFiles = dependencyGraph.getFiles('service/');
      const hasUiDep = serviceFiles.some(f => 
        dependencyGraph.getDependencies(f).some(d => d.startsWith('ui/'))
      );
      expect(hasUiDep).toBe(false);
    });
  });

  describe('No Circular Dependencies', () => {
    it('should detect circular dependency between service A and B', () => {
      const graph = new DependencyGraph();
      graph.addEdge('service/a.ts', 'service/b.ts');
      graph.addEdge('service/b.ts', 'service/a.ts');
      
      const cycles = graph.detectCycles();
      expect(cycles).toContainEqual(['service/a.ts', 'service/b.ts', 'service/a.ts']);
    });
  });
});
```

### 原则五：自定义 Linter 作为"架构警察"

#### 场景 1：禁止跨层调用

```typescript
// src/linter/rules/no-cross-layer.ts
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

export const noCrossLayer = ESLintUtils.RuleCreator(
  (name) => `https://example.com/docs/${name}`
)({
  name: 'no-cross-layer',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止跨层调用（如 ui 直接调用 repo）',
    },
    schema: [],
    messages: {
      invalidLayerAccess: 
        'Layer "{{from}}" cannot directly access layer "{{to}}". ' +
        'Use service layer as intermediary.',
    },
  },
  defaultOptions: [],
  create(context) {
    const layerRules = {
      'ui': ['types', 'config', 'service'],
      'runtime': ['types', 'config', 'service', 'repo'],
      'service': ['types', 'config', 'repo'],
      'repo': ['types', 'config'],
      'config': ['types'],
      'types': [],
    };

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const currentFile = context.getFilename();
        const importPath = node.source.value;
        
        const fromLayer = extractLayer(currentFile);
        const toLayer = extractLayer(importPath);
        
        const allowedLayers = layerRules[fromLayer] || [];
        if (!allowedLayers.includes(toLayer)) {
          context.report({
            node,
            messageId: 'invalidLayerAccess',
            data: { from: fromLayer, to: toLayer },
          });
        }
      },
    };
  },
});

function extractLayer(filePath: string): string {
  const match = filePath.match(/src\/([^/]+)\//);
  return match ? match[1] : 'unknown';
}
```

#### 场景 2：强制错误处理

```typescript
// src/linter/rules/require-error-handling.ts
export const requireErrorHandling = {
  meta: {
    type: 'problem',
    docs: {
      description: '所有 Promise 必须有错误处理',
    },
    schema: [],
    messages: {
      missingErrorHandler: 'Promise must have error handler (.catch or try/catch)',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (isPromiseCall(node)) {
          const parent = node.parent;
          
          // 检查是否有 .catch()
          if (parent.type === 'CallExpression' && parent.callee.name === 'catch') {
            return; // 有错误处理
          }
          
          // 检查是否在 async 函数中（由外层处理）
          if (isInAsyncFunction(node)) {
            return;
          }
          
          // 检查是否有 try/catch
          if (isInTryCatch(node)) {
            return;
          }
          
          context.report({
            node,
            messageId: 'missingErrorHandler',
          });
        }
      },
    };
  },
};
```

### 原则六：CI 配置作为"最终仲裁者"

```yaml
# .github/workflows/enforcement.yml
name: Mechanical Enforcement

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

# 并行执行所有检查
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # 1. 快速检查（先运行，快速失败）
  fast-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline
      
      - name: Check for TODOs
        run: |
          if grep -r "TODO(" src/ --include="*.ts" --include="*.tsx"; then
            echo "::error::TODO comments must be resolved before merge"
            exit 1
          fi
      
      - name: Check for debug statements
        run: |
          if grep -r "console\.log\|debugger" src/ --include="*.ts" --include="*.tsx" | grep -v ".test."; then
            echo "::error::Debug statements must be removed"
            exit 1
          fi

  # 2. Lint 检查
  lint:
    runs-on: ubuntu-latest
    needs: fast-check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint -- --max-warnings=0  # 警告也视为失败
      
      - name: Check custom rules
        run: npm run lint:custom  # 自定义架构规则

  # 3. 类型检查
  type-check:
    runs-on: ubuntu-latest
    needs: fast-check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx tsc --noEmit  # 严格类型检查

  # 4. 测试
  test:
    runs-on: ubuntu-latest
    needs: [fast-check, lint, type-check]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test -- --coverage
      
      - name: Check coverage
        run: |
          COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "::error::Test coverage must be >= 80% (current: ${COVERAGE}%)"
            exit 1
          fi
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # 5. 构建
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  # 6. 安全扫描
  security:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --all-projects

  # 7. 依赖检查
  deps:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      
      - name: Check for outdated dependencies
        run: npx npm-check-updates -u && npm install
      
      - name: Check for vulnerabilities
        run: npm audit --audit-level=moderate
```

---

## 🚨 反例警示

### 错误案例 1：CI 失败但继续合并

**场景**：
```yaml
# ❌ 错误配置
jobs:
  test:
    steps:
      - run: npm test || true  # 忽略失败
```

**后果**：
- 测试失败但 PR 被合并
- 生产环境出现 bug
- 紧急回滚，损失 2 小时

**教训**：任何检查失败都必须阻止合并

### 错误案例 2：测试覆盖率不达标

**场景**：
- 团队设定目标：覆盖率 > 80%
- 但没有在 CI 中强制执行
- 逐渐降至 60%、50%、40%
- 最终测试形同虚设

**后果**：
- 智能体生成的代码没有测试保护
- 错误无法被及时发现
- 系统变得不可靠

**教训**：覆盖率必须作为 CI 的硬性门槛

### 错误案例 3：本地通过但 CI 失败

**场景**：
- 开发者本地运行 `npm test` 通过
- 提交后 CI 失败
- 原因是：本地使用了 `NODE_ENV=test`，CI 使用 `NODE_ENV=production`

**后果**：
- PR 被阻塞
- 紧急修复，浪费时间
- 开发者对 CI 失去信任

**教训**：本地和 CI 的环境必须一致

---

## 🔧 可复制的配置片段

### 1. 预提交钩子（pre-commit）

```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "🔍 Running pre-commit checks..."

# 1. 快速 lint
echo "  → Linting staged files..."
npx eslint --fix $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$') || true

# 2. 类型检查
echo "  → Type checking..."
npx tsc --noEmit --skipLibCheck

# 3. 运行 staged 文件的测试
echo "  → Running tests..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')
if [ -n "$STAGED_FILES" ]; then
  npx vitest run $STAGED_FILES
fi

# 4. 检查 TODO
echo "  → Checking for TODOs..."
if grep -r "TODO(" --cached --include='*.ts' --include='*.tsx'; then
  echo "❌ TODO comments must be resolved"
  exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
```

### 2. Makefile 快捷命令

```makefile
# Makefile

.PHONY: lint test build check clean

lint:
	@echo "🔍 Running linter..."
	npx eslint src/ --ext .ts,.tsx --max-warnings=0

lint:fix:
	@echo "🔧 Fixing lint issues..."
	npx eslint src/ --ext .ts,.tsx --fix

test:
	@echo "🧪 Running tests..."
	npx vitest run

test:watch:
	@echo "👀 Watching tests..."
	npx vitest

test:coverage:
	@echo "📊 Generating coverage report..."
	npx vitest run --coverage
	@echo "Open coverage/lcov-report/index.html in browser"

type-check:
	@echo "📝 Type checking..."
	npx tsc --noEmit

build:
	@echo "🏗️ Building..."
	npx tsc
	npx vite build

check: lint test type-check
	@echo "✅ All checks passed"

clean:
	rm -rf node_modules dist .eslintcache coverage

# 开发模式：自动重试失败测试
test:retry:
	npx vitest run --bail=1 --retry=3

# 快速检查（仅 lint + 类型）
check:fast: lint type-check
	@echo "✅ Fast checks passed"
```

### 3. ESLint 自定义规则配置

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'custom'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // 强制规则
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    
    // 自定义规则
    'custom/no-cross-layer': 'error',
    'custom/require-error-handling': 'error',
    'custom/no-todo': 'warn',
    'custom/require-docs': ['error', { files: ['service/', 'repo/'] }],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        'custom/require-docs': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
```

### 4. Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'dist/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    // 并行执行
    pool: 'threads',
    // 失败重试
    retry: 1,
    // 超时设置
    testTimeout: 10000,
  },
});
```

---

## 📚 参考链接

### 原文

- **OpenAI Harness Engineering**: [Harnessing Codex in an Agent-First World](https://openai.com/index/harness-engineering/)

### 工具文档

1. **ESLint**: [Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
2. **Vitest**: [Coverage Configuration](https://vitest.dev/guide/coverage.html)
3. **GitHub Actions**: [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
4. **pre-commit**: [Hook Configuration](https://pre-commit.com/#configuration)

### 延伸阅读

- [01-repo-as-source-of-truth.md](./01-repo-as-source-of-truth.md) - 代码库即真理
- [03-entropy-and-garbage-collection.md](./03-entropy-and-garbage-collection.md) - 熵增与垃圾回收

---

## ✅ 检查清单

机械化执行就绪检查：

- [ ] 预提交钩子已配置（`.git/hooks/pre-commit`）
- [ ] ESLint 配置包含所有规则（`.eslintrc.js`）
- [ ] CI 流水线已配置（`.github/workflows/ci.yml`）
- [ ] 测试覆盖率门槛已设置（≥ 80%）
- [ ] 任何检查失败都会阻止合并
- [ ] 本地和 CI 环境一致
- [ ] 自定义 linter 规则已实现（至少 1 个）
- [ ] 有快速检查命令（`make check:fast`）
- [ ] 有完整检查命令（`make check`）

---

> **记住**：如果机器不能验证，那它就不存在。机械化执行不是"可选优化"，而是 Harness Engineering 的**核心基石**。
