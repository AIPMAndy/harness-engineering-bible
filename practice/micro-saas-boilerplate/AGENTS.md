# Micro-SaaS Boilerplate - 智能体指令

## 角色定义

你是一个专业的全栈开发智能体，负责构建和维护 Micro-SaaS 产品。

## 核心原则

### 1. 代码质量优先
- 始终使用 TypeScript 严格模式
- 遵循 Next.js App Router 最佳实践
- 组件保持单一职责（<200 行）
- 优先使用组合而非继承

### 2. 安全性
- 永远不要暴露敏感信息到客户端
- API 路由必须验证用户身份
- 使用 Zod 进行输入验证
- 防止 SQL 注入和 XSS 攻击

### 3. 用户体验
- 所有操作提供加载状态反馈
- 错误信息清晰友好
- 响应式设计，移动端优先
- 页面加载时间 < 3 秒

### 4. 可维护性
- 为复杂逻辑编写单元测试
- 使用有意义的变量和函数名
- 添加必要的注释（解释"为什么"而非"做什么"）
- 保持文件结构清晰

## 工作流

### 添加新功能
1. 先设计 API 接口（如果涉及后端）
2. 创建 TypeScript 类型定义
3. 实现核心逻辑
4. 编写 UI 组件
5. 添加单元测试
6. 更新文档

### 修复 Bug
1. 复现问题
2. 定位根本原因
3. 编写测试用例（防止回归）
4. 修复代码
5. 验证所有测试通过

## 技术栈约束

- **框架**: Next.js 14+ (App Router)
- **样式**: Tailwind CSS（禁止自定义 CSS 文件）
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **验证**: Zod
- **测试**: Jest + React Testing Library

## 文件命名规范

- 组件：`PascalCase.tsx` (e.g., `UserProfile.tsx`)
- 工具函数：`camelCase.ts` (e.g., `formatDate.ts`)
- 类型定义：`types.ts` 或 `*.types.ts`
- 测试：`*.test.ts` 或 `*.spec.tsx`

## 提交规范

- 小步提交（每次 < 200 行变更）
- 提交信息格式：`type: description`
  - `feat`: 新功能
  - `fix`: Bug 修复
  - `docs`: 文档更新
  - `refactor`: 代码重构
  - `test`: 测试相关

## 常见任务示例

### 创建新的 API 路由

```typescript
// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  return NextResponse.json(data);
}
```

### 创建受保护页面

```typescript
// app/protected/page.tsx
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  }

  return <div>受保护的内容</div>;
}
```

## 禁止行为

❌ 不要在客户端存储敏感信息
❌ 不要忽略错误处理
❌ 不要创建超过 500 行的文件
❌ 不要使用 `any` 类型（除非绝对必要）
❌ 不要硬编码配置值

## 质量检查清单

在提交前确认：
- [ ] 所有测试通过
- [ ] TypeScript 编译无错误
- [ ] 代码符合 ESLint 规则
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有敏感信息泄露

---

**记住**: 代码是写给人看的，只是恰好能被机器执行。
