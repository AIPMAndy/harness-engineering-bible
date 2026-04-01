# 案例 1: 智能体误解约束导致代码错误

**日期**: 2024-01-10  
**负责人**: Andy  
**项目**: Hello World Agent  
**严重程度**: 🟡 中

---

## 问题描述

### 现象
智能体生成的代码使用了已废弃的 `node-fetch@2`，导致在 Node.js 18+ 环境出现类型错误：

```typescript
// 智能体生成的错误代码
import fetch from 'node-fetch';
// TypeScript 报错：Cannot find module 'node-fetch'
```

### 影响范围
- 影响模块：API 调用层
- 影响用户：所有新开发者
- 持续时间：2 小时

---

## 根本原因

### 技术原因
- 智能体使用了过时的知识（node-fetch@2 的 CommonJS 语法）
- 没有考虑 Node.js 18+ 内置 fetch API

### 流程原因
- 没有在 AGENTS.md 中明确指定技术约束
- 缺少代码审查步骤

---

## 解决方案

### 临时方案
手动修改代码，使用 Node.js 内置 fetch：

```typescript
// ✅ 修复后的代码
const response = await fetch(this.config.apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.config.apiKey}`,
  },
  body: JSON.stringify(requestBody),
});
```

### 永久方案
1. 更新 AGENTS.md，明确技术约束：
   ```markdown
   ## 技术约束
   - 使用 Node.js 18+ 内置 fetch API
   - 不要使用 node-fetch 包
   ```

2. 添加 ESLint 规则检测已废弃包

---

## 经验教训

### 学到了什么
- 智能体会使用过时的知识
- 必须在 AGENTS.md 中明确技术栈版本和约束
- 不要假设智能体知道最新最佳实践

### 如何避免
- ✅ 在 AGENTS.md 中列出所有技术约束
- ✅ 指定包的最小版本
- ✅ 要求智能体先检查 package.json

### 需要改进的流程
- 添加自动化包安全检查
- 建立技术栈版本清单

---

## 相关资源

- [Node.js 18 fetch API](https://nodejs.org/docs/latest-v18.x/api/globals.html#fetch)
- [AGENTS.md 最佳实践](../harness-engineering-bible/AGENTS.md)

---

## 后续行动

- [x] 更新 AGENTS.md
- [x] 添加 ESLint 规则
- [ ] 团队分享
- [ ] 更新文档

---

**标签**: `#踩坑记录` `#typescript` `#ai-agent`
