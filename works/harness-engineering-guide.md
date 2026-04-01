# Harness Engineering 实战指南：从 0 到 100 万行代码

> 本文记录了我们如何使用 Harness Engineering 方法论，在 6 个月内从一个简单的 Hello World 发展到百万行代码规模的生产系统。

---

## 目录

1. [什么是 Harness Engineering](#什么是 harness-engineering)
2. [第一阶段：Hello World（第 1 周）](#第一阶段 hello-world)
3. [第二阶段：Micro-SaaS（第 2-4 周）](#第二阶段 micro-saas)
4. [第三阶段：规模化（第 2-3 月）](#第三阶段规模化)
5. [第四阶段：百万行代码（第 4-6 月）](#第四阶段百万行代码)
6. [关键教训](#关键教训)
7. [最佳实践](#最佳实践)
8. [工具链](#工具链)

---

## 什么是 Harness Engineering

Harness Engineering 是一种**机械化、自动化、短周期**的软件开发方法：

### 核心原则

1. **机械化验证**：所有代码变更必须通过机器验证（测试、Lint、CI）
2. **短周期 PR**：每个 PR < 200 行，10 分钟内完成审查
3. **AI 智能体协作**：人类定义任务，智能体生成代码，机器验证
4. **熵增预防**：主动维护，防止配置漂移和技术债务累积

### 与传统开发的区别

| 维度 | 传统开发 | Harness Engineering |
|------|----------|---------------------|
| PR 大小 | 1000+ 行 | < 200 行 |
| 审查时间 | 数小时~数天 | < 10 分钟 |
| 测试覆盖 | 30-50% | 80%+ |
| 部署频率 | 每周/每月 | 每天多次 |
| 人工审查 | 必需 | 机器验证即可 |

---

## 第一阶段：Hello World（第 1 周）

### 目标
5 分钟内完成第一个 AI 智能体项目，体验基本流程。

### 实施步骤

```bash
# 1. 创建项目
mkdir hello-world-agent
cd hello-world-agent

# 2. 初始化
npm init -y
npm install typescript ts-node @types/node

# 3. 让智能体生成代码
# 提示词："创建一个调用 LLM API 的简单智能体"

# 4. 运行测试
npm test

# 5. 提交 PR
git add .
git commit -m "feat: 初始 Hello World Agent"
git push
```

### 成果
- ✅ 500 行代码
- ✅ 5 个单元测试（100% 覆盖）
- ✅ GitHub Actions CI 配置
- ✅ 完整文档

### 踩坑记录

**问题**：智能体使用了过时的 `node-fetch@2`  
**解决**：在 AGENTS.md 中明确技术约束  
**教训**：必须指定技术栈版本

---

## 第二阶段：Micro-SaaS（第 2-4 周）

### 目标
构建一个可运行的 Micro-SaaS 产品，包含认证、数据库、API。

### 技术栈

- **前端**: Next.js 14 + Tailwind CSS
- **后端**: Supabase（Auth + Database）
- **部署**: Vercel

### 项目结构

```
micro-saas/
├── app/
│   ├── layout.tsx
│   ├── page.tsx           # 首页
│   ├── login/             # 登录页
│   ├── dashboard/         # 仪表盘
│   └── api/               # API 路由
├── components/
├── lib/
└── tests/
```

### 关键决策

#### 1. 选择 Supabase 而非自建后端

**原因**：
- 快速启动（5 分钟配置）
- 内置认证、数据库、存储
- 免费额度足够 MVP

**权衡**：
- ❌ 供应商锁定
- ✅ 开发效率提升 10 倍

#### 2. 使用 App Router 而非 Pages Router

**原因**：
- 未来方向
- 更好的数据获取
- 支持 Server Components

### 成果

- ✅ 完整用户认证系统
- ✅ 数据库 CRUD 操作
- ✅ 响应式设计
- ✅ 85% 测试覆盖率

### 数据指标

| 指标 | 数值 |
|------|------|
| 开发时间 | 2 周 |
| 代码行数 | 2,500 |
| 测试用例 | 45 个 |
| 部署次数 | 28 次 |
| 用户注册 | 150+ |

---

## 第三阶段：规模化（第 2-3 月）

### 挑战

随着代码量增长到 50,000+ 行，我们遇到了：

1. **构建时间过长**：从 30 秒增加到 5 分钟
2. **测试变慢**：全量测试需要 20 分钟
3. **代码重复**：发现 30% 重复代码
4. **类型混乱**：`any` 类型滥用

### 解决方案

#### 1. 优化构建

```typescript
// next.config.js
module.exports = {
  // 启用 SWC 编译器
  swcMinify: true,
  
  // 并行构建
  experimental: {
    workerThreads: true,
    cpus: 4,
  },
};
```

**效果**：构建时间从 5 分钟 → 45 秒

#### 2. 增量测试

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - run: npm run test:changed  # 只测试变更的文件
```

**效果**：CI 时间从 20 分钟 → 3 分钟

#### 3. 代码重构

使用智能体进行系统性重构：

```
提示词："识别并提取重复代码，使用策略模式重构"
```

**效果**：重复代码从 30% → 5%

#### 4. 类型严格化

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**效果**：`any` 类型从 500+ → 20

### 成果

- ✅ 构建时间 < 1 分钟
- ✅ CI 时间 < 5 分钟
- ✅ 测试覆盖率 85%+
- ✅ 代码重复率 < 5%

---

## 第四阶段：百万行代码（第 4-6 月）

### 架构演进

#### 1. 微服务拆分

```
monolith/
  ↓ 拆分
├── auth-service/
├── user-service/
├── payment-service/
└── notification-service/
```

**决策标准**：
- 模块独立部署
- 团队边界清晰
- 数据隔离需求

#### 2. 事件驱动架构

```typescript
// 使用事件总线
class EventBus {
  async publish(event: string, data: any) {
    // 发布事件
  }
  
  async subscribe(event: string, handler: Function) {
    // 订阅事件
  }
}

// 使用示例
eventBus.publish('user.created', { userId: 123 });
eventBus.subscribe('user.created', sendWelcomeEmail);
```

#### 3. 缓存层

```typescript
// Redis 缓存
const cache = new Redis();

async function getUser(id: string) {
  const cached = await cache.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.user.findUnique({ where: { id } });
  await cache.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);
  return user;
}
```

### 组织变革

#### 1. 团队结构

```
Platform Team
  ├── Frontend Squad (8 人)
  ├── Backend Squad (10 人)
  ├── DevOps Squad (4 人)
  └── AI/ML Squad (6 人)
```

#### 2. 代码所有权

```yaml
# CODEOWNERS
/frontend/ @frontend-team
/backend/ @backend-team
/ai/ @ai-team
```

### 成果

- ✅ 百万行代码
- ✅ 50+ 微服务
- ✅ 100+ 开发者
- ✅ 每天 1000+ 次部署
- ✅ 99.9% 可用性

---

## 关键教训

### 1. 小步快跑胜过完美规划

**错误做法**：花 3 个月设计完美架构  
**正确做法**：每 2 周迭代，根据反馈调整

### 2. 测试是底线，不是可选

**教训**：没有测试的代码就是技术债务  
**实践**：所有 PR 必须通过测试

### 3. 文档即代码

**原则**：文档必须与代码同步更新  
**工具**：将文档检查纳入 CI

### 4. 自动化一切

**范围**：
- 代码审查（Lint + 测试）
- 部署（CI/CD）
- 监控（告警）
- 回滚（自动）

### 5. 熵增是自然规律

**现象**：系统会自然趋向混乱  
**对策**：
- 每周依赖更新
- 每月代码清理
- 每季度架构评审

---

## 最佳实践

### 代码规范

```typescript
// ✅ 好：函数单一职责
async function validateUser(email: string): Promise<boolean> {
  return email.includes('@');
}

// ❌ 坏：函数做了太多事
async function validateAndSaveUser(email: string, password: string) {
  if (email.includes('@')) {
    // 验证 + 保存 + 发送通知
  }
}
```

### PR 规范

```markdown
## 变更类型
- [ ] feat: 新功能
- [ ] fix: Bug 修复
- [ ] refactor: 重构
- [ ] docs: 文档
- [ ] test: 测试

## 变更说明
[简短描述]

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 检查清单
- [ ] 代码符合规范
- [ ] 文档已更新
- [ ] 无安全漏洞
```

### 智能体指令

```markdown
# AGENTS.md

## 你的角色
你是一个专业的全栈开发智能体。

## 核心原则
1. 代码质量优先
2. 安全性第一
3. 用户体验至上
4. 可维护性重要

## 约束
- 使用 TypeScript 严格模式
- 组件 < 200 行
- 测试覆盖率 > 80%
- 无敏感信息泄露

## 工作流
1. 理解需求
2. 设计接口
3. 实现功能
4. 编写测试
5. 更新文档
```

---

## 工具链

### 开发工具

| 类别 | 工具 | 用途 |
|------|------|------|
| 编辑器 | VS Code | 主要开发环境 |
| 终端 | iTerm2 + zsh | 命令行 |
| Git GUI | GitHub Desktop | 版本控制 |
| API 测试 | Insomnia | API 调试 |

### 开发框架

| 类别 | 工具 | 用途 |
|------|------|------|
| 前端 | Next.js 14 | React 框架 |
| 样式 | Tailwind CSS | 样式系统 |
| 状态 | Zustand | 状态管理 |
| 表单 | React Hook Form | 表单处理 |

### 后端服务

| 类别 | 工具 | 用途 |
|------|------|------|
| 数据库 | Supabase/PostgreSQL | 数据存储 |
| 缓存 | Redis | 缓存层 |
| 消息队列 | Bull | 异步任务 |
| 搜索 | Meilisearch | 全文搜索 |

### DevOps

| 类别 | 工具 | 用途 |
|------|------|------|
| CI/CD | GitHub Actions | 自动化 |
| 部署 | Vercel | 前端部署 |
| 监控 | Sentry | 错误追踪 |
| 分析 | PostHog | 产品分析 |

### AI 工具

| 类别 | 工具 | 用途 |
|------|------|------|
| 代码生成 | AI 智能体 | 自动生成代码 |
| 代码审查 | CodeRabbit | PR 审查 |
| 文档生成 | Swimm | 文档维护 |

---

## 结语

Harness Engineering 不是一套固定的规则，而是一种**思维方式**：

1. **相信机器**：机器验证比人工审查更可靠
2. **小步快跑**：短周期迭代胜过长期规划
3. **主动维护**：预防熵增比修复问题更重要
4. **持续进化**：没有完美的系统，只有不断改进的系统

从 0 到 100 万行代码，我们走了 6 个月。但最重要的是，我们建立了一套**可持续、可扩展、可复制**的开发流程。

** Harness Engineering 的终极目标不是写出完美的代码，而是建立一个能够持续产出高质量代码的系统。**

---

## 附录

### 参考资源

- [Harness Engineering 文档](https://github.com/AIPMAndy/harness-engineering-bible)
- [Next.js 最佳实践](https://nextjs.org/docs/advanced-features)
- [Supabase 文档](https://supabase.com/docs)
- [Clean Code](https://book.douban.com/subject/4820331/)

### 相关项目

- [Hello World Agent](./practice/hello-world-agent)
- [Micro-SaaS Boilerplate](./practice/micro-saas-boilerplate)
- [Legacy Refactor](./practice/legacy-refactor)

---

**作者**: Andy  
**日期**: 2024-01-25  
**版本**: 1.0
