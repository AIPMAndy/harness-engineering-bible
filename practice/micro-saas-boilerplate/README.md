# Micro-SaaS Boilerplate ⚡

> **目标**：5 分钟启动一个完整的 Micro-SaaS 项目模板，包含 Next.js + Tailwind + Supabase 全栈配置。

---

## 📋 项目简介

这是一个生产级的 Micro-SaaS 启动模板，包含：

- ✅ **Next.js 14** - 最新 React 框架，支持 App Router
- ✅ **Tailwind CSS** - 现代化样式系统
- ✅ **Supabase** - 后端即服务（认证、数据库、存储）
- ✅ **TypeScript** - 类型安全
- ✅ **ESLint + Prettier** - 代码规范
- ✅ **Jest** - 单元测试
- ✅ **GitHub Actions CI** - 自动化测试

**适合场景**：
- 快速原型开发
- MVP 验证
- 小型 SaaS 产品
- 学习全栈开发

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的 Supabase 配置
# 获取方式：https://supabase.com/dashboard
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 运行测试

```bash
npm test
```

---

## 📁 项目结构

```
micro-saas-boilerplate/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   ├── api/                # API 路由
│   │   └── auth/           # 认证相关 API
│   ├── login/              # 登录页
│   ├── dashboard/          # 仪表盘
│   │   └── page.tsx
│   ├── components/         # 可复用组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Button.tsx
│   ├── lib/                # 工具函数
│   │   ├── supabase.ts     # Supabase 客户端
│   │   └── utils.ts        # 通用工具
│   └── styles/
│       └── globals.css     # 全局样式
├── public/                 # 静态资源
├── tests/                  # 测试文件
├── .env.example            # 环境变量模板
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔧 核心功能

### 1. 用户认证

使用 Supabase Auth 实现：

```typescript
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// 登出
await supabase.auth.signOut();
```

### 2. 数据库操作

```typescript
// 查询数据
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

// 插入数据
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello World', content: '...' });
```

### 3. API 路由

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase.from('users').select('*');
  return NextResponse.json(data);
}
```

---

## 🎨 组件示例

### Button 组件

```tsx
// components/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${variant === 'primary' 
          ? 'bg-primary-600 text-white hover:bg-primary-700' 
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
      `}
    >
      {children}
    </button>
  );
}
```

---

## 🧪 测试

### 单元测试示例

```typescript
// tests/utils.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Utils', () => {
  it('should add two numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
```

运行测试：

```bash
npm test
npm test -- --watch  # 监听模式
```

---

## 📚 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

---

## 🤖 给智能体的指令

如果你被分配到这个任务，请：

1. 遵循 Next.js App Router 最佳实践
2. 使用 TypeScript 严格模式
3. 为关键功能编写测试
4. 保持组件小而专注
5. 使用 Tailwind 类名，避免自定义 CSS

---

## 🎯 下一步扩展

1. **添加支付集成** - Stripe / Paddle
2. **实现订阅系统** - 月度/年度套餐
3. **添加分析追踪** - PostHog / Mixpanel
4. **部署上线** - Vercel + Supabase

---

> **提示**：这是一个生产级模板，可以直接用于实际项目。
