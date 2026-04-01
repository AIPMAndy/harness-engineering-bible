# 案例 2: CI 流水线偶发失败处理

**日期**: 2024-01-15  
**负责人**: Andy  
**项目**: Micro-SaaS Boilerplate  
**严重程度**: 🔴 高

---

## 问题描述

### 现象
GitHub Actions CI 流水线在 20% 的提交中出现偶发失败：

```yaml
# CI 日志
Error: Connection timeout after 30s
    at SupabaseClient.request (supabase.js:45)
    at async AuthService.login (auth.ts:12)
```

### 影响范围
- 影响模块：CI/CD 流水线
- 影响用户：所有开发者
- 持续时间：1 天（导致 5 次 PR 合并延迟）

---

## 根本原因

### 技术原因
- 测试中直接连接 Supabase 真实数据库
- 网络波动导致连接超时
- 没有设置重试机制

### 流程原因
- 测试环境配置不当
- 缺少隔离的测试数据库

---

## 解决方案

### 临时方案
增加重试逻辑：

```typescript
// tests/auth.test.ts
async function loginWithRetry(email: string, password: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await supabase.auth.signInWithPassword({ email, password });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 永久方案
1. 使用 Mock 替代真实 API：
```typescript
// tests/mocks/supabase.ts
export const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: {} } }),
  },
};
```

2. 配置测试环境变量：
```env
# .env.test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test_key
```

3. 使用 Testcontainers 启动本地数据库

---

## 经验教训

### 学到了什么
- CI 测试不应该依赖外部服务
- 必须使用 Mock 或隔离的测试环境
- 偶发失败比确定失败更危险

### 如何避免
- ✅ 所有单元测试必须离线运行
- ✅ 集成测试使用 Testcontainers
- ✅ 设置合理的超时和重试

### 需要改进的流程
- 添加 CI 稳定性监控
- 建立测试隔离标准

---

## 相关资源

- [Jest Mock 文档](https://jestjs.io/docs/mock-functions)
- [Testcontainers](https://testcontainers.com/)

---

## 后续行动

- [x] 添加 Mock 实现
- [x] 更新测试配置
- [ ] 添加 CI 监控
- [ ] 团队分享

---

**标签**: `#踩坑记录` `#ci-cd` `#testing`
