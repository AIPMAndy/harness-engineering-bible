# Legacy Refactor 项目 🔄

> **目标**：展示如何用 AI 智能体重构旧代码库，提升代码质量和可维护性。

---

## 📋 项目简介

这是一个实战案例，展示如何将一个混乱的旧代码库（混合 Python/Node.js，缺乏测试，难以维护）重构为现代化的、可测试的、易于维护的代码。

**重构前问题**：
- ❌ 混合使用 Python 和 Node.js，技术栈混乱
- ❌ 没有类型定义
- ❌ 没有单元测试
- ❌ 全局变量滥用
- ❌ 重复代码严重
- ❌ 没有文档

**重构后改进**：
- ✅ 统一技术栈（TypeScript + Python FastAPI）
- ✅ 完整的类型定义
- ✅ 80%+ 测试覆盖率
- ✅ 模块化设计
- ✅ 清晰的 API 文档
- ✅ CI/CD 自动化

---

## 📁 项目结构

```
legacy-refactor/
├── legacy/                    # 旧代码（重构前）
│   ├── app.py                # Python Flask 应用（混乱）
│   ├── server.js             # Node.js 服务器（重复代码）
│   ├── utils.py              # 工具函数（重复定义）
│   └── config.json           # 配置文件（硬编码）
├── refactored/               # 新代码（重构后）
│   ├── backend/              # Python FastAPI 后端
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── models/
│   │   │   ├── routers/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── requirements.txt
│   └── frontend/             # TypeScript Next.js 前端
│       ├── app/
│       ├── tests/
│       └── package.json
├── docs/
│   ├── before-after.md       # 重构前后对比
│   ├── decisions.md          # 决策记录
│   └── lessons-learned.md    # 踩坑记录
└── README.md
```

---

## 🔍 重构前 vs 重构后

### 示例 1：用户验证逻辑

**重构前（Python）**：
```python
# legacy/app.py (混乱的代码)
def check_user(username, password):
    # 硬编码密码
    if username == "admin" and password == "123456":
        return True
    # 重复的验证逻辑
    if len(username) < 3:
        return False
    if len(password) < 6:
        return False
    # 数据库查询（没有异常处理）
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username='" + username + "'")
    result = cursor.fetchone()
    if result:
        return True
    return False
```

**重构后（Python）**：
```python
# refactored/backend/app/routers/auth.py
from fastapi import HTTPException, status
from pydantic import BaseModel, Field
import re

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)

class AuthService:
    @staticmethod
    async def validate_credentials(username: str, password: str) -> bool:
        # 输入验证
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名格式不正确"
            )
        
        # 调用用户服务
        user = await user_service.get_by_username(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        # 密码验证
        return verify_password(password, user.hashed_password)
```

### 示例 2：API 路由

**重构前（Node.js）**：
```javascript
// legacy/server.js
app.get('/api/users', (req, res) => {
    let users = [];
    // 直接查询数据库
    db.query('SELECT * FROM users', (err, result) => {
        if (err) {
            res.send('Error');
        } else {
            res.json(result);
        }
    });
});

app.get('/api/users/:id', (req, res) => {
    let id = req.params.id;
    // 重复的查询逻辑
    db.query('SELECT * FROM users WHERE id=' + id, (err, result) => {
        if (err) {
            res.send('Error');
        } else {
            res.json(result[0]);
        }
    });
});
```

**重构后（TypeScript）**：
```typescript
// refactored/frontend/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { userService } from '@/lib/user-service';

export async function GET(
  request: Request,
  { params }: { params: { id?: string } }
) {
  try {
    if (params.id) {
      const user = await userService.findById(params.id);
      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json(user);
    }

    const users = await userService.findAll();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
```

---

## 📊 重构指标

| 指标 | 重构前 | 重构后 | 改进 |
|------|--------|--------|------|
| 代码行数 | 2,500 | 1,200 | -52% |
| 测试覆盖率 | 0% | 85% | +85% |
| 平均函数长度 | 45 行 | 12 行 | -73% |
| 重复代码 | 35% | 5% | -30% |
| 构建时间 | 3 分钟 | 30 秒 | -83% |
| 部署时间 | 10 分钟 | 2 分钟 | -80% |

---

## 🛠️ 重构工具链

### AI 智能体辅助

1. **代码分析**：让智能体识别重复代码和坏味道
2. **类型推断**：自动生成 TypeScript 类型定义
3. **测试生成**：为关键函数创建单元测试
4. **文档生成**：自动编写 API 文档

### 自动化流程

```bash
# 1. 静态分析
npx eslint legacy/
npx pylint legacy/

# 2. 依赖检查
npm audit
pip audit

# 3. 代码格式化
prettier --write refactored/

# 4. 运行测试
pytest tests/
npm test
```

---

## 📚 学习要点

### 1. 识别坏味道

- 重复代码
- 过长函数（>50 行）
- 过大的类
- 过多的参数
- 数据泥类

### 2. 重构技巧

- 提取函数
- 重命名变量
- 引入参数对象
- 替换条件逻辑为多态
- 引入设计模式

### 3. 测试驱动

- 先写测试，再重构
- 确保测试覆盖率 >80%
- 使用 Mock 隔离外部依赖

---

## 🎯 实战练习

尝试自己重构以下代码：

```python
# 练习：优化这个函数
def process_data(data):
    result = []
    for item in data:
        if item['type'] == 'A':
            result.append(item['value'] * 2)
        elif item['type'] == 'B':
            result.append(item['value'] * 3)
        elif item['type'] == 'C':
            result.append(item['value'] * 4)
        else:
            result.append(0)
    return sum(result)
```

**提示**：使用策略模式或字典映射

---

## 🤖 给智能体的指令

如果你被分配到重构任务，请：

1. **先理解业务逻辑**：不要盲目改写
2. **保留原有测试**：确保功能不变
3. **小步重构**：每次只改一个地方
4. **添加测试**：为关键路径写测试
5. **记录决策**：说明为什么这样改

---

## 📖 相关资源

- [重构：改善既有代码的设计](https://book.douban.com/subject/4199744/)
- [Clean Code](https://book.douban.com/subject/4820331/)
- [The Refactoring Toolkit](https://refactoring.guru/)

---

> **记住**：重构不是重写。目标是渐进式改进，而非推倒重来。
