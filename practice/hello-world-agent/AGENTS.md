# AGENTS.md - 智能体指令

> **给智能体看的任务指南** — Hello World Agent 项目

---

## 🎯 任务目标

创建一个最简单的 Express 服务器，提供 `/hello` 端点。

**成功标准**：
- ✅ 服务器可以启动
- ✅ `/hello` 端点返回 `{"message": "Hello, World!"}`
- ✅ 所有测试通过
- ✅ Lint 检查通过
- ✅ CI 配置正确

---

## 📋 约束规则

### 1. 代码规范

- 使用 TypeScript
- 函数名必须包含动词（如 `getHello`, `createUser`）
- 变量名必须明确（不能用 `data`, `result`）
- 禁止使用 `any` 类型
- 所有 Promise 必须有错误处理

### 2. 文件结构

```
src/
├── index.ts           # 入口，只包含服务器启动逻辑
├── routes/
│   └── hello.route.ts # 路由定义
└── types/
    └── index.ts       # 类型定义
```

### 3. 测试要求

- 必须包含单元测试
- 测试覆盖率 > 80%
- 测试文件命名：`*.spec.ts`

### 4. PR 规范

- PR 大小 < 200 行
- 包含完整的测试
- CI 必须全部通过

---

## 🔧 实现步骤

### Step 1: 创建类型定义

```typescript
// src/types/index.ts
export interface HelloResponse {
  message: string;
}
```

### Step 2: 创建路由

```typescript
// src/routes/hello.route.ts
import { Request, Response } from 'express';
import { HelloResponse } from '../types';

export function getHello(req: Request, res: Response<HelloResponse>): void {
  const response: HelloResponse = {
    message: 'Hello, World!',
  };
  res.json(response);
}
```

### Step 3: 创建入口

```typescript
// src/index.ts
import express from 'express';
import { getHello } from './routes/hello.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/hello', getHello);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: 创建测试

```typescript
// tests/hello.spec.ts
import { describe, it, expect } from 'vitest';
import { getHello } from '../src/routes/hello.route';
import { Response } from 'express';

describe('getHello', () => {
  it('should return Hello World message', () => {
    const mockRes = {
      json: vi.fn(),
    } as unknown as Response;

    getHello({} as Request, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Hello, World!',
    });
  });
});
```

---

## ✅ 检查清单

提交前确认：

- [ ] 代码通过 lint (`npm run lint`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 类型检查通过 (`npx tsc --noEmit`)
- [ ] 没有 TODO 注释
- [ ] 没有 console.log
- [ ] PR 大小 < 200 行

---

## 🚨 常见错误

### 错误 1：使用 any 类型

```typescript
// ❌ 错误
function handle(req: any, res: any) { ... }

// ✅ 正确
function handle(req: Request, res: Response<HelloResponse>) { ... }
```

### 错误 2：缺少错误处理

```typescript
// ❌ 错误
const data = await fetchData();

// ✅ 正确
try {
  const data = await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw error;
}
```

### 错误 3：PR 太大

- 如果超过 200 行，拆分成多个 PR
- 每个 PR 只做一个功能

---

## 📚 参考

- [01-repo-as-source-of-truth.md](../../concepts/01-repo-as-source-of-truth.md)
- [02-mechanical-enforcement.md](../../concepts/02-mechanical-enforcement.md)
- [04-agent-readability.md](../../concepts/04-agent-readability.md)

---

> **记住**：小步快跑，机械化验证。如果机器说通过，那就是通过。
