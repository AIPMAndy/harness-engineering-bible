# 03-entropy-and-garbage-collection.md - 熵增与垃圾回收

> **核心定义**：任何系统都会自然熵增（变得混乱），必须建立定期的"垃圾回收"机制，主动清理过期配置、僵尸代码和失效规则。

---

## 🎯 为什么重要

### 背景

在 Harness Engineering 范式中，智能体是主要的代码生产者。这带来了新的问题：

**传统开发**：
- 人类写代码 → 人类理解 → 人类维护
- 代码量增长慢，可人工管理

**Harness 开发**：
- 智能体写代码 → 机器验证 → 人类审查例外
- 代码量爆炸式增长（3 人团队 → 100 万行/5 个月）
- 规则、配置、临时方案大量堆积

**如果不主动清理**：
- 系统逐渐变成"技术债务黑洞"
- 新代码必须绕过旧规则
- 最终系统崩溃，无法维护

### 热力学第二定律在软件工程中的体现

> **封闭系统的熵总是趋向增加**

软件系统也是"封闭系统"：
- 每次修改都增加复杂性
- 每次临时方案都增加熵
- 每次"先这样吧"都增加技术债务

**唯一对抗熵增的方式**：主动输入能量（清理、重构、删除）

### 痛点

#### 1. 规则会失效

**场景**：
```typescript
// 2024-01: 添加规则禁止使用 moment
// linter/rules/no-moment.ts
export const noMoment = {
  meta: {
    message: 'Use date-fns instead of moment',
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'moment') {
          context.report({ node, messageId: 'noMoment' });
        }
      },
    };
  },
};
```

**2025-01**：项目迁移到 `dayjs`，但规则没更新
- 新代码用 `dayjs`，但 lint 报错说要用 `date-fns`
- 开发者忽略规则
- 规则失去威信

**教训**：规则需要定期审查和更新

#### 2. 临时方案变成永久代码

**场景**：
```typescript
// 2024-06: 临时修复 API 兼容性问题
// src/service/user.service.ts
async function getUser(id: string) {
  // TODO: Remove this hack when API is fixed
  const user = await api.getUser(id);
  if (!user.name) {
    user.name = 'Unknown'; // Temporary workaround
  }
  return user;
}
```

**2025-06**：API 已修复，但 workaround 还在
- 新开发者不知道这是临时方案
- 继续依赖这个行为
- 代码变得难以理解

**教训**：临时方案必须有明确的"过期时间"和清理机制

#### 3. 配置堆积如山

**场景**：
```yaml
# .github/workflows/
├── ci.yml          # 主 CI
├── deploy.yml      # 部署
├── backup.yml      # 备份（已废弃）
├── test-old.yml    # 旧测试（已废弃）
├── lint-v1.yml     # 旧 lint（已废弃）
├── security-scan.yml
└── performance.yml
```

**问题**：
- 开发者不知道哪些是活跃的
- 新 PR 触发了废弃的 workflow
- CI 时间变长，浪费资源

**教训**：定期清理废弃配置

### 核心数据

OpenAI 的经验：
- 5 个月 → 100 万行代码
- **每周**运行一次"垃圾回收"
- 每次清理 **5-10%** 的代码
- 清理后 CI 速度提升 **20%**

---

## 🔨 如何落地

### 原则一：建立"过期时间"机制

所有临时方案、workaround、实验性代码必须有明确的过期时间。

#### 实现 1：TODO 注释规范

```typescript
// ❌ 错误：没有过期时间
// TODO: Fix this later

// ✅ 正确：有明确过期时间和负责人
// TODO(@alice): Remove workaround when API v2 is released
// DEPRECATED: 2024-06-01
// EXPIRES: 2024-12-01
// ISSUE: https://github.com/org/repo/issues/123
async function getUser(id: string) {
  const user = await api.getUser(id);
  if (!user.name) {
    user.name = 'Unknown';
  }
  return user;
}
```

#### 实现 2：自动检测过期 TODO

```typescript
// src/linter/rules/expire-todo.ts
import { ESLintUtils } from '@typescript-eslint/utils';

export const expireTodo = ESLintUtils.RuleCreator(
  (name) => `https://example.com/docs/${name}`
)({
  name: 'expire-todo',
  meta: {
    type: 'problem',
    docs: {
      description: 'TODO 注释必须包含过期时间',
    },
    schema: [],
    messages: {
      missingExpiry: 'TODO must have EXPIRES date (format: YYYY-MM-DD)',
      expired: 'TODO expired on {{date}}, please remove or extend',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Comment(node) {
        const text = node.value;
        
        // 检测 TODO 注释
        if (text.match(/TODO/)) {
          const expiryMatch = text.match(/EXPIRES:\s*(\d{4}-\d{2}-\d{2})/);
          
          if (!expiryMatch) {
            context.report({
              node,
              messageId: 'missingExpiry',
            });
            return;
          }
          
          // 检查是否过期
          const expiryDate = new Date(expiryMatch[1]);
          const today = new Date();
          
          if (expiryDate < today) {
            context.report({
              node,
              messageId: 'expired',
              data: { date: expiryMatch[1] },
            });
          }
        }
      },
    };
  },
});
```

### 原则二：自动化垃圾回收脚本

#### 脚本 1：检测僵尸代码

```bash
#!/bin/bash
# scripts/gc/zombie-code.sh

echo "🗑️  Running zombie code garbage collection..."

# 1. 检测未使用的导出
echo "  → Checking unused exports..."
npx ts-unused-exports tsconfig.json --ignoreFiles=\.test\. --showLineNumber

# 2. 检测死代码（未被调用的函数）
echo "  → Checking dead code..."
npx depcheck --ignores="@testing-library/*"

# 3. 检测超过 90 天未修改的文件
echo "  → Checking stale files (>90 days)..."
find src/ -type f -name "*.ts" -not -name "*.test.ts" -mtime +90 -exec ls -la {} \;

# 4. 检测 TODO 过期
echo "  → Checking expired TODOs..."
grep -r "TODO" src/ --include="*.ts" | while read line; do
  file=$(echo $line | cut -d: -f1)
  expiry=$(grep -A2 "TODO" "$file" | grep "EXPIRES" | cut -d: -f2)
  if [ -n "$expiry" ]; then
    expiry_date=$(echo $expiry | tr -d ' ')
    if [ $(date -d "$expiry_date" +%s) -lt $(date +%s) ]; then
      echo "  ⚠️  Expired TODO in $file: $expiry"
    fi
  fi
done

echo "✅ Zombie code scan complete"
```

#### 脚本 2：清理废弃配置

```bash
#!/bin/bash
# scripts/gc/cleanup-config.sh

echo "🗑️  Running config garbage collection..."

# 1. 检测未使用的 GitHub Actions
echo "  → Checking unused workflows..."
for workflow in .github/workflows/*.yml; do
  name=$(basename $workflow)
  # 检查过去 30 天是否有运行记录
  if ! gh run list --workflow $name --limit 1 | grep -q "completed"; then
    echo "  ⚠️  Workflow $name has not run in 30 days"
    read -p "Delete? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      rm $workflow
      echo "  🗑️  Deleted $name"
    fi
  fi
done

# 2. 检测未使用的依赖
echo "  → Checking unused dependencies..."
npx depcheck --ignores="@types/*"

# 3. 清理 node_modules
echo "  → Cleaning node_modules..."
npx npm-check-updates -u
npm install

echo "✅ Config cleanup complete"
```

#### 脚本 3：自动化 PR 清理

```typescript
// scripts/gc/stale-pr.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function cleanStalePRs() {
  const owner = 'org';
  const repo = 'repo';
  
  // 获取所有开着的 PR
  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
  });
  
  const now = Date.now();
  const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  for (const pr of prs) {
    const updatedAt = new Date(pr.updated_at).getTime();
    const age = now - updatedAt;
    
    if (age > staleThreshold) {
      console.log(`🚩 PR #${pr.number} is stale (${Math.floor(age / staleThreshold)} weeks)`);
      
      // 添加评论提醒
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pr.number,
        body: `⚠️ This PR has been inactive for 7 days. Please update or close it.`,
      });
      
      // 如果超过 30 天，自动关闭
      if (age > 30 * 24 * 60 * 60 * 1000) {
        await octokit.pulls.update({
          owner,
          repo,
          pull_number: pr.number,
          state: 'closed',
        });
        console.log(`  🗑️  Closed PR #${pr.number}`);
      }
    }
  }
}

cleanStalePRs();
```

### 原则三：定期"技术债务看板"

#### 创建技术债务追踪系统

```markdown
<!-- docs/tech-debt.md -->
# 技术债务看板

## 高优先级（本周必须处理）

| 债务 | 影响 | 负责人 | 截止日期 | 状态 |
|-----|-----|-------|---------|-----|
| 移除 moment 依赖 | 安全漏洞 | @alice | 2024-06-15 | 🟡 进行中 |
| 重构 user.service | 性能问题 | @bob | 2024-06-20 | ⚪ 待办 |

## 中优先级（本月处理）

| 债务 | 影响 | 负责人 | 截止日期 | 状态 |
|-----|-----|-------|---------|-----|
| 统一错误处理格式 | 可维护性 | @charlie | 2024-07-01 | ⚪ 待办 |
| 删除旧 API v1 | 代码复杂度 | @alice | 2024-07-15 | ⚪ 待办 |

## 低优先级（季度处理）

| 债务 | 影响 | 负责人 | 截止日期 | 状态 |
|-----|-----|-------|---------|-----|
| 升级 TypeScript 5.0 | 新特性 | @bob | 2024-09-01 | ⚪ 待办 |
| 迁移到 Vite | 构建速度 | @charlie | 2024-09-15 | ⚪ 待办 |

## 已完成的债务

| 债务 | 完成时间 | 收益 |
|-----|---------|-----|
| 移除 lodash | 2024-05-01 | 减少 50KB 包体积 |
| 统一日志格式 | 2024-05-15 | 日志查询速度提升 30% |
```

#### 自动化更新看板

```bash
#!/bin/bash
# scripts/gc/update-tech-debt.sh

echo "📊 Updating tech debt dashboard..."

# 1. 统计 TODO 数量
TODO_COUNT=$(grep -r "TODO" src/ --include="*.ts" | wc -l)
echo "  → Total TODOs: $TODO_COUNT"

# 2. 统计过期 TODO
EXPIRED_TODO=$(grep -r "TODO" src/ --include="*.ts" -A2 | grep "EXPIRES" | while read line; do
  expiry=$(echo $line | cut -d: -f2 | tr -d ' ')
  if [ $(date -d "$expiry" +%s) -lt $(date +%s) ]; then
    echo "expired"
  fi
done | wc -l)
echo "  → Expired TODOs: $EXPIRED_TODO"

# 3. 统计未测试的文件
UNTESTED=$(find src/ -name "*.ts" -not -name "*.test.ts" | while read file; do
  basename=$(basename $file .ts)
  if [ ! -f "tests/${basename}.test.ts" ]; then
    echo $file
  fi
done | wc -l)
echo "  → Untested files: $UNTESTED"

# 4. 生成报告
cat > reports/tech-debt-report.md << EOF
# 技术债务报告
生成时间：$(date)

## 统计
- TODO 总数：$TODO_COUNT
- 过期 TODO: $EXPIRED_TODO
- 未测试文件：$UNTESTED

## 建议
$(if [ $EXPIRED_TODO -gt 0 ]; then echo "- 立即清理 $EXPIRED_TODO 个过期 TODO"; fi)
$(if [ $UNTESTED -gt 10 ]; then echo "- 优先为关键文件添加测试"; fi)
EOF

echo "✅ Tech debt report generated: reports/tech-debt-report.md"
```

### 原则四：每周"垃圾回收日"

#### 自动化调度

```yaml
# .github/workflows/gc-weekly.yml
name: Weekly Garbage Collection

on:
  schedule:
    # 每周一早上 9 点运行
    - cron: '0 9 * * 1'
  workflow_dispatch:  # 支持手动触发

jobs:
  gc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      # 1. 检测僵尸代码
      - name: Scan zombie code
        run: npm run gc:scan
      
      # 2. 生成报告
      - name: Generate GC report
        run: npm run gc:report
      
      # 3. 创建 PR（如果有需要清理的）
      - name: Create GC PR
        if: steps.scan.outputs.has-zombies == 'true'
        uses: peter-evans/create-pull-request@v5
        with:
          title: '🗑️ GC: Clean up zombie code and expired configs'
          body: |
            ## 垃圾回收报告
            
            本周检测到以下需要清理的内容：
            
            - TODO: 过期 TODO 列表
            - ZOMBIE: 僵尸代码列表
            - STALE: 长期未修改的文件
            
            请审查并决定是否需要清理。
          branch: gc/cleanup-${{ github.run_id }}
          base: main
          labels: 'maintenance,gc'
      
      # 4. 发送通知
      - name: Notify team
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🗑️ Weekly GC completed: ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Weekly Garbage Collection*\nStatus: ${{ job.status }}\nSee reports for details."
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### 手动执行脚本

```bash
#!/bin/bash
# scripts/gc/manual-gc.sh

echo "🗑️  Manual Garbage Collection"
echo "================================"
echo ""

# 1. 扫描
echo "Step 1/4: Scanning for issues..."
npm run gc:scan

# 2. 显示报告
echo ""
echo "Step 2/4: Review the report..."
cat reports/tech-debt-report.md

# 3. 询问清理
echo ""
echo "Step 3/4: What would you like to clean?"
echo "  1) Remove expired TODOs"
echo "  2) Remove unused dependencies"
echo "  3) Remove stale files"
echo "  4) All of the above"
read -p "Choose (1-4): " choice

case $choice in
  1) npm run gc:clean-todos ;;
  2) npm run gc:clean-deps ;;
  3) npm run gc:clean-stale ;;
  4) npm run gc:clean-all ;;
  *) echo "Cancelled" ;;
esac

# 4. 创建 PR
echo ""
echo "Step 4/4: Create a PR for review?"
read -p "Create PR? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git add -A
  git commit -m "🗑️ GC: Clean up $(date +%Y-%m-%d)"
  git push -u origin HEAD:gc/cleanup-$(date +%Y%m%d)
  gh pr create --title "🗑️ GC: Cleanup $(date +%Y-%m-%d)" \
               --body "Automated garbage collection" \
               --label "maintenance,gc"
  echo "✅ PR created"
fi
```

### 原则五：预防熵增的架构设计

#### 1. 模块化边界

```typescript
// src/modules/user/module.ts
/**
 * User Module
 * 
 * 边界规则：
 * - 只能从外部导入 types/ 和 config/
 * - 其他模块必须通过 public API 访问
 * - 禁止跨模块直接调用
 */

// 公共 API（外部可访问）
export { UserService } from './service/user.service';
export { UserRepository } from './repo/user.repo';
export * from './types';

// 内部实现（外部不可访问）
// 不导出以下内容
// - internal/
// - utils/
// - helpers/
```

#### 2. 版本化配置

```yaml
# .config/version.yml
# 配置文件版本管理

version: 2024.6  # YYYY.M format

deprecated:
  - name: legacy-auth.ts
    deprecated: 2024.3
    removed: 2024.9
    replacement: auth-v2.ts
    
  - name: old-api-client.ts
    deprecated: 2024.4
    removed: 2024.10
    replacement: api-client-v2.ts

active:
  - name: auth-v2.ts
    since: 2024.3
    stable: true
    
  - name: api-client-v2.ts
    since: 2024.4
    stable: true
```

#### 3. 自动过期检测

```typescript
// src/linter/rules/config-expiry.ts
export const configExpiry = {
  create(context) {
    return {
      Program(node) {
        const configFile = readConfig('version.yml');
        const currentVersion = configFile.version;
        
        for (const item of configFile.deprecated) {
          const removedVersion = parseVersion(item.removed);
          if (currentVersion >= removedVersion) {
            // 检查文件是否还存在
            if (fileExists(item.name)) {
              context.report({
                node,
                message: `Deprecated file ${item.name} should be removed (removed in ${item.removed})`,
              });
            }
          }
        }
      },
    };
  },
};
```

---

## 🚨 反例警示

### 错误案例 1：忽略过期 TODO

**场景**：
```typescript
// TODO: Remove this when API is fixed (EXPIRES: 2024-01-01)
// 现在是 2025-06，但代码还在
if (!user.name) {
  user.name = 'Unknown';
}
```

**后果**：
- 新开发者以为这是故意的设计
- 继续依赖这个行为
- API 修复后，代码反而出错

**教训**：过期 TODO 必须自动检测并强制清理

### 错误案例 2：配置只增不减

**场景**：
- 2023: 添加 5 个 GitHub Actions workflow
- 2024: 添加 8 个，删除 1 个
- 2025: 添加 10 个，删除 0 个
- **结果**：30 个 workflow，其中 15 个已废弃

**后果**：
- CI 时间从 2 分钟增加到 10 分钟
- 开发者开始跳过某些检查
- 系统可靠性下降

**教训**：每添加一个配置，必须考虑何时删除

### 错误案例 3：临时方案变成永久

**场景**：
```typescript
// 2023-06: 临时修复
if (process.env.NODE_ENV === 'test') {
  mockDatabase();
}

// 2025-06: 还在，但测试环境已改变
// 新测试框架不使用 NODE_ENV
// 但旧代码还在，导致真实数据库被调用
```

**后果**：
- 测试污染生产数据
- 数据损坏，需要恢复
- 损失 4 小时

**教训**：临时方案必须有明确的"拆除计划"

---

## 🔧 可复制的配置片段

### 1. npm scripts

```json
{
  "scripts": {
    "gc:scan": "ts-node scripts/gc/scan.ts",
    "gc:report": "ts-node scripts/gc/report.ts",
    "gc:clean-todos": "ts-node scripts/gc/clean-todos.ts",
    "gc:clean-deps": "npm uninstall $(npm run unused-deps --silent)",
    "gc:clean-stale": "ts-node scripts/gc/clean-stale.ts",
    "gc:clean-all": "npm run gc:clean-todos && npm run gc:clean-deps && npm run gc:clean-stale",
    "gc:manual": "bash scripts/gc/manual-gc.sh"
  }
}
```

### 2. Makefile 命令

```makefile
.PHONY: gc gc:scan gc:clean gc:report

gc: gc:scan gc:report
	@echo "✅ Garbage collection complete"

gc:scan:
	@echo "🗑️  Scanning for zombie code..."
	@bash scripts/gc/scan.sh

gc:report:
	@echo "📊 Generating report..."
	@bash scripts/gc/report.sh
	@cat reports/tech-debt-report.md

gc:clean:
	@echo "🧹 Cleaning up..."
	@bash scripts/gc/cleanup.sh

gc:weekly:
	@echo "📅 Running weekly GC..."
	@npm run gc:clean-all
	@npm run gc:report
	@gh pr create --title "🗑️ Weekly GC" --body "Automated cleanup"
```

### 3. ESLint 规则配置

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'custom/expire-todo': 'error',
    'custom/config-expiry': 'warn',
    'custom/no-deprecated-api': 'error',
  },
};
```

### 4. GitHub Actions 调度

```yaml
# .github/workflows/gc-weekly.yml
name: Weekly GC
on:
  schedule:
    - cron: '0 9 * * 1'  # 每周一 9 点
  workflow_dispatch:
```

---

## 📚 参考链接

### 原文

- **OpenAI Harness Engineering**: [Harnessing Codex in an Agent-First World](https://openai.com/index/harness-engineering/)

### 延伸阅读

1. **The Mythical Man-Month**: [No Silver Bullet](https://www.semanticscholar.org/paper/No-Silver-Bullet%E2%80%94Essence-and-Accidents-of-Software-Brooks/8686631c4e46a9489d1a6c0f3b6c5a8f7f0b8e0f) - 关于软件复杂性的经典论述
2. **Technical Debt Quadrant**: [Martin Fowler's Tech Debt](https://martinfowler.com/bliki/TechnicalDebt.html)
3. **Code Smells**: [Refactoring.guru - Code Smells](https://refactoring.guru/smells/code-smells)

### 相关概念

- [01-repo-as-source-of-truth.md](./01-repo-as-source-of-truth.md) - 代码库即真理
- [02-mechanical-enforcement.md](./02-mechanical-enforcement.md) - 机械化执行

---

## ✅ 检查清单

垃圾回收机制就绪检查：

- [ ] TODO 注释规范已定义（包含 EXPIRES 日期）
- [ ] 过期 TODO 自动检测规则已实现
- [ ] 僵尸代码扫描脚本已创建
- [ ] 废弃配置清理脚本已创建
- [ ] 技术债务看板已建立
- [ ] 每周 GC 自动化已配置（GitHub Actions）
- [ ] 手动 GC 脚本已创建
- [ ] 模块边界规则已定义
- [ ] 配置文件版本化已实现

---

> **记住**：熵增是自然规律，垃圾回收是唯一对抗方式。不要等到系统崩溃才开始清理，**每周都要 GC**。
