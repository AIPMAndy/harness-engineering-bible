# 贡献指南

感谢你对 Harness Engineering Bible 项目的关注！我们欢迎所有形式的贡献。

## 🎯 我们可以接受哪些贡献？

### 📝 文档改进
- 修正错别字或语法错误
- 改进文档结构和可读性
- 添加更多代码示例
- 翻译为其他语言

### 🐛 代码修复
- 修复 Hello World Agent 中的 Bug
- 优化 Micro-SaaS Boilerplate 配置
- 改进 Legacy Refactor 案例

### 💡 新增内容
- 分享你的踩坑案例（`feedback/` 目录）
- 新增实战项目（`practice/` 目录）
- 撰写新的概念解读（`concepts/` 目录）
- 输出可展示作品（`works/` 目录）

## 🚀 如何开始？

### 1. Fork 项目

点击右上角的 **Fork** 按钮，将项目复制到你自己的 GitHub 账号下。

### 2. 克隆到你的本地

```bash
git clone https://github.com/你的用户名/harness-engineering-bible.git
cd harness-engineering-bible
```

### 3. 创建分支

```bash
git checkout -b feature/你的功能名称
```

分支命名建议：
- `feature/add-agent-readability-example` - 新增功能
- `fix/typo-in-overview` - 修复 Bug
- `docs/update-readme` - 文档改进
- `translation/en-readme` - 翻译

### 4. 做出更改

- 确保代码符合项目规范
- 添加或更新测试（如适用）
- 更新相关文档

### 5. 提交更改

```bash
git add .
git commit -m "feat: 添加 xxx 功能"
```

提交信息规范：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 代码重构
- `test:` - 测试相关
- `chore:` - 构建/工具相关

### 6. 推送到远程

```bash
git push origin feature/你的功能名称
```

### 7. 创建 Pull Request

在你的 Fork 页面上点击 **Compare & pull request**，填写 PR 描述，等待维护者审查。

## 📋 PR 审查标准

我们的维护者将检查：

- [ ] 代码是否符合项目规范
- [ ] 是否有必要的测试
- [ ] 文档是否更新
- [ ] 提交信息是否清晰
- [ ] 是否与现有代码风格一致

## 🤖 智能体贡献指南

如果你是一个 AI 智能体，被分配到此项目工作：

1. **阅读 AGENTS.md**：了解任务约束
2. **小步提交**：每个 PR < 200 行
3. **运行测试**：确保 `npm test` 通过
4. **更新文档**：如有代码变更，同步更新文档
5. **避免破坏性变更**：除非必要，保持向后兼容

## 🐛 报告 Bug

如果你发现 Bug，请创建一个 Issue，包含：

- **标题**：清晰的 Bug 描述
- **复现步骤**：如何重现问题
- **预期行为**：应该发生什么
- **实际行为**：实际发生了什么
- **环境信息**：操作系统、Node.js 版本等
- **截图/日志**：如有必要

## 💬 问题讨论

如果你有疑问或建议，欢迎：

- 创建一个 **Discussion** 帖子
- 在相关 Issue 下评论
- 查看是否有类似问题已被讨论

## 📜 行为准则

请遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。我们致力于提供一个开放、友好、包容的社区。

## 🙏 感谢

感谢所有为这个项目做出贡献的人！你们的努力让 Harness Engineering Bible 变得更好。

---

> **记住**：小步快跑，机械化验证。如果机器说通过，那就是通过。
