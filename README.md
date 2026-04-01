# Harness Engineering Bible 🚀

> **驭缰工程** — 工程师不再写代码，而是设计环境、明确意图、构建反馈回路，让 AI 智能体可靠地完成工作。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAI](https://img.shields.io/badge/OpenAI-Harness_Engineering-blue)](https://openai.com/index/harness-engineering/)
[![Build Status](https://img.shields.io/badge/CI-Passing-green)](https://github.com/AIPMAndy/harness-engineering-bible/actions)
[![Contributors](https://img.shields.io/github/contributors/AIPMAndy/harness-engineering-bible)](https://github.com/AIPMAndy/harness-engineering-bible/graphs/contributors)
[![Star History](https://img.shields.io/github/stars/AIPMAndy/harness-engineering-bible?style=social)](https://github.com/AIPMAndy/harness-engineering-bible/stargazers)

> **核心洞察**：*"Agents aren't hard; the Harness is hard."* — Ryan Lopopolo (OpenAI, 2026)

---

## 📖 什么是 Harness Engineering？

**Harness Engineering** 是 OpenAI 在 2026 年 2 月由 **Ryan Lopopolo** 提出的工程范式变革，旨在解决 AI 智能体规模化协作的可靠性问题。

| 维度 | 传统软件工程 | Harness Engineering |
|------|-------------|---------------------|
| **核心工作** | 写代码 | 设计约束系统 (AGENTS.md, Linter, CI) |
| **验证方式** | 人工 Code Review | 机械化验证 (Test/Lint/Build) |
| **PR 周期** | 数天/周 | 分钟/小时 |
| **智能体角色** | 辅助工具 | 主要代码生产者 |
| **人类角色** | 执行者 | 架构师/掌舵者 |

### 🏆 成功案例

> **OpenAI 内部实践**：
> - **3 人团队** → **5 个月** → **~100 万行代码** → **~1500 个 PR**
> - **零手写代码**，全部由 Codex 生成
> - **人均每天 3.5 个 PR**，扩展到 7 人后吞吐量仍在增长
> - **单次运行**：Codex 可持续工作 6+ 小时（人类睡眠期间）

---

## 🗺️ 项目导航

本项目包含 **理论 + 实战 + 案例 + 工具**，适合不同阶段的读者：

```bash
harness-engineering-bible/
├── 📘 concepts/           # 核心理论（必读）
│   ├── 00-overview.md     # ⭐ 六大核心概念总览（入门首选）
│   ├── 01-repo-as-source-of-truth.md  # 代码库即真理
│   ├── 02-mechanical-enforcement.md   # 机械化执行
│   ├── 03-entropy-and-garbage-collection.md # 熵增与清理
│   ├── 04-agent-readability.md        # 智能体可读性
│   └── 05-throughput-changes-merge.md # 吞吐量优先合并
├── 🛠️ practice/           # 实战项目（可运行）
│   ├── hello-world-agent/   # ⭐ 5 分钟入门（含测试+CI）
│   ├── micro-saas-boilerplate/ # 生产级模板（Next.js+Supabase）
│   └── legacy-refactor/     # 真实重构案例
├── 📝 feedback/           # 踩坑记录（避坑指南）
│   ├── template.md          # 案例模板
│   └── case-*.md            # 真实踩坑案例
├── 🏆 works/              # 可展示作品
│   └── harness-engineering-guide.md # 6900+ 字实战指南
├── 🤖 AGENTS.md           # 智能体专用导航
└── 📖 README.md           # 本文件
```

---

## 🎯 谁应该阅读？

- ✅ **AI 产品负责人**：想落地 AI 智能体协作流程
- ✅ **资深工程师**：想转型为"约束架构师"
- ✅ **技术团队 Leader**：想提升团队 AI 协作效率
- ✅ **AI 智能体开发者**：想理解如何设计可靠的 Agent 环境
- ✅ **开源贡献者**：想参与构建下一代软件工程范式

---

## 🚀 快速开始

### 🏃 5 分钟入门（推荐新手）

```bash
# 1. 克隆项目
git clone https://github.com/AIPMAndy/harness-engineering-bible.git
cd harness-engineering-bible/practice/hello-world-agent

# 2. 安装依赖
npm install

# 3. 运行测试（验证环境）
npm test

# 4. 启动交互式智能体
npm start
```

### 📚 学习路径

| 阶段 | 内容 | 预计时间 | 产出 |
|------|------|----------|------|
| **Phase 1** | 阅读 `00-overview.md` | 30 分钟 | 理解核心概念 |
| **Phase 2** | 运行 `hello-world-agent` | 15 分钟 | 体验完整流程 |
| **Phase 3** | 研读 `01-05` 概念文档 | 2 小时 | 掌握落地方法 |
| **Phase 4** | 使用 `micro-saas-boilerplate` | 1-2 小时 | 构建生产级项目 |
| **Phase 5** | 阅读 `feedback/` 案例 | 30 分钟 | 避坑指南 |
| **Phase 6** | 阅读 `works/` 实战指南 | 1 小时 | 系统化认知 |

### 🤖 给智能体的指令

如果你被分配到此项目，请：
1. 首先阅读 `AGENTS.md` 了解任务导航
2. 理解当前阶段的目标和约束
3. 严格执行机械化的验证流程（`make check`）
4. 遇到问题先查 `feedback/` 中的历史记录

---

## 📚 六大核心概念（速览）

| 概念 | 核心定义 | 落地工具 |
|------|----------|----------|
| **Repo as Source of Truth** | 所有规则必须内嵌在代码库，可机械化验证 | `AGENTS.md`, ESLint 规则 |
| **Mechanical Enforcement** | 用 linter、测试、CI/CD 强制执行，不依赖人工 | Pre-commit, GitHub Actions |
| **Entropy & GC** | 系统会自然熵增，需定期清理技术债务 | 自动化 GC 脚本, 技术债务看板 |
| **Agent Readability** | 代码首先给智能体看，其次给人看 | 明确命名, 固定分层结构 |
| **Throughput Changes Merge** | PR 生命周期短，偶发失败重跑 | 自动化重跑, 短周期 PR (<200 行) |
| **Humans Steer, Agents Execute** | 人类掌舵，智能体执行 | 约束设计, 意图明确 |

> 💡 **提示**：每篇概念文档都包含 **代码示例**、**配置片段**、**反例警示**，可直接复制使用。

---

## 🛠️ 推荐工具链

| 类别 | 推荐工具 | 作用 |
|------|----------|------|
| **智能体** | OpenAI Codex, Claude Code, Cursor | 代码生成与修改 |
| **约束执行** | ESLint, Prettier, Pre-commit | 强制执行规则 |
| **CI/CD** | GitHub Actions, GitLab CI | 自动化验证 |
| **测试** | Jest, Vitest, Pytest | 功能正确性保障 |
| **监控** | Prometheus, Datadog, Sentry | 运行状态监控 |
| **文档** | AGENTS.md, README.md | 智能体导航入口 |

### 📦 一键启动模板

- **Hello World Agent**：`npm install && npm test` ✅
- **Micro-SaaS Boilerplate**：`npm install && npm run dev` ✅
- **Legacy Refactor**：`python3 app.py` ✅

---

## 🤝 如何贡献？

我们欢迎所有形式的贡献！无论是：
- 📝 修正文档错别字
- 🐛 修复代码 Bug
- 💡 分享你的踩坑案例
- 🌍 翻译为其他语言
- 🚀 新增实战项目

### 贡献流程

1. Fork 本项目
2. 创建你的分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

> 📌 **注意**：所有贡献需遵循 [Code of Conduct](CODE_OF_CONDUCT.md) 和 [贡献指南](CONTRIBUTING.md)。

---

## 📜 许可证

本项目采用 **MIT 许可证** - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- **Ryan Lopopolo** (OpenAI) - Harness Engineering 概念提出者
- **OpenAI Codex Team** - 提供强大的 AI 代码生成能力
- **所有贡献者** - 让这个项目不断进化

---

> **人类掌舵，智能体执行** (Humans Steer, Agents Execute)  
> 这是一个不断生长的学习项目，欢迎共同完善。
