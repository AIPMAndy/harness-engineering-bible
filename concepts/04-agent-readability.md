# 04-agent-readability.md - 智能体可读性

> **核心定义**：代码首先给智能体看，其次给人看。命名、结构、注释都要考虑智能体的理解能力，人类可读是"附加价值"而非首要目标。

---

## 🎯 为什么重要

### 背景

传统软件工程的核心假设是：**代码主要给人看**。

- 变量名要"语义化"（对人类有意义）
- 注释要解释"为什么"（人类需要理解意图）
- 结构要"优雅"（人类喜欢简洁）

但在 Harness Engineering 范式中，这个假设被颠覆了：

**主要读者变成了智能体**：
- 智能体是主要的"代码修改者"
- 智能体需要明确的、结构化的信息
- 智能体没有"直觉"，只能按规则执行

### 人类可读 ≠ 智能体可读

| 特性 | 人类可读 | 智能体可读 |
|-----|---------|-----------|
| 变量名 | `user`（简洁） | `activeUserFromDatabase`（明确来源和状态） |
| 注释 | "处理用户"（模糊） | "验证用户输入 → 查询数据库 → 返回序列化结果"（步骤化） |
| 结构 | "优雅的设计"（抽象） | "Type → Config → Repo → Service → UI"（分层明确） |
| 错误处理 | `try/catch`（通用） | `try { ... } catch (e: ValidationError) { ... } catch (e: DatabaseError) { ... }`（类型化） |

### 痛点

#### 1. 智能体无法理解"隐含意图"

**场景**：
```typescript
// 人类理解：这个函数处理用户登录
async function authenticate(user: User, password: string) {
  // 验证密码
  const isValid = await verifyPassword(password, user.passwordHash);
  
  // 生成 token
  const token = generateJWT(user);
  
  return { token };
}

// 智能体看到什么？
// - 函数名：authenticate（"认证"，但不清楚是登录、验证还是其他）
// - 参数：user, password（不清楚 user 从哪来，password 的格式）
// - 逻辑：verifyPassword, generateJWT（不清楚这些函数的行为）
```

**问题**：
- 智能体不知道"认证"的具体含义
- 智能体不知道是否应该记录日志
- 智能体不知道是否应该发送通知
- 智能体可能生成不一致的代码

#### 2. 模糊命名导致错误修改

**场景**：
```typescript
// 人类理解：data 是从数据库查出来的用户数据
const data = await getUser(id);

// 智能体看到什么？
// - data: 可以是任何东西
// 智能体可能：
// - 认为 data 是字符串
// - 认为 data 是数组
// - 尝试修改 data（但实际是只读的）
```

**后果**：
- 智能体生成错误的代码
- 运行时崩溃
- 人类需要手动修复

#### 3. 过度抽象让智能体困惑

**场景**：
```typescript
// 人类喜欢：优雅的抽象
class Repository<T> {
  async findById(id: string): Promise<T | null> { ... }
  async save(entity: T): Promise<void> { ... }
}

class UserRepository extends Repository<User> { ... }
class OrderRepository extends Repository<Order> { ... }

// 智能体看到什么？
// - Repository 是什么？
// - T 是什么类型？
// - findById 从哪里查？数据库？缓存？
// - save 会触发什么？验证？事件？
```

**问题**：
- 智能体无法理解泛型的实际含义
- 智能体不知道继承的具体行为
- 智能体可能生成错误的实现

### 核心原则

> **智能体需要明确性，人类可以容忍模糊性。**

---

## 🔨 如何落地

### 原则一：命名必须明确

#### 1. 函数名要表达完整意图

```typescript
// ❌ 错误：太模糊
function process(data: any) { ... }
function handle(req: Request) { ... }
function transform(input: any) { ... }

// ✅ 正确：明确行为
async function validateAndSaveUser(userData: UserInput): Promise<User> { ... }
async function fetchActiveUsersFromDatabase(status: UserStatus): Promise<User[]> { ... }
async function transformOrderToInvoice(order: Order): Promise<Invoice> { ... }
```

#### 2. 变量名要包含来源和状态

```typescript
// ❌ 错误：不明确
const data = await api.getUsers();
const result = processData(input);
const user = getUserById(id);

// ✅ 正确：明确来源和状态
const activeUsersFromDatabase = await userRepository.findActiveUsers();
const validatedOrderData = orderValidator.validate(rawOrderInput);
const cachedUserFromRedis = await userCache.get(userId);
```

#### 3. 避免缩写和简写

```typescript
// ❌ 错误：缩写
const usr = getUser();
const cfg = loadConfig();
const resp = await fetchApi();

// ✅ 正确：完整拼写
const user = getUser();
const config = loadConfig();
const response = await fetchApi();
```

### 原则二：结构必须分层

#### 标准分层结构

```
src/
├── types/           # 类型定义（最稳定，几乎不改变）
│   ├── user.types.ts
│   ├── order.types.ts
│   └── api.types.ts
├── config/          # 配置（环境相关，启动时加载）
│   ├── database.config.ts
│   ├── api.config.ts
│   └── index.ts
├── repo/            # 数据访问（数据库、API 调用）
│   ├── user.repo.ts
│   ├── order.repo.ts
│   └── cache.repo.ts
├── service/         # 业务逻辑（核心，最复杂）
│   ├── user.service.ts
│   ├── order.service.ts
│   └── invoice.service.ts
├── runtime/         # 运行时逻辑（事件处理、定时任务）
│   ├── webhook.handler.ts
│   ├── scheduled-tasks.ts
│   └── event.bus.ts
└── ui/              # 界面层（最易变，包含 API 路由、页面）
    ├── api.routes.ts
    ├── pages/
    └── components/
```

#### 分层规则（用代码表达）

```typescript
// src/linter/rules/layer-imports.ts
export const LAYER_IMPORT_RULES = {
  // types 层：不依赖任何层
  'types': {
    allowed: [],
    description: '类型定义，不应该导入任何业务代码',
  },
  
  // config 层：只能依赖 types
  'config': {
    allowed: ['types'],
    description: '配置加载，只能使用类型定义',
  },
  
  // repo 层：可以依赖 types, config
  'repo': {
    allowed: ['types', 'config'],
    description: '数据访问，可以使用类型和配置',
  },
  
  // service 层：可以依赖 types, config, repo
  'service': {
    allowed: ['types', 'config', 'repo'],
    description: '业务逻辑，可以使用数据访问',
  },
  
  // runtime 层：可以依赖所有层
  'runtime': {
    allowed: ['types', 'config', 'repo', 'service'],
    description: '运行时逻辑，可以调用业务服务',
  },
  
  // ui 层：可以依赖 types, config, service（不能直接访问 repo）
  'ui': {
    allowed: ['types', 'config', 'service'],
    description: '界面层，应该通过 service 访问数据',
  },
};
```

### 原则三：注释要解释"为什么"而非"是什么"

#### 智能体需要的注释类型

```typescript
// ✅ 好的注释：解释决策原因
/**
 * 使用 Redis 缓存用户数据
 * 
 * WHY: 
 * - 用户数据读取频率高（1000+ QPS）
 * - 数据更新频率低（平均每小时 1 次）
 * - 缓存命中率约 95%，显著降低数据库负载
 * 
 * CACHE_STRATEGY:
 * - TTL: 30 分钟（平衡一致性和性能）
 * - 更新时主动失效（而不是被动过期）
 * - 缓存穿透保护：空值也缓存 5 分钟
 * 
 * @see https://example.com/docs/caching-strategy
 */
async function getUserWithCache(id: string): Promise<User | null> {
  // 先查缓存
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 缓存未命中，查数据库
  const user = await userRepository.findById(id);
  
  // 缓存结果（包括 null）
  await redis.setex(`user:${id}`, 1800, JSON.stringify(user));
  
  return user;
}

// ❌ 坏的注释：重复代码已经表达的内容
/**
 * 获取用户
 * @param id 用户 ID
 * @returns 用户对象
 */
async function getUser(id: string): Promise<User> {
  // 查询数据库获取用户
  return await db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

#### 决策日志注释

```typescript
/**
 * 选择使用 PostgreSQL 而非 MongoDB
 * 
 * DECISION: 2024-03-15
 * DECIDER: @alice
 * 
 * REQUIREMENTS:
 * - 需要复杂查询（JOIN、聚合）
 * - 需要事务支持
 * - 数据一致性要求高
 * 
 * OPTIONS_CONSIDERED:
 * 1. MongoDB: 灵活 schema，但缺乏事务和 JOIN
 * 2. MySQL: 成熟稳定，但性能不如 PostgreSQL
 * 3. PostgreSQL: 支持 JSONB，性能优秀，事务完整
 * 
 * FINAL_CHOICE: PostgreSQL
 * 
 * RISK:
 * - 学习曲线较陡（团队不熟悉）
 * - 迁移成本（如果未来需要切换）
 * 
 * MITIGATION:
 * - 使用 TypeORM 抽象数据库层
 * - 编写完整的集成测试
 * - 文档化查询模式
 */
```

### 原则四：类型必须明确

#### 避免 any 和 隐式类型

```typescript
// ❌ 错误：使用 any
function process(data: any) {
  return data.map(item => item.name);
}

// 智能体不知道：
// - data 是什么结构？
// - map 是否存在？
// - item.name 是什么类型？

// ✅ 正确：明确类型
interface UserInput {
  name: string;
  email: string;
  age?: number;
}

function processUsers(users: UserInput[]): { name: string }[] {
  return users.map(user => ({ name: user.name }));
}

// 智能体清楚知道：
// - users 是 UserInput 数组
// - 每个 user 有 name, email, 可选 age
// - 返回 { name: string } 数组
```

#### 使用类型守卫

```typescript
// ❌ 错误：运行时类型检查
function handleData(data: any) {
  if (data.type === 'user') {
    // 智能体不知道 data 现在是 User 类型
    console.log(data.name); // 可能 undefined
  }
}

// ✅ 正确：类型守卫
type User = { type: 'user'; name: string; email: string };
type Order = { type: 'order'; orderId: string; amount: number };

function isUser(data: User | Order): data is User {
  return data.type === 'user';
}

function handleData(data: User | Order) {
  if (isUser(data)) {
    // 智能体清楚知道 data 现在是 User 类型
    console.log(data.name); // 类型安全
  }
}
```

### 原则五：错误处理必须类型化

#### 定义明确的错误类型

```typescript
// ❌ 错误：通用错误
async function getUser(id: string) {
  try {
    return await db.query('SELECT * FROM users WHERE id = ?', [id]);
  } catch (e) {
    throw new Error('Failed to get user');
  }
}

// 智能体不知道：
// - 是什么错误？数据库？网络？权限？
// - 应该如何处理？重试？返回错误页？

// ✅ 正确：类型化错误
class UserNotFoundError extends Error {
  constructor(public userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

class DatabaseError extends Error {
  constructor(public query: string, public cause: Error) {
    super(`Database query failed: ${query}`);
    this.name = 'DatabaseError';
  }
}

async function getUser(id: string): Promise<User> {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (!user) {
      throw new UserNotFoundError(id);
    }
    
    return user;
  } catch (e) {
    if (e instanceof UserNotFoundError) {
      throw e; // 重新抛出，让调用者处理
    }
    
    throw new DatabaseError('SELECT * FROM users', e as Error);
  }
}

// 调用者可以明确处理不同错误
try {
  const user = await getUser(id);
} catch (e) {
  if (e instanceof UserNotFoundError) {
    // 返回 404
    res.status(404).json({ error: 'User not found' });
  } else if (e instanceof DatabaseError) {
    // 记录日志，返回 500
    logger.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 原则六：文档必须机器可读

#### 结构化文档注释

```typescript
/**
 * UserService - 用户服务
 * 
 * @module service/user.service
 * @version 2.0.0
 * @stable true
 * 
 * @dependencies
 * - repo/user.repo.ts
 * - repo/cache.repo.ts
 * - config/api.config.ts
 * 
 * @interfaces
 * - IUserService
 * - UserInput
 * - UserOutput
 * 
 * @methods
 * - createUser(input: UserInput): Promise<UserOutput>
 *   - 创建新用户
 *   - 会触发 user.created 事件
 *   - 需要 admin 权限
 * 
 * - getUserById(id: string): Promise<UserOutput | null>
 *   - 根据 ID 获取用户
 *   - 会从缓存读取（TTL 30 分钟）
 *   - 不需要特殊权限
 * 
 * - updateUser(id: string, input: Partial<UserInput>): Promise<UserOutput>
 *   - 更新用户信息
 *   - 会触发 user.updated 事件
 *   - 需要用户自己或 admin 权限
 * 
 * @events
 * - user.created: { userId: string, createdAt: Date }
 * - user.updated: { userId: string, updatedFields: string[] }
 * - user.deleted: { userId: string, deletedAt: Date }
 * 
 * @examples
 * ```typescript
 * const userService = new UserService();
 * const user = await userService.createUser({ name: 'Alice', email: 'alice@example.com' });
 * ```
 */
export class UserService implements IUserService {
  // ...
}
```

### 原则七：文件结构标准化

#### 单个文件的内部结构

```typescript
// src/service/user.service.ts

// 1. 导入（按类型分组）
import { UserRepository } from '../repo/user.repo';
import { CacheRepository } from '../repo/cache.repo';
import { UserConfig } from '../config/user.config';
import { User, UserInput, UserOutput } from '../types/user.types';
import { UserNotFoundError } from '../errors/user.errors';

// 2. 类型定义
export interface IUserService {
  createUser(input: UserInput): Promise<UserOutput>;
  getUserById(id: string): Promise<UserOutput | null>;
  updateUser(id: string, input: Partial<UserInput>): Promise<UserOutput>;
  deleteUser(id: string): Promise<void>;
}

// 3. 常量
const CACHE_KEY_PREFIX = 'user:';
const CACHE_TTL = 30 * 60; // 30 minutes

// 4. 类定义
export class UserService implements IUserService {
  // 4.1 依赖注入
  constructor(
    private userRepository: UserRepository,
    private cacheRepository: CacheRepository,
    private config: UserConfig,
  ) {}

  // 4.2 公共方法
  async createUser(input: UserInput): Promise<UserOutput> {
    // 实现
  }

  async getUserById(id: string): Promise<UserOutput | null> {
    // 实现
  }

  // 4.3 私有方法
  private async cacheUser(user: User): Promise<void> {
    // 实现
  }

  private async invalidateCache(id: string): Promise<void> {
    // 实现
  }
}
```

---

## 🚨 反例警示

### 错误案例 1：模糊命名导致错误修改

**场景**：
```typescript
// 原代码
function getData() {
  return db.query('SELECT * FROM users');
}

// 智能体修改：
function getData(filter?: any) {
  // 智能体假设 filter 是对象
  if (filter.status) {
    return db.query('SELECT * FROM users WHERE status = ?', [filter.status]);
  }
  return db.query('SELECT * FROM users');
}

// 问题：filter 可能是字符串、数组或其他类型
// 运行时：filter.status 可能是 undefined，导致错误查询
```

**教训**：变量名和参数类型必须明确

### 错误案例 2：过度抽象让智能体困惑

**场景**：
```typescript
// 人类喜欢的"优雅"设计
abstract class BaseHandler<T> {
  abstract handle(data: T): Promise<void>;
  
  async process(data: T): Promise<void> {
    await this.validate(data);
    await this.handle(data);
    await this.log(data);
  }
  
  protected abstract validate(data: T): Promise<void>;
  protected abstract log(data: T): Promise<void>;
}

// 智能体看到：
// - T 是什么？
// - handle, validate, log 的具体行为？
// - process 的调用顺序？
```

**后果**：
- 智能体生成错误的实现
- 缺少必要的步骤
- 运行时错误

**教训**：抽象要适度，智能体需要明确的行为描述

### 错误案例 3：注释重复代码

**场景**：
```typescript
/**
 * 增加用户年龄
 * @param user 用户对象
 * @param age 要增加的年龄
 * @returns 增加后的年龄
 */
function increaseAge(user: User, age: number): number {
  // 增加年龄
  user.age += age;
  
  // 返回新年龄
  return user.age;
}
```

**问题**：
- 注释没有提供额外信息
- 智能体无法理解"为什么"要增加年龄
- 智能体不知道是否有业务规则（如最大年龄限制）

**教训**：注释要解释"为什么"，而非"是什么"

---

## 🔧 可复制的配置片段

### 1. ESLint 规则

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // 禁止使用 any
    '@typescript-eslint/no-explicit-any': 'error',
    
    // 函数名必须包含动词
    'custom/verb-in-function-name': 'error',
    
    // 变量名不能是缩写
    'custom/no-abbreviations': ['error', { 
      exceptions: ['id', 'url', 'api', 'db'] 
    }],
    
    // 注释必须包含 WHY（对于复杂逻辑）
    'custom/require-why-comment': ['error', { 
      minComplexity: 3 
    }],
    
    // 错误必须类型化
    'custom/typed-errors': 'error',
  },
};
```

### 2. 文件模板

```typescript
// templates/service.template.ts
/**
 * {{serviceName}} - {{description}}
 * 
 * @module service/{{serviceName}}.service
 * @version 1.0.0
 * @stable {{stable}}
 * 
 * @dependencies
 * {{#each dependencies}}
 * - {{.}}
 * {{/each}}
 * 
 * @methods
 * {{#each methods}}
 * - {{name}}({{params}}): {{returnType}}
 *   - {{description}}
 * {{/each}}
 */
export class {{serviceName}} {
  constructor(
    {{#each dependencies}}
    private {{camelCase this}}: {{pascalCase this}},
    {{/each}}
  ) {}

  {{#each methods}}
  /**
   * {{description}}
   * {{#each params}}
   * @param {{name}} {{type}} - {{description}}
   * {{/each}}
   */
  async {{name}}({{params}}): Promise<{{returnType}}> {
    // TODO: Implement
  }
  {{/each}}
}
```

### 3. Makefile 命令

```makefile
.PHONY: docs:generate docs:check docs:validate

docs:generate:
	@echo "📝 Generating documentation..."
	@npx typedoc --out docs src/
	@echo "✅ Documentation generated at docs/"

docs:check:
	@echo "🔍 Checking documentation coverage..."
	@npx documentation-check src/

docs:validate:
	@echo "📋 Validating doc structure..."
	@npx ts-node scripts/validate-docs.ts
```

---

## 📚 参考链接

### 原文

- **OpenAI Harness Engineering**: [Harnessing Codex in an Agent-First World](https://openai.com/index/harness-engineering/)

### 延伸阅读

1. **Clean Code**: [Meaningful Names](https://github.com/ka-weihe/clean-code-typescript#11-meaningful-names)
2. **TypeScript Handbook**: [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#type-guards-and-differentiating-types)
3. **Google Style Guide**: [Comments](https://google.github.io/styleguide/tsguide.html#comments)

### 相关概念

- [01-repo-as-source-of-truth.md](./01-repo-as-source-of-truth.md) - 代码库即真理
- [02-mechanical-enforcement.md](./02-mechanical-enforcement.md) - 机械化执行

---

## ✅ 检查清单

智能体可读性就绪检查：

- [ ] 命名规范已定义（无缩写、包含动词、明确来源）
- [ ] 标准分层结构已建立（types → config → repo → service → runtime → ui）
- [ ] 层依赖规则已实现（linter 检查）
- [ ] 错误类型已定义（区分不同错误场景）
- [ ] 注释规范已定义（WHY > WHAT）
- [ ] 文件模板已创建
- [ ] 类型守卫已使用（避免 any）
- [ ] 决策日志注释已应用（复杂决策）
- [ ] ESLint 规则已配置

---

> **记住**：代码首先给智能体看。如果你的代码智能体看不懂，那它就是"不可读"的。人类可读是"加分项"，智能体可读是"必要条件"。
