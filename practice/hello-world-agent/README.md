# Hello World Agent 🤖

> **目标**：5 分钟内完成第一个 AI 智能体项目，体验 Harness Engineering 的基本流程。

---

## 📋 项目简介

这是一个最简单的 AI 智能体示例，展示如何用 TypeScript 构建一个调用 LLM API 的智能体。

**功能特性**：
- ✅ 调用 LLM API 生成回复
- ✅ 支持自定义配置（模型、温度、token 限制）
- ✅ 完整的 TypeScript 类型定义
- ✅ 单元测试覆盖
- ✅ GitHub Actions CI 配置
- ✅ 交互式命令行界面

**适合人群**：
- 第一次接触 Harness Engineering
- 想快速体验 AI 智能体开发
- 了解 LLM API 调用模式

---

## 🚀 快速开始

### 安装与运行

```bash
# 1. 克隆项目
cd harness-engineering-bible/practice/hello-world-agent

# 2. 安装依赖
npm install

# 3. 配置 API Key（可选）
cp .env.example .env
# 编辑 .env 文件，填入你的 LLM_API_KEY

# 4. 运行测试
npm test

# 5. 编译项目
npm run build

# 6. 启动交互式命令行
npm start

# 或直接运行开发模式
npm run dev
```

### 使用示例

```bash
# 启动后，你会看到交互界面
$ npm run dev

🤖 Hello World Agent 已启动
- 模型：gpt-4
- API 端点：https://api.example.com/v1/chat/completions
- 状态：已配置

输入消息进行测试（输入 "quit" 退出）:

> 你好，请介绍一下你自己
✨ 你好！我是一个 AI 助手，很高兴为你服务...

📊 模型：gpt-4
```

---

## 📁 项目结构

```
hello-world-agent/
├── src/
│   └── index.ts              # 智能体核心代码
├── tests/
│   └── index.test.ts         # 单元测试
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI 配置
├── .env.example              # 环境变量模板
├── .gitignore
├── jest.config.js            # Jest 测试配置
├── package.json
├── tsconfig.json             # TypeScript 配置
├── AGENTS.md                 # 智能体指令
└── README.md                 # 本文件
```

---

## 🧪 测试与验证

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 编译 TypeScript
npm run build

# 验证编译结果
ls -la dist/
```

**测试状态**：✅ 所有测试通过（5/5 tests passed）

---

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `LLM_API_KEY` | LLM API Key | 必填 |
| `LLM_API_URL` | API 端点 | `https://api.example.com/v1/chat/completions` |
| `MODEL` | 使用的模型 | `gpt-4` |
| `MAX_TOKENS` | 最大响应长度 | `1024` |
| `TEMPERATURE` | 随机性 (0-1) | `0.7` |

### 代码配置

```typescript
const agent = new HelloWorldAgent({
  model: 'gpt-4',
  maxTokens: 2048,
  temperature: 0.8,
});

const result = await agent.process('你好，请介绍一下 AI');
console.log(result.reply);
```

---

## 📚 学习要点

### 1. 理解 Harness 流程

```
人类定义任务 → 智能体生成代码 → 机器验证 → 自动合并
```

### 2. 体验机械化验证

- **Lint 检查**：代码风格统一
- **单元测试**：功能正确性保障
- **CI 自动化**：每次提交自动验证

### 3. 智能体架构模式

- **配置驱动**：通过配置灵活调整行为
- **错误处理**：优雅降级和错误提示
- **模块化设计**：易于扩展和维护

---

## 🎯 下一步

完成这个项目后，可以尝试：

1. **扩展功能**：添加记忆功能、多轮对话
2. **添加插件**：支持工具调用（搜索、计算等）
3. **部署上线**：部署为 HTTP 服务
4. **继续学习**：下一个项目 **Micro-SaaS Boilerplate**（1-2 小时）

---

## 🤖 给智能体的指令

如果你被分配到这个任务，请：

1. 阅读 `AGENTS.md` 了解约束
2. 确保所有测试通过 (`npm test`)
3. 提交小 PR（<200 行）
4. 等待机器验证自动合并

---

> **记住**：这是最简单的入门项目。目标是体验流程，而非追求完美。
