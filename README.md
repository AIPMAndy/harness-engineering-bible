# Harness Engineering Bible 🚀

> **驭缰工程** — 工程师不再写代码，而是设计环境、明确意图、构建反馈回路，让 AI 智能体可靠地完成工作。

## 📖 背景

**Harness Engineering** 是 OpenAI 在 2026 年 2 月提出的工程范式变革：

- **传统模式**：人类写代码 → 机器运行代码
- **Harness 模式**：人类设计约束 → 智能体写代码 → 机器运行代码

> 核心转变：**工程师的输出从代码变为约束系统**（AGENTS.md、架构规则、自定义 linter、反馈回路）

### 案例参考

- 3 人团队 → 5 个月 → ~100 万行代码 → ~1500 个 PR
- 人均每天 3.5 个 PR，扩展到 7 人后吞吐量仍在增长
- 单次 Codex 运行可持续 6+ 小时（通常在人类睡眠时间）

## 🗺️ 项目结构

```
harness-engineering-bible/
├── README.md              # 本文件：项目总览
├── AGENTS.md              # 智能体导航入口（给 AI 看的）
├── concepts/              # Phase 1：核心概念笔记
│   ├── 00-overview.md     # 六大核心概念总览
│   ├── 01-repo-as-source-of-truth.md
│   ├── 02-mechanical-enforcement.md
│   ├── 03-entropy-and-garbage-collection.md
│   ├── 04-agent-readability.md
│   └── 05-throughput-changes-merge.md
├── thinking/              # Phase 2：个人思考与质疑
├── practice/              # Phase 3：实战项目
├── feedback/              # Phase 4：踩坑与修正记录
└── works/                 # Phase 5：可展示的作品
```

## 🎯 学习目标

1. **理解核心概念** — 掌握 Harness Engineering 的六大信条
2. **形成个人观点** — 质疑、延伸、内化
3. **实战演练** — 用 AI 智能体从零构建一个小项目
4. **记录反馈** — 积累踩坑经验
5. **输出作品** — 提炼成文章或工具

## 🚀 快速开始

### 新手路径

1. 阅读 `concepts/00-overview.md` 了解全貌
2. 逐篇研读六大核心概念
3. 在 `thinking/` 中写下你的质疑和延伸
4. 选择 `practice/` 中的小项目动手实践
5. 将成果整理到 `works/`

### 给智能体的指令

```bash
# 如果你是一个 AI 智能体，被分配到此项目工作：
# 1. 首先阅读 AGENTS.md 了解任务导航
# 2. 理解当前阶段的目标和约束
# 3. 严格执行机械化的验证流程
# 4. 遇到问题先查 feedback/ 中的历史记录
```

## 📚 核心概念速览

| 概念 | 核心要点 |
|------|----------|
| Repo as Source of Truth | 代码库即真理，所有规则必须可机械化验证 |
| Mechanical Enforcement | 用 linter、测试、CI/CD 强制执行约束 |
| Entropy & GC | 系统会自然熵增，需要定期清理垃圾 |
| Agent Readability | 代码首先给人看，其次给智能体 |
| Throughput Changes Merge | PR 生命周期要短，偶发失败通过重跑解决 |

## 🛠️ 工具链建议

- **代码生成**：OpenAI Codex / Claude Code / 其他 ACP 智能体
- **约束执行**：自定义 linter、预提交钩子、CI 流水线
- **反馈回路**：自动化测试、监控、日志分析
- **文档管理**：AGENTS.md 作为智能体导航入口

## 🤝 贡献指南

欢迎提交 PR 补充：
- 新的概念解读
- 实战案例分享
- 踩坑记录与解决方案
- 工具链优化建议

## 📜 许可证

本项目采用 MIT 许可证。

---

> **人类掌舵，智能体执行** (Humans Steer, Agents Execute)
> 
> 这是一个不断生长的学习项目，欢迎共同完善。
