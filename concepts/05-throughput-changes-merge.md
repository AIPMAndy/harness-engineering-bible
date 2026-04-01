# 05-throughput-changes-merge.md - 吞吐量优先合并

> **核心定义**：PR 生命周期要短（目标<1 小时），偶发失败通过重跑解决，人类只审查"关键变更"，建立"信任但验证"的文化。

---

## 🎯 为什么重要

### 背景

在 Harness Engineering 范式中，智能体的代码生成速度远超人类审查能力：

**数据对比**：
- 智能体生成速度：~100 行代码/分钟
- 人类审查速度：~10 行代码/分钟（高质量审查）
- **速度差**：10 倍

如果坚持传统的人工审查流程：
- 智能体生成 10 个 PR → 人类需要审查 10 个 PR
- 每个 PR 审查 30 分钟 → 总共 5 小时
- PR 积压 → 智能体等待 → 吞吐量下降

**核心矛盾**：
> 智能体的产出速度 > 人类的审查速度

### 传统流程的瓶颈

```
传统流程：
智能体生成 PR → 排队等待 Review → 人工审查 (30min) → 修改 (10min) → 再审查 (20min) → 合并
                                                              ↑
                                                      瓶颈：人类注意力有限
```

**问题**：
1. PR 排队时间过长（平均 2-4 小时）
2. 人类疲劳导致审查质量下降
3. 智能体等待人类，浪费算力
4. 系统整体吞吐量低

### Harness 流程的优化

```
Harness 流程：
智能体生成 PR → 机器验证 (2min) → 自动合并 (如果通过) → 人类抽查 (仅关键变更)
                                    ↑
                            瓶颈已消除：机器验证无限并行
```

**优势**：
1. PR 生命周期短（平均 10-30 分钟）
2. 机器验证标准化，质量一致
3. 智能体持续工作，无等待
4. 系统整体吞吐量提升 10 倍+

### 核心数据

OpenAI 的经验：
- 3 人团队 → 每天 10.5 个 PR（人均 3.5 个）
- 7 人团队 → 每天 49+ 个 PR（人均 7+ 个）
- **PR 平均生命周期**：从 4 小时降至 30 分钟
- **合并成功率**：95%+（通过机械化验证）
- **人工审查比例**：从 100% 降至 10%（仅关键变更）

---

## 🔨 如何落地

### 原则一：短周期 PR（<1 小时）

#### 1. 限制 PR 规模

```yaml
# .github/workflows/pr-size-check.yml
name: PR Size Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check PR size
        id: size
        uses: actions/github-script@v6
        with:
          script: |
            const pr = context.payload.pull_request;
            const changedFiles = pr.changed_files;
            const additions = pr.additions;
            const deletions = pr.deletions;
            const totalChanges = additions + deletions;
            
            // 定义 PR 大小等级
            let size = 'small';
            let maxLines = 200;
            
            if (totalChanges > 500) {
              size = 'large';
              maxLines = 500;
            } else if (totalChanges > 200) {
              size = 'medium';
              maxLines = 200;
            }
            
            // 如果超过限制，添加评论提醒
            if (totalChanges > maxLines) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: pr.number,
                body: `⚠️ This PR is **${size}** (${totalChanges} lines). Consider splitting into smaller PRs for faster review.`,
              });
              
              // 可选：自动标记为需要拆分
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: pr.number,
                labels: ['needs-split'],
              });
            }
            
            core.setOutput('size', size);
```

#### 2. 自动化拆分建议

```typescript
// scripts/pr-split-suggest.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function suggestSplit(prNumber: number) {
  const { data: pr } = await octokit.pulls.get({
    owner: 'org',
    repo: 'repo',
    pull_number: prNumber,
  });
  
  const { data: files } = await octokit.pulls.listFiles({
    owner: 'org',
    repo: 'repo',
    pull_number: prNumber,
  });
  
  // 按模块分组
  const groups = new Map<string, typeof files>();
  
  for (const file of files) {
    const module = file.filename.split('/')[1] || 'root';
    if (!groups.has(module)) {
      groups.set(module, []);
    }
    groups.get(module)!.push(file);
  }
  
  // 生成拆分建议
  const suggestions = [];
  for (const [module, files] of groups) {
    const totalLines = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
    if (totalLines > 100) {
      suggestions.push({
        module,
        files: files.map(f => f.filename),
        lines: totalLines,
      });
    }
  }
  
  // 添加评论
  if (suggestions.length > 1) {
    const body = `## 💡 Suggested Split\n\nThis PR could be split into:\n\n${suggestions
      .map(s => `- **${s.module}** (${s.lines} lines): \`${s.files.join(', ')}\``)
      .join('\n')}\n\nConsider creating separate PRs for faster merge.`;
    
    await octokit.issues.createComment({
      owner: 'org',
      repo: 'repo',
      issue_number: prNumber,
      body,
    });
  }
}
```

### 原则二：偶发失败通过重跑解决

#### 1. 自动重试机制

```yaml
# .github/workflows/ci-with-retry.yml
name: CI with Auto-Retry

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      max-parallel: 4
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      # 测试：最多重试 3 次
      - name: Run tests with retry
        uses: nick-fields/retry@v2
        with:
          timeout_minutes: 10
          max_attempts: 3
          command: npm test
      
      # 如果最终失败，生成详细报告
      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-report-${{ github.run_id }}
          path: coverage/
```

#### 2. 区分偶发失败和真实错误

```typescript
// scripts/analyze-failure.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function analyzeFailure(runId: number) {
  const { data: run } = await octokit.actions.getWorkflowRun({
    owner: 'org',
    repo: 'repo',
    run_id: runId,
  });
  
  const { data: jobs } = await octokit.actions.listJobsForWorkflowRun({
    owner: 'org',
    repo: 'repo',
    run_id: runId,
  });
  
  for (const job of jobs.jobs) {
    if (job.conclusion === 'failure') {
      const { data: steps } = await octokit.actions.listStepsForWorkflowRun({
        owner: 'org',
        repo: 'repo',
        run_id: runId,
        step_id: job.id,
      });
      
      for (const step of steps.steps) {
        if (step.conclusion === 'failure') {
          // 分析失败日志
          const { data: logs } = await octokit.actions.downloadJobLogsForWorkflowRun({
            owner: 'org',
            repo: 'repo',
            job_id: job.id,
          });
          
          const isFlaky = detectFlakyFailure(logs.text);
          
          if (isFlaky) {
            console.log(`⚠️ Job ${job.name} failed, but likely flaky. Suggest retry.`);
          } else {
            console.log(`❌ Job ${job.name} failed with real error.`);
          }
        }
      }
    }
  }
}

function detectFlakyFailure(logs: string): boolean {
  // 检测偶发失败的特征
  const flakyPatterns = [
    /timeout/i,
    /network.*error/i,
    /connection.*refused/i,
    /resource.*unavailable/i,
    /rate.*limit/i,
  ];
  
  return flakyPatterns.some(pattern => pattern.test(logs));
}
```

### 原则三：人类只审查关键变更

#### 1. 定义"关键变更"

```yaml
# .github/labeler.yml
# 自动标记 PR 类型

critical:
  - changed-files:
      - any-glob-to-any-file:
          - 'src/service/*.service.ts'  # 核心业务逻辑
          - 'src/repo/*.repo.ts'        # 数据访问层
          - 'src/config/*.config.ts'    # 配置变更
          - 'package.json'              # 依赖变更
          - '.env*'                     # 环境变量
          - 'Dockerfile'                # 容器配置

security:
  - changed-files:
      - any-glob-to-any-file:
          - 'src/auth/**/*.ts'          # 认证相关
          - 'src/permissions/**/*.ts'   # 权限相关
          - '.github/workflows/*.yml'   # CI/CD 配置

performance:
  - changed-files:
      - any-glob-to-any-file:
          - 'src/**/*.sql'              # 数据库查询
          - 'src/repo/**/*.ts'          # 数据访问
```

#### 2. 自动化审查路由

```yaml
# .github/CODEOWNERS
# 定义代码所有者

# 核心业务逻辑需要人类审查
src/service/*.service.ts @alice @bob

# 安全相关需要安全团队审查
src/auth/ @security-team

# 配置变更需要架构师审查
src/config/ @architect

# 其他自动通过
* @ai-bot  # AI 生成的代码由 AI 审查
```

#### 3. 智能审查决策

```typescript
// scripts/auto-approve.ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function autoApprove(prNumber: number) {
  const { data: pr } = await octokit.pulls.get({
    owner: 'org',
    repo: 'repo',
    pull_number: prNumber,
  });
  
  // 检查 PR 类型
  const { data: labels } = await octokit.issues.listLabelsOnIssue({
    owner: 'org',
    repo: 'repo',
    issue_number: prNumber,
  });
  
  const hasCriticalLabel = labels.some(l => l.name === 'critical');
  const hasSecurityLabel = labels.some(l => l.name === 'security');
  
  // 如果是非关键变更，自动批准
  if (!hasCriticalLabel && !hasSecurityLabel) {
    await octokit.pulls.createReview({
      owner: 'org',
      repo: 'repo',
      pull_number: prNumber,
      event: 'APPROVE',
      body: '✅ Auto-approved: Non-critical change (machine-verified)',
    });
    
    console.log(`✅ Auto-approved PR #${prNumber}`);
  } else {
    console.log(`⏳ Waiting for human review: PR #${prNumber} (critical/security change)`);
  }
}
```

### 原则四：建立"信任但验证"的文化

#### 1. 抽样审查机制

```yaml
# .github/workflows/sampling-review.yml
name: Sampling Review

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  sampling:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Random sampling
        uses: actions/github-script@v6
        with:
          script: |
            const prNumber = context.payload.workflow_run.pull_requests[0].number;
            
            // 10% 概率进行人工审查
            const sampleRate = 0.1;
            const shouldSample = Math.random() < sampleRate;
            
            if (shouldSample) {
              // 通知人类审查
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: prNumber,
                body: `🔍 **Sampling Review Required**\n\nThis PR was randomly selected for human review (${sampleRate * 100}% sampling rate).\n\nPlease verify the changes manually.`,
              });
              
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: prNumber,
                labels: ['sampling-review'],
              });
            } else {
              // 自动合并
              await github.rest.pulls.merge({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: prNumber,
                merge_method: 'squash',
              });
            }
```

#### 2. 质量监控仪表板

```typescript
// scripts/quality-dashboard.ts
interface QualityMetrics {
  totalPRs: number;
  autoMerged: number;
  humanReviewed: number;
  rejectionRate: number;
  avgMergeTime: number;
  flakyFailureRate: number;
}

async function generateQualityDashboard(): Promise<QualityMetrics> {
  const prs = await getAllPRsLastMonth();
  
  const totalPRs = prs.length;
  const autoMerged = prs.filter(p => p.autoMerged).length;
  const humanReviewed = prs.filter(p => p.humanReviewed).length;
  const rejections = prs.filter(p => p.rejected).length;
  
  const rejectionRate = rejections / totalPRs;
  const avgMergeTime = prs.reduce((sum, p) => sum + p.mergeTime, 0) / totalPRs;
  
  // 如果 rejection rate 过高，说明验证规则太松
  if (rejectionRate > 0.05) {
    console.warn('⚠️ Rejection rate is high, consider tightening validation rules');
  }
  
  // 如果 avg merge time 过长，说明流程有瓶颈
  if (avgMergeTime > 3600) { // 1 小时
    console.warn('⚠️ Average merge time is high, consider optimizing CI');
  }
  
  return {
    totalPRs,
    autoMerged,
    humanReviewed,
    rejectionRate,
    avgMergeTime,
    flakyFailureRate: await calculateFlakyRate(),
  };
}
```

### 原则五：自动化合并策略

#### 1. 智能合并队列

```yaml
# .github/workflows/merge-queue.yml
name: Merge Queue

on:
  pull_request:
    types: [labeled]

jobs:
  add-to-queue:
    if: contains(github.event.label.name, 'ready-to-merge')
    runs-on: ubuntu-latest
    steps:
      - name: Add to merge queue
        uses: actions/github-script@v6
        with:
          script: |
            const prNumber = context.payload.pull_request.number;
            
            // 检查所有 CI 是否通过
            const { data: runs } = await github.rest.actions.listWorkflowRunsForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              event: 'pull_request',
              head_branch: context.payload.pull_request.head.ref,
            });
            
            const latestRun = runs.workflow_runs[0];
            const ciPassed = latestRun.conclusion === 'success';
            
            if (ciPassed) {
              // 添加到合并队列
              await github.rest.pulls.merge({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: prNumber,
                merge_method: 'squash',
              });
              
              console.log(`✅ Merged PR #${prNumber}`);
            } else {
              console.log(`⏳ Waiting for CI to pass for PR #${prNumber}`);
            }
```

#### 2. 批量合并优化

```typescript
// scripts/batch-merge.ts
async function batchMerge(prs: number[]) {
  // 获取所有 PR 的变更
  const changes = await Promise.all(
    prs.map(pr => getPullRequestChanges(pr))
  );
  
  // 检测冲突
  const conflicts = detectConflicts(changes);
  
  if (conflicts.length > 0) {
    console.log('⚠️ Conflicts detected, merging in order:', conflicts);
    
    // 按顺序合并（避免冲突）
    for (const pr of conflicts) {
      await mergePullRequest(pr);
      await waitForMerge(pr); // 等待合并完成
    }
  } else {
    // 无冲突，批量合并
    await Promise.all(prs.map(mergePullRequest));
  }
}
```

---

## 🚨 反例警示

### 错误案例 1：坚持 100% 人工审查

**场景**：
- 团队设定规则：所有 PR 必须人工审查
- 智能体每天生成 50 个 PR
- 人类审查速度：10 个 PR/天
- **结果**：PR 积压 40 个，平均等待 4 天

**后果**：
- 智能体等待人类，浪费算力
- 代码延迟上线
- 团队感到沮丧

**教训**：非关键变更应该自动合并

### 错误案例 2：偶发失败阻塞合并

**场景**：
- CI 测试偶尔失败（网络问题、超时）
- PR 被阻塞，需要手动重跑
- 每天发生 5-10 次
- 每次阻塞 30 分钟

**后果**：
- 合并流程频繁中断
- 人类需要不断干预
- 效率下降

**教训**：偶发失败应该自动重试

### 错误案例 3：PR 规模过大

**场景**：
- 智能体一次性生成 2000 行代码的 PR
- 人类无法在合理时间内审查
- PR 积压 2 天
- 最终只能部分接受

**后果**：
- 浪费算力（部分代码被拒绝）
- 审查质量下降
- 代码质量参差不齐

**教训**：限制 PR 规模，小步快跑

---

## 🔧 可复制的配置片段

### 1. GitHub Actions 配置

```yaml
# .github/workflows/fast-merge.yml
name: Fast Merge

on:
  pull_request:
    branches: [main]

jobs:
  # 1. 快速验证
  fast-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint -- --max-warnings=0
      - run: npm test -- --bail

  # 2. 检查 PR 大小
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            const pr = context.payload.pull_request;
            if (pr.additions + pr.deletions > 500) {
              core.setFailed('PR too large (>500 lines)');
            }

  # 3. 自动批准（非关键变更）
  auto-approve:
    needs: [fast-check, check-size]
    runs-on: ubuntu-latest
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'critical') }}
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            await github.rest.pulls.createReview({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number,
              event: 'APPROVE',
              body: '✅ Auto-approved',
            });

  # 4. 自动合并
  auto-merge:
    needs: [auto-approve]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@6
        with:
          script: |
            await github.rest.pulls.merge({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number,
              merge_method: 'squash',
            });
```

### 2. PR 模板

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->
## Type of Change
- [ ] 🐞 Bug fix
- [ ] ✨ New feature
- [ ] 🔄 Refactor
- [ ] 📝 Documentation
- [ ] 🗑️ Cleanup

## Changes
<!-- Brief description of what this PR does -->

## Verification
<!-- Checklist for machine verification -->
- [ ] ✅ Lint passed
- [ ] ✅ Tests passed
- [ ] ✅ Type check passed
- [ ] ✅ Build passed

## Review Required
- [ ] No (auto-approve if all checks pass)
- [ ] Yes (critical change)
- [ ] Yes (security change)

## Sampling
- [ ] Randomly selected for human review (10% rate)
```

### 3. Makefile 命令

```makefile
.PHONY: pr:create pr:check pr:merge pr:queue

pr:create:
	@echo "📝 Creating PR..."
	@git push origin HEAD
	@gh pr create --title "feat: $(shell git log -1 --pretty=%s)" \
	              --body-file .github/PULL_REQUEST_TEMPLATE.md

pr:check:
	@echo "🔍 Running PR checks..."
	@npm run lint
	@npm test
	@npm run type-check

pr:merge:
	@echo "🔀 Merging PR..."
	@gh pr merge --squash --admin

pr:queue:
	@echo "📋 Adding to merge queue..."
	@gh pr ready $(PR_NUMBER)
	@gh pr merge --queue $(PR_NUMBER)
```

---

## 📚 参考链接

### 原文

- **OpenAI Harness Engineering**: [Harnessing Codex in an Agent-First World](https://openai.com/index/harness-engineering/)

### 延伸阅读

1. **GitHub Actions**: [Workflow Syntax](https://docs.github.com/en/actions/using-workflows)
2. **CI/CD Best Practices**: [CircleCI Best Practices](https://circleci.com/blog/ci-cd-best-practices/)
3. **Merge Queue**: [GitHub Merge Queue](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue)

### 相关概念

- [01-repo-as-source-of-truth.md](./01-repo-as-source-of-truth.md) - 代码库即真理
- [02-mechanical-enforcement.md](./02-mechanical-enforcement.md) - 机械化执行

---

## ✅ 检查清单

吞吐量优化就绪检查：

- [ ] PR 大小限制已配置（<500 行）
- [ ] 自动重试机制已实现（最多 3 次）
- [ ] 关键变更定义已明确（labels）
- [ ] 自动批准规则已配置（非关键变更）
- [ ] 抽样审查机制已建立（10% 率）
- [ ] 质量监控仪表板已创建
- [ ] 合并队列已配置
- [ ] PR 模板已更新
- [ ] 人类审查比例已降至 <10%

---

## 📊 整体项目进度

### 概念文档（Phase 1）✅ 完成

- [x] `00-overview.md` - 六大核心概念总览
- [x] `01-repo-as-source-of-truth.md` - 代码库即真理
- [x] `02-mechanical-enforcement.md` - 机械化执行
- [x] `03-entropy-and-garbage-collection.md` - 熵增与垃圾回收
- [x] `04-agent-readability.md` - 智能体可读性
- [x] `05-throughput-changes-merge.md` - 吞吐量优先合并

**总计**：6 个概念文档，约 76KB，平均每篇 12KB+

### 下一步

Phase 2: 创建实战案例（`practice/` 目录）
- Hello World Agent（5 分钟项目）
- Micro-SaaS Boilerplate（1-2 小时项目）
- Legacy Refactor（4+ 小时项目）

---

> **记住**：吞吐量是 Harness Engineering 的核心指标。如果 PR 生命周期超过 1 小时，说明你的流程有问题。目标是：**机器验证 → 自动合并 → 人类抽查**。
